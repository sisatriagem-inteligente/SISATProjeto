import { useState } from 'react';
import { Link } from 'react-router-dom';
import '/src/pages/Autenticacao/Auth.css';
//importando a imagem da logo do sisat ↓
import logoImg from '/src/assets/img/logoMaisGrossa.png'


export default function LoginMedico(){
    const [mostrarSenha, setMostrarSenha] = useState(false);

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
        <form className='login-form'>

            <div className='input-group'>
            <label htmlFor='email'>Email:</label>  
            <input 
                type='text' 
                id='email' 
                placeholder='exemplo@dominio.com'
                />
            </div>

            <div className='input-group'>
            <label htmlFor='senha'>Senha:</label>
        
            <div className='password-wrapper'>
                <input 
            
                type={mostrarSenha ? 'text' : 'password'} 
                id='senha' 
                placeholder='••••••••••••' 
                />
                
                <i 
                className={`bi ${mostrarSenha ? 'bi-eye' : 'bi-eye-slash'}`} 
                onClick={() => setMostrarSenha(!mostrarSenha)}               
                ></i>
            </div>
            </div>

            <button type='submit' className='submit-btn'>
            Entrar
            </button>
        </form>
        {/* Links de Rodapé */}
       <div className='login-footer'>
        <span>Não é profissional de saúde? <Link to='/login'>Entre como paciente</Link></span>
       </div>

        
        </div> 
    </div>
    )
}
