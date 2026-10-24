import './InicioPaciente.css';
import bemVindo from '../../../assets/img/bemvindo-paciente.png';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { obterMensagemErro, obterUsuario } from '../../../services/api';
import { criarTriagem } from '../../../services/triagensApi';

export default function InicioPaciente(){

    const navigate = useNavigate();
    const [mostrarDica, setMostrarDica] = useState(false);
    const [iniciando, setIniciando] = useState(false);
    const [erro, setErro] = useState('');



/*
 * INTEGRAÇÃO CODEX — MODO DE DEMONSTRAÇÃO E CRIAÇÃO
 *
 * Esta função pode criar uma triagem real por meio do BFF.
 *
 * Conferir a condição VITE_SISAT_FRONTEND_DEMO já utilizada
 * nas telas de autenticação e aplicar o comportamento de
 * demonstração também a este fluxo.
 *
 * Quando o modo de demonstração estiver ativo, não chamar
 * criarTriagem() nem apresentar uma operação simulada como
 * se tivesse sido registrada no backend.
 *
 * No fluxo real, conferir a resposta da API antes de salvar
 * o ID e navegar para o chatbot.
 */   

    async function comecarTriagem() {
        const usuario = obterUsuario();
        if (!usuario || usuario.role !== 'paciente') {
            navigate('/login');
            return;
        }

        /*
        * INTEGRAÇÃO CODEX — TRIAGEM ATIVA E ESTADO DO BACKEND
        *
        * Este identificador local ajuda a navegar para uma triagem
        * conhecida pelo navegador, mas não comprova sozinho o estado
        * atual da triagem no backend.
        *
        * Conferir o comportamento de POST /triagens quando já existe
        * uma triagem Aguardando para o paciente.
        *
        * Se não houver triagem_ativa_id local, não presumir que não
        * existe uma triagem pendente no servidor.
        *
        * Tratar respostas de conflito de forma clara, sem afirmar
        * que uma nova triagem foi criada.
        *
        * Não implementar uma rota de consulta ou retomada sem confirmar
        * que ela existe no BFF integrado e que faz parte do escopo.
        */
        const triagemAtiva = localStorage.getItem('triagem_ativa_id');
        if (triagemAtiva) {
            navigate(`/chatbot/${triagemAtiva}`);
            return;
        }

        setIniciando(true);
        setErro('');
        try {
            const resposta = await criarTriagem(usuario.id);
            const triagemId = resposta.data.triagem.id;
            localStorage.setItem('triagem_ativa_id', triagemId);
            navigate(`/chatbot/${triagemId}`);
        } catch (falha) {
            setErro(obterMensagemErro(falha));
        } finally {
            setIniciando(false);
        }
    }

    return(
        <div className='ip-container ip-container-paciente'>
            <div className='ip-content'>
                <div className='ip-left'>
                    <h1 className='sr-only'>Bem vindo, paciente.</h1>
                    <img src={bemVindo} className='img-bemVindo' alt='Bem vindo, paciente.' />

                    <p className='ip-subtitle'>Responda algumas perguntas para avaliar seus sintomas de forma rápida e acompanhe suas triagens anteriores em um só lugar.</p>
                </div>
                <div className='ip-right'>
                    <div className='ip-btn-block'>

                        
                            <button type='button' onClick={comecarTriagem} disabled={iniciando} className='btn-comecarTri'>
                                <span className='icone'>
                                    <i className="bi bi-plus-lg" />
                                </span>
                                <span>
                                    {iniciando ? 'Iniciando...' : 'Começar Triagem'}
                                </span>
                            </button>
                            {erro && <p role='alert'>{erro}</p>}
                        
                        
                            <Link to='/verAnteriores' className='btn-verAnt'>
                                <span className='icone'>
                                    <i className="bi bi-arrow-counterclockwise" />
                                </span>
                                <span >                             
                                        Ver Anteriores
                                </span>
                            </Link>
                        
                    </div>

                    <div className='ip-help'>
                        <button className='btn-dica' onClick={() => setMostrarDica(!mostrarDica)}><i className="bi bi-question-lg" /></button>
                        {
                            mostrarDica && (
                                <div className='help-card'>
                                    <div className='help-header'>
                                        <button className='btn-fechar' onClick={() => setMostrarDica(false)} aria-label='Fechar guia rápido'>
                                            <i className='bi bi-x-lg' />
                                        </button> 
                                        <h2>Guia Rápido</h2>
                                        <p className='help-text'>Ao clicar em <span className='help-bold'>começar triagem</span>, você responderá algumas perguntas de nossa assistente virtual sobre seus sintomas. 
                                        Caso queira  visualizar os dias em triagens anteriores, clique em <span className='help-bold'>ver anteriores</span>.</p>
                                    </div>  
                                   
                                </div>
  
                            )
                        }       
                    </div>
                    
                </div>
                
            </div>

        </div>

    );
}
