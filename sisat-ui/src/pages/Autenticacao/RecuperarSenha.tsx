import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import '/src/pages/Autenticacao/Auth.css';
import logoImg from '/src/assets/img/logoMaisGrossa.png';
import './RecuperarSenha.css';


// TEMPORÁRIO — REMOVER NA INTEGRAÇÃO COM O BFF.
//
// As perguntas vêm de uma constante local compartilhada para que
// cadastro e recuperação exibam exatamente os mesmos textos durante
// o desenvolvimento do frontend.
//
// Na integração:
// 1. Consultar GET /auth/paciente/perguntas-recuperacao.
// 2. Utilizar os textos retornados pelo backend.
// 3. Preservar a ordem dos IDs e a correspondência com as respostas.
// 4. Remover a dependência de PERGUNTAS_RECUPERACAO_DEMO.
import { PERGUNTAS_RECUPERACAO_DEMO } from './perguntasRecuperacaoDemo';



const modoDemonstracaoFrontend =
  import.meta.env.DEV &&
  import.meta.env.VITE_SISAT_FRONTEND_DEMO === 'true';

type TipoMensagem = 'erro' | 'info' | 'sucesso';

export default function RecuperarSenha() {
  const [cpf, setCpf] = useState('');
  const [resposta, setResposta] = useState('');

  const [palavraConferida, setPalavraConferida] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState<TipoMensagem>('info');

  function mostrarMensagem(texto: string, tipo: TipoMensagem) {
    setMensagem(texto);
    setTipoMensagem(tipo);
  }

  function bloquearRedefinicao() {
    setPalavraConferida(false);
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

  function handleConferirPalavra() {
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



    // INTEGRAÇÃO COM O BFF — SUBSTITUIR ESTE BLOCO INFORMATIVO.
//
// Implementar a chamada real que valida uma única resposta de
// recuperação. O endpoint deverá ser conferido no código atualizado
// do BFF pelo Codex, incluindo DTO, nomes dos campos e resposta.
//
// Após a validação:
// - Se a resposta for incorreta, apresentar a mensagem apropriada.
// - Se for correta, guardar o token temporário de redefinição em
//   estado React e liberar os campos de nova senha.
// - Não salvar esse token no localStorage.
// - Não considerar palavraConferida, isoladamente, como autorização
//   para alterar a senha: o BFF deverá validar o token na redefinição.
//
// A simulação abaixo só pode ser utilizada no modo de demonstração.

    if (!modoDemonstracaoFrontend) {
      mostrarMensagem(
        'A validação real da palavra-chave ainda depende da integração com o backend. Nenhuma resposta foi verificada.',
        'info',
      );
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

  function handleRedefinirSenha(evento: FormEvent<HTMLFormElement>) {
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


// INTEGRAÇÃO COM O BFF — SUBSTITUIR ESTE BLOCO INFORMATIVO.
//
// Implementar a chamada real de redefinição de senha utilizando
// o token temporário obtido na validação da resposta.
//
// O Codex deverá conferir no BFF atualizado:
// - A rota e o método HTTP definitivos.
// - O DTO e o nome exato do campo da nova senha.
// - O formato das respostas de sucesso e erro.
// - A validade e as regras de uso único do token.
//
// Enviar a nova senha somente depois de validar localmente a
// confirmação e os limites de tamanho conhecidos.
// O BFF continua responsável por validar o token e salvar a senha.
//
// Após sucesso real, apresentar a confirmação e encaminhar ao login.
// Não utilizar a mensagem de sucesso da demonstração como resultado real.
    
    if (!modoDemonstracaoFrontend) {
      mostrarMensagem(
        'A redefinição real ainda não está conectada. Nenhuma senha foi alterada.',
        'info',
      );
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
            : 'As etapas de validação e redefinição ainda dependem da integração com o backend.'}
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
              autoComplete="username"
              required
            />
          </div>

          <div className="recuperar-senha-perguntas">
            <p className="recuperar-senha-subtitulo">
              Você só precisa responder a uma destas perguntas:
            </p>

            <ol>
              {PERGUNTAS_RECUPERACAO_DEMO.map((pergunta) => (
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
              placeholder="Digite uma das palavras cadastradas"
            // Limite visual alinhado ao contrato conhecido do BFF.
            // A validação definitiva continua sendo responsabilidade do servidor.
            // Durante a integração, confirmar a correspondência dos limites
            // de caracteres e bytes com o DTO de validação da recuperação.
              maxLength={80}
              autoComplete="off"
              required
            />
          </div>

          <button
            type="button"
            className="submit-btn"
            onClick={handleConferirPalavra}
          >
            Conferir palavra-chave
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
              disabled={!palavraConferida}
            >
              Redefinir senha
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