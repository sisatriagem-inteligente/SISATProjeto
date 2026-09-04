import axios from 'axios';

export type UserRole = 'paciente' | 'medico';

// Usa a URL do .env e mantém localhost como valor padrão.
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://localhost:3000',
});

//ADICIONADO PARA O FUNCIONAMENTO DO FRONTEND

export interface AtendimentoEmAndamento {
  id: string;
  nome: string;
  idade: number;
  sexo: string;
  data: string;
  sintomas: string;
  prioridade: 'vermelho' | 'amarelo' | 'verde';
}

export async function buscarAtendimentosEmAndamento() {
  const resposta = await api.get<AtendimentoEmAndamento[]>(
    'COLOCAR_AQUI_A_ROTA_REAL'
  );

  return resposta.data;
}



//FIM DO ADICIONADO PARA O FUNCIONAMENTO DO FRONTEND

export interface UsuarioSISAT {
  id: string;
  cpf?: string;
  email: string;
  role: UserRole;
}

export interface DadosCadastroPaciente {
  cpf: string;
  email: string;
  password: string;
}

export interface DadosLoginPaciente {
  cpf: string;
  password: string;
}

export interface DadosLoginMedico {
  email: string;
  password: string;
}

export interface RespostaCadastroPaciente {
  message: string;
  patient: {
    id: string;
    cpf: string;
    email: string;
  };
}

export interface RespostaLogin {
  message: string;
  access_token: string;
  user: UsuarioSISAT;
}



// Salva os dados retornados depois de um login válido.
function salvarSessao(resposta: RespostaLogin) {
  localStorage.setItem(
    'access_token',
    resposta.access_token,
  );

  localStorage.setItem(
    'sisat_user',
    JSON.stringify(resposta.user),
  );
}

export function cadastrarPaciente(
  dados: DadosCadastroPaciente,
) {
  return api.post<RespostaCadastroPaciente>(
    '/auth/paciente/cadastro',
    dados,
  );
}

export async function loginPaciente(
  dados: DadosLoginPaciente,
) {
  const resposta = await api.post<RespostaLogin>(
    '/auth/paciente/login',
    dados,
  );

  salvarSessao(resposta.data);
  return resposta;
}

export async function loginMedico(
  dados: DadosLoginMedico,
) {
  const resposta = await api.post<RespostaLogin>(
    '/auth/medico/login',
    dados,
  );

  salvarSessao(resposta.data);
  return resposta;
}

export function obterToken() {
  return localStorage.getItem('access_token');
}

export function obterUsuario(): UsuarioSISAT | null {
  const usuarioSalvo = localStorage.getItem('sisat_user');

  if (!usuarioSalvo) {
    return null;
  }

  try {
    return JSON.parse(usuarioSalvo) as UsuarioSISAT;
  } catch {
    return null;
  }
}

export function obterMensagemErro(erro: unknown) {
  if (axios.isAxiosError(erro)) {
    const mensagem = erro.response?.data?.message;

    if (Array.isArray(mensagem)) {
      return mensagem.join(' ');
    }

    if (typeof mensagem === 'string') {
      return mensagem;
    }

    if (!erro.response) {
      return 'Não foi possível conectar com o servidor.';
    }
  }

  return 'Ocorreu um erro inesperado.';
}

export default api;
