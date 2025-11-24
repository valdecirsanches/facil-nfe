import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { PackageIcon, EditIcon, SearchIcon, XIcon } from 'lucide-react';
import { db } from '../utils/database';
import { useCompany } from '../context/CompanyContext';
export function Products() {
  const {
    activeCompanyId
  } = useCompany();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Estados para busca de NCM e CFOP
  const [ncmSearch, setNcmSearch] = useState('');
  const [ncmResults, setNcmResults] = useState<any[]>([]);
  const [ncmLoading, setNcmLoading] = useState(false);
  const [showNcmResults, setShowNcmResults] = useState(false);
  const [cfopSearch, setCfopSearch] = useState('');
  const [cfopResults, setCfopResults] = useState<any[]>([]);
  const [cfopLoading, setCfopLoading] = useState(false);
  const [showCfopResults, setShowCfopResults] = useState(false);
  const [formData, setFormData] = useState({
    codigo: '',
    descricao: '',
    unidade: 'UN',
    valor_unitario: '',
    ncm: '',
    cfop: '',
    ncm_id: '',
    cfop_id: '',
    aliquota_icms: ''
  });
  const [selectedNcm, setSelectedNcm] = useState<any>(null);
  const [selectedCfop, setSelectedCfop] = useState<any>(null);
  useEffect(() => {
    if (activeCompanyId) {
      loadData();
    }
  }, [activeCompanyId]);
  useEffect(() => {
    filterProducts();
  }, [searchTerm, products]);
  // Busca NCM com debounce
  useEffect(() => {
    if (ncmSearch.length >= 2) {
      const timer = setTimeout(() => {
        searchNCM(ncmSearch);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setNcmResults([]);
      setShowNcmResults(false);
    }
  }, [ncmSearch]);
  // Busca CFOP com debounce
  useEffect(() => {
    if (cfopSearch.length >= 2) {
      const timer = setTimeout(() => {
        searchCFOP(cfopSearch);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setCfopResults([]);
      setShowCfopResults(false);
    }
  }, [cfopSearch]);
  const normalizeText = (text: string) => {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };
  const filterProducts = () => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const normalizedSearch = normalizeText(searchTerm);
      const filtered = products.filter(product => {
        const codigo = normalizeText(product.codigo || '');
        const descricao = normalizeText(product.descricao || '');
        return codigo.includes(normalizedSearch) || descricao.includes(normalizedSearch);
      });
      setFilteredProducts(filtered);
    }
  };
  const searchNCM = async (query: string) => {
    setNcmLoading(true);
    try {
      const results = await db.searchNCMs(query, 50);
      console.log('NCM Results:', results);
      setNcmResults(results);
      setShowNcmResults(true);
    } catch (error) {
      console.error('Error searching NCM:', error);
    } finally {
      setNcmLoading(false);
    }
  };
  const searchCFOP = async (query: string) => {
    setCfopLoading(true);
    try {
      const results = await db.searchCFOPs(query, 50);
      console.log('CFOP Results:', results);
      setCfopResults(results);
      setShowCfopResults(true);
    } catch (error) {
      console.error('Error searching CFOP:', error);
    } finally {
      setCfopLoading(false);
    }
  };
  const selectNCM = (ncm: any) => {
    setSelectedNcm(ncm);
    setFormData({
      ...formData,
      ncm_id: ncm.id.toString(),
      ncm: ncm.id.toString()
    });
    setNcmSearch(`${ncm.id} - ${ncm.descricao || 'Sem descrição'}`);
    setShowNcmResults(false);
  };
  const clearNCM = () => {
    setSelectedNcm(null);
    setFormData({
      ...formData,
      ncm_id: '',
      ncm: ''
    });
    setNcmSearch('');
    setNcmResults([]);
  };
  const selectCFOP = (cfop: any) => {
    setSelectedCfop(cfop);
    setFormData({
      ...formData,
      cfop_id: cfop.id.toString(),
      cfop: cfop.id.toString()
    });
    setCfopSearch(`${cfop.id} - ${cfop.descricao || cfop.texto || 'Sem descrição'}`);
    setShowCfopResults(false);
  };
  const clearCFOP = () => {
    setSelectedCfop(null);
    setFormData({
      ...formData,
      cfop_id: '',
      cfop: ''
    });
    setCfopSearch('');
    setCfopResults([]);
  };
  const loadData = async () => {
    if (!activeCompanyId) return;
    try {
      await db.initialize();
      const productsData = await db.getProducts(activeCompanyId);
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleEdit = (product: any) => {
    setFormData({
      codigo: product.codigo,
      descricao: product.descricao,
      unidade: product.unidade,
      valor_unitario: product.valor_unitario.toString(),
      ncm: product.ncm || '',
      cfop: product.cfop || '',
      ncm_id: product.ncm_id?.toString() || '',
      cfop_id: product.cfop_id?.toString() || '',
      aliquota_icms: product.aliquota_icms?.toString() || '0'
    });
    // Carregar NCM e CFOP selecionados
    if (product.ncm_id) {
      setNcmSearch(`${product.ncm || product.ncm_id}`);
      setSelectedNcm({
        id: product.ncm_id,
        descricao: product.ncm
      });
    }
    if (product.cfop_id) {
      setCfopSearch(`${product.cfop || product.cfop_id}`);
      setSelectedCfop({
        id: product.cfop_id,
        descricao: product.cfop
      });
    }
    setEditingId(product.id);
    setShowForm(true);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompanyId) {
      alert('Selecione uma empresa ativa primeiro');
      return;
    }
    try {
      const productData = {
        ...formData,
        valor_unitario: parseFloat(formData.valor_unitario),
        ncm_id: formData.ncm_id ? parseInt(formData.ncm_id) : null,
        cfop_id: formData.cfop_id ? parseInt(formData.cfop_id) : null,
        aliquota_icms: parseFloat(formData.aliquota_icms) || 0
      };
      if (editingId) {
        await db.updateProduct(activeCompanyId, {
          ...productData,
          id: editingId
        });
      } else {
        await db.createProduct(activeCompanyId, productData);
      }
      await loadData();
      handleCancel();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erro ao salvar produto. Verifique se o código já não está cadastrado.');
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
    setSearchTerm('');
    setFormData({
      codigo: '',
      descricao: '',
      unidade: 'UN',
      valor_unitario: '',
      ncm: '',
      cfop: '',
      ncm_id: '',
      cfop_id: '',
      aliquota_icms: ''
    });
    clearNCM();
    clearCFOP();
  };
  if (!activeCompanyId) {
    return <div className="flex-1 bg-gray-50">
        <Header title="Produtos" />
        <main className="p-8">
          <Card className="p-12 text-center">
            <p className="text-gray-600">
              Selecione uma empresa ativa para gerenciar produtos
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
  return <div className="flex-1 bg-gray-50">
      <Header title="Produtos" />

      <main className="p-8">
        {!showForm ? <>
            <div className="mb-6 flex justify-between items-center gap-4">
              <div className="flex-1 max-w-md relative">
                <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar por código ou descrição..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <Button onClick={() => setShowForm(true)}>
                <PackageIcon size={18} className="mr-2" />
                Novo Produto
              </Button>
            </div>

            {filteredProducts.length === 0 ? <Card className="p-12 text-center">
                {searchTerm ? <>
                    <SearchIcon size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhum resultado encontrado
                    </h3>
                    <p className="text-gray-600">
                      Tente buscar por outro termo
                    </p>
                  </> : <>
                    <PackageIcon size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhum produto cadastrado
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Cadastre produtos para agilizar a emissão de notas
                    </p>
                    <Button onClick={() => setShowForm(true)}>
                      Cadastrar Produto
                    </Button>
                  </>}
              </Card> : <Card>
                <Table headers={['Código', 'Descrição', 'Unidade', 'Valor Unitário', 'ICMS %', 'Ações']}>
                  {filteredProducts.map(product => <tr key={product.id} className="hover:bg-gray-50 cursor-pointer" onDoubleClick={() => handleEdit(product)} title="Duplo clique para editar">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {product.codigo}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {product.descricao}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {product.unidade}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        R$ {parseFloat(product.valor_unitario).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {product.aliquota_icms || 0}%
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={e => {
                  e.stopPropagation();
                  handleEdit(product);
                }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <EditIcon size={16} />
                        </button>
                      </td>
                    </tr>)}
                </Table>
              </Card>}
          </> : <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {editingId ? 'Editar Produto' : 'Cadastrar Novo Produto'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Input label="Código do Produto *" name="codigo" value={formData.codigo} onChange={handleChange} placeholder="Ex: PROD001" required />
                <Input label="Unidade *" name="unidade" value={formData.unidade} onChange={handleChange} placeholder="UN, KG, PC, etc" required />
                <Input label="Descrição *" name="descricao" value={formData.descricao} onChange={handleChange} required className="md:col-span-2" />
                <Input label="Valor Unitário *" name="valor_unitario" type="number" step="0.01" value={formData.valor_unitario} onChange={handleChange} placeholder="0.00" required />
                <Input label="Alíquota ICMS (%)" name="aliquota_icms" type="number" step="0.01" value={formData.aliquota_icms} onChange={handleChange} placeholder="0.00" />

                {/* NCM Search */}
                <div className="md:col-span-2 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NCM (Buscar por código ou descrição)
                  </label>
                  <div className="relative">
                    <input type="text" value={ncmSearch} onChange={e => setNcmSearch(e.target.value)} onFocus={() => ncmResults.length > 0 && setShowNcmResults(true)} placeholder="Digite código ou descrição do NCM (ex: CAVALO, 1010)" className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" disabled={!!selectedNcm} />
                    {selectedNcm && <button type="button" onClick={clearNCM} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                        <XIcon size={18} />
                      </button>}
                  </div>
                  {ncmLoading && <p className="text-sm text-gray-600 mt-1">Buscando...</p>}
                  {showNcmResults && ncmResults.length > 0 && <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {ncmResults.map(ncm => <button key={ncm.id} type="button" onClick={() => selectNCM(ncm)} className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                          <p className="font-medium text-gray-900">
                            {ncm.id} - {ncm.descricao || 'Sem descrição'}
                          </p>
                          {ncm.categoria && <p className="text-xs text-gray-500 mt-1">
                              {ncm.categoria}
                            </p>}
                        </button>)}
                    </div>}
                  {showNcmResults && ncmResults.length === 0 && !ncmLoading && ncmSearch.length >= 2 && <p className="text-sm text-red-600 mt-1">
                        Nenhum NCM encontrado
                      </p>}
                </div>

                {/* CFOP Search */}
                <div className="md:col-span-2 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CFOP (Buscar por código ou descrição)
                  </label>
                  <div className="relative">
                    <input type="text" value={cfopSearch} onChange={e => setCfopSearch(e.target.value)} onFocus={() => cfopResults.length > 0 && setShowCfopResults(true)} placeholder="Digite código ou descrição do CFOP (ex: 5102, venda)" className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" disabled={!!selectedCfop} />
                    {selectedCfop && <button type="button" onClick={clearCFOP} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                        <XIcon size={18} />
                      </button>}
                  </div>
                  {cfopLoading && <p className="text-sm text-gray-600 mt-1">Buscando...</p>}
                  {showCfopResults && cfopResults.length > 0 && <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {cfopResults.map(cfop => <button key={cfop.id} type="button" onClick={() => selectCFOP(cfop)} className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                          <p className="font-medium text-gray-900">
                            {cfop.id} - {cfop.descricao || 'Sem descrição'}
                          </p>
                          {cfop.texto && <p className="text-xs text-gray-500 mt-1">
                              {cfop.texto}
                            </p>}
                        </button>)}
                    </div>}
                  {showCfopResults && cfopResults.length === 0 && !cfopLoading && cfopSearch.length >= 2 && <p className="text-sm text-red-600 mt-1">
                        Nenhum CFOP encontrado
                      </p>}
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Dica:</strong> Digite pelo menos 2 caracteres para
                  buscar NCM e CFOP. A busca funciona por código (ex: 1010,
                  5102) ou descrição (ex: CAVALO, venda).
                </p>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="secondary" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </Button>
              </div>
            </form>
          </Card>}
      </main>
    </div>;
}