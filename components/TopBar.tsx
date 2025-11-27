import React, { useEffect, useState } from 'react';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../utils/database';
import { BuildingIcon, ChevronDownIcon, UserIcon, LogOutIcon, KeyIcon } from 'lucide-react';
import { Select } from './ui/Select';
import { ChangePasswordModal } from './ChangePasswordModal';
export function TopBar() {
  const {
    activeCompanyId,
    setActiveCompanyId
  } = useCompany();
  const {
    isSuperUser,
    user,
    logout
  } = useAuth();
  const [companyName, setCompanyName] = useState<string>('');
  const [companies, setCompanies] = useState<any[]>([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  useEffect(() => {
    loadData();
  }, [activeCompanyId]);
  const loadData = async () => {
    try {
      await db.initialize();
      const companiesData = await db.getCompanies();
      setCompanies(companiesData);
      if (activeCompanyId) {
        const company = companiesData.find(c => c.id === activeCompanyId);
        setCompanyName(company?.razao_social || 'Empresa não encontrada');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };
  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCompanyId = parseInt(e.target.value);
    setActiveCompanyId(newCompanyId);
  };
  return <>
      <div className="bg-white border-b-2 border-green-600 shadow-sm">
        {/* Linha 1: Nome da Empresa + Seletor */}
        <div className="px-8 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BuildingIcon size={24} className="text-green-600" />
              </div>
              <div>
                {activeCompanyId ? <>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                      {isSuperUser ? 'Empresa Selecionada' : 'Sua Empresa'}
                    </p>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {companyName}
                    </h1>
                  </> : <>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                      Sistema
                    </p>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Fácil NFe
                    </h1>
                  </>}
              </div>
            </div>

            {/* Seletor de Empresa (apenas para super usuário com múltiplas empresas) */}
            {isSuperUser && companies.length > 1 && activeCompanyId && <div className="w-64">
                <Select label="Trocar Empresa" value={activeCompanyId.toString()} onChange={handleCompanyChange} options={companies.map(c => ({
              value: c.id.toString(),
              label: c.razao_social
            }))} />
              </div>}
          </div>
        </div>

        {/* Linha 2: Usuário + Alterar Senha + Sair */}
        <div className="px-8 py-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserIcon size={18} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {user?.nome}
              </span>
              <span className="text-xs text-gray-500">
                • {isSuperUser ? 'Super Usuário' : 'Usuário'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setShowPasswordModal(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors" title="Alterar Senha">
                <KeyIcon size={16} />
                Alterar Senha
              </button>

              <button onClick={logout} className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200">
                <LogOutIcon size={16} />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </>;
}