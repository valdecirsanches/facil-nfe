#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Microserviço Python para Assinatura Digital de NFe
Usa signxml para garantir compatibilidade 100% com SEFAZ
"""

import os
import sys

# ✅ FORÇAR SHA-1 (exigido pela SEFAZ) - ANTES DE IMPORTAR SIGNXML
os.environ['SIGNXML_INSECURE_ALLOW_SHA1'] = '1'

from flask import Flask, request, jsonify
from signxml import XMLSigner, methods
from lxml import etree
from cryptography.hazmat.primitives.serialization import pkcs12, Encoding, PrivateFormat, NoEncryption
from cryptography.hazmat.backends import default_backend

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'NFe Python Signer'})

@app.route('/sign', methods=['POST'])
def sign_xml():
    """
    Assina XML de NFe usando certificado A1
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'JSON inválido'}), 400
        
        xml_string = data.get('xml')
        cert_path = data.get('cert_path')
        cert_password = data.get('cert_password', '')
        
        if not xml_string or not cert_path:
            return jsonify({'success': False, 'error': 'xml e cert_path são obrigatórios'}), 400
        
        print(f'📥 Requisição recebida:')
        print(f'   Certificado: {cert_path}')
        print(f'   XML size: {len(xml_string)} bytes')
        
        if not os.path.exists(cert_path):
            print(f'❌ Certificado não encontrado: {cert_path}')
            return jsonify({'success': False, 'error': f'Certificado não encontrado: {cert_path}'}), 404
        
        # Ler certificado PFX
        with open(cert_path, 'rb') as f:
            pfx_data = f.read()
        
        print(f'✅ Certificado lido: {len(pfx_data)} bytes')
        
        # Converter PFX para PEM (chave privada + certificado)
        password_bytes = cert_password.encode('utf-8') if cert_password else None
        
        try:
            private_key, certificate, additional_certificates = pkcs12.load_key_and_certificates(
                pfx_data,
                password_bytes,
                backend=default_backend()
            )
        except Exception as e:
            print(f'❌ Erro ao ler PFX: {e}')
            return jsonify({'success': False, 'error': f'Erro ao ler certificado PFX: {str(e)}'}), 400
        
        # Converter chave privada para PEM
        private_key_pem = private_key.private_bytes(
            encoding=Encoding.PEM,
            format=PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=NoEncryption()
        )
        
        # Converter certificado para PEM
        from cryptography.hazmat.primitives.serialization import Encoding as CertEncoding
        certificate_pem = certificate.public_bytes(CertEncoding.PEM)
        
        print(f'✅ Chave privada extraída: {len(private_key_pem)} bytes')
        print(f'✅ Certificado convertido: {len(certificate_pem)} bytes')
        
        # Parse XML
        root = etree.fromstring(xml_string.encode('utf-8'))
        
        namespaces = {'nfe': 'http://www.portalfiscal.inf.br/nfe'}
        infnfe = root.find('.//nfe:infNFe', namespaces)
        
        if infnfe is None:
            print('❌ Tag infNFe não encontrada')
            return jsonify({'success': False, 'error': 'Tag infNFe não encontrada no XML'}), 400
        
        nfe_id = infnfe.get('Id')
        if not nfe_id:
            print('❌ Atributo Id não encontrado')
            return jsonify({'success': False, 'error': 'Atributo Id não encontrado em infNFe'}), 400
        
        print(f'✅ NFe ID: {nfe_id}')
        
        # Criar assinador
        signer = XMLSigner(
            method=methods.enveloped,
            signature_algorithm='rsa-sha1',
            digest_algorithm='sha1',
            c14n_algorithm='http://www.w3.org/TR/2001/REC-xml-c14n-20010315'
        )
        
        print('🔐 Assinando XML...')
        
        # Assinar XML usando chave PEM
        signed_root = signer.sign(
            root,
            key=private_key_pem,
            cert=certificate_pem,  # ← CORRIGIDO: usar certificado PEM
            reference_uri=f'#{nfe_id}'
        )
        
        # Converter para string
        signed_xml = etree.tostring(
            signed_root,
            encoding='unicode',
            method='xml'
        )
        
        # Extrair DigestValue
        signature = signed_root.find('.//{http://www.w3.org/2000/09/xmldsig#}Signature')
        digest_value = None
        if signature is not None:
            digest = signature.find('.//{http://www.w3.org/2000/09/xmldsig#}DigestValue')
            if digest is not None:
                digest_value = digest.text
        
        print(f'✅ XML assinado com sucesso!')
        print(f'   DigestValue: {digest_value}')
        print(f'   Tamanho: {len(signed_xml)} bytes')
        
        return jsonify({
            'success': True,
            'signed_xml': signed_xml,
            'digest_value': digest_value,
            'reference_uri': nfe_id
        })
        
    except Exception as e:
        import traceback
        error_msg = str(e)
        trace = traceback.format_exc()
        
        print(f'❌ ERRO ao assinar:')
        print(f'   {error_msg}')
        print(f'   Traceback:')
        print(trace)
        
        return jsonify({
            'success': False,
            'error': error_msg,
            'traceback': trace
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5301))
    print(f'🐍 Python NFe Signer rodando na porta 5301')
    print(f'📡 Endpoint: http://localhost:{port}/sign')
    print(f'⚠️  SHA-1 habilitado (exigido pela SEFAZ)')
    app.run(host='0.0.0.0', port=port, debug=False)