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

    async function comecarTriagem() {
        const triagemAtiva = localStorage.getItem('triagem_ativa_id');
        if (triagemAtiva) {
            navigate(`/chatbot/${triagemAtiva}`);
            return;
        }

        const usuario = obterUsuario();
        if (!usuario || usuario.role !== 'paciente') {
            navigate('/login');
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
        <div className='ip-container'>
            <div className='ip-content'>
                <div className='ip-left'>
                    <h1 className='sr-only'>Bem vindo, paciente.</h1>
                    <img src={bemVindo} className='img-bemVindo' alt='Bem vindo, paciente.' />

                    <p className='ip-subtitle'>Responda algumas perguntas para avaliar seus sintomas de forma rápida e acompanhe suas triagens anteriores em um só lugar.</p>
                </div>
                <div className='ip-right'>
                    <div className='ip-btn-block'>

                        
                            <button type='button' className='btn-comecarTri' onClick={comecarTriagem} disabled={iniciando}>
                                <span className='icone'>
                                    <i className="bi bi-plus-lg" />
                                </span>
                                <span>
                                    {iniciando ? 'Iniciando...' : 'Começar Triagem'}
                                </span>
                            </button>

                            {erro && <p>{erro}</p>}
                        
                        
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
