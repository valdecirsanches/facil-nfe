import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './pages/Dashboard';
import { NewNFe } from './pages/NewNFe';
import { NFeList } from './pages/NFeList';
import { Companies } from './pages/Companies';
import { CompanySettings } from './pages/CompanySettings';
import { Clients } from './pages/Clients';
import { Products } from './pages/Products';
import { Carriers } from './pages/Carriers';
import { Users } from './pages/Users';
import { DatabaseInfo } from './pages/DatabaseInfo';
import { SystemSettings } from './pages/SystemSettings';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CompanyProvider } from './context/CompanyContext';
function AppContent() {
  const {
    user
  } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  if (!user) {
    return <Login />;
  }
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'new-nfe':
        return <NewNFe onNavigate={setCurrentPage} />;
      case 'nfe-list':
        return <NFeList />;
      case 'companies':
        return <Companies />;
      case 'company-settings':
        return <CompanySettings />;
      case 'system-settings':
        return <SystemSettings />;
      case 'users':
        return <Users />;
      case 'database-info':
        return <DatabaseInfo />;
      case 'clients':
        return <Clients />;
      case 'products':
        return <Products />;
      case 'carriers':
        return <Carriers />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };
  return <div className="flex min-h-screen w-full bg-gray-50">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex-1 flex flex-col">
        <TopBar />
        {renderPage()}
      </div>
    </div>;
}
export function App() {
  return <AuthProvider>
      <CompanyProvider>
        <AppContent />
      </CompanyProvider>
    </AuthProvider>;
}