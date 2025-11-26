const API_URL = 'http://localhost:5300/api';
class DatabaseService {
  private token: string | null = null;
  private initialized = false;
  async initialize() {
    if (this.initialized) return;

    // Tentar ambos os nomes de token para compatibilidade
    this.token = localStorage.getItem('token') || localStorage.getItem('api_token');
    this.initialized = true;
    if (this.token) {
      console.log('✅ Token encontrado no localStorage');
    } else {
      console.log('⚠️  Nenhum token encontrado');
    }
  }
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token); // Usar 'token' ao invés de 'api_token'
    console.log('✅ Token salvo:', token.substring(0, 20) + '...');
  }
  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('token') || localStorage.getItem('api_token');
    }
    return this.token;
  }
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('api_token');
  }
  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('⚠️  Requisição sem token:', endpoint);
    }
    console.log(`📡 Request: ${options.method || 'GET'} ${endpoint}`);
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error('❌ Token inválido ou expirado');
          this.clearToken();
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        const error = await response.json();
        console.error('❌ Erro na API:', error);
        throw new Error(error.error || `Erro na API: ${response.statusText}`);
      }
      const data = await response.json();
      console.log(`✅ Response: ${endpoint}`, data);
      return data;
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  // ===== USER OPERATIONS =====
  async authenticateUser(email: string, senha: string): Promise<any | null> {
    await this.initialize();
    try {
      console.log('🔐 Tentando autenticar:', email);
      const data = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          senha
        })
      });
      if (data.token) {
        this.setToken(data.token);
        console.log('✅ Login bem-sucedido');
      }
      return data.user;
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return null;
    }
  }
  async createDefaultSuperUser(): Promise<void> {
    await this.initialize();
  }
  async createUser(user: any): Promise<number> {
    await this.initialize();
    const data = await this.request('/usuarios', {
      method: 'POST',
      body: JSON.stringify(user)
    });
    return data.id;
  }
  async updateUser(user: any): Promise<void> {
    await this.initialize();
    await this.request(`/usuarios/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify(user)
    });
  }
  async getUsers(): Promise<any[]> {
    await this.initialize();
    return this.request('/usuarios');
  }

  // ===== COMPANY OPERATIONS =====
  async createCompany(company: any): Promise<number> {
    await this.initialize();
    const data = await this.request('/empresas', {
      method: 'POST',
      body: JSON.stringify(company)
    });
    return data.id;
  }
  async updateCompany(company: any): Promise<void> {
    await this.initialize();
    await this.request(`/empresas/${company.id}`, {
      method: 'PUT',
      body: JSON.stringify(company)
    });
  }
  async getCompanies(): Promise<any[]> {
    await this.initialize();
    return this.request('/empresas');
  }
  async getCompanyById(id: number): Promise<any> {
    await this.initialize();
    return this.request(`/empresas/${id}`);
  }

  // ===== NCM OPERATIONS =====
  async searchNCMs(query: string = '', limit: number = 50): Promise<any[]> {
    await this.initialize();
    return this.request(`/ncm/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  // ===== CFOP OPERATIONS =====
  async searchCFOPs(query: string = '', limit: number = 50): Promise<any[]> {
    await this.initialize();
    return this.request(`/cfop/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  // ===== CLIENT OPERATIONS =====
  async searchClients(companyId: number, query: string = '', limit: number = 50): Promise<any[]> {
    await this.initialize();
    return this.request(`/empresas/${companyId}/clientes/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }
  async createClient(companyId: number, client: any): Promise<number> {
    await this.initialize();
    const data = await this.request(`/empresas/${companyId}/clientes`, {
      method: 'POST',
      body: JSON.stringify(client)
    });
    return data.id;
  }
  async updateClient(companyId: number, client: any): Promise<void> {
    await this.initialize();
    await this.request(`/empresas/${companyId}/clientes/${client.id}`, {
      method: 'PUT',
      body: JSON.stringify(client)
    });
  }
  async getClients(companyId: number): Promise<any[]> {
    await this.initialize();
    return this.request(`/empresas/${companyId}/clientes`);
  }

  // ===== PRODUCT OPERATIONS =====
  async searchProducts(companyId: number, query: string = '', limit: number = 50): Promise<any[]> {
    await this.initialize();
    return this.request(`/empresas/${companyId}/produtos/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }
  async createProduct(companyId: number, product: any): Promise<number> {
    await this.initialize();
    const data = await this.request(`/empresas/${companyId}/produtos`, {
      method: 'POST',
      body: JSON.stringify(product)
    });
    return data.id;
  }
  async updateProduct(companyId: number, product: any): Promise<void> {
    await this.initialize();
    await this.request(`/empresas/${companyId}/produtos/${product.id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    });
  }
  async getProducts(companyId: number): Promise<any[]> {
    await this.initialize();
    return this.request(`/empresas/${companyId}/produtos`);
  }

  // ===== CARRIER OPERATIONS =====
  async searchTransportadoras(companyId: number, query: string = '', limit: number = 50): Promise<any[]> {
    await this.initialize();
    return this.request(`/empresas/${companyId}/transportadoras/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }
  async createCarrier(companyId: number, carrier: any): Promise<number> {
    await this.initialize();
    const data = await this.request(`/empresas/${companyId}/transportadoras`, {
      method: 'POST',
      body: JSON.stringify(carrier)
    });
    return data.id;
  }
  async updateCarrier(companyId: number, carrier: any): Promise<void> {
    await this.initialize();
    await this.request(`/empresas/${companyId}/transportadoras/${carrier.id}`, {
      method: 'PUT',
      body: JSON.stringify(carrier)
    });
  }
  async getCarriers(companyId: number): Promise<any[]> {
    await this.initialize();
    return this.request(`/empresas/${companyId}/transportadoras`);
  }

  // ===== NFE OPERATIONS =====
  async createNFe(companyId: number, nfe: any, items: any[]): Promise<number> {
    await this.initialize();
    const data = await this.request(`/empresas/${companyId}/nfes`, {
      method: 'POST',
      body: JSON.stringify({
        ...nfe,
        items
      })
    });
    return data.id;
  }
  async getNFes(companyId: number): Promise<any[]> {
    await this.initialize();
    return this.request(`/empresas/${companyId}/nfes`);
  }
  async getNFeById(companyId: number, nfeId: number): Promise<any> {
    await this.initialize();
    return this.request(`/empresas/${companyId}/nfes/${nfeId}`);
  }
  async deleteNFe(companyId: number, nfeId: number): Promise<void> {
    await this.initialize();
    await this.request(`/empresas/${companyId}/nfes/${nfeId}`, {
      method: 'DELETE'
    });
  }

  // NOVO: Transmitir NFe para SEFAZ
  async transmitirNFe(companyId: number, nfeId: number): Promise<any> {
    await this.initialize();
    return this.request(`/empresas/${companyId}/nfes/${nfeId}/transmitir`, {
      method: 'POST'
    });
  }

  // NOVO: Abortar processamento de NFe
  async abortarNFe(companyId: number, nfeId: number): Promise<void> {
    await this.initialize();
    await this.request(`/empresas/${companyId}/nfes/${nfeId}/abortar`, {
      method: 'POST'
    });
  }

  // NOVO: Consultar status SEFAZ
  async consultarStatusSefaz(uf: string = 'SP'): Promise<any> {
    await this.initialize();
    return this.request(`/sefaz/status/${uf}`);
  }

  // ===== CONFIGURAÇÕES =====
  async getConfiguracoes(): Promise<any[]> {
    await this.initialize();
    console.log('📊 Buscando configurações...');
    return this.request('/configuracoes');
  }
  async getConfiguracao(chave: string): Promise<any> {
    await this.initialize();
    return this.request(`/configuracoes/${chave}`);
  }
  async updateConfiguracao(chave: string, valor: string): Promise<void> {
    await this.initialize();
    console.log(`💾 Salvando ${chave}: "${valor}"`);
    await this.request(`/configuracoes/${chave}`, {
      method: 'PUT',
      body: JSON.stringify({
        valor
      })
    });
  }
  async createConfiguracao(chave: string, valor: string, descricao: string, tipo: string = 'string'): Promise<void> {
    await this.initialize();
    await this.request('/configuracoes', {
      method: 'POST',
      body: JSON.stringify({
        chave,
        valor,
        descricao,
        tipo
      })
    });
  }
}
export const db = new DatabaseService();