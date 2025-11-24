import React, { useState } from 'react';
import { BellIcon, LogOutIcon, KeyIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ChangePasswordModal } from './ChangePasswordModal';
interface HeaderProps {
  title: string;
}
export function Header({
  title
}: HeaderProps) {
  const {
    user,
    logout,
    isSuperUser
  } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  return <>
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <BellIcon size={20} />
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <button onClick={() => setShowPasswordModal(true)} className="text-sm font-medium text-gray-900 hover:text-green-600 transition-colors flex items-center gap-1">
                  {user?.nome}
                  <KeyIcon size={14} className="text-gray-400" />
                </button>
                <p className="text-xs text-gray-500">
                  {isSuperUser ? 'Super Usuário' : 'Usuário'}
                </p>
              </div>
              <button onClick={logout} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Sair">
                <LogOutIcon size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </>;
}