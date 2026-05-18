import { useState } from "react";
import Login from "./Login";
import Cadastro from "./Cadastro";

export default function App(){
  // vou usar um estado temporário só pra conseguir visualizar as duas telas ao mesmo tempo
  //pode remover esse useState e os buttons abaixo pra conseguir
  const [telaAtual, setTelaAtual] = useState('login');

  return(
    <div>
      {/* botões provisórios só pra conseguir alternar entre as telas e ver como ficou */}
      {/*COMEÇO DO QUE PODE APAGAR */}
      <div style={{position: 'absolute', 
        top:10, 
        left:10, 
        gap:10, 
        display: 'flex'
        }}>
        <button onClick={() => setTelaAtual('login')}>Ver Tela de Login</button>
        <button onClick={() => setTelaAtual('cadastro')}>Ver Tela de Cadastro</button>
      </div>
        {/* FIM DO QUE PODE APAGAR */}


      {/* ↓ se a tela atual for login, mostra o componente Login, senão, mostra o Cadastro */}
      {/* pelo o que eu entendi, essa linha ↓ vai ser substituida por algo como <routes>...</routes> PELO BACKEND*/}
      {telaAtual === 'login' ? <Login /> : <Cadastro />}
    </div>
  );
}