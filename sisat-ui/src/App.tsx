import '/src/pages/Autenticacao/Auth.css';
import Login from "./pages/Autenticacao/Login";
import Cadastro from "./pages/Autenticacao/Cadastro";
import Home from "./pages/Home/Home";
import LoginMedico from './pages/Autenticacao/LoginMedico';
import InicioPaciente from './pages/Paciente/InicioPaciente/InicioPaciente';
import Navbar from "./components/Navbar/Navbar";

import { Routes, Route } from "react-router-dom";
import Footer from './components/Footer/Footer';
import VerAnteriores from './pages/Paciente/VerAnteriores/VerAnteriores';
import Chatbot from './pages/Paciente/Chatbot/Chatbot';
import InicioMedico from './pages/Medico/InicioMedico/InicioMedico';
import FichaMed from './pages/Medico/FichaMed/FichaMedica';
import PainelAtendimento from './pages/Medico/PainelAtend/PainelAtendimento';



function App(){

  return(
      <div className="app-container">
     
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          {/* rotas para o paciente */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path='/inicioPaciente' element={<InicioPaciente />}/>
          <Route path="/verAnteriores" element={<VerAnteriores />} />
          <Route path="/chatbot/:triagemId" element={<Chatbot />} />

          {/* rotas para o médico */}
          <Route path="/loginMedico" element={<LoginMedico />} />
          <Route path="/inicioMedico" element={<InicioMedico />} />
          <Route path="/ficha-atendimento/:triagemId" element={<FichaMed />} />
          <Route path="/painelAtendimento" element={<PainelAtendimento />} />
          
        </Routes>

        <Footer />

      </div>

  );
}

export default App;
