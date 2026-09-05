import { useState, type FormEvent } from 'react';
import '/src/pages/Autenticacao/Auth.css';
//importando a imagem da logo do sisat
import logoImg from '/src/assets/img/logoMaisGrossa.png'

import { Link, useNavigate } from 'react-router-dom';
import { cadastrarPaciente, obterMensagemErro } from '../../services/api';


export default function Cadastro(){
  const navigate = useNavigate();
  // fazendo o ponto e o tracinho do cpf↓
  const [cpf,setCpf] = useState('');   //criando um estado para o valor do CPF
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  //essas duas linhas seguintes vão ser responsáveis pelo olhinho de mostrar senha
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const handleCpfChange =(e: React.ChangeEvent<HTMLInputElement>) => {      //função que vai aplicar a máscara
    let value = e.target.value;

    value = value.replace(/\D/g,'');                                         //remove tudo que não for número

    if(value.length > 11) value = value.slice(0,11);                         //aplica os pontos e o tracinho conforme o usuário vai digitando
        
    value = value.replace(/^(\d{3})(\d)/, '$1.$2')                           //adiciona o primeiro ponto
    
    value = value.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');              //adiciona o segundo ponto
    
    value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');  //adiciona o tracinho
    
    //atualiza o estado com o valor formatado
    setCpf(value);

  }

  async function handleCadastro(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem('');

    if (password !== confirmarSenha) {
      setMensagem('As senhas não são iguais.');
      return;
    }

    setCarregando(true);
    try {
      await cadastrarPaciente({
        cpf: cpf.replace(/\D/g, ''),
        email,
        password,
      });
      navigate('/login');
    } catch (erro) {
      setMensagem(obterMensagemErro(erro));
    } finally {
      setCarregando(false);
    }
  }

  
  return (  
    <div className="login-container">   {/* isso é como se faz um comentario dentro do return (JSX)*/ }
    <h1 className='sr-only'>Cadastro de paciente SISAT</h1>
       <div className='login-card'>     {/*className é a mesma coisa que o atributo class no html */}
        {/* Cabeçalho */}
        <div className='login-header'>
          { /* colocando a logo */}
          <img src={logoImg} alt='Logo do SISAT' className='logo-image'/>
          <h2> Bem vindo ao SISAT </h2>
          <p> Cadastre-se para continuar </p>
        </div>

       {/* Formulário */}
       <form className='login-form' onSubmit={handleCadastro}>

        <div className='input-group'>
          <label htmlFor='cpf'>CPF:</label> 
          <input 
            type='text' 
            id='cpf' 
            placeholder='123.456.789-00'
            maxLength={14}                  //limitando o número de caracteres (11 números + 3 símbolos)
            value={cpf}                     // o valor do input agora vem do nosso "estado"
            onChange={handleCpfChange}      //chama a função sempre que o usuário digita
           />  
        </div>

        <div className='input-group'>
          <label htmlFor='email'>E-mail:</label>
          <input type='email' id='email' placeholder='nome.sobrenome@dominio.com' value={email} onChange={(evento) => setEmail(evento.target.value)}/>
        </div>

       {/* senha e confirmação de senha */}
        <div className='input-group'>
          <label htmlFor='senha'>Senha:</label>

          <div className='password-wrapper'>
            <input 
              type={ mostrarSenha ? 'text' : 'password'}
              id='senha' 
              placeholder='••••••••••••' 
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
            />
            <i
              className={`bi ${mostrarSenha ? 'bi-eye' : 'bi-eye-slash'}`}
              onClick={() => setMostrarSenha(!mostrarSenha)}
              ></i>
            </div>
        </div>

          <div className='input-group'>
          <label htmlFor='senhaConfirm'>Confirme sua senha:</label>
          <div className='password-wrapper'>
            <input 
              type={ mostrarConfirmarSenha ? 'text' : 'password'}
              id='senhaConfirm' 
              placeholder='••••••••••••' 
              value={confirmarSenha}
              onChange={(evento) => setConfirmarSenha(evento.target.value)}
            />
            <i
              className={`bi ${mostrarConfirmarSenha ? 'bi-eye' : 'bi-eye-slash'}`}
              onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
            ></i>
          </div>  
        </div>

        <button type='submit' className='submit-btn' disabled={carregando}>
          {carregando ? 'Cadastrando...' : 'Criar conta'}
        </button>
       </form>

       {mensagem && <p className='auth-message'>{mensagem}</p>}

       {/* Links de Rodapé */}
       <div className='login-footer'>
        <span>Já tem uma conta? <Link to='/login'>Entrar</Link></span>
       </div>

      </div> 
    </div>
  )
}
