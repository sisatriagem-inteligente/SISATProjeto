import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '/src/pages/Autenticacao/Auth.css';
//importando a imagem da logo do sisat ↓
import logoImg from '/src/assets/img/logoMaisGrossa.png'
import { loginMedico, obterMensagemErro } from '../../services/api';


export default function LoginMedico(){
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [mostrarSenha, setMostrarSenha] = useState(false);

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      setMensagem('');
      setCarregando(true);

      try {
        await loginMedico({ email, password });
        navigate('/inicioMedico');
      } catch (erro) {
        setMensagem(obterMensagemErro(erro));
      } finally {
        setCarregando(false);
      }
    }

    return (

        <div className="login-container-medico">  
            <h1 className='sr-only'>Entrar como profissional da saúde SISAT</h1>
            <div className='login-card'>
                {/* Cabeçalho */}
                <div className='login-header'>
                    { /* Colocando a logo */}
                    <img src={logoImg} alt='Logo do SISAT' className='logo-image'/>
                    <h2> Bem vindo, Dr(a). </h2>
                    <p> Entre para continuar </p>
                </div>

        {/* Formulário */}
        <form className='login-form' onSubmit={handleLogin}>

            <div className='input-group'>
            <label htmlFor='email'>Email:</label>  
            <input 
                type='text' 
                id='email' 
                placeholder='exemplo@dominio.com'
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                />
            </div>

            <div className='input-group'>
            <label htmlFor='senha'>Senha:</label>
        
            <div className='password-wrapper'>
                <input 
            
                type={mostrarSenha ? 'text' : 'password'} 
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

            <button type='submit' className='submit-btn' disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
            </button>
        </form>
        {mensagem && <p className='auth-message'>{mensagem}</p>}
        {/* Links de Rodapé */}
       <div className='login-footer'>
        <span>Não é profissional de saúde? <Link to='/login'>Entre como paciente</Link></span>
       </div>

        
        </div> 
    </div>
    )
}
