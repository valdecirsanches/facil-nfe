export interface Company {
  id?: number;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  ie?: string;
  endereco?: string;
  numero?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  created_at?: string;
}
export interface User {
  id?: number;
  nome: string;
  email: string;
  senha: string;
  empresa_id: number | null;
  created_at?: string;
}
export interface Client {
  id?: number;
  tipo_documento: 'cpf' | 'cnpj';
  documento: string;
  razao_social: string;
  nome_fantasia?: string;
  ie?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  created_at?: string;
}
export interface Product {
  id?: number;
  codigo: string;
  descricao: string;
  unidade: string;
  valor_unitario: number;
  ncm?: string;
  cfop?: string;
  created_at?: string;
}
export interface Carrier {
  id?: number;
  razao_social: string;
  cnpj?: string;
  ie?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  created_at?: string;
}
export interface NFe {
  id?: number;
  numero: string;
  serie?: string;
  cliente_id: number;
  data_emissao?: string;
  natureza_operacao: string;
  cfop: string;
  valor_total: number;
  status?: string;
  chave_acesso?: string;
  xml_path?: string;
}
export interface NFeItem {
  id?: number;
  nfe_id: number;
  produto_id: number;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}