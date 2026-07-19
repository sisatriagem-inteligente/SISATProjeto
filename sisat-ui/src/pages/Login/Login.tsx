import { useState, type FormEvent } from 'react';
import '/src/pages/Auth.css';
//importando a imagem da logo do sisat ↓
import logoImg from '/src/assets/img/logoMaisGrossa.png'
import { Link } from 'react-router-dom';

import { // importando as funções da api
  loginPaciente,
  obterMensagemErro,
} from '../../services/api';


export default function Login(){
    const [cpf,setCpf] = useState(''); //criando um estado para o valor do cpf
    const [password, setPassword] = useState(''); // criando um estado para o valor da senha
    const [mensagem, setMensagem] = useState(''); // criando um estado para o valor da mensagem
    
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

    };

     // Função executada quando o formulário for enviado.
  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    // Impede que a página recarregue.
    event.preventDefault();

    // Limpa qualquer mensagem anterior.
    setMensagem('');

    // Remove os pontos e o traço antes de enviar.
    const cpfSemMascara = cpf.replace(/\D/g, '');

    try {
      const resposta = await loginPaciente({
        cpf: cpfSemMascara,
        password,
      });

      // Mostra a mensagem retornada pelo backend.
      setMensagem(resposta.data.message);

      console.log(
        'Token salvo:',
        localStorage.getItem('access_token'),
      );
    } catch (erro) {
      // Mostra a mensagem de erro retornada pelo backend.
      setMensagem(obterMensagemErro(erro));
    }
  }

  return (
    <div className="login-container">  {/* isso é como se faz um comentario dentro do return (JSX)*/}
      <div className='login-card'>
        {/* Cabeçalho */}
        <div className='login-header'>
         { /* Colocando a logo */}
          <img src={logoImg} alt='Logo do SISAT' className='logo-image'/>
          <h2> Bem vindo ao SISAT </h2>
          <p> Entre para continuar </p>
        </div>

       {/* Formulário */}
       <form className='login-form' onSubmit={handleLogin}> {/*Quando o formulário for enviado vai executar a função handleLogin */}

        <div className='input-group'>
          <label htmlFor='cpf'>CPF:</label>  
          <input 
            type='text' 
            id='cpf' 
            placeholder='123.456.789-00'
            maxLength={14}
            value={cpf} // determina o valor do estado do cpf
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
              onChange={(event) =>  ////Essa linha atualiza o estado da senha toda vez que o usuário digita no campo:
                  setPassword(event.target.value)
                }
            />
            
            {/* ícone do olhinho (também muda dependedndo do estado) */}
            <i 
              className={`bi ${mostrarSenha ? 'bi-eye' : 'bi-eye-slash'}`} //bi bi eye = olhinho aberto / bi bi-eye-slash = olhinho fechado
              onClick={() => setMostrarSenha(!mostrarSenha)}               //inverte o estado quando clicar (se estiver true fica false, se estiver false fica true)
              ></i>
          </div>
        </div>

        <button type='submit' className='submit-btn'>
          Entrar
        </button>
       </form>

          {/* Mostra a mensagem de sucesso ou erro */}
        {mensagem && (
          <p className="auth-message">
            {mensagem}
          </p>
        )}

       {/* Links de Rodapé */}
       <div className='login-footer'>
        <span>Não tem uma conta? <Link to='/cadastro'>Cadastre-se</Link></span>
        {/* INTEGRAR COM A ROTA DE CADASTRO AQUI */}
       </div>


      </div> 
    </div>
  )
}
