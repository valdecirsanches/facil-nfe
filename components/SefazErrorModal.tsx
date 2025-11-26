import React from 'react';
import { XIcon, AlertTriangleIcon, CheckCircleIcon, InfoIcon, FileTextIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from './ui/Button';
interface SefazErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: {
    cStat: string | number;
    xMotivo: string;
    chave?: string;
    protocolo?: string;
    dhRecbto?: string;
    xml?: string;
    detalhes?: any;
  };
  onRetry?: () => void;
}
export function SefazErrorModal({
  isOpen,
  onClose,
  error,
  onRetry
}: SefazErrorModalProps) {
  if (!isOpen) return null;
  const getSeverityConfig = (cStat: string | number) => {
    const stat = String(cStat);
    if (stat === '100') return {
      color: 'emerald',
      icon: CheckCircleIcon,
      title: 'NFe Autorizada com Sucesso',
      bgGradient: 'from-emerald-50 to-green-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      titleColor: 'text-emerald-900',
      subtitleColor: 'text-emerald-700'
    };
    if (stat.startsWith('1')) return {
      color: 'blue',
      icon: InfoIcon,
      title: 'Processamento em Andamento',
      bgGradient: 'from-blue-50 to-indigo-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      subtitleColor: 'text-blue-700'
    };
    if (stat.startsWith('4')) return {
      color: 'amber',
      icon: AlertTriangleIcon,
      title: 'NFe Denegada',
      bgGradient: 'from-amber-50 to-yellow-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-900',
      subtitleColor: 'text-amber-700'
    };
    return {
      color: 'red',
      icon: AlertTriangleIcon,
      title: 'NFe Rejeitada pela SEFAZ',
      bgGradient: 'from-red-50 to-rose-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      subtitleColor: 'text-red-700'
    };
  };
  const getSolution = (cStat: string | number) => {
    const stat = String(cStat);
    const solutions: Record<string, string> = {
      '225': 'Verifique a estrutura do XML. Certifique-se de que todas as tags obrigatórias estão presentes e no formato correto.',
      '290': 'Certificado digital inválido ou não reconhecido pela SEFAZ. Verifique se está usando o certificado correto para homologação/produção.',
      '297': 'Problema na assinatura digital. Verifique se o certificado está correto, se a senha está configurada e se o Python Signer está rodando.',
      '204': 'Duplicidade de NFe. Esta nota já foi autorizada anteriormente.',
      '539': 'CNPJ do emitente não cadastrado na SEFAZ. Verifique o cadastro da empresa.',
      '213': 'CNPJ do destinatário inválido. Verifique o cadastro do cliente.',
      '280': 'Certificado digital vencido ou inválido. Renove o certificado.'
    };
    return solutions[stat] || 'Consulte o manual da SEFAZ para mais detalhes sobre este erro.';
  };
  const config = getSeverityConfig(error.cStat);
  const Icon = config.icon;
  return <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header com gradiente */}
        <div className={`bg-gradient-to-br ${config.bgGradient} p-6 border-b border-gray-200`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl ${config.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Icon size={28} className={config.iconColor} />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${config.titleColor} mb-1`}>
                  {config.title}
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.iconBg} ${config.iconColor}`}>
                    Código {error.cStat}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-white/50 rounded-lg">
              <XIcon size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Mensagem Principal */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                <InfoIcon size={18} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">
                  Mensagem da SEFAZ
                </h3>
                <p className="text-gray-700 leading-relaxed">{error.xMotivo}</p>
              </div>
            </div>
          </div>

          {/* Solução Sugerida */}
          {error.cStat !== '100' && <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                  <FileTextIcon size={18} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1.5 text-sm">
                    💡 Solução Sugerida
                  </h3>
                  <p className="text-blue-700 leading-relaxed">
                    {getSolution(error.cStat)}
                  </p>
                </div>
              </div>
            </div>}

          {/* Detalhes Técnicos */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <div className="w-1 h-4 bg-gray-900 rounded-full"></div>
              Detalhes Técnicos
            </h3>

            <div className="grid gap-3">
              {error.chave && <div className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                  <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Chave de Acesso
                  </p>
                  <p className="text-sm font-mono text-gray-900 break-all leading-relaxed">
                    {error.chave}
                  </p>
                </div>}

              {error.protocolo && <div className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                  <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Protocolo
                  </p>
                  <p className="text-sm font-mono text-gray-900">
                    {error.protocolo}
                  </p>
                </div>}

              {error.dhRecbto && <div className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                  <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Data/Hora Recebimento
                  </p>
                  <p className="text-sm text-gray-900">
                    {new Date(error.dhRecbto).toLocaleString('pt-BR', {
                  dateStyle: 'long',
                  timeStyle: 'medium'
                })}
                  </p>
                </div>}
            </div>

            {error.detalhes && <details className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <summary className="px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Ver Resposta Completa da SEFAZ
                </summary>
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <pre className="text-xs text-gray-700 overflow-x-auto p-3 bg-white rounded border border-gray-200 leading-relaxed">
                    {JSON.stringify(error.detalhes, null, 2)}
                  </pre>
                </div>
              </details>}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gradient-to-br from-gray-50 to-white flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
          {error.cStat !== '100' && onRetry && <Button onClick={onRetry} className="gap-2">
              <RefreshCwIcon size={16} />
              Tentar Novamente
            </Button>}
        </div>
      </div>
    </div>;
}