import '/src/pages/Home/QuemSomos.css';
import agoraFicou from '/src/assets/img/agoraFicou.png';
import qsIdosos from '/src/assets/img/quemsomos-idosos.png';
import qsCelular from '/src/assets/img/quemsomos-celular.png';


export default function QuemSomos() {
    return(
        <section className='quemsomos-container' id='quem-somos'>

                <div className='quemsomos-content'>
                    <div className='quemsomos-first'>
                        <img src={agoraFicou} className='quemsomos-header' alt='Título: Agora ficou mais fácil ser atendido'/>
                        <h3>
                            
                            <span className='subtitle-normal'>Focados na </span>
                            <span className='subtitle-bold'>saúde pública </span>
                            <span className='subtitle-normal'>do </span>
                            <span className='subtitle-bold'>Brasil</span>
                            <span className='subtitle-normal'>, levamos facilidade e acessibilidade à sua </span>
                            <span className='subtitle-bold'>triagem</span>
                            <span className='subtitle-normal'>.</span>
                        </h3>
                        <img src={qsIdosos} className='idosos-img' alt='Idosos que utilizam o sistema'/>
                    </div>
                    <div className='quemsomos-last'>
                        <div className='quemsomos-left'>
                            <img src={qsCelular} className='qs-celular' alt='Celular com o SISAT aberto'/>
                        </div>
                        <div className='quemsomos-right'>
                         
                                <p>
                                    <span className='subtitle-normal'>Unimos </span>
                                    <span className='subtitle-bold'>tecnologia, inovação e impacto social </span>
                                    <span className='subtitle-normal'>para desenvolver soluções que </span>
                                    <span className='subtitle-bold'>auxiliam profissionais da saúde, otimizam a triagem hospitalar </span>
                                    <span className='subtitle-normal'>e </span>
                                    <span className='subtitle-bold'>melhoram a experiência </span>
                                    <span className='subtitle-normal'>dos pacientes.</span>
                                </p>
                                <p>
                                    <span className='subtitle-normal'>Nosso objetivo é tornar o  </span>
                                    <span className='subtitle-bold'>atendimento </span>
                                    <span className='subtitle-normal'>mais </span>
                                    <span className='subtitle-bold'>eficiente, ágil e humanizado, </span>
                                    <span className='subtitle-normal'>contribuindo para a </span>
                                    <span className='subtitle-bold'>melhoria </span>
                                    <span className='subtitle-normal'>dos </span>
                                    <span className='subtitle-bold'>serviços de saúde </span>
                                    <span className='subtitle-normal'>e </span>
                                    <span className='subtitle-bold'>beneficiando </span>
                                    <span className='subtitle-normal'>tanto </span>
                                    <span className='subtitle-bold'>equipes médicas </span>
                                    <span className='subtitle-normal'>quanto a </span>
                                    <span className='subtitle-bold'>população atendida.</span>
                                </p>
                            
                        </div>
                    </div>

                </div>
        </section>
    )
}
    
