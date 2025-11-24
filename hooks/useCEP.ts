import { useState } from 'react';
interface CEPData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}
export function useCEP() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buscarCEP = async (cep: string) => {
    // Remove formatação apenas para a busca na API
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      setError('CEP inválido');
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data: CEPData = await response.json();
      if ('erro' in data) {
        setError('CEP não encontrado');
        return null;
      }
      setLoading(false);
      return {
        endereco: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        uf: data.uf,
        codigo_municipio: data.ibge,
        // IMPORTANTE: Retornar o CEP original SEM transformação
        cep: cep
      };
    } catch (err) {
      setError('Erro ao buscar CEP');
      setLoading(false);
      return null;
    }
  };
  return {
    buscarCEP,
    loading,
    error
  };
}