import { useState, type FormEvent } from 'react';
import '/src/pages/Autenticacao/Auth.css';

import logoImg from '/src/assets/img/logoMaisGrossa.png';

import { Link, useNavigate } from 'react-router-dom';
import {
  cadastrarPaciente,
  obterMensagemErro,
} from '../../services/api';

export default function Cadastro() {
  const navigate = useNavigate();


  // TEMPORÁRIO — Modo de demonstração do frontend.
  // Só funciona em desenvolvimento e quando a variável
  // VITE_SISAT_FRONTEND_DEMO estiver definida como "true".
  const modoDemonstracaoFrontend =
    import.meta.env.DEV &&
    import.meta.env.VITE_SISAT_FRONTEND_DEMO === 'true';

  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] =
    useState(false);

  const handleCpfChange = (
    evento: React.ChangeEvent<HTMLInputElement>,
  ) => {
    let valor = evento.target.value;

    valor = valor.replace(/\D/g, '');

    if (valor.length > 11) {
      valor = valor.slice(0, 11);
    }

    valor = valor.replace(/^(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(
      /^(\d{3})\.(\d{3})(\d)/,
      '$1.$2.$3',
    );
    valor = valor.replace(
      /^(\d{3})\.(\d{3})\.(\d{3})(\d)/,
      '$1.$2.$3-$4',
    );

    setCpf(valor);
  };

  async function handleCadastro(
    evento: FormEvent<HTMLFormElement>,
  ) {
  evento.preventDefault();
  setMensagem('');

  if (carregando) {
    return;
  }

  // Validação local do tamanho do CPF.
  const cpfSemMascara = cpf.replace(/\D/g, '');

  if (cpfSemMascara.length !== 11) {
    setMensagem('Informe um CPF com 11 números.');
    return;
  }

  // TODO (INTEGRAÇÃO CODEX):
  // Conferir as regras de validação do CPF no DTO/serviço do BFF.
  // Se houver validação dos dígitos verificadores, alinhar a
  // validação do frontend à regra existente no backend.
  // Esta verificação de comprimento, sozinha, não valida o CPF.

  if (password !== confirmarSenha) {
    setMensagem('As senhas não são iguais.');
    return;
  }

  // TODO (INTEGRAÇÃO CODEX) — POLÍTICA DE SENHA DO CADASTRO:
  //
  // Conferir no CadastroDto e no AuthService quais regras de senha
  // são realmente aplicadas ao cadastro inicial.
  // Depois, implementar aqui as mesmas restrições no frontend,
  // mantendo o backend como responsável pela validação definitiva.
  //
  // Verificar comprimento mínimo e máximo, complexidade e limite
  // em bytes, caso existam essas restrições no contrato real.
  // NÃO presumir que as regras de redefinição de senha se aplicam
  // automaticamente ao cadastro.



  // TEMPORÁRIO — REMOVER NA INTEGRAÇÃO COM O BFF.
  //
  // Durante o desenvolvimento, esta ramificação evita a criação
  // de contas reais e encaminha para a tela de palavras-chave
  // usando um token fictício.
  //
  // Na integração, o Codex deve remover esta simulação e manter
  // o fluxo real: cadastrarPaciente() -> ler setup_token ->
  // navegar para /palavras-chave com o token retornado pelo BFF.
  //
  // Nunca enviar TOKEN_DEMO_NAO_REAL para endpoints reais.
  if (modoDemonstracaoFrontend) {
    navigate('/palavras-chave', {
      state: {
        setupToken: 'TOKEN_DEMO_NAO_REAL',
        modoDemonstracao: true,
      },
    });

    return;
  }
    setCarregando(true);

    try {
      const resposta = await cadastrarPaciente({
        cpf: cpf.replace(/\D/g, ''),
        email,
        password,
      });

      const setupToken = resposta.data.setup_token;

      // O cadastro pode ter sido criado mesmo que o token
      // não tenha vindo na resposta. Não repetir a requisição.
      if (!setupToken) {
        setMensagem(
          'O cadastro foi enviado, mas o servidor não retornou ' +
            'a autorização para configurar as palavras-chave. ' +
            'Não tente criar a conta novamente. Verifique a conexão com o servidor.',
        );

        return;
      }

      navigate('/palavras-chave', {
        state: { setupToken },
      });
    } catch (erro) {
      setMensagem(obterMensagemErro(erro));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-container cadastro-container">
      <h1 className="sr-only">Cadastro de paciente SISAT</h1>

      <div className="login-card">
        <div className="login-header">
          <img
            src={logoImg}
            alt="Logo do SISAT"
            className="logo-image"
          />

          <h2>Bem vindo ao SISAT</h2>

          <p>
            {modoDemonstracaoFrontend
              ? 'Modo de demonstração: nenhuma conta real será criada.'
              : 'Cadastre-se para continuar'}
          </p>
        </div>

        <form className="login-form" onSubmit={handleCadastro}>
          <div className="input-group">
            <label htmlFor="cpf">CPF:</label>

            <input
              type="text"
              id="cpf"
              placeholder="123.456.789-00"
              maxLength={14}
              value={cpf}
              onChange={handleCpfChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">E-mail:</label>

            <input
              type="email"
              id="email"
              placeholder="nome.sobrenome@dominio.com"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="senha">Senha:</label>

            <div className="password-wrapper">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                id="senha"
                placeholder="••••••••••••"
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
                required
              />

              <button
                  type="button"
                  className="password-toggle"
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={mostrarSenha}
                  onClick={() => setMostrarSenha((atual) => !atual)}
                >
                  <i
                    className={`bi ${
                      mostrarSenha ? 'bi-eye' : 'bi-eye-slash'
                    }`}
                    aria-hidden="true"
                  />
                </button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="senhaConfirm">
              Confirme sua senha:
            </label>

            <div className="password-wrapper">
              <input
                type={mostrarConfirmarSenha ? 'text' : 'password'}
                id="senhaConfirm"
                placeholder="••••••••••••"
                value={confirmarSenha}
                onChange={(evento) =>
                  setConfirmarSenha(evento.target.value)
                }
                required
              />

              <button
                type="button"
                className="password-toggle"
                aria-label={
                  mostrarConfirmarSenha
                    ? 'Ocultar confirmação da senha'
                    : 'Mostrar confirmação da senha'
                }
                aria-pressed={mostrarConfirmarSenha}
                onClick={() => setMostrarConfirmarSenha((atual) => !atual)}
              >
                <i
                  className={`bi ${
                    mostrarConfirmarSenha ? 'bi-eye' : 'bi-eye-slash'
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={carregando}
          >
            {carregando ? 'Cadastrando...' : 'Criar conta'}
          </button>
        </form>

        {mensagem && (
          <p className="auth-message" role="alert">
            {mensagem}
          </p>
        )}

        <div className="login-footer">
          <span>
            Já tem uma conta? <Link to="/login">Entrar</Link>
          </span>
        </div>
      </div>
    </div>
  );
}