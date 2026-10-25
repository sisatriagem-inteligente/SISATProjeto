import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Navbar.css';
import logoImg from '/src/assets/img/logoMaisGrossa.png';
import {
    encerrarSessao,
    obterMensagemErro,
    obterUsuario
} from '../../services/api';
import { buscarTriagemPorId, criarTriagem } from '../../services/triagensApi';

export default function Navbar(){
    
    //useLocation() e useNavigate() estão sendo usados para fazer a função de mudar para as telas dentro de outras telas (para mudar para "Como Funciona" e "Quem Somos")
    const location = useLocation();

    const navigate = useNavigate(); // usar o useNavigate mantém a navegação dentro da aplicação React, sem recarregar a página

    //estado para controlar o menu no celular
    const [menuAberto, setMenuAberto] = useState(false);

    const [iniciandoTriagem, setIniciandoTriagem] = useState(false);
    const [erroTriagem, setErroTriagem] = useState('');

    const estaNoChatbot =
        location.pathname === '/chatbot' ||
        location.pathname.startsWith('/chatbot/');


    const estaNaFicha = location.pathname.startsWith('/ficha-atendimento/');


    // inicio da lógica da navbar mudar de cor dependendo do fluxo do usuário 

    const estaNoFluxoPaciente =
        location.pathname === '/inicioPaciente' ||
        location.pathname === '/verAnteriores' ||
        estaNoChatbot;
    
    const estaNoFluxoMedico =
        location.pathname === '/inicioMedico' ||
        location.pathname === '/painelAtendimento' ||
        estaNaFicha;

    const usuario = obterUsuario();

    const exibirLogout = 
        (estaNoFluxoPaciente || estaNoFluxoMedico) && 
        usuario !== null;

    let temaNavbar = 'navbar-padrao'; //tema padrão da navbar

    if (estaNoFluxoPaciente) {
        temaNavbar = 'navbar-paciente'; //tema da navbar para o fluxo do paciente
    } else if (estaNoFluxoMedico) {
        temaNavbar = 'navbar-medico'; //tema da navbar para o fluxo do médico
    }

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
        '/inicioMedico',
        '/painelAtendimento',
        '/recuperar-senha',
        '/configurar-palavras-chave',
        '/palavras-chave'
    ];

    // Não exibe a Navbar na tela do chatbot.
    // Nas demais rotas, mantém a regra atual de exibição.
    if (
        estaNoChatbot ||
        (!rotasComNavbar.includes(location.pathname) && !estaNaFicha)
    ) {
        return null;
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
    '/verAnteriores',
    '/inicioMedico',
    '/painelAtendimento',
    '/recuperar-senha',
    '/configurar-palavras-chave',
    '/palavras-chave'
    ];

    const temMenu =
        rotasComMenu.includes(location.pathname) ||
        estaNoChatbot ||
        estaNaFicha;



    //função para fazer a logo ser clicável em páginas específicas
    const logoClicavel = [
        '/',
        '/login',
        '/cadastro',
        '/loginMedico',
        '/comoFunciona',
        '/quemSomos'
    ].includes(location.pathname);

    const logoVisivelMobile = !estaNoChatbot;


     //função que inverte o estado do menu do celular (se tá aberto, fecha, se tá fechado, abre)
    const alternarMenu = () => {
        setMenuAberto(!menuAberto);
    };

    const iniciarTriagem = async () => {
        const usuario = obterUsuario();

        if (!usuario || usuario.role !== 'paciente') {
            navigate('/login');
            return;
        }

        setIniciandoTriagem(true);
        setErroTriagem('');

        try {
            const triagemAtiva = localStorage.getItem('triagem_ativa_id');
            if (triagemAtiva) {
                const { data } = await buscarTriagemPorId(triagemAtiva);
                if (data.triagem.paciente_id !== usuario.id) {
                    localStorage.removeItem('triagem_ativa_id');
                    setErroTriagem('A referência local da triagem não pertence a esta conta.');
                    return;
                }
                if (data.triagem.status === 'Concluida') {
                    localStorage.removeItem('triagem_ativa_id');
                } else if (data.triagem.chat_finalizado) {
                    setErroTriagem('Esta triagem não está disponível para continuar a conversa.');
                    return;
                } else {
                    navigate(`/chatbot/${triagemAtiva}`);
                    return;
                }
            }
            const resposta = await criarTriagem(usuario.id);
            const triagemId = resposta.data.triagem.id;

            localStorage.setItem('triagem_ativa_id', triagemId);
            navigate(`/chatbot/${triagemId}`);
        } catch (falha) {
    if (
        axios.isAxiosError(falha) &&
        falha.response?.status === 409
    ) {
        setErroTriagem(
            'Já existe uma triagem pendente para esta conta. No momento, não é possível iniciar outra nem retomar automaticamente a anterior. Os registros já salvos não serão apagados.'
        );
    } else {
        setErroTriagem(obterMensagemErro(falha));
    }
    } finally {
        setIniciandoTriagem(false);
    }
    };

    const sairDaConta = () => {
    const usuarioAtual = obterUsuario();

    let mensagemConfirmacao: string | null = null;

    // Paciente com uma referência de triagem ativa
    // ou que ainda está na tela do chatbot.
    if (
        usuarioAtual?.role === 'paciente' &&
        (
            localStorage.getItem('triagem_ativa_id') ||
            estaNoChatbot
        )
    ) {
        mensagemConfirmacao =
            'Os registros já salvos não serão apagados, mas o SISAT ainda não consegue retomar automaticamente uma triagem pendente após um novo login. Deseja sair mesmo assim?';
    }

    // Médico na ficha: alterações não salvas podem ser perdidas.
    else if (
        usuarioAtual?.role === 'medico' &&
        estaNaFicha
    ) {
        mensagemConfirmacao =
            'Se houver alterações ainda não salvas na ficha médica, elas serão perdidas. Deseja sair mesmo assim?';
    }

    // Só interrompe a saída se houver uma confirmação
    // necessária e o usuário optar por permanecer.
    if (
        mensagemConfirmacao &&
        !window.confirm(mensagemConfirmacao)
    ) {
        return;
    }

    // Define o login de destino antes de limpar a sessão.
    const destino =
        usuarioAtual?.role === 'medico'
            ? '/loginMedico'
            : '/login';

        encerrarSessao();

        setMenuAberto(false);
        setErroTriagem('');

        navigate(destino, { replace: true });
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

    if(location.pathname === '/login' || location.pathname === '/cadastro' || location.pathname === '/comoFunciona'|| location.pathname === '/recuperar-senha' || location.pathname === '/configurar-palavras-chave' || location.pathname === '/palavras-chave'){
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
            <li>
                <button
                    type='button'
                    onClick={iniciarTriagem}
                    className='loginMedico nav-button'
                    disabled={iniciandoTriagem}
                >
                    {iniciandoTriagem ? 'Iniciando...' : 'Nova Triagem'}
                </button>
            </li>
            </>
    
    } else if (location.pathname === '/inicioMedico' || location.pathname === '/painelAtendimento' || estaNaFicha){
        itensMenu=
         <>
            <li><Link to='/inicioMedico' className='nav-button'>Início</Link></li>
            <li><Link to="/painelAtendimento" className='loginMedico'>Ver Painel de Atendimentos</Link></li>
            </>
    
    } else{
        itensMenu = (
            <>
            </>
        )
    }





    return(
        
        <nav className={`navbar ${temaNavbar}`}>
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
                {exibirLogout && (
                    <li>
                        <button
                            type="button"
                            onClick={sairDaConta}
                            className="logout-btn"
                        >
                            <i
                                className="bi bi-person-circle"
                                aria-hidden="true"
                            />
                            <span>Sair</span>
                        </button>
                    </li>
                )}
                {erroTriagem && (
                    <li role='alert'>
                        {erroTriagem}
                    </li>
                )}
            </ul>

            {menuAberto && <div className="menu-overlay" onClick={alternarMenu}></div>}
        </nav>
        
        );
    }
