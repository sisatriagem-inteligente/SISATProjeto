import { useState } from 'react';
import '/src/pages/Autenticacao/Auth.css';
//importando a imagem da logo do sisat
import logoImg from '/src/assets/img/logoMaisGrossa.png'

import { Link } from 'react-router-dom';


export default function Cadastro(){
  // fazendo o ponto e o tracinho do cpf↓
  const [cpf,setCpf] = useState('');   //criando um estado para o valor do CPF

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
       <form className='login-form'>

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
          <input type='email' id='email' placeholder='nome.sobrenome@dominio.com'/>
        </div>

       {/* senha e confirmação de senha */}
        <div className='input-group'>
          <label htmlFor='senha'>Senha:</label>

          <div className='password-wrapper'>
            <input 
              type={ mostrarSenha ? 'text' : 'password'}
              id='senha' 
              placeholder='••••••••••••' 
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
            />
            <i
              className={`bi ${mostrarConfirmarSenha ? 'bi-eye' : 'bi-eye-slash'}`}
              onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
            ></i>
          </div>  
        </div>

        <button type='submit' className='submit-btn'>
          Criar conta
        </button>
       </form>

       {/* Links de Rodapé */}
       <div className='login-footer'>
        <span>Já tem uma conta? <Link to='/login'>Entrar</Link></span>
       </div>

      </div> 
    </div>
  )
}