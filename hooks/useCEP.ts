import { useState } from 'react'

interface CEPData {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
}

interface BrasilAPICEPData {
  cep: string
  state: string
  city: string
  neighborhood: string
  street: string
  service: string
  location: {
    type: string
    coordinates: {
      longitude: string
      latitude: string
    }
  }
}

export function useCEP() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buscarCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '')

    if (cepLimpo.length !== 8) {
      setError('CEP inválido')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Tentar BrasilAPI primeiro (mais confiável)
      console.log('🔍 Buscando CEP na BrasilAPI:', cepLimpo)

      const brasilApiResponse = await fetch(
        `https://brasilapi.com.br/api/cep/v2/${cepLimpo}`,
      )

      if (brasilApiResponse.ok) {
        const data: BrasilAPICEPData = await brasilApiResponse.json()

        console.log('✅ BrasilAPI retornou:', data)

        // Buscar código IBGE do município
        const ibgeResponse = await fetch(
          `https://brasilapi.com.br/api/ibge/municipios/v1/${data.state}?providers=dados-abertos-br,gov,wikipedia`,
        )

        let codigoIBGE = ''

        if (ibgeResponse.ok) {
          const municipios = await ibgeResponse.json()
          const municipio = municipios.find(
            (m: any) => m.nome.toLowerCase() === data.city.toLowerCase(),
          )

          if (municipio) {
            codigoIBGE = municipio.codigo_ibge
            console.log('✅ Código IBGE encontrado:', codigoIBGE)
          }
        }

        setLoading(false)
        return {
          endereco: data.street,
          bairro: data.neighborhood,
          cidade: data.city,
          uf: data.state,
          codigo_municipio: codigoIBGE,
          cep: cep,
        }
      }

      // Se BrasilAPI falhar, tentar ViaCEP como fallback
      console.log('⚠️  BrasilAPI falhou, tentando ViaCEP...')

      const viaCepResponse = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`,
      )
      const viaCepData: CEPData = await viaCepResponse.json()

      if ('erro' in viaCepData) {
        setError('CEP não encontrado')
        setLoading(false)
        return null
      }

      console.log('✅ ViaCEP retornou:', viaCepData)

      setLoading(false)
      return {
        endereco: viaCepData.logradouro,
        bairro: viaCepData.bairro,
        cidade: viaCepData.localidade,
        uf: viaCepData.uf,
        codigo_municipio: viaCepData.ibge,
        cep: cep,
      }
    } catch (err) {
      console.error('❌ Erro ao buscar CEP:', err)
      setError('Erro ao buscar CEP')
      setLoading(false)
      return null
    }
  }

  return { buscarCEP, loading, error }
}
