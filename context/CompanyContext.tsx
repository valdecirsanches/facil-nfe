import React, { useEffect, useState, createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
interface CompanyContextType {
  activeCompanyId: number | null;
  setActiveCompanyId: (id: number | null) => void;
}
const CompanyContext = createContext<CompanyContextType | undefined>(undefined);
export function CompanyProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const {
    user,
    isSuperUser
  } = useAuth();
  const [activeCompanyId, setActiveCompanyIdState] = useState<number | null>(() => {
    // Se não é super usuário, usar empresa do usuário
    if (user && !isSuperUser && user.empresa_id) {
      return user.empresa_id;
    }
    // Se é super usuário, tentar carregar do localStorage
    const saved = localStorage.getItem('active_company_id');
    return saved ? parseInt(saved) : null;
  });
  // Atualizar empresa ativa quando usuário mudar
  useEffect(() => {
    if (user && !isSuperUser && user.empresa_id) {
      setActiveCompanyIdState(user.empresa_id);
    }
  }, [user, isSuperUser]);
  const setActiveCompanyId = (id: number | null) => {
    // Apenas super usuários podem mudar de empresa
    if (!isSuperUser) return;
    setActiveCompanyIdState(id);
    if (id !== null) {
      localStorage.setItem('active_company_id', id.toString());
    } else {
      localStorage.removeItem('active_company_id');
    }
  };
  return <CompanyContext.Provider value={{
    activeCompanyId,
    setActiveCompanyId
  }}>
      {children}
    </CompanyContext.Provider>;
}
export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}