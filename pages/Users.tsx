import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { UserIcon, EditIcon, ShieldIcon, ShieldCheckIcon, UserCheckIcon } from 'lucide-react';
import { db } from '../utils/database';
import { useAuth } from '../context/AuthContext';
export function Users() {
  const {
    user,
    isSuperUser,
    isAdmin,
    canManageUsers
  } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    empresa_id: '',
    tipo: 'usuario'
  });
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      await db.initialize();
      const [usersData, companiesData] = await Promise.all([db.getUsers(), db.getCompanies()]);
      // Filtrar usuários baseado no tipo
      let filteredUsers = usersData;
      if (isAdmin && user?.empresa_id) {
        // Admin vê apenas usuários de sua empresa
        filteredUsers = usersData.filter(u => u.empresa_id === user.empresa_id);
      }
      setUsers(filteredUsers);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (userToEdit: any) => {
    setFormData({
      nome: userToEdit.nome,
      email: userToEdit.email,
      senha: '',
      empresa_id: userToEdit.empresa_id?.toString() || '',
      tipo: userToEdit.tipo || 'usuario'
    });
    setEditingId(userToEdit.id);
    setShowForm(true);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userData = {
        ...formData,
        empresa_id: formData.empresa_id ? parseInt(formData.empresa_id) : null
      };
      // Validações baseadas no tipo de usuário
      if (isAdmin && !isSuperUser) {
        // Admin só pode criar usuários de sua própria empresa
        userData.empresa_id = user?.empresa_id || null;
        // Admin não pode criar super users ou outros admins
        if (userData.tipo === 'super' || userData.tipo === 'admin') {
          alert('Você não tem permissão para criar usuários Super ou Admin');
          return;
        }
      }
      if (editingId) {
        await db.updateUser({
          ...userData,
          id: editingId
        });
      } else {
        if (!userData.senha) {
          alert('Senha é obrigatória para novos usuários');
          return;
        }
        await db.createUser(userData);
      }
      await loadData();
      handleCancel();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Erro ao salvar usuário');
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      nome: '',
      email: '',
      senha: '',
      empresa_id: '',
      tipo: 'usuario'
    });
  };
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'super':
        return <ShieldCheckIcon size={16} className="text-purple-600" />;
      case 'admin':
        return <ShieldIcon size={16} className="text-blue-600" />;
      default:
        return <UserCheckIcon size={16} className="text-gray-600" />;
    }
  };
  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'super':
        return 'Super Usuário';
      case 'admin':
        return 'Administrador';
      default:
        return 'Usuário';
    }
  };
  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'super':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  if (!canManageUsers) {
    return <div className="flex-1 bg-gray-50">
        <Header title="Usuários" />
        <main className="p-8">
          <Card className="p-12 text-center">
            <ShieldIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Acesso Restrito
            </h3>
            <p className="text-gray-600">
              Apenas Super Usuários e Administradores podem gerenciar usuários
            </p>
          </Card>
        </main>
      </div>;
  }
  if (loading) {
    return <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>;
  }
  // Opções de tipo baseadas no usuário logado
  const tipoOptions = isSuperUser ? [{
    value: 'super',
    label: 'Super Usuário'
  }, {
    value: 'admin',
    label: 'Administrador'
  }, {
    value: 'usuario',
    label: 'Usuário'
  }] : [{
    value: 'usuario',
    label: 'Usuário'
  }];
  return <div className="flex-1 bg-gray-50">
      <Header title="Usuários" />

      <main className="p-8">
        {!showForm ? <>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <p className="text-gray-600">
                  {isSuperUser ? 'Gerencie todos os usuários do sistema' : 'Gerencie os usuários da sua empresa'}
                </p>
                {isAdmin && <p className="text-sm text-blue-600 mt-1">
                    Como Administrador, você pode criar e gerenciar usuários da
                    sua empresa
                  </p>}
              </div>
              <Button onClick={() => setShowForm(true)}>
                <UserIcon size={18} className="mr-2" />
                Novo Usuário
              </Button>
            </div>

            {users.length === 0 ? <Card className="p-12 text-center">
                <UserIcon size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum usuário cadastrado
                </h3>
                <p className="text-gray-600 mb-6">
                  Cadastre usuários para acessar o sistema
                </p>
                <Button onClick={() => setShowForm(true)}>
                  Cadastrar Usuário
                </Button>
              </Card> : <Card>
                <Table headers={['Nome', 'E-mail', 'Tipo', 'Empresa', 'Ações']}>
                  {users.map(userItem => <tr key={userItem.id} className="hover:bg-gray-50 cursor-pointer" onDoubleClick={() => handleEdit(userItem)} title="Duplo clique para editar">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getTipoIcon(userItem.tipo)}
                          <span className="font-medium text-gray-900">
                            {userItem.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {userItem.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoBadgeColor(userItem.tipo)}`}>
                          {getTipoLabel(userItem.tipo)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {userItem.empresa_id ? companies.find(c => c.id === userItem.empresa_id)?.razao_social || '-' : <span className="text-purple-600 font-medium">
                            Todas
                          </span>}
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={e => {
                  e.stopPropagation();
                  handleEdit(userItem);
                }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" disabled={isAdmin && (userItem.tipo === 'super' || userItem.tipo === 'admin')}>
                          <EditIcon size={16} />
                        </button>
                      </td>
                    </tr>)}
                </Table>
              </Card>}
          </> : <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {editingId ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Input label="Nome Completo *" name="nome" value={formData.nome} onChange={handleChange} required className="md:col-span-2" />
                <Input label="E-mail *" name="email" type="email" value={formData.email} onChange={handleChange} required />
                <Input label={editingId ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'} name="senha" type="password" value={formData.senha} onChange={handleChange} required={!editingId} placeholder={editingId ? 'Deixe em branco para não alterar' : ''} />

                <Select label="Tipo de Usuário *" name="tipo" value={formData.tipo} onChange={handleChange} options={tipoOptions} required />

                {isSuperUser && <Select label="Empresa" name="empresa_id" value={formData.empresa_id} onChange={handleChange} options={[{
              value: '',
              label: 'Todas (Super Usuário)'
            }, ...companies.map(c => ({
              value: c.id.toString(),
              label: c.razao_social
            }))]} />}

                {isAdmin && !isSuperUser && <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <strong>Empresa:</strong>{' '}
                      {companies.find(c => c.id === user?.empresa_id)?.razao_social || 'Sua empresa'}
                      <br />
                      <span className="text-xs">
                        Você só pode criar usuários para sua empresa
                      </span>
                    </p>
                  </div>}
              </div>

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Tipos de Usuário:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <ShieldCheckIcon size={14} className="text-purple-600" />
                    <strong>Super Usuário:</strong> Acesso total ao sistema,
                    gerencia empresas e todos os usuários
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldIcon size={14} className="text-blue-600" />
                    <strong>Administrador:</strong> Gerencia usuários de sua
                    empresa
                  </li>
                  <li className="flex items-center gap-2">
                    <UserCheckIcon size={14} className="text-gray-600" />
                    <strong>Usuário:</strong> Acesso às funcionalidades da
                    empresa
                  </li>
                </ul>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                </Button>
              </div>
            </form>
          </Card>}
      </main>
    </div>;
}