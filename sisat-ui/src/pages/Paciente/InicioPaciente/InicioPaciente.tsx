import './InicioPaciente.css';
import bemVindo from '../../../assets/img/bemvindo-paciente.png';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { obterMensagemErro, obterUsuario } from '../../../services/api';
import { buscarTriagemPorId, criarTriagem } from '../../../services/triagensApi';

export default function InicioPaciente(){

    const navigate = useNavigate();
    const [mostrarDica, setMostrarDica] = useState(false);
    const [iniciando, setIniciando] = useState(false);
    const [erro, setErro] = useState('');



    async function comecarTriagem() {
        const usuario = obterUsuario();
        if (!usuario || usuario.role !== 'paciente') {
            navigate('/login');
            return;
        }

        setIniciando(true);
        setErro('');
        try {
            const triagemAtiva = localStorage.getItem('triagem_ativa_id');
            if (triagemAtiva) {
                const { data } = await buscarTriagemPorId(triagemAtiva);
                if (data.triagem.paciente_id !== usuario.id) {
                    localStorage.removeItem('triagem_ativa_id');
                    setErro('A referência local da triagem não pertence a esta conta.');
                    return;
                }
                if (data.triagem.status === 'Concluida') {
                    localStorage.removeItem('triagem_ativa_id');
                } else if (data.triagem.chat_finalizado) {
                    setErro('Esta triagem não está disponível para continuar a conversa.');
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
            setErro(axios.isAxiosError(falha) && falha.response?.status === 409
                ? 'Já existe uma triagem pendente para esta conta. Não é possível iniciar outra; o BFF ainda não permite localizar automaticamente a triagem sem o ID salvo no navegador.'
                : obterMensagemErro(falha));
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
