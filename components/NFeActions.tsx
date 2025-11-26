import React, { useState } from 'react';
import { toast, Toaster } from 'sonner';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { FileTextIcon, DownloadIcon, MailIcon, CheckCircleIcon, LoaderIcon } from 'lucide-react';
interface NFeActionsProps {
  nfeNumber: string;
  nfeId: number;
  clientEmail?: string;
  onDownloadDANFE: () => Promise<void>;
  onDownloadXML: () => Promise<void>;
  onSendEmail: (email: string, message: string) => Promise<void>;
}
export function NFeActions({
  nfeNumber,
  nfeId,
  clientEmail = '',
  onDownloadDANFE,
  onDownloadXML,
  onSendEmail
}: NFeActionsProps) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState(clientEmail);
  const [message, setMessage] = useState('Segue em anexo a Nota Fiscal Eletrônica.');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const handleSendEmail = async () => {
    if (!email) {
      toast.warning('Digite um e-mail válido');
      return;
    }
    setSending(true);
    try {
      await onSendEmail(email, message);
      setSent(true);
      setTimeout(() => {
        setShowEmailForm(false);
        setSent(false);
      }, 2000);
    } catch (error) {
      toast.error('Erro ao enviar e-mail');
    } finally {
      setSending(false);
    }
  };
  return <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FileTextIcon size={20} className="text-gray-600" />
        Ações da NFe #{nfeNumber}
      </h3>

      <div className="space-y-3">
        {/* Download DANFE */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileTextIcon size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">DANFE (PDF)</p>
              <p className="text-sm text-gray-600">Documento Auxiliar da NFe</p>
            </div>
          </div>
          <Button variant="secondary" onClick={onDownloadDANFE}>
            <DownloadIcon size={16} className="mr-2" />
            Baixar
          </Button>
        </div>

        {/* Download XML */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileTextIcon size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">XML da NFe</p>
              <p className="text-sm text-gray-600">Arquivo fiscal eletrônico</p>
            </div>
          </div>
          <Button variant="secondary" onClick={onDownloadXML}>
            <DownloadIcon size={16} className="mr-2" />
            Baixar
          </Button>
        </div>

        {/* Enviar E-mail */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MailIcon size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Enviar por E-mail</p>
                <p className="text-sm text-gray-600">XML e PDF anexados</p>
              </div>
            </div>
            {!showEmailForm && <Button variant="secondary" onClick={() => setShowEmailForm(true)}>
                <MailIcon size={16} className="mr-2" />
                Enviar
              </Button>}
          </div>

          {showEmailForm && <div className="mt-4 space-y-3 pt-3 border-t border-gray-200">
              <Input label="E-mail do destinatário" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@email.com" required />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensagem
                </label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Mensagem para o cliente..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowEmailForm(false)} disabled={sending}>
                  Cancelar
                </Button>
                <Button onClick={handleSendEmail} disabled={sending}>
                  {sending ? <>
                      <LoaderIcon size={16} className="mr-2 animate-spin" />
                      Enviando...
                    </> : sent ? <>
                      <CheckCircleIcon size={16} className="mr-2" />
                      Enviado!
                    </> : <>
                      <MailIcon size={16} className="mr-2" />
                      Enviar E-mail
                    </>}
                </Button>
              </div>
            </div>}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Dica:</strong> Você pode baixar os arquivos e enviar por
          e-mail quantas vezes precisar.
        </p>
      </div>
    </Card>;
}