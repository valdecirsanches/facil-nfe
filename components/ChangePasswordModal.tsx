import React, { useState } from 'react';
import { toast, Toaster } from 'sonner';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { XIcon, LockIcon } from 'lucide-react';
import { db } from '../utils/database';
import { useAuth } from '../context/AuthContext';
interface ChangePasswordModalProps {
  onClose: () => void;
}
export function ChangePasswordModal({
  onClose
}: ChangePasswordModalProps) {
  const {
    user,
    login
  } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.newPassword !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    if (formData.newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      // Verificar senha atual
      const authenticatedUser = await db.authenticateUser(user!.email, formData.currentPassword);
      if (!authenticatedUser) {
        setError('Senha atual incorreta');
        setLoading(false);
        return;
      }
      // Atualizar senha
      await db.updateUser({
        ...user,
        senha: formData.newPassword
      });
      // Atualizar contexto com nova senha
      login({
        ...user!,
        senha: formData.newPassword
      });
      toast.info('Senha alterada com sucesso!');
      onClose();
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Erro ao alterar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <LockIcon size={20} className="text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Alterar Senha
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <XIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4 mb-6">
            <Input label="Senha Atual *" name="currentPassword" type="password" value={formData.currentPassword} onChange={handleChange} placeholder="Digite sua senha atual" required />

            <Input label="Nova Senha *" name="newPassword" type="password" value={formData.newPassword} onChange={handleChange} placeholder="Mínimo 6 caracteres" required minLength={6} />

            <Input label="Confirmar Nova Senha *" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Digite novamente" required minLength={6} />
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>}

          <div className="flex justify-end gap-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </div>
        </form>
      </Card>
    </div>;
}