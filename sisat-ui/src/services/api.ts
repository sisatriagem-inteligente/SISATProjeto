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
// Usa a URL do .env e mantém localhost como valor padrão.
const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://localhost:3000',
});

// Em demonstração, telas que não têm simulação própria não podem tocar dados reais.
if (import.meta.env.DEV && import.meta.env.VITE_SISAT_FRONTEND_DEMO === 'true') {
  api.interceptors.request.use(() => {
    throw new Error('Modo de demonstração: esta operação não será enviada ao servidor.');
  });
}


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

export interface PerguntaRecuperacao {
  id: 1 | 2 | 3;
  text: string;
}

export interface RespostaPerguntasRecuperacao {
  questions: PerguntaRecuperacao[];
}

export interface DadosConfigurarRecuperacao {
  cpf: string;
  currentPassword: string;
  recoveryWord1: string;
  recoveryWord2: string;
  recoveryWord3: string;
}

export interface RespostaConfigurarRecuperacao {
  message: string;
}

export interface DadosConcluirCadastroPaciente {
  setupToken: string;
  recoveryWord1: string;
  recoveryWord2: string;
  recoveryWord3: string;
}

export interface RespostaConcluirCadastroPaciente {
  message: string;
}


export interface DadosValidarRespostaRecuperacao {
  cpf: string;
  answer: string;
}

export interface RespostaValidarRespostaRecuperacao {
  reset_token: string;
  expires_in_seconds: number;
}

export interface DadosRedefinirSenha {
  resetToken: string;
  newPassword: string;
}

export interface RespostaRedefinirSenha {
  message: string;
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
  setup_token?: string;
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

/**
 * Encerra a sessão local do usuário.
 *
 * Remove os dados de autenticação e a referência
 * local da triagem ativa, sem apagar registros do banco.
 *
 * Esta função não revoga o JWT no backend.
 */
export function encerrarSessao(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('sisat_user');
  localStorage.removeItem('triagem_ativa_id');
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
 * Busca as três perguntas fixas de recuperação.
 *
 * Rota utilizada:
 * GET /auth/paciente/perguntas-recuperacao
 *
 * O modo de demonstração usa perguntas locais e não chama esta rota.
 */
export function obterPerguntasRecuperacao() {
  return api.get<RespostaPerguntasRecuperacao>(
    '/auth/paciente/perguntas-recuperacao',
  );
}

/**
 * Configura as três respostas e conclui
 * o cadastro do paciente.
 *
 * Rota utilizada:
 * POST /auth/paciente/concluir-cadastro
 */
export function concluirCadastroPaciente(
  dados: DadosConcluirCadastroPaciente,
) {
  return api.post<RespostaConcluirCadastroPaciente>(
    '/auth/paciente/concluir-cadastro',
    dados,
  );
}

/**
 * Configura ou substitui as respostas de recuperação
 * mediante confirmação da senha atual.
 *
 * Rota utilizada:
 * POST /auth/paciente/configurar-recuperacao
 *
 * CONFIGURAÇÃO TARDIA — PRESERVAR NA INTEGRAÇÃO.
 *
 * Utilizada quando a conta já foi criada, mas as respostas
 * não foram configuradas durante o cadastro.
 *
 * O paciente informa CPF, senha atual e as três respostas.
 * Não exige setup_token e não deve ser confundida com
 * a recuperação de uma senha esquecida.
 */
export function configurarRecuperacaoPaciente(
  dados: DadosConfigurarRecuperacao,
) {
  return api.post<RespostaConfigurarRecuperacao>(
    '/auth/paciente/configurar-recuperacao',
    dados,
  );
}

/** Confere uma resposta contra os três hashes cadastrados. */
export function validarRespostaRecuperacao(
  dados: DadosValidarRespostaRecuperacao,
) {
  return api.post<RespostaValidarRespostaRecuperacao>(
    '/auth/paciente/validar-resposta-recuperacao',
    dados,
  );
}

/** Consome a autorização temporária para salvar a nova senha. */
export function redefinirSenhaPaciente(dados: DadosRedefinirSenha) {
  return api.post<RespostaRedefinirSenha>(
    '/auth/paciente/redefinir-senha',
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
  if (erro instanceof Error && erro.message.startsWith('Modo de demonstração:')) {
    return erro.message;
  }
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
