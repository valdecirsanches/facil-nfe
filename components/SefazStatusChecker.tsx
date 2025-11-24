import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { RefreshCwIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon, WifiIcon, WifiOffIcon, SendIcon, DownloadIcon, ClockIcon, FileTextIcon, ArrowRightIcon } from 'lucide-react';
import { db } from '../utils/database';
interface SefazStatusCheckerProps {
  uf?: string;
}
interface RequestDetails {
  sent: string;
  received: string;
  duration: number;
}
export function SefazStatusChecker({
  uf = 'SP'
}: SefazStatusCheckerProps) {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [requestDetails, setRequestDetails] = useState<RequestDetails | null>(null);
  const checkStatus = async () => {
    setChecking(true);
    const startTime = Date.now();
    try {
      const result = await db.consultarStatusSefaz(uf);
      const endTime = Date.now();
      const duration = endTime - startTime;
      setStatus(result);
      setLastCheck(new Date());
      // Simular detalhes da requisição
      setRequestDetails({
        sent: new Date(startTime).toISOString(),
        received: new Date(endTime).toISOString(),
        duration: duration
      });
    } catch (error) {
      setStatus({
        status: 'error',
        mensagem: 'Erro ao consultar status'
      });
      setRequestDetails(null);
    } finally {
      setChecking(false);
    }
  };
  const getStatusIcon = () => {
    if (!status) return <AlertCircleIcon size={24} className="text-gray-400" />;
    // Código 107 = Serviço em Operação
    if (status.codigo === '107' || status.codigo === 107 || status.status === 'online') return <CheckCircleIcon size={24} className="text-green-600" />;
    if (status.status === 'offline') return <XCircleIcon size={24} className="text-red-600" />;
    return <AlertCircleIcon size={24} className="text-yellow-600" />;
  };
  const getStatusBadge = () => {
    if (!status) return null;
    // Código 107 = Online
    const isOnline = status.codigo === '107' || status.codigo === 107 || status.status === 'online';
    const colors = {
      online: 'bg-green-100 text-green-800 border-green-200',
      offline: 'bg-red-100 text-red-800 border-red-200',
      error: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    const color = isOnline ? colors.online : status.status === 'offline' ? colors.offline : colors.error;
    const label = isOnline ? 'Online' : status.status === 'offline' ? 'Offline' : 'Erro';
    return <span className={`px-3 py-1 text-sm font-medium rounded-full border ${color}`}>
        {label}
      </span>;
  };
  return <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {status?.status === 'online' ? <div className="relative">
              <WifiIcon size={24} className="text-green-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            </div> : <WifiOffIcon size={24} className="text-gray-400" />}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Status da SEFAZ
            </h3>
            <p className="text-sm text-gray-600">
              Ambiente: {status?.ambiente || 'Homologação'} - {uf}
            </p>
          </div>
        </div>
        <Button onClick={checkStatus} disabled={checking} variant="secondary" className="flex items-center gap-2">
          <RefreshCwIcon size={16} className={checking ? 'animate-spin' : ''} />
          {checking ? 'Verificando...' : 'Verificar Status'}
        </Button>
      </div>

      {status && <div className="space-y-4">
          {/* Status Principal */}
          <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${status.codigo === '107' || status.codigo === 107 || status.status === 'online' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-3">
              {getStatusIcon()}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {status.codigo === '107' || status.codigo === 107 || status.status === 'online' ? 'Serviço Operacional' : 'Serviço Indisponível'}
                  </h4>
                  {getStatusBadge()}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-700">
                    <strong>Código:</strong> {status.codigo}
                  </p>
                  <p className="text-gray-700">
                    <strong>Mensagem:</strong> {status.mensagem}
                  </p>
                  {status.dhRecbto && <p className="text-gray-600">
                      <strong>Última resposta:</strong>{' '}
                      {new Date(status.dhRecbto).toLocaleString('pt-BR')}
                    </p>}
                  {status.tMed && <p className="text-gray-600">
                      <strong>Tempo médio:</strong> {status.tMed}s
                    </p>}
                  {status.detalhes && <p className="text-gray-600">
                      <strong>Detalhes:</strong> {status.detalhes}
                    </p>}
                </div>
              </div>
            </div>
          </div>

          {/* Detalhes da Requisição */}
          {requestDetails && <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <SendIcon size={16} className="text-blue-600" />
                  <span className="text-xs font-semibold text-blue-900">
                    Comando Enviado
                  </span>
                </div>
                <p className="text-xs text-blue-700 font-mono">
                  {new Date(requestDetails.sent).toLocaleTimeString('pt-BR')}
                </p>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DownloadIcon size={16} className="text-green-600" />
                  <span className="text-xs font-semibold text-green-900">
                    Resposta Recebida
                  </span>
                </div>
                <p className="text-xs text-green-700 font-mono">
                  {new Date(requestDetails.received).toLocaleTimeString('pt-BR')}
                </p>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <ClockIcon size={16} className="text-purple-600" />
                  <span className="text-xs font-semibold text-purple-900">
                    Tempo de Resposta
                  </span>
                </div>
                <p className="text-xs text-purple-700 font-mono">
                  {requestDetails.duration}ms
                </p>
              </div>
            </div>}

          {lastCheck && <p className="text-xs text-gray-500 text-center">
              Última verificação: {lastCheck.toLocaleTimeString('pt-BR')}
            </p>}

          {status.status === 'offline' && status.codigo !== '107' && status.codigo !== 107 && <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircleIcon size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-900 mb-1">
                      ⚠️ Modo Offline Ativo
                    </p>
                    <p className="text-sm text-yellow-800">
                      As NFes serão salvas localmente e podem ser reenviadas
                      quando o serviço voltar.
                    </p>
                  </div>
                </div>
              </div>}
        </div>}

      {!status && <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <AlertCircleIcon size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-600 mb-2">
            Clique em "Verificar Status" para consultar a SEFAZ
          </p>
          <p className="text-sm text-gray-500">
            Você verá detalhes da comunicação em tempo real
          </p>
        </div>}
    </Card>;
}