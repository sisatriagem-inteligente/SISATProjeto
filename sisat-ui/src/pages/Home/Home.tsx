import '/src/pages/Home/Home.css';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import celHall from '/src/assets/img/celularHall.png';
import sisatEscrito from '/src/assets/img/SiSAT.png';
import ComoFunciona from './ComoFun';
import QuemSomos from './QuemSomos';

export default function Home() {

    const location = useLocation();

    useEffect(() => {
        if(location.hash){
            const id = location.hash.replace("#","");

            setTimeout(() => { //esse setTimeOut garante que a página já terminou de renderizar antes de procuara a seção.
                document.getElementById(id)?.scrollIntoView({
                    behavior:"smooth",
                });
            },100);
        }
    }, [location]);

    return (
        <>

            <section className="home-container" id='inicio'>
            {/* secção da home */}
                <div className="home-content">

                    {/* esse h1 não vai ser visto. ele está sendo usado apenas para direcionar o navegador */}
                    <h1 className='sr-only'> SISAT - Sistema Inteligente de Saúde e Atendimento</h1>
                    <div className='home-left'>

                        <img src={sisatEscrito} alt='Logo do SISAT' className='logo-escrito'/>

                        {/* separando para dar negrito só nas palavras necessárias */}
                        <h2 className='home-subtitle'>
                            <span className='subtitle-normal'>O</span>
                            <span className='subtitle-bold'> começo</span><br/>
                            <span className='subtitle-normal'>de todo bom</span> <br/>
                            <span className='subtitle-bold'>atendimento</span>
                            <span className='subtitle-normal'>.</span>
                            
                        </h2>

                        {/* esse i ta importando o cadeadinho dos icones do bootstrap */}
                        <p className='home-seguranca'><i className="bi bi-lock-fill"></i>Triagem inteligente, rápida e segura.</p>

                        <button className='comeceTriagem'>
                            <Link to='/cadastro' className='link-comece'>Comece sua triagem →</Link>
                        </button>

                        <button className='jaTenhoConta'>
                            <Link to='/login' className='link-jaTenho'>Já tenho conta </Link>
                        </button>
                    </div>
                    <div className='home-right'>
                        <img src={celHall} alt='Imagem de um celular com a tela do SISAT' className='celular-image'/>
                    </div>
                <p className='comoFunciona'><i className="bi bi-arrow-down-circle"></i> Como Funciona</p>
                </div>
                
            </section>

            <ComoFunciona />

            <QuemSomos />
        </>
    )
}