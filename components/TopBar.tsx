import React, { useEffect, useState } from 'react';
import { useCompany } from '../context/CompanyContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../utils/database';
import { BuildingIcon, ChevronDownIcon } from 'lucide-react';
import { Select } from './ui/Select';
export function TopBar() {
  const {
    activeCompanyId,
    setActiveCompanyId
  } = useCompany();
  const {
    isSuperUser
  } = useAuth();
  const [companyName, setCompanyName] = useState<string>('');
  const [companies, setCompanies] = useState<any[]>([]);
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
  if (!activeCompanyId) {
    return null;
  }
  return <div className="bg-white border-b-2 border-green-600 px-8 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <BuildingIcon size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              {isSuperUser ? 'Empresa Selecionada' : 'Sua Empresa'}
            </p>
            <h1 className="text-2xl font-bold text-gray-900">{companyName}</h1>
          </div>
        </div>

        {isSuperUser && companies.length > 1 && <div className="w-64">
            <Select label="Trocar Empresa" value={activeCompanyId.toString()} onChange={handleCompanyChange} options={companies.map(c => ({
          value: c.id.toString(),
          label: c.razao_social
        }))} />
          </div>}
      </div>
    </div>;
}