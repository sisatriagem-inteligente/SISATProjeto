import { useState } from 'react'; 
import { Link, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import './Navbar.css';
import logoImg from '/src/assets/img/logoMaisGrossa.png';

export default function Navbar(){
    
    //useLocation() e useNavigate() estão sendo usados para fazer a função de mudar para as telas dentro de outras telas (para mudar para "Como Funciona" e "Quem Somos")
    const location = useLocation();

    const navigate = useNavigate(); // usar o useNavigate mantém a navegação dentro da aplicação React, sem recarregar a página

    //estado para controlar o menu no celular
    const [menuAberto, setMenuAberto] = useState(false);

   //lista de rotas que devem exibir a Navbar
    const rotasComNavbar= [ //aqui estão listadas todas as rotas que devem exibir a Navbar
        '/',
        '/login',
        '/cadastro',
        '/loginMedico',
        '/comoFunciona',
        '/quemSomos',
        '/inicioPaciente',
        '/verAnteriores',
        '/chatbot',
        '/inicioMedico',
        '/painelAtendimentos'
    ];

    if (!rotasComNavbar.includes(location.pathname)) {
        return null; // Retorna null para não renderizar a Navbar
    }

    //lista de rotas que devem exibir o MENU (versão mobile da Navbar)
    const rotasComMenu = [
        '/',
        '/login',
        '/cadastro',
        '/loginMedico',
        '/comoFunciona',
        '/quemSomos',
        '/inicioPaciente',
        '/inicioMedico'
    ]
    const temMenu = rotasComMenu.includes(location.pathname);



    //função para fazer a logo ser clicável em páginas específicas
    const logoClicavel = [
        '/',
        '/login',
        '/cadastro',
        '/loginMedico',
        '/comoFunciona',
        '/quemSomos'
    ].includes(location.pathname);

    const logoVisivelMobile = ![
        '/chatbot'
    ].includes(location.pathname);


     //função que inverte o estado do menu do celular (se tá aberto, fecha, se tá fechado, abre)
    const alternarMenu = () => {
        setMenuAberto(!menuAberto);
    };


    const navegarParaSecao = (id: string) => {
        if (location.pathname !== "/") {
            navigate(`/#${id}`); //esse código muda a URL, mas não faz o scroll automaticamente
        } else {
            document.getElementById(id)?.scrollIntoView({
                behavior: "smooth",
            });
        }

        setMenuAberto(false); //fecha o menu no celular
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


    //essa parte serve para alterar os itens do menu da navbar dependendo da página que o usuário está
    let itensMenu;

    if(location.pathname === '/login' || location.pathname === '/cadastro' || location.pathname === '/comoFunciona'){
        itensMenu = (
            <>
            <li><Link to="/">Início</Link></li>
            <li><button onClick={irParaComoFunciona} className='nav-button'>Como Funciona</button></li>
            <li><button onClick={irParaQuemSomos} className='nav-button'>Quem Somos</button></li>
            <li><Link to="/loginMedico" className='loginMedico'>Profissionais de Saúde</Link></li>
            </>
        )
     } else if(location.pathname === '/loginMedico'){
        itensMenu = (
            <>
            <li><Link to="/" className='home'>Início</Link></li>
            <li><button onClick={irParaComoFunciona} className='nav-button'>Como Funciona</button></li>
            <li><button onClick={irParaQuemSomos} className='nav-button'>Quem Somos</button></li>
            <li><Link to="/login" className='login'>Sou paciente</Link></li>
            </>
        )
    } else if(location.pathname === '/'){
        itensMenu = (
            <>
            <li><button onClick={irParaInicio} className='nav-button'>Início</button></li>
            <li><button onClick={irParaComoFunciona} className='nav-button'>Como Funciona</button></li>
            <li><button onClick={irParaQuemSomos} className='nav-button'>Quem Somos</button></li>
            <li><Link to="/loginMedico" className='loginMedico'>Profissionais de Saúde</Link></li>
            </>
        )
    } else if (location.pathname === '/inicioPaciente'|| location.pathname === '/verAnteriores'){
        itensMenu=
         <>
            <li><Link to='/inicioPaciente' className='nav-button'>Início</Link></li>
            <li><Link to='/verAnteriores' className='nav-button'>Ver Triagens Anteriores</Link></li>
            <li><Link to="/inicioPaciente" className='loginMedico'>Nova Triagem</Link></li>
            </>
    
    } else if (location.pathname === '/inicioMedico' || location.pathname === '/fichaMed'){
        itensMenu=
         <>
            <li><Link to='/inicioMedico' className='nav-button'>Início</Link></li>
            <li><Link to="/painelAtendimentos" className='loginMedico'>Ver Painel de Atendimentos</Link></li>
            </>
    
    } else{
        itensMenu = (
            <>
            </>
        )
    }





    return(
        
        <nav className='navbar'>
            {/* lado esquerdo → logo que funciona como botão para a tela de início */}
            <div className={`navbar-logo-container ${
                !logoVisivelMobile ? 'logo-esconder-mobile' : ''
            }`}>
                {logoClicavel ? (
                    <button onClick={irParaInicio} className='navbar-brand-btn'>
                        <img src={logoImg} alt='Logo SISAT' className='navbar-logo-img'/>
                    </button>
                ) : (
                    <div className='navbar-brand-logo'>
                        <img src={logoImg} alt='Logo SISAT' className='navbar-logo-img'/>
                    </div>
                )}
                {/* <button onClick={irParaInicio} className='navbar-brand-btn'>
                    <img src={logoImg} alt='Logo SISAT' className='navbar-logo-img'/>
                </button> */}
            </div>

            {/* botão de menu para dispositivos móveis (menu hamburguer/três risquinhos) */}
            {temMenu && (
                <div className="menu-icon" onClick={alternarMenu}>
                    <div className="bar"></div>
                    <div className="bar"></div>
                    <div className="bar"></div>
                </div>
            )}
            
            <ul className={menuAberto ? 'navbar-menu ativo' : 'navbar-menu'}>
                {itensMenu}
            </ul>

            {menuAberto && <div className="menu-overlay" onClick={alternarMenu}></div>}
        </nav>
        
        );
    }
