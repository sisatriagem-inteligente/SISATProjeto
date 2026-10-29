import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import logoImg from '/src/assets/img/logoMaisGrossa.png';
import './PalavrasChave.css';


import {
  concluirCadastroPaciente,
  configurarRecuperacaoPaciente,
  marcarRecuperacaoConfigurada,
  obterPerguntasRecuperacao,
  obterMensagemErro,
  type PerguntaRecuperacao,
} from '../../../services/api';

import {
  PERGUNTAS_RECUPERACAO_DEMO as PERGUNTAS_DEMO,
} from '../perguntasRecuperacaoDemo';





type ModoPalavrasChave = 'cadastro' | 'configuracao';

interface PalavraChaveProps {
  modo: ModoPalavrasChave;
}

interface RespostasRecuperacao {
  recoveryWord1: string;
  recoveryWord2: string;
  recoveryWord3: string;
}

type CampoResposta = keyof RespostasRecuperacao;

const camposPorId: Record<PerguntaRecuperacao['id'], CampoResposta> = {
  1: 'recoveryWord1',
  2: 'recoveryWord2',
  3: 'recoveryWord3',
};

const respostasVazias: RespostasRecuperacao = {
  recoveryWord1: '',
  recoveryWord2: '',
  recoveryWord3: '',
};

function normalizarResposta(resposta: string): string {
  return resposta
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}



// O modo de demonstração só funciona durante o desenvolvimento.
const modoDemonstracaoFrontend =
  import.meta.env.DEV &&
  import.meta.env.VITE_SISAT_FRONTEND_DEMO === 'true';

export default function PalavraChave({ modo }: PalavraChaveProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const estado = location.state as { setupToken?: unknown } | null;

  const setupToken =
    typeof estado?.setupToken === 'string'
      ? estado.setupToken
      : '';

// Perguntas recebidas da API real.
const [perguntasApi, setPerguntasApi] =
  useState<PerguntaRecuperacao[]>([]);

// Controla o resultado da consulta sem precisar
// atualizar o estado imediatamente dentro do useEffect.
const [statusPerguntas, setStatusPerguntas] =
  useState<'idle' | 'success' | 'error'>('idle');

// As perguntas demonstrativas são calculadas, não copiadas
// para o estado com setState dentro do useEffect.
const perguntas = modoDemonstracaoFrontend
  ? PERGUNTAS_DEMO
  : perguntasApi;

const carregandoPerguntas =
  !modoDemonstracaoFrontend &&
  !(modo === 'cadastro' && !setupToken) &&
  statusPerguntas === 'idle';




  const [respostas, setRespostas] =
    useState<RespostasRecuperacao>(respostasVazias);

  const [cpf, setCpf] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);


  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
  // Não consulta a API quando estamos na demonstração
  // ou quando falta o token de conclusão do cadastro.
  if (
    modoDemonstracaoFrontend ||
    (modo === 'cadastro' && !setupToken)
  ) {
    return;
  }

  let ativo = true;

  async function carregarPerguntas() {
    try {
      const resposta = await obterPerguntasRecuperacao();

      if (!ativo) {
        return;
      }

      const perguntasOrdenadas = [
        ...resposta.data.questions,
      ].sort((a, b) => a.id - b.id);

      setPerguntasApi(perguntasOrdenadas);
      setStatusPerguntas('success');
    } catch (erro) {
      if (!ativo) {
        return;
      }

      setMensagem(obterMensagemErro(erro));
      setStatusPerguntas('error');
    }
  }

  void carregarPerguntas();

  return () => {
    ativo = false;
  };
}, [modo, setupToken]);

  function handleCpfChange(evento: ChangeEvent<HTMLInputElement>) {
    let valor = evento.target.value.replace(/\D/g, '');

    if (valor.length > 11) {
      valor = valor.slice(0, 11);
    }

    valor = valor.replace(/^(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    valor = valor.replace(
      /^(\d{3})\.(\d{3})\.(\d{3})(\d)/,
      '$1.$2.$3-$4',
    );

    setCpf(valor);
  }

  function handleRespostaChange(
    campo: CampoResposta,
    valor: string,
  ) {
    setRespostas((atuais) => ({
      ...atuais,
      [campo]: valor,
    }));
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem('');

    if (modo === 'cadastro' && !setupToken) {
      setMensagem(
        'Não encontramos a autorização para concluir o cadastro. ' +
        'Use a opção de configuração com CPF e senha atual.',
      );
      return;
    }


    // CONFIGURAÇÃO TARDIA — VALIDAÇÃO LOCAL.
    //
    // Este bloco se aplica somente à rota
    // /configurar-palavras-chave, destinada a contas já existentes.
    // Nela, o paciente precisa informar CPF e senha atual.
    //
    // A conferência real da senha é responsabilidade do backend,
    // por meio de configurarRecuperacaoPaciente().
    // A verificação do comprimento do CPF não substitui a validação
    // definitiva do CPF pelo BFF.


    if (modo === 'configuracao') {
      const cpfSemMascara = cpf.replace(/\D/g, '');

      if (cpfSemMascara.length !== 11) {
        setMensagem('Informe um CPF válido.');
        return;
      }
    }

    // Valida as três respostas antes de continuar.
    const listaRespostas = Object.values(respostas);

    for (const resposta of listaRespostas) {
    const respostaLimpa = resposta.trim();
    const quantidadeCaracteres = Array.from(respostaLimpa).length;
    const quantidadeBytes = new TextEncoder().encode(respostaLimpa).length;

    if (quantidadeCaracteres < 4 || quantidadeCaracteres > 80) {
        setMensagem(
        'Cada resposta deve ter entre 4 e 80 caracteres.',
        );
        return;
    }

    if (quantidadeBytes > 72) {
        setMensagem(
        'Uma das respostas é longa demais. Tente uma resposta mais curta.',
        );
        return;
    }
    }

    const respostasNormalizadas = listaRespostas.map(normalizarResposta);

    if (new Set(respostasNormalizadas).size !== 3) {
    setMensagem(
        'As três respostas precisam ser diferentes.',
    );
    return;
    }

    // Simula a conclusão visual, sem enviar respostas ou token.
    if (modoDemonstracaoFrontend) {
    setMensagem(
        'Demonstração concluída! Nenhuma resposta foi enviada ' +
        'ao backend ou salva. A conclusão real depende da integração.'
    );
    return;
    }

    setCarregando(true);

    try {
    /*
    * INTEGRAÇÃO REAL COM O BFF — PRESERVAR ESTA SEPARAÇÃO.
    *
    * Cadastro:
    * - Usa o setupToken recebido na etapa anterior.
    * - Conclui o cadastro com as três respostas.
    *
    * Configuração tardia:
    * - Usa CPF e senha atual para identificar/autenticar o paciente.
    * - Configura as respostas de uma conta já existente.
    *
    * Não unificar essas duas operações: seus contratos e finalidades
    * são diferentes.
    *
    * Durante a integração, conferir estes DTOs e as respostas reais
    * no BFF. Não substituir as chamadas por sucesso simulado.
    */
    if (modo === 'cadastro') {
      await concluirCadastroPaciente({
        setupToken,
        ...respostas,
      });
    } else {
      await configurarRecuperacaoPaciente({
        cpf: cpf.replace(/\D/g, ''),
        currentPassword: senhaAtual,
        ...respostas,
      });
    }

    // Só chegamos aqui se a operação real tiver sucesso.
    if (
      modo === 'configuracao' &&
      marcarRecuperacaoConfigurada(cpf.replace(/\D/g, ''))
    ) {
      navigate('/inicioPaciente', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
    } catch (erro) {
    setMensagem(obterMensagemErro(erro));
    } finally {
    setCarregando(false);
    }
  }

  /*
 * RECUPERAÇÃO DO FLUXO DE CADASTRO INTERROMPIDO.
 *
 * Se o paciente chegou ao modo 'cadastro' sem o setupToken,
 * não tentar concluir o cadastro nem criar a conta novamente.
 * Oferecer o caminho de configuração tardia, que utiliza CPF,
 * senha atual e a rota configurar-recuperacao.
 *
 * Esse comportamento deve ser preservado na integração.
 */

  const tokenAusente = modo === 'cadastro' && !setupToken;

  const titulo =
    modo === 'cadastro'
      ? 'Proteja sua conta'
      : 'Configure suas palavras-chave';

  const descricao =
    modo === 'cadastro'
      ? 'Responda às três perguntas para concluir seu cadastro.'
      : 'Informe seu CPF e sua senha atual para configurar as respostas de recuperação.';

  return (
    <div className="login-container palavras-chave-container">
      <h1 className="sr-only">
        Configuração de palavras-chave do SISAT
      </h1>

      <div className="login-card palavras-chave-card">
        <div className="login-header">
          <img
            src={logoImg}
            alt="Logo do SISAT"
            className="logo-image"
          />

          <h2>{titulo}</h2>
          <p>{descricao}</p>
        </div>

        {modoDemonstracaoFrontend && (
        <p className="palavras-chave-demo-aviso" role="status">
            Modo de demonstração: as respostas não serão enviadas
            ao servidor nem salvas.
        </p>
        )}

        {tokenAusente ? (
          <div className="palavras-chave-fallback">
            <p className="auth-message" role="alert">
              Não encontramos a autorização para concluir o cadastro.
              Como a conta pode já ter sido criada, não tente cadastrá-la
              novamente.
            </p>

            <button
              type="button"
              className="submit-btn"
              onClick={() => navigate('/configurar-palavras-chave')}
            >
              Configurar com CPF e senha atual
            </button>

            <div className="login-footer">
              <Link to="/login">Voltar ao login</Link>
            </div>
          </div>
        ) : (
          <form
            className="login-form palavras-chave-form"
            onSubmit={handleSubmit}
          >

            {/* CONFIGURAÇÃO TARDIA — CAMPOS EXCLUSIVOS. 
            CPF e senha atual não aparecem durante o cadastro normal.
            Preservar estes campos na integração com o BFF. */}

            {modo === 'configuracao' && (
              <>
                <div className="input-group">
                  <label htmlFor="cpf-palavras">CPF:</label>
                  <input
                    type="text"
                    id="cpf-palavras"
                    placeholder="123.456.789-00"
                    maxLength={14}
                    value={cpf}
                    onChange={handleCpfChange}
                    autoComplete="username"
                    required
                    disabled={carregando}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="senha-atual">
                    Senha atual:
                  </label>
                  <div className="palavras-chave-password-wrapper">
                  <input
                    type="password"
                    id="senha-atual"
                    value={senhaAtual}
                    onChange={(evento) =>
                      setSenhaAtual(evento.target.value)
                    }
                    autoComplete="current-password"
                    required
                    disabled={carregando}
                  />

                  <button
                      type="button"
                      className="palavras-chave-toggle"
                      aria-label={
                        mostrarSenhaAtual
                          ? 'Ocultar senha atual'
                          : 'Mostrar senha atual'
                      }
                      aria-pressed={mostrarSenhaAtual}
                      onClick={() =>
                        setMostrarSenhaAtual((atual) => !atual)
                      }
                      disabled={carregando}
                    >
                      <i
                        className={`bi ${
                          mostrarSenhaAtual ? 'bi-eye' : 'bi-eye-slash'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                </div>
                </div>
              </>
            )}

            <p className="palavras-chave-instrucoes">
              Escolha três respostas diferentes, que você consiga
              lembrar e que não sejam óbvias para outras pessoas.
            </p>

            {carregandoPerguntas && (
              <p role="status">Carregando perguntas...</p>
            )}


            {perguntas.map((pergunta) => {
              const campo = camposPorId[pergunta.id];

              return (
                <div className="input-group" key={pergunta.id}>
                  <label htmlFor={campo}>
                    {pergunta.text}
                  </label>

                  <input
                    type="text"
                    id={campo}
                    name={campo}
                    value={respostas[campo]}
                    onChange={(evento) =>
                      handleRespostaChange(campo, evento.target.value)
                    }
                    minLength={4}
                    maxLength={80}
                    autoComplete="off"
                    required
                    disabled={carregando || carregandoPerguntas}
                  />
                </div>
              );
            })}

            {mensagem && (
              <p className="auth-message" role="alert">
                {mensagem}
              </p>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={
                carregando ||
                carregandoPerguntas ||
                perguntas.length !== 3
              }
            >
              {carregando
                ? 'Salvando...'
                : modo === 'cadastro'
                  ? 'Concluir cadastro'
                  : 'Configurar palavras-chave'}
            </button>

            <div className="palavras-chave-alternativa">
              {modo === 'cadastro' ? (
                <Link to="/configurar-palavras-chave">
                  Problemas para concluir? Configure com CPF e senha atual.
                </Link>
              ) : (
                <Link to="/login">Voltar ao login</Link>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
