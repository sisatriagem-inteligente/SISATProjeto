// import { useState } from "react";
import '/src/pages/Auth.css';
import Login from "./pages/Login/Login";
import Cadastro from "./pages/Cadastro/Cadastro";
import LoginMedico from './pages/LoginMedico/LoginMedico';
import Navbar from "./components/Navbar";

import { Routes, Route } from "react-router-dom";


function App(){

  return(
      <div className="app-container">
     
        <Navbar />

        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/loginMedico" element={<LoginMedico />} />
        </Routes>

      </div>

  );
}

export default App;