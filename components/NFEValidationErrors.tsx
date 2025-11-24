import React from 'react';
import { AlertCircleIcon, AlertTriangleIcon, XIcon } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
interface ValidationError {
  campo: string;
  erro: string;
  solucao: string;
}
interface ValidationWarning {
  campo: string;
  aviso: string;
  solucao: string;
}
interface NFEValidationErrorsProps {
  erros: ValidationError[];
  avisos?: ValidationWarning[];
  onClose: () => void;
}
export function NFEValidationErrors({
  erros,
  avisos = [],
  onClose
}: NFEValidationErrorsProps) {
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircleIcon className="text-red-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Erros de Validação da NFe
              </h2>
              <p className="text-sm text-gray-600">
                Corrija os erros abaixo antes de transmitir
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <XIcon size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Erros */}
          {erros.length > 0 && <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircleIcon className="text-red-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">
                  {erros.length}{' '}
                  {erros.length === 1 ? 'Erro Encontrado' : 'Erros Encontrados'}
                </h3>
              </div>

              <div className="space-y-4">
                {erros.map((erro, index) => <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-900 mb-1">
                          Campo: <span className="font-mono">{erro.campo}</span>
                        </p>
                        <p className="text-sm text-red-800 mb-2">{erro.erro}</p>
                        <div className="bg-white border border-red-200 rounded p-3">
                          <p className="text-xs font-medium text-red-900 mb-1">
                            💡 Solução:
                          </p>
                          <p className="text-sm text-red-800">{erro.solucao}</p>
                        </div>
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>}

          {/* Avisos */}
          {avisos.length > 0 && <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangleIcon className="text-yellow-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">
                  {avisos.length} {avisos.length === 1 ? 'Aviso' : 'Avisos'}
                </h3>
              </div>

              <div className="space-y-4">
                {avisos.map((aviso, index) => <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangleIcon className="text-yellow-600 flex-shrink-0" size={20} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-yellow-900 mb-1">
                          Campo:{' '}
                          <span className="font-mono">{aviso.campo}</span>
                        </p>
                        <p className="text-sm text-yellow-800 mb-2">
                          {aviso.aviso}
                        </p>
                        <p className="text-xs text-yellow-700">
                          💡 {aviso.solucao}
                        </p>
                      </div>
                    </div>
                  </div>)}
              </div>
            </div>}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Corrija os erros e tente transmitir novamente
            </p>
            <Button onClick={onClose}>Entendi</Button>
          </div>
        </div>
      </Card>
    </div>;
}