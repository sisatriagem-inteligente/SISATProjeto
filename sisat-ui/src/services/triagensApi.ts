import api from './api';

/**
 * Centraliza os tipos e as requisições utilizadas
 * pelo frontend no fluxo de triagem.
 *
 * As interfaces representam os formatos enviados
 * e recebidos do BFF, enquanto as funções encapsulam
 * as rotas HTTP utilizadas pelas telas.
 */
/**
 * Valores padronizados pelo backend para representar
 * o estado, a intensidade e a classificação da triagem.
 */

export type StatusTriagem = 'Aguardando' | 'Concluida';
export type IntensidadeTriagem = 'leve' | 'moderada' | 'intensa';
export type CorClassificacao = 'verde' | 'amarelo' | 'vermelho';

/**
 * Dados pessoais coletados pela MarIA durante
 * a conversa de pré-triagem.
 */
export interface DadosPacienteTriagem {
  nome: string;
  idade: number;
  sexo: string;
}

/**
 * Informações clínicas estruturadas pela MarIA
 * a partir das respostas fornecidas pelo paciente.
 */
export interface DadosTriagemMaria {
  queixa_principal: string;
  sintomas: string[];
  tempo_sintomas: string;
  intensidade: IntensidadeTriagem;
  informacoes_complementares: string[];
}

/**
 * Hipótese inicial gerada como apoio à triagem.
 * Não representa um diagnóstico médico definitivo.
 */
export interface HipoteseClinicaInicial {
  hipotese: string;
  justificativa: string;
}

/**
 * Estrutura completa da ficha gerada pela MarIA
 * depois que a coleta da conversa é finalizada.
 */
export interface ResultadoMaria {
  dados_paciente: DadosPacienteTriagem;
  dados_triagem: DadosTriagemMaria;
  resumo_triagem: {
    resumo: string;
  };
  hipoteses_clinicas_iniciais: HipoteseClinicaInicial[];
}

/**
 * Informações registradas pelo profissional durante
 * o atendimento. Os campos são opcionais porque
 * o backend permite atualizações parciais.
 */
export interface InformacoesMedicas {
  altura?: number | null;
  peso?: number | null;
  temperatura?: number | null;
  frequencia_cardiaca?: number | null;
  frequencia_respiratoria?: number | null;
  exame_fisico_direcionado?: string | null;
  observacoes?: string | null;
}

/**
 * Resposta devolvida pelo BFF após o processamento
 * de uma mensagem pela MarIA.
 *
 * `finalizada` indica o encerramento da coleta da IA,
 * e não a conclusão do atendimento médico.
 */
export interface RespostaMensagemMaria {
  mensagem: string;
  finalizada: boolean;
}

/**
 * Representação resumida de uma triagem utilizada
 * na tela de atendimentos anteriores do paciente.
 */
export interface ItemHistoricoTriagem {
  id: string;
  data_hora_entrada: string;
  status: StatusTriagem;
  cor_classificacao: CorClassificacao | null;
  queixa_principal: string | null;
  intensidade: IntensidadeTriagem | null;
  resumo: string | null;
}

/**
 * Formato devolvido pelo BFF ao consultar
 * o histórico de triagens de um paciente.
 */
export interface RespostaHistoricoPaciente {
  paciente: { id: string; nome: string | null };
  total_triagens: number;
  triagens: ItemHistoricoTriagem[];
}

/**
 * Representa os dados detalhados de uma triagem
 * consultada pelo identificador.
 *
 * Inclui dados da MarIA, classificação e informações
 * adicionadas pelo profissional durante o atendimento.
 */
export interface TriagemCompleta {
  id: string;
  paciente_id: string;
  medico_id: string | null;
  status: StatusTriagem;
  data_hora_entrada: string;
  cor_classificacao: CorClassificacao | null;
  dados_paciente: DadosPacienteTriagem | null;
  dados_triagem: DadosTriagemMaria | null;
  resumo: string | null;
  hipoteses_clinicas_iniciais: HipoteseClinicaInicial[];
  informacoes_medicas: InformacoesMedicas;
}

export interface RespostaTriagemCompleta {
  triagem: TriagemCompleta;
}

export interface RespostaCriarTriagem {
  message: string;
  triagem: {
    id: string;
    paciente_id: string;
    status: StatusTriagem;
  };
}

/**
 * Representa uma triagem disponível no painel médico.
 * O backend já devolve a fila organizada por prioridade
 * e, dentro da mesma cor, pelo horário de entrada.
 */
export interface TriagemPainelMedico {
  id: string;
  paciente: {
    id: string | null;
    nome: string | null;
    idade: number | null;
    sexo: string | null;
    cpf: string | null;
    email: string | null;
  };
  queixa_principal: string | null;
  sintomas: string[];
  tempo_sintomas: string | null;
  intensidade: IntensidadeTriagem | null;
  resumo: string | null;
  cor_classificacao: CorClassificacao | null;
  status: StatusTriagem;
  data_hora_entrada: string;
}

export interface RespostaPainelMedico {
  total_triagens: number;
  triagens: TriagemPainelMedico[];
}

/**
 * Cria uma triagem vazia associada ao paciente.
 * Os dados clínicos serão preenchidos posteriormente
 * durante a conversa com a MarIA.
 *
 * POST /triagens
 */
export function criarTriagem(pacienteId: string) {
  return api.post<RespostaCriarTriagem>('/triagens', {
    paciente_id: pacienteId,
  });
}

/**
 * Consulta o histórico resumido das triagens
 * já preenchidas para determinado paciente.
 *
 * GET /triagens/paciente/:paciente_id
 */
export function buscarTriagensDoPaciente(
  pacienteId: string,
) {
  return api.get<RespostaHistoricoPaciente>(`/triagens/paciente/${pacienteId}`);
}

/**
 * Recupera os dados completos de uma triagem,
 * incluindo resultado da MarIA e informações médicas.
 *
 * GET /triagens/:id
 */
export function buscarTriagemPorId(triagemId: string) {
  return api.get<RespostaTriagemCompleta>(`/triagens/${triagemId}`);
}

/**
 * Envia uma nova mensagem do paciente ao BFF.
 *
 * O frontend envia somente a mensagem atual e o ID
 * da triagem. O histórico completo é recuperado
 * pelo backend diretamente no MongoDB.
 *
 * POST /maria/mensagem
 */
export function enviarMensagemMaria(triagemId: string, mensagem: string) {
  return api.post<RespostaMensagemMaria>('/maria/mensagem', {
    triagem_id: triagemId,
    mensagem,
  });
}

/**
 * Consulta as triagens finalizadas pela MarIA
 * que ainda não foram assumidas por um médico.
 *
 * GET /triagens/painel-medico
 */
export function buscarPainelMedico() {
  return api.get<RespostaPainelMedico>(
    '/triagens/painel-medico',
  );
}

/**
 * Envia uma ficha estruturada diretamente para
 * uma triagem existente.
 *
 * O fluxo atual do chat normalmente realiza esse
 * salvamento internamente pelo BFF; esta função
 * representa a rota direta de atualização.
 *
 * PATCH /triagens/:id/resultado-maria
 */
export function salvarResultadoMaria(
  triagemId: string,
  resultado: ResultadoMaria,
) {
  return api.patch(
    `/triagens/${triagemId}/resultado-maria`,
    resultado,
  );
}

/**
 * Associa o médico à triagem e registra
 * o início do atendimento.
 *
 * PATCH /triagens/:id/iniciar-atendimento
 */
export function iniciarAtendimento(
  triagemId: string,
  medicoId: string,
) {
  return api.patch(
    `/triagens/${triagemId}/iniciar-atendimento`,
    { medico_id: medicoId },
  );
}

/**
 * Atualiza parcialmente as informações médicas
 * registradas durante o atendimento.
 *
 * Somente os campos presentes no objeto são enviados.
 *
 * PATCH /triagens/:id/informacoes-medicas
 */
export function salvarInformacoesMedicas(
  triagemId: string,
  informacoes: InformacoesMedicas,
) {
  return api.patch(
    `/triagens/${triagemId}/informacoes-medicas`,
    informacoes,
  );
}

/**
 * Consulta os atendimentos em aberto que já foram
 * assumidos pelo médico informado.
 *
 * GET /triagens/medico/:medico_id
 */
export function buscarAtendimentosDoMedico(
  medicoId: string,
) {
  return api.get(`/triagens/medico/${medicoId}`);
}

/**
 * Finaliza o atendimento médico, altera o status
 * da triagem e registra o horário de conclusão.
 *
 * PATCH /triagens/:id/concluir
 */
export function concluirAtendimento(triagemId: string) {
  return api.patch(`/triagens/${triagemId}/concluir`);
}
