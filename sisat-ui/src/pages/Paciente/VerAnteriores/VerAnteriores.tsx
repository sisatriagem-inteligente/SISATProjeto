import './VerAnteriores.css';
import CardHistorico from '../../../components/CardHistorico/CardHistorico';
import { Link } from 'react-router-dom';

export default function VerAnteriores(){
    return(
        <>
            <main className='verAnt-container'>
                <div className='verAnt-header'>  
                    <div className='header-left'>
                        
                                    <Link to='/inicioPaciente' className='btn-voltar'>
                                        <i className="bi bi-caret-left-fill"></i>
                                        <span className='voltar-header'> Voltar ao início</span>
                                    </Link>
                                
                            <p>Bem vindo(a) ao <span className='historico'>histórico</span>!</p>
                            <h1>Triagens Anteriores</h1>
                        </div> 
                </div>
                <section className='lista-triagens'>
                    <div className='verAnt-card'>
                        <p>Data da triagem</p>
                        <p>Sintomas</p>
                        <p>Status</p>
                    </div>
                    <CardHistorico
                        data="05/07/2026"
                        hora="17:38"
                        sintomas="Dor de cabeça, dor na perna"
                        status="Em andamento"
                    />

                    <CardHistorico
                        data="19/04/2026"
                        hora="12:56"
                        sintomas="Dor no quadril, falta de ar"
                        status="Concluído"
                    />


                </section>

                
            </main>
        
        </>
    )
}