import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { DownloadIcon, EyeIcon, XCircleIcon, PrinterIcon, TrashIcon, SendIcon, RefreshCwIcon } from 'lucide-react';
import { db } from '../utils/database';
import { useCompany } from '../context/CompanyContext';
import { DANFEPreview } from '../components/DANFEPreview';
export function NFeList() {
  const {
    activeCompanyId
  } = useCompany();
  const [searchTerm, setSearchTerm] = useState('');
  const [nfes, setNfes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNFeId, setSelectedNFeId] = useState<number | null>(null);
  const [resending, setResending] = useState<number | null>(null);
  useEffect(() => {
    if (activeCompanyId) {
      loadNFes();
    }
  }, [activeCompanyId]);
  const loadNFes = async () => {
    if (!activeCompanyId) return;
    try {
      const data = await db.getNFes(activeCompanyId);
      setNfes(data);
    } catch (error) {
      console.error('Error loading NFes:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteNFe = async (nfeId: number, nfeNumero: string, status: string) => {
    if (!activeCompanyId) return;
    // Permitir exclusão de NFes Processando ou Rejeitadas
    if (status !== 'Processando' && status !== 'Rejeitada') {
      alert('Apenas NFes com status "Processando" ou "Rejeitada" podem ser excluídas.');
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir a NFe #${nfeNumero}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      await db.deleteNFe(activeCompanyId, nfeId);
      alert('NFe excluída com sucesso!');
      loadNFes();
    } catch (error) {
      console.error('Error deleting NFe:', error);
      alert('Erro ao excluir NFe.');
    }
  };
  const handleResendNFe = async (nfeId: number) => {
    if (!activeCompanyId) return;
    setResending(nfeId);
    try {
      await db.transmitirNFe(activeCompanyId, nfeId);
      alert('NFe reenviada com sucesso!');
      loadNFes();
    } catch (error) {
      console.error('Error resending NFe:', error);
      alert('Erro ao reenviar NFe.');
    } finally {
      setResending(null);
    }
  };
  const filteredNFes = nfes.filter(nfe => nfe.numero.includes(searchTerm) || nfe.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()));
  if (!activeCompanyId) {
    return <div className="flex-1 bg-gray-50">
        <Header title="Notas Fiscais Emitidas" />
        <main className="p-8">
          <Card className="p-12 text-center">
            <p className="text-gray-600">
              Selecione uma empresa para visualizar as notas
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
      <Header title="Notas Fiscais Emitidas" />

      <main className="p-8">
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input label="Buscar" placeholder="Número da nota ou cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select label="Status" options={[{
            value: 'all',
            label: 'Todos'
          }, {
            value: 'authorized',
            label: 'Autorizadas'
          }, {
            value: 'cancelled',
            label: 'Canceladas'
          }]} />
            <Select label="Período" options={[{
            value: 'today',
            label: 'Hoje'
          }, {
            value: 'week',
            label: 'Esta Semana'
          }, {
            value: 'month',
            label: 'Este Mês'
          }]} />
          </div>
        </Card>

        <Card>
          <Table headers={['Número', 'Data', 'Cliente', 'Valor', 'Status', 'Ações']}>
            {filteredNFes.map(nfe => <tr key={nfe.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-gray-900">
                    {nfe.numero}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(nfe.data_emissao).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {nfe.cliente_nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  R$ {parseFloat(nfe.valor_total).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${nfe.status === 'Autorizada' ? 'bg-green-100 text-green-700' : nfe.status === 'Processando' ? 'bg-yellow-100 text-yellow-700' : nfe.status === 'Rejeitada' ? 'bg-red-100 text-red-700' : nfe.status === 'Pendente' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                    {nfe.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    {nfe.status === 'Autorizada' && <>
                        <button onClick={() => setSelectedNFeId(nfe.id)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Imprimir DANFE">
                          <PrinterIcon size={16} />
                        </button>
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Visualizar">
                          <EyeIcon size={16} />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Baixar XML">
                          <DownloadIcon size={16} />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancelar NFe">
                          <XCircleIcon size={16} />
                        </button>
                      </>}
                    {(nfe.status === 'Processando' || nfe.status === 'Rejeitada') && <button onClick={() => handleDeleteNFe(nfe.id, nfe.numero, nfe.status)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title={`Excluir NFe (${nfe.status})`}>
                        <TrashIcon size={16} />
                      </button>}
                    {(nfe.status === 'Rejeitada' || nfe.status === 'Pendente' || nfe.status === 'Erro') && <button onClick={() => handleResendNFe(nfe.id)} disabled={resending === nfe.id} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50" title="Reenviar NFe">
                        {resending === nfe.id ? <RefreshCwIcon size={16} className="animate-spin" /> : <SendIcon size={16} />}
                      </button>}
                  </div>
                </td>
              </tr>)}
          </Table>
        </Card>
      </main>

      {selectedNFeId && activeCompanyId && <DANFEPreview companyId={activeCompanyId} nfeId={selectedNFeId} onClose={() => setSelectedNFeId(null)} />}
    </div>;
}