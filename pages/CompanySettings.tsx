import React, { useEffect, useState, useRef } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { toast, Toaster } from 'sonner';
import { SettingsIcon, UploadIcon, CheckCircleIcon, FileIcon, ImageIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { db } from '../utils/database';
import { useCompany } from '../context/CompanyContext';
export function CompanySettings() {
  const {
    activeCompanyId
  } = useCompany();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const certificateInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState({
    // Certificado Digital
    certificado_senha: '',
    certificado_path: '',
    // Logo
    logo_path: '',
    // Configurações NFe
    sefaz_ambiente: 2,
    sefaz_uf: 'SP',
    serie_nfe: 1,
    proximo_numero: 1,
    csosn_padrao: '102',
    // Configurações de E-mail
    email_smtp_host: '',
    email_smtp_port: 587,
    email_smtp_user: '',
    email_smtp_pass: ''
  });
  useEffect(() => {
    if (activeCompanyId) {
      loadCompanySettings();
    }
  }, [activeCompanyId]);
  const loadCompanySettings = async () => {
    if (!activeCompanyId) return;
    try {
      await db.initialize();
      const companyData = await db.getCompanyById(activeCompanyId);
      setCompany(companyData);
      // Carregar configurações
      const config = await db.getConfiguracoes(activeCompanyId);
      setSettings({
        certificado_senha: config.certificado_senha || '',
        certificado_path: config.certificado_path || '',
        logo_path: companyData.logo_path || '',
        sefaz_ambiente: config.sefaz_ambiente || 2,
        sefaz_uf: config.sefaz_uf || 'SP',
        serie_nfe: config.serie_nfe || 1,
        proximo_numero: config.proximo_numero || 1,
        csosn_padrao: config.csosn_padrao || '102',
        email_smtp_host: config.email_smtp_host || '',
        email_smtp_port: config.email_smtp_port || 587,
        email_smtp_user: config.email_smtp_user || '',
        email_smtp_pass: config.email_smtp_pass || ''
      });
    } catch (error) {
      console.error('Error loading company settings:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo deve ter no máximo 2MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Arquivo deve ser uma imagem');
      return;
    }
    setUploadingLogo(true);
    const loadingToast = toast.loading('Enviando logo...');
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5300/api/empresas/${activeCompanyId}/upload/logo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Resposta não é JSON:', text);
        toast.error('Erro no servidor. Verifique o console.', {
          id: loadingToast
        });
        return;
      }
      const data = await response.json();
      if (data.success) {
        setSettings(prev => ({
          ...prev,
          logo_path: data.path
        }));
        toast.success('Logo enviada com sucesso!', {
          id: loadingToast
        });
        await loadCompanySettings();
      } else {
        toast.error(data.error || 'Erro ao enviar logo', {
          id: loadingToast
        });
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Erro ao enviar logo', {
        id: loadingToast
      });
    } finally {
      setUploadingLogo(false);
    }
  };
  const handleCertificateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.pfx') && !file.name.endsWith('.p12')) {
      toast.error('Arquivo deve ser .pfx ou .p12');
      return;
    }
    setUploadingCert(true);
    const loadingToast = toast.loading('Enviando certificado...');
    try {
      const formData = new FormData();
      formData.append('certificado', file);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5300/api/empresas/${activeCompanyId}/upload/certificado`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Resposta não é JSON:', text);
        toast.error('Erro no servidor. Verifique o console.', {
          id: loadingToast
        });
        return;
      }
      const data = await response.json();
      if (data.success) {
        setSettings(prev => ({
          ...prev,
          certificado_path: data.path
        }));
        toast.success('Certificado enviado com sucesso!', {
          id: loadingToast
        });
      } else {
        toast.error(data.error || 'Erro ao enviar certificado', {
          id: loadingToast
        });
      }
    } catch (error) {
      console.error('Error uploading certificate:', error);
      toast.error('Erro ao enviar certificado', {
        id: loadingToast
      });
    } finally {
      setUploadingCert(false);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const {
      name,
      value,
      type
    } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? parseInt(value) || 0 : value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const loadingToast = toast.loading('Salvando configurações...');
    try {
      await db.saveConfiguracoes(activeCompanyId!, settings);
      toast.success('Configurações salvas com sucesso!', {
        id: loadingToast
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações', {
        id: loadingToast
      });
    } finally {
      setSaving(false);
    }
  };
  if (!activeCompanyId) {
    return <div className="flex-1 bg-gray-50">
        <Header title="Configurações da Empresa" />
        <main className="p-8">
          <Card className="p-12 text-center">
            <p className="text-gray-600">
              Selecione uma empresa ativa para configurar
            </p>
          </Card>
        </main>
      </div>;
  }
  if (loading) {
    return <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>;
  }
  return <div className="flex-1 bg-gray-50">
      <Header title="Configurações da Empresa" />
      <Toaster position="top-right" richColors />

      <main className="p-8">
        <form onSubmit={handleSubmit}>
          {/* Logo da Empresa */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <ImageIcon size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Logo da Empresa
              </h3>
            </div>

            <div className="flex items-start gap-6">
              {settings.logo_path ? <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                  <img src={`http://localhost:5300/${settings.logo_path}`} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div> : <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                  <ImageIcon size={32} className="text-gray-400" />
                </div>}

              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-3">
                  Faça upload da logo da sua empresa para aparecer na DANFE e
                  documentos fiscais.
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Formatos aceitos: PNG, JPG, JPEG. Tamanho máximo: 2MB.
                  Recomendado: 300x100px
                </p>
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} />
                <Button type="button" variant="secondary" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                  <UploadIcon size={16} className="mr-2" />
                  {uploadingLogo ? 'Enviando...' : settings.logo_path ? 'Alterar Logo' : 'Fazer Upload'}
                </Button>
                {settings.logo_path && <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                    <CheckCircleIcon size={16} />
                    Logo configurada
                  </p>}
              </div>
            </div>
          </Card>

          {/* Certificado Digital */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <FileIcon size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Certificado Digital (A1)
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Faça upload do certificado digital A1 (arquivo .pfx ou .p12)
                  para assinar as NFe.
                </p>
                <input ref={certificateInputRef} type="file" accept=".pfx,.p12" onChange={handleCertificateUpload} className="hidden" disabled={uploadingCert} />
                <Button type="button" variant="secondary" onClick={() => certificateInputRef.current?.click()} disabled={uploadingCert}>
                  <UploadIcon size={16} className="mr-2" />
                  {uploadingCert ? 'Enviando...' : settings.certificado_path ? 'Alterar Certificado' : 'Fazer Upload do Certificado'}
                </Button>
                {settings.certificado_path && <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                    <CheckCircleIcon size={16} />
                    Certificado configurado
                  </p>}
              </div>

              <Input label="Senha do Certificado *" name="certificado_senha" type={showPassword ? 'text' : 'password'} value={settings.certificado_senha} onChange={handleChange} placeholder="Digite a senha do certificado" required={!!settings.certificado_path} rightIcon={<button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                  </button>} />
              <Button type="button" variant="secondary" onClick={() => setShowPassword(!showPassword)} className="mt-2">
                {showPassword ? 'Ocultar' : 'Mostrar'} Senha
              </Button>
            </div>
          </Card>

          {/* Configurações de Ambiente */}
          <Card className="p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <SettingsIcon size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Configurações de Emissão
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Ambiente *" name="sefaz_ambiente" value={settings.sefaz_ambiente.toString()} onChange={handleChange} options={[{
              value: '2',
              label: 'Homologação (Testes)'
            }, {
              value: '1',
              label: 'Produção (Real)'
            }]} required />

              <Select label="UF da SEFAZ *" name="sefaz_uf" value={settings.sefaz_uf} onChange={handleChange} options={[{
              value: 'SP',
              label: 'São Paulo'
            }, {
              value: 'RJ',
              label: 'Rio de Janeiro'
            }, {
              value: 'MG',
              label: 'Minas Gerais'
            }]} required />

              <Input label="Série da NFe *" name="serie_nfe" type="number" value={settings.serie_nfe.toString()} onChange={handleChange} placeholder="1" required />

              <Input label="Próximo Número *" name="proximo_numero" type="number" value={settings.proximo_numero.toString()} onChange={handleChange} placeholder="1" required />

              <Select label="CSOSN Padrão (Simples Nacional) *" name="csosn_padrao" value={settings.csosn_padrao} onChange={handleChange} options={[{
              value: '102',
              label: '102 - Sem permissão de crédito'
            }, {
              value: '103',
              label: '103 - Isenção do ICMS'
            }, {
              value: '300',
              label: '300 - Imune'
            }, {
              value: '400',
              label: '400 - Não tributada'
            }]} required />
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Atenção:</strong> Certifique-se de testar em ambiente de
                homologação antes de usar em produção.
              </p>
            </div>
          </Card>

          {/* Configurações de E-mail */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Configurações de E-mail (SMTP)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Configure o servidor SMTP para envio automático de NFe por e-mail.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Servidor SMTP" name="email_smtp_host" value={settings.email_smtp_host} onChange={handleChange} placeholder="smtp.gmail.com" />

              <Input label="Porta SMTP" name="email_smtp_port" type="number" value={settings.email_smtp_port.toString()} onChange={handleChange} placeholder="587" />

              <Input label="Usuário SMTP" name="email_smtp_user" value={settings.email_smtp_user} onChange={handleChange} placeholder="usuario@email.com" />

              <Input label="Senha SMTP" name="email_smtp_pass" type="password" value={settings.email_smtp_pass} onChange={handleChange} placeholder="••••••••" />
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </form>
      </main>
    </div>;
}