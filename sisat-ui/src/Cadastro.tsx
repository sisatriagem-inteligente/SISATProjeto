import { useState } from 'react';
import './Auth.css';
//importando a imagem da logo do sisat
import logoImg from './assets/logo-sisat.jpeg';

export default function Cadastro(){
  // fazendo o ponto e o tracinho do cpf↓
  const [cpf,setCpf] = useState(''); //criando um estado para o valor do CPF
  const [email, setEmail] = useState('');
  const[password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleCpfChange =(e: React.ChangeEvent<HTMLInputElement>) => { //função que vai aplicar a máscara
    let value = e.target.value;

    value = value.replace(/\D/g,''); //remove tudo que não for número

    if(value.length > 11) value = value.slice(0,11); //aplica os pontos e o tracinho conforme o usuário vai digitando
        
    value = value.replace(/^(\d{3})(\d)/, '$1.$2') //adiciona o primeiro ponto
    
    value = value.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3'); //adiciona o segundo ponto
    
    value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4'); //adiciona o tracinho
    
    //atualiza o estado com o valor formatado
    setCpf(value);

  }



  const handleCadastro = async (e: React.FormEvent) => {
  e.preventDefault();

  if( password!== confirmPassword){
    alert("As senhas não coincidem");
    return;
  }

  const res = await fetch("http://localhost:3000/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cpf,
      email,
      password,
    }),
  });

  const data = await res.json();

  console.log(data);
  if (res.ok) {
    alert("Cadastro realizado com sucesso!");
  } else {
    alert("Erro ao cadastrar");
  }


};

  

  
  return (  
    <div className="login-container">   {/* isso é como se faz um comentario dentro do return (JSX)*/ }
       <div className='login-card'> {/*className é a mesma coisa que o atributo class no html */}
        {/* Cabeçalho */}
        <div className='login-header'>
          { /* colocando a logo */}
          <img src={logoImg} alt='Logo do SISAT' className='logo-image'/>
          <h2> Bem vindo ao SISAT </h2>
          <p> Cadastre-se para continuar </p>
        </div>

       {/* Formulário */}
       <form className='login-form' onSubmit = {handleCadastro}>

        <div className='input-group'>
          <label htmlFor='cpf'>CPF:</label> 
          <input 
            type='text' 
            id='cpf' 
            placeholder='123.456.789-00'
            maxLength={14} //limitando o número de caracteres (11 números + 3 símbolos)
            value={cpf}    // o valor do input agora vem do nosso "estado"
            onChange={handleCpfChange} //chama a função sempre que o usuário digita
           />  
        </div>

        <div className='input-group'>
          <label htmlFor='email'>E-mail:</label>
          <input type='email' id='email' placeholder='nome.sobrenome@dominio.com' value={email}  onChange={(e) => setEmail(e.target.value)}/>
        </div>

       {/* senha e confirmação de senha */}
        <div className='input-group'>
          <label htmlFor='senha'>Senha:</label>
          <input type='password' id='senha' placeholder='••••••••'  value = {password} onChange={(e) => setPassword(e.target.value)}/>
        </div>

          <div className='input-group'>
          <label htmlFor='senhaConfirm'>Confirme sua senha:</label>
          <input type='password' id='senhaConfirm' placeholder='••••••••' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/>
        </div>

        <button type='submit' className='submit-btn'>
          Criar conta
        </button>
       </form>

       {/* Links de Rodapé */}
       <div className='login-footer'>
        <span>Já tem uma conta? <a href='#login'>Entrar</a></span>
       </div>

      </div> 
    </div>
  )
}