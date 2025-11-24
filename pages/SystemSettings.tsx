import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { SefazStatusChecker } from '../components/SefazStatusChecker';
import { PendingNFesManager } from '../components/PendingNFesManager';
import { FileUpload } from '../components/FileUpload';
import { SaveIcon, CheckCircleIcon, AlertTriangleIcon, RefreshCwIcon } from 'lucide-react';
import { useCompany } from '../context/CompanyContext';
const API_URL = 'http://localhost:3001/api';
interface Config {
  sefaz_ambiente: string;
  sefaz_uf: string;
  certificado_tipo: string;
  certificado_senha: string;
  certificado_path: string;
  serie_nfe: string;
  proximo_numero: string;
  csosn_padrao: string;
  email_smtp_host: string;
  email_smtp_port: string;
  email_smtp_user: string;
  email_smtp_pass: string;
}
export function SystemSettings() {
  const {
    activeCompanyId
  } = useCompany();
  const [config, setConfig] = useState<Config>({
    sefaz_ambiente: '2',
    sefaz_uf: 'SP',
    certificado_tipo: 'A1',
    certificado_senha: '',
    certificado_path: '',
    serie_nfe: '1',
    proximo_numero: '1',
    csosn_padrao: '102',
    email_smtp_host: '',
    email_smtp_port: '587',
    email_smtp_user: '',
    email_smtp_pass: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  useEffect(() => {
    if (activeCompanyId) {
      loadConfigs();
    }
  }, [activeCompanyId]);
  const loadConfigs = async () => {
    if (!activeCompanyId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log(`🔄 Carregando configurações da empresa ${activeCompanyId}...`);
      const response = await fetch(`${API_URL}/empresas/${activeCompanyId}/configuracoes`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('✅ Configurações recebidas:', data);
      setConfig({
        sefaz_ambiente: String(data.sefaz_ambiente || '2'),
        sefaz_uf: data.sefaz_uf || 'SP',
        certificado_tipo: data.certificado_tipo || 'A1',
        certificado_senha: data.certificado_senha || '',
        certificado_path: data.certificado_path || '',
        serie_nfe: String(data.serie_nfe || '1'),
        proximo_numero: String(data.proximo_numero || '1'),
        csosn_padrao: String(data.csosn_padrao || '102'),
        email_smtp_host: data.email_smtp_host || '',
        email_smtp_port: String(data.email_smtp_port || '587'),
        email_smtp_user: data.email_smtp_user || '',
        email_smtp_pass: data.email_smtp_pass || ''
      });
    } catch (error) {
      console.error('❌ Erro ao carregar:', error);
      setErrorMessage('Erro ao carregar configurações: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    if (!activeCompanyId) {
      console.error('❌ Nenhuma empresa selecionada!');
      setErrorMessage('Nenhuma empresa selecionada');
      setShowError(true);
      return;
    }
    console.log('🚀 INICIANDO SALVAMENTO...');
    console.log('📦 Empresa ID:', activeCompanyId);
    console.log('📦 Config atual:', config);
    setSaving(true);
    setShowSuccess(false);
    setShowError(false);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado. Faça login novamente.');
      }
      const url = `${API_URL}/empresas/${activeCompanyId}/configuracoes`;
      const payload = {
        sefaz_ambiente: parseInt(config.sefaz_ambiente),
        sefaz_uf: config.sefaz_uf,
        certificado_tipo: config.certificado_tipo,
        certificado_senha: config.certificado_senha,
        certificado_path: config.certificado_path,
        serie_nfe: parseInt(config.serie_nfe),
        proximo_numero: parseInt(config.proximo_numero),
        csosn_padrao: config.csosn_padrao,
        email_smtp_host: config.email_smtp_host,
        email_smtp_port: parseInt(config.email_smtp_port),
        email_smtp_user: config.email_smtp_user,
        email_smtp_pass: config.email_smtp_pass
      };
      console.log('📡 URL:', url);
      console.log('📦 Payload:', {
        ...payload,
        certificado_senha: payload.certificado_senha ? '***' : '(vazio)',
        email_smtp_pass: payload.email_smtp_pass ? '***' : '(vazio)'
      });
      console.log('🔄 Enviando requisição PUT...');
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      console.log('📨 Response status:', response.status);
      console.log('📨 Response ok:', response.ok);
      const result = await response.json();
      console.log('📨 Response body:', result);
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar');
      }
      console.log('✅ Salvo com sucesso!');
      await loadConfigs();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('❌ ERRO AO SALVAR:', error);
      console.error('❌ Stack:', error instanceof Error ? error.stack : 'N/A');
      setErrorMessage('Erro ao salvar configurações: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      setShowError(true);
    } finally {
      setSaving(false);
      console.log('🏁 Salvamento finalizado');
    }
  };
  const handleCertificadoUpload = async (file: File) => {
    if (!activeCompanyId) return;
    const formData = new FormData();
    formData.append('certificado', file);
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/empresas/${activeCompanyId}/upload/certificado`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao fazer upload');
    }
    const result = await response.json();
    console.log('✅ Certificado enviado:', result);
    setConfig(prev => ({
      ...prev,
      certificado_path: result.path
    }));
    await loadConfigs();
  };
  const updateConfig = (field: keyof Config, value: string) => {
    console.log(`📝 Atualizando ${field}: "${value}"`);
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };
  if (!activeCompanyId) {
    return <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertTriangleIcon size={48} className="mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma Empresa Selecionada
          </h3>
          <p className="text-gray-600">
            Selecione uma empresa no menu superior para configurar.
          </p>
        </Card>
      </div>;
  }
  if (loading) {
    return <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCwIcon size={48} className="mx-auto text-gray-400 animate-spin mb-3" />
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>;
  }
  return <div className="flex-1 bg-gray-50">
      <Header title="Configurações do Sistema" />

      <main className="p-8 max-w-6xl mx-auto">
        {showSuccess && <Card className="p-4 mb-6 bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <CheckCircleIcon size={20} className="text-green-600" />
              <p className="text-green-800 font-medium">
                Configurações salvas com sucesso!
              </p>
            </div>
          </Card>}

        {showError && <Card className="p-4 mb-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertTriangleIcon size={20} className="text-red-600" />
              <p className="text-red-800 font-medium">{errorMessage}</p>
            </div>
          </Card>}

        {/* Debug Info */}
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <p className="text-xs font-mono text-blue-800 mb-2">
            🐛 <strong>Debug Info (Empresa {activeCompanyId}):</strong>
          </p>
          <div className="text-xs font-mono text-blue-700 space-y-1">
            <div>certificado_path = "{config.certificado_path}"</div>
            <div>
              certificado_senha ={' '}
              {config.certificado_senha ? `"${config.certificado_senha.substring(0, 3)}***"` : '"(vazio)"'}
            </div>
            <div>email_smtp_host = "{config.email_smtp_host}"</div>
            <div>sefaz_ambiente = "{config.sefaz_ambiente}"</div>
          </div>
        </Card>

        {/* Grid de 2 colunas para Status e NFes Pendentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SefazStatusChecker uf={config.sefaz_uf} />
          <PendingNFesManager />
        </div>

        {/* Configurações SEFAZ */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Configurações SEFAZ
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Ambiente" value={config.sefaz_ambiente} onChange={e => updateConfig('sefaz_ambiente', e.target.value)} options={[{
            value: '1',
            label: 'Produção'
          }, {
            value: '2',
            label: 'Homologação'
          }]} />

            <Select label="UF da SEFAZ" value={config.sefaz_uf} onChange={e => updateConfig('sefaz_uf', e.target.value)} options={[{
            value: 'SP',
            label: 'São Paulo'
          }, {
            value: 'RJ',
            label: 'Rio de Janeiro'
          }, {
            value: 'MG',
            label: 'Minas Gerais'
          }, {
            value: 'RS',
            label: 'Rio Grande do Sul'
          }, {
            value: 'PR',
            label: 'Paraná'
          }, {
            value: 'SC',
            label: 'Santa Catarina'
          }]} />
          </div>

          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Atenção:</strong> Em ambiente de homologação, as NFes
              emitidas não têm valor fiscal. Use apenas para testes.
            </p>
          </div>
        </Card>

        {/* Certificado Digital */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Certificado Digital
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Tipo de Certificado" value={config.certificado_tipo} onChange={e => updateConfig('certificado_tipo', e.target.value)} options={[{
              value: 'A1',
              label: 'A1 (arquivo .pfx)'
            }, {
              value: 'A3',
              label: 'A3 (token/smartcard)'
            }]} />

              <Input label="Senha do Certificado" type="password" value={config.certificado_senha} onChange={e => updateConfig('certificado_senha', e.target.value)} placeholder="Digite a senha" />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <FileUpload label="Arquivo do Certificado (.pfx ou .p12)" accept=".pfx,.p12,application/x-pkcs12" onUpload={handleCertificadoUpload} currentFile={config.certificado_path} description="Faça upload do seu certificado digital A1" maxSize={10} />
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Segurança:</strong> O certificado será salvo em
              Arqs/empresa_{activeCompanyId}/certificado.pfx. A senha é
              armazenada no banco de dados da empresa.
            </p>
          </div>
        </Card>

        {/* Configurações de NFe */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Configurações de NFe
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Série Padrão" type="number" value={config.serie_nfe} onChange={e => updateConfig('serie_nfe', e.target.value)} placeholder="1" />

            <Input label="Próximo Número de NFe" type="number" value={config.proximo_numero} onChange={e => updateConfig('proximo_numero', e.target.value)} placeholder="1" />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CSOSN Padrão (Simples Nacional) *
              </label>
              <select value={config.csosn_padrao} onChange={e => updateConfig('csosn_padrao', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="102">
                  102 - Tributada sem permissão de crédito
                </option>
                <option value="103">103 - Isenção do ICMS</option>
                <option value="300">300 - Imune</option>
                <option value="400">400 - Não tributada</option>
                <option value="500">500 - ICMS cobrado anteriormente</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Este CSOSN será usado automaticamente para empresas do Simples
                Nacional (CRT 1 ou 2)
              </p>
            </div>
          </div>
        </Card>

        {/* Configurações de E-mail */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Configurações de E-mail (SMTP)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Servidor SMTP" value={config.email_smtp_host} onChange={e => updateConfig('email_smtp_host', e.target.value)} placeholder="smtp.gmail.com" />

            <Input label="Porta SMTP" type="number" value={config.email_smtp_port} onChange={e => updateConfig('email_smtp_port', e.target.value)} placeholder="587" />

            <Input label="Usuário SMTP" value={config.email_smtp_user} onChange={e => updateConfig('email_smtp_user', e.target.value)} placeholder="seu@email.com" />

            <Input label="Senha SMTP" type="password" value={config.email_smtp_pass} onChange={e => updateConfig('email_smtp_pass', e.target.value)} placeholder="Digite a senha" />
          </div>
        </Card>

        {/* Botões */}
        <div className="flex justify-end gap-4">
          <Button onClick={loadConfigs} variant="secondary" disabled={loading}>
            <RefreshCwIcon size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recarregar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="min-w-[200px]">
            <SaveIcon size={18} className="mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </main>
    </div>;
}