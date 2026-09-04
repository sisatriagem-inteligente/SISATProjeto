import '/src/pages/Home/ComoFun.css';
import cardMarIA from '/src/assets/img/card-marIA.png';
import cardDados from '/src/assets/img/card-dados.png';
import cardAtend from '/src/assets/img/card-atendimento.png';
import comoFunciona from '/src/assets/img/comoFunciona.png';

export default function ComoFunciona() {
    return(
        <section className='comoFun-container' id='como-funciona'>
            <div className='comoFun-content'>
                <img src={comoFunciona} alt='Como Funciona' className='comoFun-header'/>
                <h3 className='comoFun-subtitle'>
                        <span className='subtitle-normal'>Um processo</span>
                        <span className='subtitle-bold'> rápido</span>
                        <span className='subtitle-normal'> e </span> 
                        <span className='subtitle-bold'>seguro</span><br/>
                        <span className='subtitle-normal'>dos</span>
                        <span className='subtitle-bold'> seus dados</span>
                        <span className='subtitle-normal'>.</span>  
                    </h3>

                <div className='card-container'>
                    {/* card sobre o funcionamento do chatbot */}
                    <div className='cards'>
                        <img src={cardMarIA} alt='Prancheta MarIA' className='card-images'/>
                        <h3 className='card-title'>MarIA</h3>
                        <p className='conteudo'>Responda ao Chatbot como você está se sentindo. Perguntas rápidas e objetivas.</p>
                    </div>

                    <p className='arrow'> → </p>

                    
                    <div className='cards'>
                        {/* card sobre os dados */}
                        <img src={cardDados} alt='Nuvem Dados' className='card-images'/>
                        <h3 className='card-title'>Dados</h3>
                        <p className='conteudo'>Nosso sistema analisa seu formulário e identifica prioridades e sinais de alerta.</p>
                    </div>

                    <p className='arrow'> → </p>

                    <div className='cards'>
                        {/* card sobre o funcionamento do atendimento */}
                        <img src={cardAtend} alt='Médico Atendimento' className='card-images'/>
                        <h3 className='card-title'>Atendimento</h3>
                        <p className='conteudo'>Você é encaminhado ao serviço de saúde mais adequado, com mais agilidade.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}