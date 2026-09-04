import './Footer.css';
import logoSISAT from '/src/assets/img/logoSISAT.png';
import { Link, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

export default function Footer(){

     //useLocation() e useNavigate() estão sendo usados para fazer a função de mudar para as telas dentro de outras telas (para mudar para "Como Funciona" e "Quem Somos")
    const location = useLocation();

    const navigate = useNavigate(); // usar o useNavigate mantém a navegação dentro da aplicação React, sem recarregar a página

    const navegarParaSecao = (id: string) => {
        if (location.pathname !== "/") {
            navigate(`/#${id}`); //esse código muda a URL, mas não faz o scroll automaticamente
        } else {
            document.getElementById(id)?.scrollIntoView({
                behavior: "smooth",
            });
        }
    }

    const irParaComoFunciona = () => {      // essa função serve para rolar a página automaticamente quando clicar no "Como Funciona" na navbar
        navegarParaSecao("como-funciona");
    };

    const irParaQuemSomos = () => {         // essa função serve para rolar a página automaticamente quando clicar no "Como Funciona" na navbar
        navegarParaSecao("quem-somos");
    };

    const irParaInicio = () => {         // essa função serve para rolar a página automaticamente quando clicar no "Como Funciona" na navbar
        navegarParaSecao("inicio");
    };


    const pathname = location.pathname;

    const footerConfig: Record<string , string> = {
        "/": "hall",
        "/cadastro":"hall",
        "/login":"hall",
        "/loginMedico":"medico",
        "/inicioMedico":"medico",
        "/painelMedico":"none",
        "/verAnteriores":"none",
        "/chatbot":"none",
    };

    const tipoFooter = footerConfig[pathname];

    if(tipoFooter === "none") return null;

    let conteudoFooter;

    if(tipoFooter === "hall"){
        conteudoFooter =(
            <>
                 <div className='grid-two'>
                        <h4 className='title'>Geral</h4>
                        <button onClick={irParaInicio} className='button-link'>Início</button> <br/>
                        <button onClick={irParaComoFunciona} className='button-link'>Como Funciona</button><br/>
                        <button onClick={irParaQuemSomos} className='button-link'>Quem Somos</button>
                    </div>
                    <div className='grid-three'>
                        <h4 className='title'>Faça sua triagem</h4>
                        <p className='text'>Comece agora</p>
                        <button className='btn-cadastro'><Link to='/cadastro' className='btn-cadastro'>Clique Aqui</Link></button>
                        <button className='btn-cadastro'><Link to='/inicioPaciente' className='btn-cadastro'>Início Paciente</Link></button>
                        <button className='btn-cadastro'><Link to='/inicioMedico' className='btn-cadastro'>Início Médico</Link></button>

                    </div>
            </>
        );
    }
    else if(tipoFooter === "medico"){
        conteudoFooter = (
            <>
                <div className='grid-two'>
                    <h4 className='title'>Área Médica</h4>
                    <p className='title'>Acesso exclusivo para profissionais.</p>
                    <button className='btn-cadastro'><Link to='/fichaMed' className='btn-cadastro'>Ficha Médica</Link></button>
                </div>
                <div className='grid-three'>
                    <h4 className='title'>Contato</h4>
                    <p className='text'>triagem@sisat.com</p>
                </div>
            </>
        );
        
    }
    

    return(
        <div className='footer-container'>
            <div className='footer-content'>
                <div className='footer-grid'>
                    <div className='grid-one'>
                        <img src={logoSISAT} className='logo'/>
                        <p className='text'>Sistema Inteligente de Saúde e Atendimento</p>
                    </div>

                    {conteudoFooter}
                   
                    <div className='grid-four'>
                        <h4 className='title'>Contato</h4>
                        <p className='text'>triagem@sisat.com</p>
                    </div>

                </div>
                <div className='footer-last'>
                    <p>@2026 SISAT. Todos os direitos reservados.</p>
                    <button onClick={irParaInicio} className='button-link'>sisat.com.br</button>
                </div>
            </div>
        </div>
    );
}