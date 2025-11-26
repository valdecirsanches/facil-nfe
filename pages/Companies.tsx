import React, { useEffect, useState, useRef } from 'react'
import { toast, Toaster } from 'sonner';
import { Header } from '../components/Header'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Table } from '../components/ui/Table'
import { BuildingIcon, CheckCircleIcon, EditIcon } from 'lucide-react'
import { db } from '../utils/database'
import { useCompany } from '../context/CompanyContext'
import { useCEP } from '../hooks/useCEP'
export function Companies() {
  const [companies, setCompanies] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const { activeCompanyId, setActiveCompanyId } = useCompany()
  const { buscarCEP, loading: cepLoading } = useCEP()
  const numeroRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    ie: '',
    crt: '1',
    endereco: '',
    numero: '',
    cidade: '',
    estado: '',
    cep: '',
    codigo_municipio: '',
    telefone: '',
    email: '',
  })
  useEffect(() => {
    loadCompanies()
  }, [])
  const loadCompanies = async () => {
    try {
      await db.initialize()
      const data = await db.getCompanies()
      setCompanies(data)
      if (!activeCompanyId && data.length > 0) {
        setActiveCompanyId(data[0].id)
      }
    } catch (error) {
      console.error('Error loading companies:', error)
    } finally {
      setLoading(false)
    }
  }
  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCep = e.target.value
    setFormData((prev) => ({
      ...prev,
      cep: newCep,
    }))
    const cleanCEP = newCep.replace(/\D/g, '')
    if (cleanCEP.length === 8) {
      const cepData = await buscarCEP(cleanCEP)
      if (cepData) {
        setFormData((prev) => ({
          ...prev,
          endereco: cepData.endereco,
          bairro: cepData.bairro,
          cidade: cepData.cidade,
          estado: cepData.uf,
          codigo_municipio: cepData.codigo_municipio,
        }))
        setTimeout(() => {
          numeroRef.current?.focus()
        }, 100)
      }
    }
  }
  const handleEdit = (company: any) => {
    setFormData({
      razao_social: company.razao_social,
      nome_fantasia: company.nome_fantasia || '',
      cnpj: company.cnpj,
      ie: company.ie || '',
      crt: company.crt || '1',
      endereco: company.endereco || '',
      numero: company.numero || '',
      cidade: company.cidade || '',
      estado: company.estado || '',
      cep: company.cep || '',
      codigo_municipio: company.codigo_municipio || '',
      telefone: company.telefone || '',
      email: company.email || '',
    })
    setEditingId(company.id)
    setShowForm(true)
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Validar código do município
    if (!formData.codigo_municipio) {
      toast.error(
        'Por favor, busque o CEP para preencher o código do município automaticamente.',
      )
      return
    }
    try {
      if (editingId) {
        const existingCompany = companies.find((c) => c.id === editingId)
        if (existingCompany && existingCompany.cnpj !== formData.cnpj) {
          const cnpjExists = companies.some(
            (c) => c.cnpj === formData.cnpj && c.id !== editingId,
          )
          if (cnpjExists) {
            toast.error('Este CNPJ já está cadastrado em outra empresa.')
            return
          }
        }
        await db.updateCompany({
          ...formData,
          id: editingId,
        })
      } else {
        const cnpjExists = companies.some((c) => c.cnpj === formData.cnpj)
        if (cnpjExists) {
          toast.error('Este CNPJ já está cadastrado. Use um CNPJ diferente ou edite a empresa existente.',
          )
          return
        }
        const id = await db.createCompany(formData)
        setActiveCompanyId(id)
      }
      await loadCompanies()
      setShowForm(false)
      setEditingId(null)
      setFormData({
        razao_social: '',
        nome_fantasia: '',
        cnpj: '',
        ie: '',
        crt: '1',
        endereco: '',
        numero: '',
        cidade: '',
        estado: '',
        cep: '',
        codigo_municipio: '',
        telefone: '',
        email: '',
      })
    } catch (error: any) {
      console.error('Error saving company:', error)
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        toast.error(
          'Este CNPJ já está cadastrado. Use um CNPJ diferente ou edite a empresa existente.',
        )
      } else {
        toast.error('Erro ao salvar empresa. Tente novamente.')
      }
    }
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }
  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      razao_social: '',
      nome_fantasia: '',
      cnpj: '',
      ie: '',
      crt: '1',
      endereco: '',
      numero: '',
      cidade: '',
      estado: '',
      cep: '',
      codigo_municipio: '',
      telefone: '',
      email: '',
    })
  }
  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    )
  }
  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Empresas (Emitentes)" />

      <main className="p-8">
        {!showForm ? (
          <>
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                Gerencie as empresas emitentes. Cada empresa terá seu próprio
                banco de dados.
              </p>
              <Button onClick={() => setShowForm(true)}>
                <BuildingIcon size={18} className="mr-2" />
                Nova Empresa
              </Button>
            </div>

            {companies.length === 0 ? (
              <Card className="p-12 text-center">
                <BuildingIcon
                  size={48}
                  className="mx-auto text-gray-400 mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma empresa cadastrada
                </h3>
                <p className="text-gray-600 mb-6">
                  Cadastre sua primeira empresa para começar a emitir notas
                  fiscais.
                </p>
                <Button onClick={() => setShowForm(true)}>
                  Cadastrar Empresa
                </Button>
              </Card>
            ) : (
              <Card>
                <Table
                  headers={[
                    'Razão Social',
                    'CNPJ',
                    'Cidade/UF',
                    'Status',
                    'Ações',
                  ]}
                >
                  {companies.map((company) => (
                    <tr
                      key={company.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onDoubleClick={() => handleEdit(company)}
                      title="Duplo clique para editar"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {company.razao_social}
                          </p>
                          {company.nome_fantasia && (
                            <p className="text-sm text-gray-600">
                              {company.nome_fantasia}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {company.cnpj}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {company.cidade && company.estado
                          ? `${company.cidade}/${company.estado}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {activeCompanyId === company.id ? (
                          <span className="flex items-center gap-2 text-green-600 text-sm font-medium">
                            <CheckCircleIcon size={16} />
                            Ativa
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Inativa</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(company)
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <EditIcon size={16} />
                          </button>
                          {activeCompanyId !== company.id && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveCompanyId(company.id)
                              }}
                            >
                              Ativar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </Table>
              </Card>
            )}
          </>
        ) : (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {editingId ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Input
                  label="Razão Social *"
                  name="razao_social"
                  value={formData.razao_social}
                  onChange={handleChange}
                  required
                  className="md:col-span-2"
                />
                <Input
                  label="Nome Fantasia"
                  name="nome_fantasia"
                  value={formData.nome_fantasia}
                  onChange={handleChange}
                />
                <Input
                  label="CNPJ *"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  placeholder="00.000.000/0000-00"
                  required
                />
                <Input
                  label="Inscrição Estadual"
                  name="ie"
                  value={formData.ie}
                  onChange={handleChange}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Regime Tributário (CRT) *
                  </label>
                  <select
                    name="crt"
                    value={formData.crt}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="1">1 - Simples Nacional</option>
                    <option value="2">2 - Simples Nacional - Excesso</option>
                    <option value="3">3 - Regime Normal</option>
                  </select>
                </div>
                <Input
                  label="Telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                />
                <Input
                  label="CEP *"
                  name="cep"
                  value={formData.cep}
                  onChange={handleCEPChange}
                  placeholder="00000-000"
                  required
                  disabled={cepLoading}
                />
                {cepLoading && (
                  <div className="flex items-center text-sm text-gray-600">
                    Buscando CEP...
                  </div>
                )}
                <Input
                  label="Endereço"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  className="md:col-span-2"
                />
                <Input
                  label="Número *"
                  name="numero"
                  value={formData.numero}
                  onChange={handleChange}
                  ref={numeroRef}
                  required
                />
                <Input
                  label="Cidade"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                />
                <Input
                  label="Estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  placeholder="SP"
                  maxLength={2}
                />
                <Input
                  label="Código do Município (IBGE) *"
                  name="codigo_municipio"
                  value={formData.codigo_municipio}
                  onChange={handleChange}
                  placeholder="Preenchido automaticamente ao buscar CEP"
                  required
                  className={!formData.codigo_municipio ? 'bg-yellow-50' : ''}
                />
                <Input
                  label="E-mail"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="md:col-span-2"
                />
              </div>

              {!formData.codigo_municipio && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Atenção:</strong> O código do município é
                    obrigatório para emissão de NFe. Por favor, preencha o CEP e
                    clique fora do campo para buscar automaticamente.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={!formData.codigo_municipio}>
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Empresa'}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </main>
    </div>
  )
}
