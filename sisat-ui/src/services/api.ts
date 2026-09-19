import axios from 'axios';

export type UserRole = 'paciente' | 'medico';

/**
 * Instância central do Axios utilizada pelo frontend
 * para se comunicar com o BFF.
 *
 * A URL pode ser configurada pela variável VITE_API_URL.
 * Quando ela não é informada, o frontend utiliza
 * o backend local na porta 3000.
 */

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://localhost:3000',
});

/**
 * Representa os dados básicos do usuário autenticado
 * que são mantidos no navegador após o login.
 *
 * O CPF existe apenas para pacientes, enquanto
 * médicos são identificados pelo e-mail institucional.
 */
export interface UsuarioSISAT {
  id: string;
  cpf?: string;
  email: string;
  role: UserRole;
}


/**
 * Estruturas enviadas ao BFF nas operações
 * de cadastro e autenticação.
 *
 * Esses tipos mantêm o frontend alinhado
 * com os DTOs definidos no backend.
 */
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

/**
 * Formato devolvido pelo backend após um login válido.
 * Contém o token JWT e os dados básicos do usuário.
 */

export interface RespostaLogin {
  message: string;
  access_token: string;
  user: UsuarioSISAT;
}



/**
 * Persiste o token JWT e os dados do usuário
 * no localStorage após uma autenticação válida.
 *
 * Nesta versão, o token é armazenado para manter
 * a identificação do usuário entre as telas, mas ainda
 * não é adicionado automaticamente às requisições.
 */

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
/**
 * Envia os dados do novo paciente ao BFF.
 *
 * Rota utilizada:
 * POST /auth/paciente/cadastro
 */
export function cadastrarPaciente(
  dados: DadosCadastroPaciente,
) {
  return api.post<RespostaCadastroPaciente>(
    '/auth/paciente/cadastro',
    dados,
  );
}

/**
 * Autentica o paciente por CPF e senha.
 * Depois de uma resposta válida, mantém o token
 * e os dados da conta no localStorage.
 *
 * Rota utilizada:
 * POST /auth/paciente/login
 */

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
/**
 * Autentica o médico por e-mail institucional e senha
 * e armazena localmente os dados da sessão.
 *
 * Rota utilizada:
 * POST /auth/medico/login
 */
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
/**
 * Recupera o token JWT salvo após o login.
 * Retorna null quando não existe uma sessão armazenada.
 */
export function obterToken() {
  return localStorage.getItem('access_token');
}
/**
 * Recupera e interpreta os dados do usuário armazenados
 * no navegador. Caso o conteúdo esteja ausente ou seja
 * um JSON inválido, retorna null.
 */
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
/**
 * Converte diferentes formatos de erro do Axios
 * em uma mensagem simples para exibição nas telas.
 *
 * O método trata listas de erros de validação,
 * mensagens enviadas pelo backend, falhas de conexão
 * e erros inesperados.
 */

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
