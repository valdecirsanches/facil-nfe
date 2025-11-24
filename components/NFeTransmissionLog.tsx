import React from 'react';
import { Card } from './ui/Card';
import { CheckCircleIcon, AlertCircleIcon, LoaderIcon, ClockIcon, SendIcon, FileTextIcon, MailIcon } from 'lucide-react';
interface LogEntry {
  timestamp: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message: string;
  details?: string;
}
interface NFeTransmissionLogProps {
  logs: LogEntry[];
  isTransmitting: boolean;
}
export function NFeTransmissionLog({
  logs,
  isTransmitting
}: NFeTransmissionLogProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon size={20} className="text-green-600" />;
      case 'error':
        return <AlertCircleIcon size={20} className="text-red-600" />;
      case 'processing':
        return <LoaderIcon size={20} className="text-blue-600 animate-spin" />;
      default:
        return <ClockIcon size={20} className="text-gray-400" />;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      case 'processing':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-300 bg-gray-50';
    }
  };
  const getStepIcon = (message: string) => {
    if (message.includes('Validando')) return '📋';
    if (message.includes('Assinando')) return '🔐';
    if (message.includes('Enviando')) return '📤';
    if (message.includes('Processando')) return '⚙️';
    if (message.includes('Autorizada')) return '✅';
    if (message.includes('DANFE')) return '📄';
    if (message.includes('E-mail')) return '📧';
    if (message.includes('XML')) return '📝';
    return '•';
  };
  return <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <SendIcon size={20} className="text-gray-600" />
          Log de Transmissão
        </h3>
        {isTransmitting && <div className="flex items-center gap-2 text-blue-600">
            <LoaderIcon size={16} className="animate-spin" />
            <span className="text-sm font-medium">Processando...</span>
          </div>}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {logs.length === 0 ? <div className="text-center py-8 text-gray-500">
            <ClockIcon size={32} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Aguardando início da transmissão...</p>
          </div> : logs.map((log, index) => <div key={index} className={`border-l-4 p-4 rounded-r-lg transition-all ${getStatusColor(log.status)}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon(log.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getStepIcon(log.message)}</span>
                    <p className="font-medium text-gray-900">{log.message}</p>
                  </div>
                  {log.details && <p className="text-sm text-gray-600 mt-1 font-mono bg-white/50 p-2 rounded">
                      {log.details}
                    </p>}
                  <p className="text-xs text-gray-500 mt-1">{log.timestamp}</p>
                </div>
              </div>
            </div>)}
      </div>

      {logs.length > 0 && <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Total de etapas: {logs.length}
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircleIcon size={14} />
                {logs.filter(l => l.status === 'success').length} sucesso
              </span>
              {logs.filter(l => l.status === 'error').length > 0 && <span className="flex items-center gap-1 text-red-600">
                  <AlertCircleIcon size={14} />
                  {logs.filter(l => l.status === 'error').length} erro(s)
                </span>}
            </div>
          </div>
        </div>}
    </Card>;
}