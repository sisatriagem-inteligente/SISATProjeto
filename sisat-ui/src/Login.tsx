import { useState } from 'react';
import './Auth.css';
//importando a imagem da logo do sisat
import logoImg from './assets/logo-sisat.jpeg';

export default function Login(){
    const [cpf,setCpf] = useState('');
    const [password, setPassword] = useState('');

    const handleCpfChange = (e:React.ChangeEvent<HTMLInputElement>) =>{
    let value = e.target.value;

    value = value.replace(/\D/g,''); //remove tudo que não for número

    if(value.length > 11) value = value.slice(0,11); //aplica os pontos e o tracinho conforme o usuário vai digitando
        
    value = value.replace(/^(\d{3})(\d)/, '$1.$2') //adiciona o primeiro ponto
    
    value = value.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3'); //adiciona o segundo ponto
    
    value = value.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4'); //adiciona o tracinho
    
    //atualiza o estado com o valor formatado
    setCpf(value);

    }
     const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cpf, password }),
      });

      const data = await res.json();
      console.log(data);

      // CORREÇÃO: Usamos res.ok para verificar se o status é 200-299
      // ou verificamos a mensagem que vimos no seu console
      if (data.message === 'Login feito com sucesso') {
        alert("Login realizado!");
        
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
      } else {
        alert("Erro no login: " + (data.message || "Credenciais inválidas"));
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Erro ao conectar com o servidor.");
    }
  };




  return (
    <div className="login-container">  {/* isso é como se faz um comentario dentro do return (JSX)*/}
      <div className='login-card'>
        {/* Cabeçalho */}
        <div className='login-header'>
         { /* colocando a logo */}
          <img src={logoImg} alt='Logo do SISAT' className='logo-image'/>
          <h2> Bem vindo ao SISAT </h2>
          <p> Entre para continuar </p>
        </div>

       {/* Formulário */}
       <form className='login-form' onSubmit ={handleLogin}>

        <div className='input-group'>
          <label htmlFor='cpf'>CPF:</label>  {/*aqui coloquei como texto mas se tiver um jeito de organizar automaticamente pro usuario só conseguir escrever números e os pontos e traço serem colocados automaticamente a cada 3 caracteres seria bem legal */}
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
          <input type='senha' id='senha' placeholder='••••••••' value={password}  onChange={(e) => setPassword(e.target.value)}  />
        </div>

        <button type='submit' className='submit-btn'>
          Entrar
        </button>
       </form>

       {/* Links de Rodapé */}
       <div className='login-footer'>
        <span>Não tem uma conta? <a href='#cadastrese'>Cadastre-se</a></span>
        {/* INTEGRAR COM A ROTA DE CADASTRO AQUI */}
       </div>


      </div> 
    </div>
  )
}