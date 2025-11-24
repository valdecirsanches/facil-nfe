import React, { useEffect, useState, createContext, useContext } from 'react';
import { db } from '../utils/database';
interface User {
  id: number;
  nome: string;
  email: string;
  empresa_id: number | null;
  tipo: 'super' | 'admin' | 'usuario';
}
interface AuthContextType {
  user: User | null;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  isSuperUser: boolean;
  isAdmin: boolean;
  canManageUsers: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function AuthProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  const login = async (email: string, senha: string) => {
    try {
      const authenticatedUser = await db.authenticateUser(email, senha);
      if (authenticatedUser) {
        setUser(authenticatedUser);
        localStorage.setItem('user', JSON.stringify(authenticatedUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    db.clearToken();
  };
  const isSuperUser = user?.tipo === 'super';
  const isAdmin = user?.tipo === 'admin';
  const canManageUsers = isSuperUser || isAdmin;
  return <AuthContext.Provider value={{
    user,
    login,
    logout,
    isSuperUser,
    isAdmin,
    canManageUsers
  }}>
      {children}
    </AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}