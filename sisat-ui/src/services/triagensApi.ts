import api from './api';

export type StatusTriagem = 'Aguardando' | 'Concluida';
export type IntensidadeTriagem = 'leve' | 'moderada' | 'intensa';
export type CorClassificacao = 'verde' | 'amarelo' | 'vermelho';

export interface DadosPacienteTriagem {
  nome: string;
  idade: number;
  sexo: string;
}

export interface DadosTriagemMaria {
  queixa_principal: string;
  sintomas: string[];
  tempo_sintomas: string;
  intensidade: IntensidadeTriagem;
  informacoes_complementares: string[];
}

export interface HipoteseClinicaInicial {
  hipotese: string;
  justificativa: string;
}

export interface ResultadoMaria {
  historico_chat_id?: string | null;
  dados_paciente: DadosPacienteTriagem;
  dados_triagem: DadosTriagemMaria;
  resumo_triagem: {
    resumo: string;
  };
  hipoteses_clinicas_iniciais: HipoteseClinicaInicial[];
}

export interface InformacoesMedicas {
  altura?: number | null;
  peso?: number | null;
  temperatura?: number | null;
  frequencia_cardiaca?: number | null;
  frequencia_respiratoria?: number | null;
  exame_fisico_direcionado?: string | null;
  observacoes?: string | null;
}

export interface RespostaMensagemMaria {
  mensagem: string;
  finalizada: boolean;
}

export interface ItemHistoricoTriagem {
  id: string;
  data_hora_entrada: string;
  status: StatusTriagem;
  cor_classificacao: CorClassificacao | null;
  queixa_principal: string | null;
  intensidade: IntensidadeTriagem | null;
  resumo: string | null;
}

export interface RespostaHistoricoPaciente {
  paciente: { id: string; nome: string | null };
  total_triagens: number;
  triagens: ItemHistoricoTriagem[];
}

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

export function criarTriagem(pacienteId: string) {
  return api.post<RespostaCriarTriagem>('/triagens', {
    paciente_id: pacienteId,
  });
}

export function buscarTriagensDoPaciente(
  pacienteId: string,
) {
  return api.get<RespostaHistoricoPaciente>(
    `/triagens/paciente/${pacienteId}`,
  );
}

export function buscarTriagemPorId(triagemId: string) {
  return api.get<RespostaTriagemCompleta>(
    `/triagens/${triagemId}`,
  );
}

export function enviarMensagemMaria(
  triagemId: string,
  mensagem: string,
) {
  return api.post<RespostaMensagemMaria>('/maria/mensagem', {
    triagem_id: triagemId,
    mensagem,
  });
}

export function buscarPainelMedico() {
  return api.get<RespostaPainelMedico>(
    '/triagens/painel-medico',
  );
}

export function salvarResultadoMaria(
  triagemId: string,
  resultado: ResultadoMaria,
) {
  return api.patch(
    `/triagens/${triagemId}/resultado-maria`,
    resultado,
  );
}

export function iniciarAtendimento(
  triagemId: string,
  medicoId: string,
) {
  return api.patch(
    `/triagens/${triagemId}/iniciar-atendimento`,
    { medico_id: medicoId },
  );
}

export function salvarInformacoesMedicas(
  triagemId: string,
  informacoes: InformacoesMedicas,
) {
  return api.patch(
    `/triagens/${triagemId}/informacoes-medicas`,
    informacoes,
  );
}

export function buscarAtendimentosDoMedico(
  medicoId: string,
) {
  return api.get(`/triagens/medico/${medicoId}`);
}

export function concluirAtendimento(triagemId: string) {
  return api.patch(`/triagens/${triagemId}/concluir`);
}
