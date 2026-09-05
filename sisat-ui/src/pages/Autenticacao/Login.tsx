import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '/src/pages/Autenticacao/Auth.css';
//importando a imagem da logo do sisat ↓
import logoImg from '/src/assets/img/logoMaisGrossa.png'
import { loginPaciente, obterMensagemErro } from '../../services/api';



export default function Login(){
    const navigate = useNavigate();
    const [cpf,setCpf] = useState('');
    const [password, setPassword] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [carregando, setCarregando] = useState(false);
    
    const [mostrarSenha, setMostrarSenha] = useState(false);

    const handleCpfChange = (e:React.ChangeEvent<HTMLInputElement>) =>{
    let value = e.target.value;

    value = value.replace(/\D/g,'');                                           //remove tudo que não for número

    if(value.length > 11) value = value.slice(0,11);                           //aplica os pontos e o tracinho conforme o usuário vai digitando
        
    value = value.replace(/^(\d{3})(\d)/, '$1.$2')                             //adiciona o primeiro ponto
    
    value = value.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');                //adiciona o segundo ponto
    
    value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');    //adiciona o tracinho
    
    //atualiza o estado com o valor formatado
    setCpf(value);

    }

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setMensagem('');
      setCarregando(true);

      try {
        await loginPaciente({
          cpf: cpf.replace(/\D/g, ''),
          password,
        });
        navigate('/inicioPaciente');
      } catch (erro) {
        setMensagem(obterMensagemErro(erro));
      } finally {
        setCarregando(false);
      }
    }
  return (
    <div className="login-container">  {/* isso é como se faz um comentario dentro do return (JSX)*/}
    <h1 className='sr-only'>Entrar no SISAT</h1>
      <div className='login-card'>
        {/* Cabeçalho */}
        <div className='login-header'>
         { /* Colocando a logo */}
          <img src={logoImg} alt='Logo do SISAT' className='logo-image'/>
          <h2> Bem vindo ao SISAT </h2>
          <p> Entre para continuar </p>
        </div>

       {/* Formulário */}
       <form className='login-form' onSubmit={handleLogin}>

        <div className='input-group'>
          <label htmlFor='cpf'>CPF:</label>  
          <input 
            type='text' 
            id='cpf' 
            placeholder='123.456.789-00'
            maxLength={14}
            value={cpf}
            onChange={handleCpfChange}
            />
        </div>

        <div className='input-group'>
          <label htmlFor='senha'>Senha:</label>
          {/* div para segurar o ícone do olhinho dentro da parte do input */}
          <div className='password-wrapper'>
            <input 
              //se mostrarSenha for true, vira texto normal. se for false, vira as bolinhas (password)
              type={mostrarSenha ? 'text' : 'password'} 
              id='senha' 
              placeholder='••••••••••••' 
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
            />
            
            {/* ícone do olhinho (também muda dependedndo do estado) */}
            <i 
              className={`bi ${mostrarSenha ? 'bi-eye' : 'bi-eye-slash'}`} //bi bi eye = olhinho aberto / bi bi-eye-slash = olhinho fechado
              onClick={() => setMostrarSenha(!mostrarSenha)}               //inverte o estado quando clicar (se estiver true fica false, se estiver false fica true)
              ></i>
          </div>
        </div>

        <button type='submit' className='submit-btn' disabled={carregando}>
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
       </form>

       {mensagem && <p className='auth-message'>{mensagem}</p>}

       {/* Links de Rodapé */}
       <div className='login-footer'>
        <span>Não tem uma conta? <Link to='/cadastro'>Cadastre-se</Link></span>
       </div>


      </div> 
    </div>
  )
}
