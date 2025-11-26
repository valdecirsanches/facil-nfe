import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { AlertTriangleIcon, XIcon, CheckCircleIcon } from 'lucide-react';
interface ValidationError {
  codigo: string;
  campo: string;
  mensagem: string;
  valor?: string;
}
interface ValidationErrorsModalProps {
  errors: ValidationError[];
  warnings: ValidationError[];
  onClose: () => void;
  onRetry?: () => void;
}
export function ValidationErrorsModal({
  errors,
  warnings,
  onClose,
  onRetry
}: ValidationErrorsModalProps) {
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangleIcon size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Erros de Validação NFe
              </h3>
              <p className="text-sm text-gray-600">
                {errors.length} erro(s) • {warnings.length} aviso(s)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <XIcon size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Erros */}
          {errors.length > 0 && <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-red-600">
                    {errors.length}
                  </span>
                </div>
                <h4 className="font-semibold text-red-900">
                  Erros Críticos (devem ser corrigidos)
                </h4>
              </div>
              <div className="space-y-3">
                {errors.map((error, index) => <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-mono font-bold text-red-700 bg-red-100 px-2 py-1 rounded">
                        {error.codigo}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-red-900 mb-1">
                          {error.mensagem}
                        </p>
                        <p className="text-sm text-red-700">
                          <span className="font-medium">Campo:</span>{' '}
                          {error.campo}
                        </p>
                        {error.valor && <p className="text-sm text-red-700 mt-1">
                            <span className="font-medium">Valor:</span>{' '}
                            <code className="bg-red-100 px-2 py-0.5 rounded">
                              {error.valor}
                            </code>
                          </p>}
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>}

          {/* Avisos */}
          {warnings.length > 0 && <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-yellow-600">
                    {warnings.length}
                  </span>
                </div>
                <h4 className="font-semibold text-yellow-900">
                  Avisos (recomendado corrigir)
                </h4>
              </div>
              <div className="space-y-3">
                {warnings.map((warning, index) => <div key={index} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-mono font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                        AVISO
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-yellow-900 mb-1">
                          {warning.mensagem}
                        </p>
                        <p className="text-sm text-yellow-700">
                          <span className="font-medium">Campo:</span>{' '}
                          {warning.campo}
                        </p>
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>}

          {/* Dicas */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              💡 Como corrigir:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Verifique os campos indicados nos erros acima</li>
              <li>Corrija os valores conforme as mensagens</li>
              <li>
                Se o problema persistir, verifique o cadastro da empresa e do
                cliente
              </li>
              <li>
                Erros de namespace: o XML será corrigido automaticamente no
                próximo envio
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <p>
              <strong>Próximos passos:</strong> Corrija os erros e tente
              novamente
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>
              Fechar
            </Button>
            {onRetry && <Button onClick={onRetry}>
                <CheckCircleIcon size={16} className="mr-2" />
                Tentar Novamente
              </Button>}
          </div>
        </div>
      </Card>
    </div>;
}