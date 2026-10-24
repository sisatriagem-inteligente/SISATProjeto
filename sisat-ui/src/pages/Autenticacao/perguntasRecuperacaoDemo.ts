import type { PerguntaRecuperacao } from '../../services/api';

// TEMPORÁRIO — REMOVER NA INTEGRAÇÃO COM O BACKEND.
// Usado para desenvolver as telas sem depender da rota GET
// /auth/paciente/perguntas-recuperacao.
export const PERGUNTAS_RECUPERACAO_DEMO: PerguntaRecuperacao[] = [
  {
    id: 1,
    text: 'Qual era o nome de um brinquedo especial da sua infância?',
  },
  {
    id: 2,
    text: 'Qual foi o destino de uma excursão escolar de que você se lembra?',
  },
  {
    id: 3,
    text: 'Qual profissão você imaginava ter quando era criança?',
  },
];