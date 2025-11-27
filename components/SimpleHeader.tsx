import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOutIcon, UserIcon } from 'lucide-react';
export function SimpleHeader() {
  const {
    user,
    logout
  } = useAuth();
  return <div className="bg-white border-b border-gray-200 px-8 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sistema NFe</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <UserIcon size={20} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {user?.nome}
            </span>
          </div>
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOutIcon size={16} />
            Sair
          </button>
        </div>
      </div>
    </div>;
}