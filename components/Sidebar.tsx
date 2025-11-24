import React from 'react';
import { LayoutDashboardIcon, FileTextIcon, ListIcon, BuildingIcon, UsersIcon, PackageIcon, TruckIcon, UserIcon, DatabaseIcon, SettingsIcon, SlidersIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}
export function Sidebar({
  currentPage,
  onNavigate
}: SidebarProps) {
  const {
    isSuperUser,
    canManageUsers
  } = useAuth();
  const menuItems = [{
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboardIcon,
    show: true
  }, {
    id: 'new-nfe',
    label: 'Emitir NFe',
    icon: FileTextIcon,
    show: true
  }, {
    id: 'nfe-list',
    label: 'Notas Emitidas',
    icon: ListIcon,
    show: true
  }, {
    id: 'clients',
    label: 'Clientes',
    icon: UserIcon,
    show: true
  }, {
    id: 'products',
    label: 'Produtos',
    icon: PackageIcon,
    show: true
  }, {
    id: 'carriers',
    label: 'Transportadoras',
    icon: TruckIcon,
    show: true
  }, {
    id: 'system-settings',
    label: 'Configurações',
    icon: SlidersIcon,
    show: true
  }, {
    id: 'companies',
    label: 'Empresas',
    icon: BuildingIcon,
    show: isSuperUser
  }, {
    id: 'users',
    label: 'Usuários',
    icon: UsersIcon,
    show: canManageUsers
  }, {
    id: 'database-info',
    label: 'Banco de Dados',
    icon: DatabaseIcon,
    show: isSuperUser
  }];
  return <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Fácil NFe</h1>
        <p className="text-sm text-gray-600 mt-1">Gestão de Notas Fiscais</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.filter(item => item.show).map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return <li key={item.id}>
                  <button onClick={() => onNavigate(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                </li>;
        })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">Fácil NFe v1.0</p>
      </div>
    </aside>;
}