import React, { useEffect, useState, useRef } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { SettingsIcon, UploadIcon, CheckCircleIcon, AlertCircleIcon, FileIcon, ImageIcon } from 'lucide-react';
import { db } from '../utils/database';
import { useCompany } from '../context/CompanyContext';
export function CompanySettings() {
  const {
    activeCompanyId
  } = useCompany();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const certificateInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState({
    // Certificado Digital
    certificado_pfx: '',
    certificado_senha: '',
    certificado_nome: '',
    certificado_validade: '',
    // Logo
    logo_url: '',
    logo_nome: '',
    // Configurações NFe
    ambiente: 'homologacao' as 'homologacao' | 'producao',
    serie_nfe: '1',
    proximo_numero: '1',
    // Configurações de Emissão
    regime_tributario: '1',
    tipo_emissao: '1',
    finalidade_nfe: '1',
    // Configurações de Impressão
    formato_danfe: 'retrato' as 'retrato' | 'paisagem',
    exibir_logo_danfe: true,
    // Configurações de E-mail
    email_envio: '',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    smtp_secure: true
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
      // Carregar configurações salvas (simulado - você pode adicionar endpoint específico)
      // Por enquanto, usar valores padrão
      setSettings(prev => ({
        ...prev,
        email_envio: companyData.email || '',
        serie_nfe: '1',
        proximo_numero: '1'
      }));
    } catch (error) {
      console.error('Error loading company settings:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showMessage('error', 'Logo deve ter no máximo 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        showMessage('error', 'Arquivo deve ser uma imagem');
        return;
      }
      const reader = new FileReader();
      reader.onload = event => {
        setSettings(prev => ({
          ...prev,
          logo_url: event.target?.result as string,
          logo_nome: file.name
        }));
        showMessage('success', 'Logo carregada com sucesso');
      };
      reader.readAsDataURL(file);
    }
  };
  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.pfx') && !file.name.endsWith('.p12')) {
        showMessage('error', 'Arquivo deve ser .pfx ou .p12');
        return;
      }
      const reader = new FileReader();
      reader.onload = event => {
        setSettings(prev => ({
          ...prev,
          certificado_pfx: event.target?.result as string,
          certificado_nome: file.name
        }));
        showMessage('success', 'Certificado carregado com sucesso');
      };
      reader.readAsDataURL(file);
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
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({
      type,
      text
    });
    setTimeout(() => setMessage(null), 5000);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Aqui você salvaria as configurações no backend
      // Por enquanto, apenas simular
      await new Promise(resolve => setTimeout(resolve, 1000));
      showMessage('success', 'Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', 'Erro ao salvar configurações');
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

      <main className="p-8">
        {message && <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {message.type === 'success' ? <CheckCircleIcon size={20} className="text-green-600" /> : <AlertCircleIcon size={20} className="text-red-600" />}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
          </div>}

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
              {settings.logo_url ? <div className="w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                  <img src={settings.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
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
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <Button type="button" variant="secondary" onClick={() => logoInputRef.current?.click()}>
                  <UploadIcon size={16} className="mr-2" />
                  {settings.logo_nome ? 'Alterar Logo' : 'Fazer Upload'}
                </Button>
                {settings.logo_nome && <p className="text-sm text-gray-600 mt-2">
                    Arquivo: {settings.logo_nome}
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
                <input ref={certificateInputRef} type="file" accept=".pfx,.p12" onChange={handleCertificateUpload} className="hidden" />
                <Button type="button" variant="secondary" onClick={() => certificateInputRef.current?.click()}>
                  <UploadIcon size={16} className="mr-2" />
                  {settings.certificado_nome ? 'Alterar Certificado' : 'Fazer Upload do Certificado'}
                </Button>
                {settings.certificado_nome && <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                    <CheckCircleIcon size={16} />
                    Certificado: {settings.certificado_nome}
                  </p>}
              </div>

              <Input label="Senha do Certificado *" name="certificado_senha" type="password" value={settings.certificado_senha} onChange={handleChange} placeholder="Digite a senha do certificado" required={!!settings.certificado_pfx} />

              {settings.certificado_validade && <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Validade:</strong> {settings.certificado_validade}
                  </p>
                </div>}
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
              <Select label="Ambiente *" name="ambiente" value={settings.ambiente} onChange={handleChange} options={[{
              value: 'homologacao',
              label: 'Homologação (Testes)'
            }, {
              value: 'producao',
              label: 'Produção (Real)'
            }]} required />

              <Input label="Série da NFe *" name="serie_nfe" value={settings.serie_nfe} onChange={handleChange} placeholder="1" required />

              <Input label="Próximo Número *" name="proximo_numero" type="number" value={settings.proximo_numero} onChange={handleChange} placeholder="1" required />

              <Select label="Regime Tributário *" name="regime_tributario" value={settings.regime_tributario} onChange={handleChange} options={[{
              value: '1',
              label: 'Simples Nacional'
            }, {
              value: '2',
              label: 'Simples Nacional - Excesso'
            }, {
              value: '3',
              label: 'Regime Normal'
            }]} required />

              <Select label="Tipo de Emissão *" name="tipo_emissao" value={settings.tipo_emissao} onChange={handleChange} options={[{
              value: '1',
              label: 'Normal'
            }, {
              value: '2',
              label: 'Contingência FS-IA'
            }, {
              value: '9',
              label: 'Contingência Off-Line'
            }]} required />

              <Select label="Finalidade da NFe *" name="finalidade_nfe" value={settings.finalidade_nfe} onChange={handleChange} options={[{
              value: '1',
              label: 'Normal'
            }, {
              value: '2',
              label: 'Complementar'
            }, {
              value: '3',
              label: 'Ajuste'
            }, {
              value: '4',
              label: 'Devolução'
            }]} required />
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Atenção:</strong> Certifique-se de testar em ambiente de
                homologação antes de usar em produção.
              </p>
            </div>
          </Card>

          {/* Configurações de DANFE */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Configurações de Impressão (DANFE)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Formato da DANFE *" name="formato_danfe" value={settings.formato_danfe} onChange={handleChange} options={[{
              value: 'retrato',
              label: 'Retrato (Padrão)'
            }, {
              value: 'paisagem',
              label: 'Paisagem'
            }]} required />

              <div className="flex items-center pt-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="exibir_logo_danfe" checked={settings.exibir_logo_danfe} onChange={handleChange} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                  <span className="text-sm text-gray-700">
                    Exibir logo na DANFE
                  </span>
                </label>
              </div>
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
              <Input label="E-mail de Envio" name="email_envio" type="email" value={settings.email_envio} onChange={handleChange} placeholder="nfe@suaempresa.com.br" className="md:col-span-2" />

              <Input label="Servidor SMTP" name="smtp_host" value={settings.smtp_host} onChange={handleChange} placeholder="smtp.gmail.com" />

              <Input label="Porta SMTP" name="smtp_port" value={settings.smtp_port} onChange={handleChange} placeholder="587" />

              <Input label="Usuário SMTP" name="smtp_user" value={settings.smtp_user} onChange={handleChange} placeholder="usuario@email.com" />

              <Input label="Senha SMTP" name="smtp_password" type="password" value={settings.smtp_password} onChange={handleChange} placeholder="••••••••" />

              <div className="flex items-center pt-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="smtp_secure" checked={settings.smtp_secure} onChange={handleChange} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                  <span className="text-sm text-gray-700">
                    Usar conexão segura (TLS/SSL)
                  </span>
                </label>
              </div>
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