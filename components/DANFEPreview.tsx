import React, { useEffect, useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { XIcon, PrinterIcon } from 'lucide-react';
import { db } from '../utils/database';
interface DANFEPreviewProps {
  companyId: number;
  nfeId: number;
  onClose: () => void;
}
export function DANFEPreview({
  companyId,
  nfeId,
  onClose
}: DANFEPreviewProps) {
  const [nfeData, setNfeData] = useState<any>(null);
  const [emitente, setEmitente] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadData();
  }, [companyId, nfeId]);
  const loadData = async () => {
    try {
      const [nfe, company] = await Promise.all([db.getNFeById(companyId, nfeId), db.getCompanyById(companyId)]);
      setNfeData(nfe);
      setEmitente(company);
    } catch (error) {
      console.error('Error loading NFe:', error);
    } finally {
      setLoading(false);
    }
  };
  const handlePrint = () => {
    window.print();
  };
  if (loading) {
    return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="p-8">
          <p className="text-gray-600">Carregando DANFE...</p>
        </Card>
      </div>;
  }
  if (!nfeData || !emitente) {
    return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="p-8">
          <p className="text-red-600">Erro ao carregar dados da NFe</p>
          <Button onClick={onClose} className="mt-4">
            Fechar
          </Button>
        </Card>
      </div>;
  }
  const chaveAcesso = nfeData.chave_acesso || '35251074543298000128550010000073981111434290';
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        {/* Header - não imprime */}
        <div className="flex items-center justify-between p-4 border-b print:hidden">
          <h2 className="text-xl font-semibold text-gray-900">
            Visualizar DANFE
          </h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="secondary">
              <PrinterIcon size={18} className="mr-2" />
              Imprimir
            </Button>
            <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <XIcon size={20} />
            </button>
          </div>
        </div>

        {/* DANFE Content */}
        <div className="p-6 bg-white" id="danfe-content" style={{
        fontFamily: 'Arial, sans-serif',
        fontSize: '8px'
      }}>
          {/* RECIBO DO DESTINATÁRIO */}
          <div className="border-2 border-black mb-2">
            <div className="grid grid-cols-12 text-[7px]">
              <div className="col-span-9 border-r border-black p-1">
                <div className="font-bold mb-0.5">
                  RECEBEMOS DE {emitente.razao_social} OS PRODUTOS/SERVIÇOS
                  CONSTANTES DA NOTA FISCAL INDICADA AO LADO
                </div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <div>
                    <div className="font-bold">DATA DE RECEBIMENTO</div>
                  </div>
                  <div>
                    <div className="font-bold">
                      IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-span-3 p-1 text-center">
                <div className="font-bold text-[10px]">NF-e</div>
                <div className="font-bold text-[9px]">Nº {nfeData.numero}</div>
                <div className="font-bold text-[9px]">
                  SÉRIE {nfeData.serie}
                </div>
              </div>
            </div>
          </div>

          {/* CABEÇALHO PRINCIPAL */}
          <div className="border-2 border-black mb-2">
            <div className="grid grid-cols-12">
              {/* Identificação do Emitente */}
              <div className="col-span-5 border-r border-black p-2">
                <div className="text-[7px] mb-1">
                  <div className="font-bold">IDENTIFICAÇÃO DO EMITENTE</div>
                </div>
                <div className="text-[8px] font-bold mb-0.5">
                  {emitente.razao_social}
                </div>
                <div className="text-[7px]">
                  {emitente.endereco}, {emitente.numero}
                </div>
                <div className="text-[7px]">
                  {emitente.cidade}/{emitente.estado} - CEP: {emitente.cep}
                </div>
                <div className="text-[7px] mt-1">CNPJ: {emitente.cnpj}</div>
              </div>

              {/* DANFE */}
              <div className="col-span-4 border-r border-black p-2 text-center">
                <div className="font-bold text-[12px] mb-1">DANFE</div>
                <div className="text-[7px] mb-2">
                  DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA
                </div>
                <div className="text-[7px] mb-1">
                  <div>0 - ENTRADA</div>
                  <div>1 - SAÍDA</div>
                </div>
                <div className="text-[16px] font-bold border border-black inline-block px-4 py-1">
                  1
                </div>
                <div className="text-[8px] font-bold mt-2">
                  Nº {nfeData.numero}
                </div>
                <div className="text-[7px]">SÉRIE {nfeData.serie}</div>
              </div>

              {/* Código de Barras */}
              <div className="col-span-3 p-2 flex flex-col items-center justify-center">
                <svg width="100%" height="60" viewBox="0 0 200 60">
                  {/* Simulação de código de barras */}
                  {Array.from({
                  length: 44
                }).map((_, i) => <rect key={i} x={i * 4.5} y="0" width={Math.random() > 0.5 ? 2 : 1} height="50" fill="black" />)}
                </svg>
                <div className="text-[6px] text-center mt-1 break-all leading-tight">
                  {chaveAcesso.match(/.{1,4}/g)?.join(' ')}
                </div>
              </div>
            </div>

            {/* Chave de Acesso */}
            <div className="border-t border-black p-1 text-center">
              <div className="text-[7px] font-bold">CHAVE DE ACESSO</div>
              <div className="text-[9px] font-mono tracking-wider">
                {chaveAcesso.match(/.{1,4}/g)?.join(' ')}
              </div>
            </div>

            {/* Consulta */}
            <div className="border-t border-black p-1 text-center text-[7px]">
              Consulta de autenticidade no portal nacional da NF-e
              www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora
            </div>
          </div>

          {/* NATUREZA DA OPERAÇÃO */}
          <div className="border-2 border-black border-t-0 mb-2">
            <div className="grid grid-cols-12">
              <div className="col-span-8 border-r border-black p-1">
                <div className="text-[7px] font-bold">NATUREZA DA OPERAÇÃO</div>
                <div className="text-[8px]">{nfeData.natureza_operacao}</div>
              </div>
              <div className="col-span-4 p-1">
                <div className="text-[7px] font-bold">INSCRIÇÃO ESTADUAL</div>
                <div className="text-[8px]">{emitente.ie}</div>
              </div>
            </div>
          </div>

          {/* DESTINATÁRIO/REMETENTE */}
          <div className="border-2 border-black border-t-0 mb-2">
            <div className="bg-gray-200 p-1 border-b border-black">
              <div className="text-[7px] font-bold">DESTINATÁRIO/REMETENTE</div>
            </div>
            <div className="p-1">
              <div className="grid grid-cols-12 gap-1 mb-1">
                <div className="col-span-8">
                  <div className="text-[7px] font-bold">NOME/RAZÃO SOCIAL</div>
                  <div className="text-[8px]">
                    {nfeData.cliente?.razao_social}
                  </div>
                </div>
                <div className="col-span-4">
                  <div className="text-[7px] font-bold">CNPJ/CPF</div>
                  <div className="text-[8px]">{nfeData.cliente?.documento}</div>
                </div>
              </div>
              <div className="grid grid-cols-12 gap-1 mb-1">
                <div className="col-span-8">
                  <div className="text-[7px] font-bold">ENDEREÇO</div>
                  <div className="text-[8px]">{nfeData.cliente?.endereco}</div>
                </div>
                <div className="col-span-4">
                  <div className="text-[7px] font-bold">BAIRRO/DISTRITO</div>
                  <div className="text-[8px]">{nfeData.cliente?.bairro}</div>
                </div>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <div className="col-span-5">
                  <div className="text-[7px] font-bold">MUNICÍPIO</div>
                  <div className="text-[8px]">{nfeData.cliente?.cidade}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[7px] font-bold">UF</div>
                  <div className="text-[8px]">{nfeData.cliente?.estado}</div>
                </div>
                <div className="col-span-3">
                  <div className="text-[7px] font-bold">CEP</div>
                  <div className="text-[8px]">{nfeData.cliente?.cep}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[7px] font-bold">DATA EMISSÃO</div>
                  <div className="text-[8px]">
                    {new Date(nfeData.data_emissao).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FATURA */}
          <div className="border-2 border-black border-t-0 mb-2">
            <div className="bg-gray-200 p-1 border-b border-black">
              <div className="text-[7px] font-bold">FATURA</div>
            </div>
            <div className="grid grid-cols-12">
              <div className="col-span-12 p-1">
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div>
                    <div className="text-[7px] font-bold">DADOS DA FATURA</div>
                  </div>
                  <div>
                    <div className="text-[7px] font-bold">VENCIMENTO</div>
                  </div>
                  <div>
                    <div className="text-[7px] font-bold">VALOR</div>
                  </div>
                  <div>
                    <div className="text-[7px] font-bold">VALOR LÍQUIDO</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CÁLCULO DO IMPOSTO */}
          <div className="border-2 border-black border-t-0 mb-2">
            <div className="bg-gray-200 p-1 border-b border-black">
              <div className="text-[7px] font-bold">CÁLCULO DO IMPOSTO</div>
            </div>
            <div className="grid grid-cols-12 text-center text-[7px]">
              <div className="col-span-2 border-r border-black p-1">
                <div className="font-bold">BASE DE CÁLCULO DO ICMS</div>
                <div className="text-[8px]">
                  {parseFloat(nfeData.valor_total).toFixed(2)}
                </div>
              </div>
              <div className="col-span-2 border-r border-black p-1">
                <div className="font-bold">VALOR DO ICMS</div>
                <div className="text-[8px]">0,00</div>
              </div>
              <div className="col-span-2 border-r border-black p-1">
                <div className="font-bold">BASE DE CÁLCULO ICMS ST</div>
                <div className="text-[8px]">0,00</div>
              </div>
              <div className="col-span-2 border-r border-black p-1">
                <div className="font-bold">VALOR ICMS SUBSTITUIÇÃO</div>
                <div className="text-[8px]">0,00</div>
              </div>
              <div className="col-span-2 border-r border-black p-1">
                <div className="font-bold">VALOR IMP. IMPORTAÇÃO</div>
                <div className="text-[8px]">0,00</div>
              </div>
              <div className="col-span-2 p-1">
                <div className="font-bold">VALOR DO PIS</div>
                <div className="text-[8px]">0,00</div>
              </div>
            </div>
            <div className="grid grid-cols-12 text-center text-[7px] border-t border-black">
              <div className="col-span-2 border-r border-black p-1">
                <div className="font-bold">VALOR TOTAL DOS PRODUTOS</div>
                <div className="text-[8px]">
                  {parseFloat(nfeData.valor_total).toFixed(2)}
                </div>
              </div>
              <div className="col-span-2 border-r border-black p-1">
                <div className="font-bold">VALOR DO FRETE</div>
                <div className="text-[8px]">0,00</div>
              </div>
              <div className="col-span-2 border-r border-black p-1">
                <div className="font-bold">VALOR DO SEGURO</div>
                <div className="text-[8px]">0,00</div>
              </div>
              <div className="col-span-2 border-r border-black p-1">
                <div className="font-bold">DESCONTO</div>
                <div className="text-[8px]">0,00</div>
              </div>
              <div className="col-span-2 border-r border-black p-1">
                <div className="font-bold">OUTRAS DESPESAS</div>
                <div className="text-[8px]">0,00</div>
              </div>
              <div className="col-span-2 p-1">
                <div className="font-bold">VALOR TOTAL DA NOTA</div>
                <div className="text-[10px] font-bold">
                  {parseFloat(nfeData.valor_total).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* TRANSPORTADOR/VOLUMES TRANSPORTADOS */}
          <div className="border-2 border-black border-t-0 mb-2">
            <div className="bg-gray-200 p-1 border-b border-black">
              <div className="text-[7px] font-bold">
                TRANSPORTADOR/VOLUMES TRANSPORTADOS
              </div>
            </div>
            <div className="grid grid-cols-12 text-[7px]">
              <div className="col-span-8 border-r border-black p-1">
                <div className="font-bold">RAZÃO SOCIAL</div>
              </div>
              <div className="col-span-2 border-r border-black p-1">
                <div className="font-bold">FRETE POR CONTA</div>
              </div>
              <div className="col-span-2 p-1">
                <div className="font-bold">CÓDIGO ANTT</div>
              </div>
            </div>
          </div>

          {/* DADOS DOS PRODUTOS/SERVIÇOS */}
          <div className="border-2 border-black border-t-0 mb-2">
            <div className="bg-gray-200 p-1 border-b border-black">
              <div className="text-[7px] font-bold">
                DADOS DOS PRODUTOS/SERVIÇOS
              </div>
            </div>
            <table className="w-full text-[7px]">
              <thead className="border-b border-black">
                <tr className="bg-gray-100">
                  <th className="p-1 text-left border-r border-black font-bold w-16">
                    CÓDIGO
                  </th>
                  <th className="p-1 text-left border-r border-black font-bold">
                    DESCRIÇÃO DO PRODUTO/SERVIÇO
                  </th>
                  <th className="p-1 text-center border-r border-black font-bold w-12">
                    NCM/SH
                  </th>
                  <th className="p-1 text-center border-r border-black font-bold w-12">
                    CST
                  </th>
                  <th className="p-1 text-center border-r border-black font-bold w-12">
                    CFOP
                  </th>
                  <th className="p-1 text-center border-r border-black font-bold w-12">
                    UN
                  </th>
                  <th className="p-1 text-right border-r border-black font-bold w-16">
                    QUANT
                  </th>
                  <th className="p-1 text-right border-r border-black font-bold w-20">
                    VALOR UNIT
                  </th>
                  <th className="p-1 text-right border-r border-black font-bold w-20">
                    VALOR TOTAL
                  </th>
                  <th className="p-1 text-right border-r border-black font-bold w-16">
                    BC ICMS
                  </th>
                  <th className="p-1 text-right border-r border-black font-bold w-16">
                    VALOR ICMS
                  </th>
                  <th className="p-1 text-right border-r border-black font-bold w-12">
                    IPI
                  </th>
                  <th className="p-1 text-right font-bold w-12">ALÍQ ICMS</th>
                </tr>
              </thead>
              <tbody>
                {nfeData.items?.map((item: any, index: number) => <tr key={index} className="border-b border-black">
                    <td className="p-1 border-r border-black">
                      {item.produto_id}
                    </td>
                    <td className="p-1 border-r border-black">
                      {item.descricao}
                    </td>
                    <td className="p-1 text-center border-r border-black">-</td>
                    <td className="p-1 text-center border-r border-black">-</td>
                    <td className="p-1 text-center border-r border-black">
                      {nfeData.cfop}
                    </td>
                    <td className="p-1 text-center border-r border-black">
                      UN
                    </td>
                    <td className="p-1 text-right border-r border-black">
                      {parseFloat(item.quantidade).toFixed(2)}
                    </td>
                    <td className="p-1 text-right border-r border-black">
                      {parseFloat(item.valor_unitario).toFixed(2)}
                    </td>
                    <td className="p-1 text-right border-r border-black">
                      {parseFloat(item.valor_total).toFixed(2)}
                    </td>
                    <td className="p-1 text-right border-r border-black">
                      0,00
                    </td>
                    <td className="p-1 text-right border-r border-black">
                      0,00
                    </td>
                    <td className="p-1 text-right border-r border-black">
                      0,00
                    </td>
                    <td className="p-1 text-right">0,00</td>
                  </tr>)}
              </tbody>
            </table>
          </div>

          {/* DADOS ADICIONAIS */}
          <div className="border-2 border-black border-t-0">
            <div className="bg-gray-200 p-1 border-b border-black">
              <div className="text-[7px] font-bold">DADOS ADICIONAIS</div>
            </div>
            <div className="grid grid-cols-2">
              <div className="border-r border-black p-1">
                <div className="text-[7px] font-bold mb-1">
                  INFORMAÇÕES COMPLEMENTARES
                </div>
                <div className="text-[7px] min-h-[60px]">
                  Nota Fiscal Eletrônica emitida nos termos da legislação
                  vigente.
                </div>
              </div>
              <div className="p-1">
                <div className="text-[7px] font-bold mb-1">
                  RESERVADO AO FISCO
                </div>
                <div className="text-[7px] min-h-[60px]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #danfe-content, #danfe-content * {
            visibility: visible;
          }
          #danfe-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>;
}