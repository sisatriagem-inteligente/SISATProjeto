import axios from 'axios';

// Cria uma configuração do Axios com a URL do backend.
const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Cadastra um novo paciente.
export function cadastrarPaciente(dados: {
  cpf: string;
  email: string;
  password: string;
}) {
  return api.post('/auth/paciente/cadastro', dados);
}

// Faz o login do paciente e salva o token.
export async function loginPaciente(dados: {
  cpf: string;
  password: string;
}) {
  // Espera o backend responder ao login.
  const resposta = await api.post(
    '/auth/paciente/login',
    dados,
  );

  // Pega o token retornado pelo backend.
  const token = resposta.data.access_token;

  // Salva o token no navegador.
  localStorage.setItem('access_token', token);

  // Devolve a resposta para o componente React.
  return resposta;
}

// Faz o login do médico e salva o token.
export async function loginMedico(dados: {
  email: string;
  password: string;
}) {
  // Espera o backend responder ao login.
  const resposta = await api.post(
    '/auth/medico/login',
    dados,
  );

  // Pega o token retornado pelo backend.
  const token = resposta.data.access_token;

  // Salva o token no navegador.
  localStorage.setItem('access_token', token);

  // Devolve a resposta para o componente React.
  return resposta;
}

// Busca o token que foi salvo.
export function obterToken() {
  return localStorage.getItem('access_token');
}
// Cria e exporta uma função para obter uma mensagem de erro.
export function obterMensagemErro(erro: unknown) {
  // Verifica se o erro foi gerado pelo Axios.
  if (axios.isAxiosError(erro)) {
    // Tenta acessar a mensagem enviada pelo backend.
    // O "?." evita erro caso response, data ou message não existam.
    const mensagem = erro.response?.data?.message;

    // Verifica se a mensagem é uma lista de mensagens.
    if (Array.isArray(mensagem)) {
      // Junta todas as mensagens em um único texto,
      // separando cada uma por um espaço.
      return mensagem.join(' ');
    }

    // Verifica se a mensagem é um texto simples.
    if (typeof mensagem === 'string') {
      // Retorna a mensagem enviada pelo backend.
      return mensagem;
    }

    // Verifica se não houve nenhuma resposta do servidor.
    if (!erro.response) {
      // Retorna uma mensagem indicando falha na conexão.
      return 'Não foi possível conectar com o servidor.';
    }
  }

  // Retorna esta mensagem caso o erro não seja do Axios
  // ou não tenha uma mensagem reconhecida.
  return 'Ocorreu um erro inesperado.';
}
export default api;