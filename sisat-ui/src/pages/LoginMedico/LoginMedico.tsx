import {useState, type FormEvent,} from 'react';
import '/src/pages/LoginMedico/LoginMedico.css';
//importando a imagem da logo do sisat ↓
import logoImg from '/src/assets/img/logoMaisGrossa.png'
// Importando as funções da API.
import {
  loginMedico,
  obterMensagemErro,
} from '../../services/api';


export default function LoginMedico(){
     
    const [email, setEmail] = useState(''); // Estado que armazena o e-mail digitado.
    const [password, setPassword] = useState(''); // Estado que armazena a mensagem de sucesso ou erro.
    const [mensagem, setMensagem] = useState('');  // Estado que armazena a mensagem de sucesso ou erro.

    const [mostrarSenha, setMostrarSenha] = useState(false);

    // Função executada quando o formulário for enviado.
  async function handleLoginMedico(
    event: FormEvent<HTMLFormElement>,
  ) {
    // Impede que a página recarregue.
    event.preventDefault();

    // Limpa qualquer mensagem anterior.
    setMensagem('');

    try {
      // Envia o e-mail e a senha para o backend.
      const resposta = await loginMedico({
        email,
        password,
      });

      // Mostra a mensagem retornada pelo backend.
      setMensagem(resposta.data.message);

      // O token já é salvo dentro da função loginMedico
      // localizada no arquivo api.ts.
      console.log(
        'Token médico salvo:',
        localStorage.getItem('access_token'),
      );
    } catch (erro) {
      // Mostra a mensagem de erro retornada pelo backend.
      setMensagem(obterMensagemErro(erro));
    }
  }


    return (
        <div className="login-container-medico">  
        <div className='login-card'>
            {/* Cabeçalho */}
            <div className='login-header'>
            { /* Colocando a logo */}
            <img src={logoImg} alt='Logo do SISAT' className='logo-image'/>
            <h2> Bem vindo, Dr(a). </h2>
            <p> Entre para continuar </p>
            </div>

        {/* Formulário */}
        <form className='login-form' onSubmit={handleLoginMedico}> {/*executa a função handleLoginMedico quando o formulário é enviado*/}

            <div className='input-group'>
            <label htmlFor='email'>Email:</label>  
            <input 
                type='email' 
                id='email' 
                placeholder='exemplo@dominio.com'
                 value={email} // O valor do campo vem do estado email.
                 onChange={(event) =>  // Atualiza o estado quando o médico digita.
                setEmail(event.target.value)
              }
                />
            </div>

            <div className='input-group'>
            <label htmlFor='senha'>Senha:</label>
        
            <div className='password-wrapper'>
                <input 
            
                type={mostrarSenha ? 'text' : 'password'} 
                id='senha' 
                placeholder='••••••••••••'
                value={password}   // O valor do campo vem do estado password.
                onChange={(event) => // Atualiza o estado quando o médico digita.
                  setPassword(event.target.value)
                }
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

         {/* Exibe a mensagem de sucesso ou erro */}
        {mensagem && (
          <p className="auth-message">
            {mensagem}
          </p>
        )}

        </div> 
    </div>
    )
}
