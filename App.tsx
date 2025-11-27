import React, { useEffect, useState } from 'react';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { Products } from './pages/Products';
import { Carriers } from './pages/Carriers';
import { NewNFe } from './pages/NewNFe';
import { NFeList } from './pages/NFeList';
import { Users } from './pages/Users';
import { Companies } from './pages/Companies';
import { SystemSettings } from './pages/SystemSettings';
import { DatabaseInfo } from './pages/DatabaseInfo';
import { Subscription } from './pages/Subscription';
import { Billing } from './pages/Billing';
import { Orders } from './pages/Orders';
import { Financial } from './pages/Financial';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { SimpleHeader } from './components/SimpleHeader';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CompanyProvider } from './context/CompanyContext';
import { Toaster } from 'sonner';
type Page = 'dashboard' | 'clients' | 'products' | 'carriers' | 'new-nfe' | 'nfe-list' | 'orders' | 'financial' | 'users' | 'companies' | 'system-settings' | 'database-info' | 'subscription' | 'billing';
function AppContent() {
  const {
    user
  } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [showRegister, setShowRegister] = useState(false);
  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };
  const handleRegisterSuccess = () => {
    setShowRegister(false);
  };
  if (!user) {
    if (showRegister) {
      return <Register onBack={() => setShowRegister(false)} onSuccess={handleRegisterSuccess} />;
    }
    return <Login onRegisterClick={() => setShowRegister(true)} />;
  }
  // Páginas que usam SimpleHeader (sem empresa)
  const pagesWithSimpleHeader = ['subscription', 'billing'];
  const useSimpleHeader = pagesWithSimpleHeader.includes(currentPage);
  return <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {useSimpleHeader ? <SimpleHeader /> : <TopBar />}
        <main className="flex-1 overflow-y-auto">
          {currentPage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {currentPage === 'clients' && <Clients />}
          {currentPage === 'products' && <Products />}
          {currentPage === 'carriers' && <Carriers />}
          {currentPage === 'new-nfe' && <NewNFe onNavigate={handleNavigate} />}
          {currentPage === 'nfe-list' && <NFeList onNavigate={handleNavigate} />}
          {currentPage === 'orders' && <Orders />}
          {currentPage === 'financial' && <Financial />}
          {currentPage === 'users' && <Users />}
          {currentPage === 'companies' && <Companies />}
          {currentPage === 'system-settings' && <SystemSettings />}
          {currentPage === 'database-info' && <DatabaseInfo />}
          {currentPage === 'subscription' && <Subscription />}
          {currentPage === 'billing' && <Billing />}
        </main>
      </div>
    </div>;
}
export function App() {
  return <AuthProvider>
      <CompanyProvider>
        <Toaster position="top-right" richColors />
        <AppContent />
      </CompanyProvider>
    </AuthProvider>;
}