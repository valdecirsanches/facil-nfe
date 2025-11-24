import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { UploadIcon, CheckCircleIcon, XCircleIcon, FileIcon, Loader2Icon } from 'lucide-react';
interface FileUploadProps {
  label: string;
  accept: string;
  onUpload: (file: File) => Promise<void>;
  currentFile?: string;
  description?: string;
  maxSize?: number; // em MB
}
export function FileUpload({
  label,
  accept,
  onUpload,
  currentFile,
  description,
  maxSize = 10
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Arquivo muito grande. Máximo: ${maxSize}MB`);
      return;
    }
    setSelectedFile(file);
    setError(null);
    setSuccess(false);
  };
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    setSuccess(false);
    try {
      await onUpload(selectedFile);
      setSuccess(true);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  };
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  return <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {description && <p className="text-sm text-gray-600">{description}</p>}

      <div className="flex items-center gap-3">
        <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileSelect} className="hidden" />

        <Button type="button" onClick={handleButtonClick} variant="secondary" className="flex items-center gap-2">
          <FileIcon size={16} />
          Selecionar Arquivo
        </Button>

        {selectedFile && <Button type="button" onClick={handleUpload} disabled={uploading} className="flex items-center gap-2">
            {uploading ? <>
                <Loader2Icon size={16} className="animate-spin" />
                Enviando...
              </> : <>
                <UploadIcon size={16} />
                Fazer Upload
              </>}
          </Button>}
      </div>

      {selectedFile && !uploading && !success && <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Arquivo selecionado:</strong> {selectedFile.name} (
            {(selectedFile.size / 1024).toFixed(2)} KB)
          </p>
        </div>}

      {currentFile && !selectedFile && !success && <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Arquivo atual:</strong> {currentFile}
          </p>
        </div>}

      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircleIcon size={18} className="text-green-600" />
            <p className="text-sm text-green-800 font-medium">
              Upload realizado com sucesso!
            </p>
          </div>
        </div>}

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <XCircleIcon size={18} className="text-red-600" />
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        </div>}
    </div>;
}