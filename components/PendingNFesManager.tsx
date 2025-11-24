import React, { useEffect, useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { FileTextIcon, SendIcon, RefreshCwIcon, AlertCircleIcon, CheckCircleIcon, ClockIcon, ArrowRightIcon } from 'lucide-react';
import { db } from '../utils/database';
import { useCompany } from '../context/CompanyContext';
interface PendingNFe {
  id: number;
  numero: string;
  serie: string;
  cliente_nome: string;
  valor_total: number;
  data_emissao: string;
  status: string;
}
export function PendingNFesManager() {
  const {
    activeCompanyId
  } = useCompany();
  const [pendingNFes, setPendingNFes] = useState<PendingNFe[]>([]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState<number | null>(null);
  const [resendingAll, setResendingAll] = useState(false);
  useEffect(() => {
    if (activeCompanyId) {
      loadPendingNFes();
    }
  }, [activeCompanyId]);
  const loadPendingNFes = async () => {
    if (!activeCompanyId) return;
    setLoading(true);
    try {
      const nfes = await db.getNFes(activeCompanyId);
      const pending = nfes.filter((nfe: any) => nfe.status === 'Pendente');
      setPendingNFes(pending);
    } catch (error) {
      console.error('Error loading pending NFes:', error);
    } finally {
      setLoading(false);
    }
  };
  const resendNFe = async (nfeId: number) => {
    if (!activeCompanyId) return;
    setResending(nfeId);
    try {
      await db.transmitirNFe(activeCompanyId, nfeId);
      await loadPendingNFes();
    } catch (error) {
      console.error('Error resending NFe:', error);
    } finally {
      setResending(null);
    }
  };
  const resendAll = async () => {
    if (!activeCompanyId || pendingNFes.length === 0) return;
    setResendingAll(true);
    try {
      for (const nfe of pendingNFes) {
        await db.transmitirNFe(activeCompanyId, nfe.id);
      }
      await loadPendingNFes();
    } catch (error) {
      console.error('Error resending all NFes:', error);
    } finally {
      setResendingAll(false);
    }
  };
  if (!activeCompanyId) {
    return <Card className="p-6">
        <div className="text-center py-8">
          <AlertCircleIcon size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600">
            Selecione uma empresa para ver NFes pendentes
          </p>
        </div>
      </Card>;
  }
  return <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <ClockIcon size={20} className="text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              NFes Pendentes
            </h3>
            <p className="text-sm text-gray-600">
              {pendingNFes.length}{' '}
              {pendingNFes.length === 1 ? 'nota aguardando' : 'notas aguardando'}{' '}
              envio
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadPendingNFes} disabled={loading} variant="secondary" className="flex items-center gap-2">
            <RefreshCwIcon size={16} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </Button>
          {pendingNFes.length > 0 && <Button onClick={resendAll} disabled={resendingAll} className="flex items-center gap-2">
              <SendIcon size={16} />
              {resendingAll ? 'Reenviando...' : 'Reenviar Todas'}
            </Button>}
        </div>
      </div>

      {loading ? <div className="text-center py-12">
          <RefreshCwIcon size={48} className="mx-auto text-gray-400 animate-spin mb-3" />
          <p className="text-gray-600">Carregando NFes pendentes...</p>
        </div> : pendingNFes.length === 0 ? <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircleIcon size={32} className="text-green-600" />
          </div>
          <p className="text-gray-900 font-medium mb-1">Nenhuma NFe pendente</p>
          <p className="text-sm text-gray-600">
            Todas as notas foram enviadas com sucesso!
          </p>
        </div> : <div className="space-y-3">
          {pendingNFes.map(nfe => <div key={nfe.id} className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileTextIcon size={20} className="text-orange-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        NFe #{nfe.numero} - Série {nfe.serie}
                      </h4>
                      <span className="px-2 py-0.5 text-xs font-medium bg-orange-200 text-orange-800 rounded-full">
                        Pendente
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">
                      Cliente: {nfe.cliente_nome}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>
                        Valor: R$ {parseFloat(nfe.valor_total).toFixed(2)}
                      </span>
                      <span>•</span>
                      <span>
                        Emissão:{' '}
                        {new Date(nfe.data_emissao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                <Button onClick={() => resendNFe(nfe.id)} disabled={resending === nfe.id || resendingAll} variant="secondary" className="flex items-center gap-2 ml-4">
                  {resending === nfe.id ? <>
                      <RefreshCwIcon size={16} className="animate-spin" />
                      Enviando...
                    </> : <>
                      <SendIcon size={16} />
                      Reenviar
                      <ArrowRightIcon size={14} />
                    </>}
                </Button>
              </div>
            </div>)}
        </div>}

      {pendingNFes.length > 0 && <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Dica:</strong> As NFes pendentes foram salvas localmente.
            Clique em "Reenviar" para tentar enviar novamente à SEFAZ.
          </p>
        </div>}
    </Card>;
}