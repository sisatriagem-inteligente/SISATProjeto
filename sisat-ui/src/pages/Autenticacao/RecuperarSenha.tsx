import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import '/src/pages/Autenticacao/Auth.css';
import logoImg from '/src/assets/img/logoMaisGrossa.png';
import './RecuperarSenha.css';


// As perguntas locais são usadas somente no modo de demonstração.
import { PERGUNTAS_RECUPERACAO_DEMO } from './perguntasRecuperacaoDemo';
import {
  obterMensagemErro,
  obterPerguntasRecuperacao,
  redefinirSenhaPaciente,
  validarRespostaRecuperacao,
  type PerguntaRecuperacao,
} from '../../services/api';



const modoDemonstracaoFrontend =
  import.meta.env.DEV &&
  import.meta.env.VITE_SISAT_FRONTEND_DEMO === 'true';

type TipoMensagem = 'erro' | 'info' | 'sucesso';

export default function RecuperarSenha() {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState('');
  const [resposta, setResposta] = useState('');
  const [perguntasApi, setPerguntasApi] = useState<PerguntaRecuperacao[]>([]);
  const [carregandoPerguntas, setCarregandoPerguntas] = useState(!modoDemonstracaoFrontend);
  const [validando, setValidando] = useState(false);
  const [redefinindo, setRedefinindo] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [resetExpiraEm, setResetExpiraEm] = useState(0);

  const [palavraConferida, setPalavraConferida] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState<TipoMensagem>('info');

  const perguntas = modoDemonstracaoFrontend ? PERGUNTAS_RECUPERACAO_DEMO : perguntasApi;

  useEffect(() => {
    if (modoDemonstracaoFrontend) return;
    let ativo = true;
    obterPerguntasRecuperacao()
      .then((resultado) => {
        if (ativo) setPerguntasApi([...resultado.data.questions].sort((a, b) => a.id - b.id));
      })
      .catch((erro) => {
        if (ativo) {
          setMensagem(obterMensagemErro(erro));
          setTipoMensagem('erro');
        }
      })
      .finally(() => {
        if (ativo) setCarregandoPerguntas(false);
      });
    return () => { ativo = false; };
  }, []);

  function mostrarMensagem(texto: string, tipo: TipoMensagem) {
    setMensagem(texto);
    setTipoMensagem(tipo);
  }

  function bloquearRedefinicao() {
    setPalavraConferida(false);
    setResetToken('');
    setResetExpiraEm(0);
    setNovaSenha('');
    setConfirmarNovaSenha('');
  }

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
    bloquearRedefinicao();
    setMensagem('');
  }

  function handleRespostaChange(evento: ChangeEvent<HTMLInputElement>) {
    setResposta(evento.target.value);
    bloquearRedefinicao();
    setMensagem('');
  }

  async function handleConferirPalavra() {
    if (validando || redefinindo) return;
    setMensagem('');

    if (cpf.replace(/\D/g, '').length !== 11) {
      mostrarMensagem('Informe um CPF com 11 números.', 'erro');
      return;
    }

    if (resposta.trim().length < 4) {
      mostrarMensagem(
        'Digite uma resposta com pelo menos 4 caracteres.',
        'erro',
      );
      return;
    }



    if (!modoDemonstracaoFrontend) {
      setValidando(true);
      try {
        const resultado = await validarRespostaRecuperacao({
          cpf: cpf.replace(/\D/g, ''),
          answer: resposta,
        });
        setResetToken(resultado.data.reset_token);
        setResetExpiraEm(Date.now() + resultado.data.expires_in_seconds * 1000);
        setPalavraConferida(true);
        mostrarMensagem('Resposta confirmada. Defina uma nova senha.', 'sucesso');
      } catch (erro) {
        bloquearRedefinicao();
        mostrarMensagem(obterMensagemErro(erro), 'erro');
      } finally {
        setValidando(false);
      }
      return;
    }

    // TEMPORÁRIO — SIMULAÇÃO VISUAL.
    // Não compara a resposta com as palavras cadastradas e não chama a API.
    setPalavraConferida(true);

    mostrarMensagem(
      'Demonstração: a resposta foi aceita apenas para testar a interface. Nenhuma verificação real foi realizada.',
      'info',
    );
  }

  async function handleRedefinirSenha(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem('');

    if (!palavraConferida) {
      mostrarMensagem(
        'Primeiro, confira a palavra-chave.',
        'erro',
      );
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      mostrarMensagem('As senhas não são iguais.', 'erro');
      return;
    }

    const quantidadeCaracteres = Array.from(novaSenha).length;
    const quantidadeBytes = new TextEncoder().encode(novaSenha).length;

    if (quantidadeCaracteres < 15) {
      mostrarMensagem(
        'A nova senha precisa ter pelo menos 15 caracteres.',
        'erro',
      );
      return;
    }

    if (quantidadeBytes > 72) {
      mostrarMensagem(
        'A nova senha ultrapassa o limite de 72 bytes em UTF-8.',
        'erro',
      );
      return;
    }


    if (!modoDemonstracaoFrontend) {
      if (!resetToken || Date.now() >= resetExpiraEm) {
        bloquearRedefinicao();
        mostrarMensagem('A autorização expirou. Confira a resposta novamente.', 'erro');
        return;
      }
      setRedefinindo(true);
      try {
        await redefinirSenhaPaciente({ resetToken, newPassword: novaSenha });
        bloquearRedefinicao();
        mostrarMensagem('Senha redefinida com sucesso. Faça login novamente.', 'sucesso');
        setTimeout(() => navigate('/login', { replace: true }), 1500);
      } catch (erro) {
        bloquearRedefinicao();
        mostrarMensagem(obterMensagemErro(erro), 'erro');
      } finally {
        setRedefinindo(false);
      }
      return;
    }

    // TEMPORÁRIO — SIMULAÇÃO VISUAL.
    // Nenhuma senha é enviada ou alterada.
    mostrarMensagem(
      'Demonstração concluída! A senha não foi alterada nem enviada ao backend.',
      'sucesso',
    );
  }

  return (
    <div className="login-container recuperar-senha-container">
      <h1 className="sr-only">Recuperar senha do SISAT</h1>

      <div className="login-card recuperar-senha-card">
        <div className="login-header">
          <img
            src={logoImg}
            alt="Logo do SISAT"
            className="logo-image"
          />

          <h2>Recuperar senha</h2>

          <p>
            Responda corretamente a uma das três perguntas abaixo para
            prosseguir com a redefinição da sua senha.
          </p>
        </div>

        <div className="recuperar-senha-aviso" role="status">
          {modoDemonstracaoFrontend
            ? 'Modo de demonstração: a validação e a redefinição são simuladas. Nenhum dado será enviado ou salvo.'
            : 'A resposta será conferida pelo servidor antes de liberar a nova senha.'}
        </div>

        <form
          className="login-form recuperar-senha-form"
          onSubmit={handleRedefinirSenha}
        >
          <div className="input-group">
            <label htmlFor="cpf-recuperacao">CPF:</label>

            <input
              type="text"
              id="cpf-recuperacao"
              placeholder="123.456.789-00"
              maxLength={14}
              value={cpf}
              onChange={handleCpfChange}
              disabled={validando || redefinindo}
              autoComplete="username"
              required
            />
          </div>

          <div className="recuperar-senha-perguntas">
            <p className="recuperar-senha-subtitulo">
              Você só precisa responder a uma destas perguntas:
            </p>

            <ol>
              {perguntas.map((pergunta) => (
                <li key={pergunta.id}>{pergunta.text}</li>
              ))}
            </ol>
          </div>

          <div className="input-group">
            <label htmlFor="resposta-recuperacao">
              Sua resposta:
            </label>

            <input
              type="text"
              id="resposta-recuperacao"
              value={resposta}
              onChange={handleRespostaChange}
              disabled={validando || redefinindo}
              placeholder="Digite uma das palavras cadastradas"
            // A validação definitiva é realizada pelo BFF.
              maxLength={80}
              autoComplete="off"
              required
            />
          </div>

          <button
            type="button"
            className="submit-btn"
            onClick={handleConferirPalavra}
            disabled={carregandoPerguntas || perguntas.length !== 3 || validando || redefinindo}
          >
            {validando ? 'Conferindo...' : 'Conferir palavra-chave'}
          </button>

          <div
            className={`recuperar-senha-campos ${
              palavraConferida ? 'is-unlocked' : 'is-locked'
            }`}
            aria-disabled={!palavraConferida}
          >
            {!palavraConferida && (
              <p className="recuperar-senha-bloqueio">
                <i className="bi bi-lock-fill" aria-hidden="true" />
                {' '}
                Confira a palavra-chave para liberar estes campos.
              </p>
            )}

            <div className="input-group">
              <label htmlFor="nova-senha">Nova senha:</label>

              <div className="password-wrapper">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  id="nova-senha"
                  value={novaSenha}
                  onChange={(evento) => setNovaSenha(evento.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={!palavraConferida}
                />

                <button
                  type="button"
                  className="recuperar-senha-toggle"
                  aria-label={mostrarSenha ? 'Ocultar nova senha' : 'Mostrar nova senha'}
                  onClick={() => setMostrarSenha((atual) => !atual)}
                  disabled={!palavraConferida}
                >
                  <i
                    className={`bi ${mostrarSenha ? 'bi-eye' : 'bi-eye-slash'}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirmar-nova-senha">
                Confirme a nova senha:
              </label>

              <div className="password-wrapper">
                <input
                  type={mostrarConfirmacao ? 'text' : 'password'}
                  id="confirmar-nova-senha"
                  value={confirmarNovaSenha}
                  onChange={(evento) =>
                    setConfirmarNovaSenha(evento.target.value)
                  }
                  autoComplete="new-password"
                  required
                  disabled={!palavraConferida}
                />

                <button
                  type="button"
                  className="recuperar-senha-toggle"
                  aria-label={
                    mostrarConfirmacao
                      ? 'Ocultar confirmação da senha'
                      : 'Mostrar confirmação da senha'
                  }
                  onClick={() => setMostrarConfirmacao((atual) => !atual)}
                  disabled={!palavraConferida}
                >
                  <i
                    className={`bi ${mostrarConfirmacao ? 'bi-eye' : 'bi-eye-slash'}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={!palavraConferida || redefinindo}
            >
              {redefinindo ? 'Redefinindo...' : 'Redefinir senha'}
            </button>
          </div>

          {mensagem && (
            <p
              className={`recuperar-senha-mensagem ${tipoMensagem}`}
              role={tipoMensagem === 'erro' ? 'alert' : 'status'}
            >
              {mensagem}
            </p>
          )}

          <div className="recuperar-senha-voltar">
            <Link to="/login">Voltar ao login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
