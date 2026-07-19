
import { useState, type FormEvent } from 'react'; //importação do useState e to FormEvent
import '/src/pages/Auth.css';
//importando a imagem da logo do sisat
import logoImg from '/src/assets/img/logoMaisGrossa.png'

import { Link } from 'react-router-dom';

import { // importação das funções do arquivo api.ts dentro da pasta service
  cadastrarPaciente,
  obterMensagemErro,
} from '../../services/api';

export default function Cadastro(){
  // fazendo o ponto e o tracinho do cpf↓
  const [cpf,setCpf] = useState('');   //criando um estado para o valor do CPF
  const[email, setEmail] = useState(''); // criando um estado para o valor do cpf
  const [mensagem, setMensagem] = useState(''); // criando um estado para o valor da mensagem 
  const [password, setPassword] = useState(''); // criando um estado para o valor da senha
  const [confirmarSenha, setConfirmarSenha] = useState('');
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

  };
   // Função executada quando o formulário for enviado.
  async function handleCadastro(
    event: FormEvent<HTMLFormElement>,
  ) {
    // Evita que a página atualize ao enviar o formulário.
    event.preventDefault();

    // Limpa a mensagem anterior.
    setMensagem('');

    // Verifica se as senhas digitadas são iguais.
    if (password !== confirmarSenha) {
      setMensagem('As senhas não são iguais.');
      return;
    }

    try {
      // Remove os pontos e o traço do CPF.
      const cpfSemMascara = cpf.replace(/\D/g, '');

      // Envia os dados para o backend.
      const resposta = await cadastrarPaciente({
        cpf: cpfSemMascara,
        email,
        password,
      });

      // Mostra a mensagem retornada pelo backend.
      setMensagem(resposta.data.message);

      // Limpa os campos depois do cadastro.
      setCpf('');
      setEmail('');
      setPassword('');
      setConfirmarSenha('');
    } catch (erro) {
      // Mostra a mensagem de erro retornada pelo backend.
      setMensagem(obterMensagemErro(erro));
    }
  }
  
  return (  
    <div className="login-container">   {/* isso é como se faz um comentario dentro do return (JSX)*/ }
       <div className='login-card'>     {/*className é a mesma coisa que o atributo class no html */}
        {/* Cabeçalho */}
        <div className='login-header'>
          { /* colocando a logo */}
          <img src={logoImg} alt='Logo do SISAT' className='logo-image'/>
          <h2> Bem vindo ao SISAT </h2>
          <p> Cadastre-se para continuar </p>
        </div>


     
       {/* Formulário */}
       <form className='login-form'  onSubmit={handleCadastro}> {/*Quando o formulário for enviado, vai executar a função handleCadastro*/ }

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
          <input 
          type='email'
          id='email' 
          value={email}
          onChange={(event)=>setEmail(event.target.value)} placeholder='nome.sobrenome@dominio.com'/>
        </div>

       {/* senha e confirmação de senha */}
        <div className='input-group'>
          <label htmlFor='senha'>Senha:</label>

          <div className='password-wrapper'>
            <input 
              type={ mostrarSenha ? 'text' : 'password'}
              id='senha' 
              placeholder='••••••••••••'
              value = {password}
               onChange={(event) => //Essa linha atualiza o estado da senha toda vez que o usuário digita no campo:
                  setPassword(event.target.value)
                } 
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
              value = {confirmarSenha} // declara o valor como confirmarSenha na função
              onChange={(event) => //Essa linha atualiza o estado da senha toda vez que o usuário digita no campo:
                  setConfirmarSenha(event.target.value)
                } 
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
        {/* Exibe a mensagem de sucesso ou erro */}
        {mensagem && (
          <p className="auth-message">{mensagem}</p>
        )}

       {/* Links de Rodapé */}
       <div className='login-footer'>
        <span>Já tem uma conta? <Link to='/'>Entrar</Link></span>
       </div>

      </div> 
    </div>
  )
}