import { useState } from 'react'; 
import './Navbar.css';
import logoImg from '/src/assets/img/logoMaisGrossa.png';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
// import logoEscrita from '/src/assets/img/logoSISAT.png';

export default function Navbar(){
    //estado para controlar o menu no celular
    const [menuAberto, setMenuAberto] = useState(false);

    //função que inverte o estado (se tá aberto, fecha, se tá fechado, abre)
    const alternarMenu = () => {
        setMenuAberto(!menuAberto);
    };

    const location = useLocation();

    let itensMenu;

    if(location.pathname === '/' || location.pathname === '/cadastro'){
        itensMenu = (
            <>
            <li><a href="#home" onClick={(e) => e.preventDefault()}>Início</a></li>
            <li><a href="#comoFunciona" onClick={(e) => e.preventDefault()}>Como Funciona</a></li>
            <li><a href="#quemSomos" onClick={(e) => e.preventDefault()}>Quem Somos</a></li>
            <li><Link to="/loginMedico" className='loginMedico'>Profissionais de Saúde</Link></li>
            </>
        )
     } else if(location.pathname === '/loginMedico'){
        itensMenu = (
            <>
            <li><a href="#home" onClick={(e) => e.preventDefault()}>Início</a></li>
            <li><a href="#comoFunciona" onClick={(e) => e.preventDefault()}>Como Funciona</a></li>
            <li><a href="#quemSomos" onClick={(e) => e.preventDefault()}>Quem Somos</a></li>
            <li><Link to="/" className='login'>Sou paciente</Link></li>
            </>
        )
    } else{
        itensMenu = (
            <>
            </>
        )
    }

    return(
        
        <nav className='navbar'>
            {/* lado esquerdo → logo que funciona como botão para a tela de início */}
            <div className='navbar-logo-container'>
                <a href="#home" className="navbar-brand-btn" onClick={(e) => e.preventDefault()}>
                    <img src={logoImg} alt='Logo SISAT' className='navbar-logo-img'/>
                </a> 
            </div>

                {/* botão de menu para dispositivos móveis (menu hamburguer/três risquinhos) */}
            <div className="menu-icon" onClick={alternarMenu}>
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
            </div>

            <ul className={menuAberto ? 'navbar-menu ativo' : 'navbar-menu'}>
                {itensMenu}
            </ul>

            {menuAberto && <div className="menu-overlay" onClick={alternarMenu}></div>}
        </nav>
        
        );
    }
