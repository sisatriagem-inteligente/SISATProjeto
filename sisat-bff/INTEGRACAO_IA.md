# Integração SISAT BFF e IA

Alterações locais de 31/08/2026, somente em sisat-bff e sisat-triage.
Nenhum push, commit ou publicação foi feito. O frontend e as cópias antigas
do projeto não foram alterados.

## Fluxo implementado

1. O frontend cria a triagem com POST /triagens e guarda o id retornado.
2. Envia POST /maria/mensagem ao BFF, com triagem_id e mensagem.
3. O BFF lê o histórico salvo, acrescenta a mensagem atual e chama POST /chat na IA.
4. A IA extrai os dados parciais, confere campos obrigatórios e responde
   com mensagem e finalizada.
5. Se finalizada for false, o BFF salva o turno e devolve a resposta.
6. Se finalizada for true, o BFF chama POST /triagem com o mesmo histórico.
7. A IA confere novamente a coleta e gera a ficha no formato anterior.
8. O BFF valida a ficha, calcula a cor e grava ficha, turno e chat_finalizado
   em uma única atualização no MongoDB.

Finalizar o chat NÃO conclui o atendimento médico: o status continua Aguardando.
Não foi criado banco na IA, WebSocket, streaming, autenticação nova nem logout.
O grafo existente foi preservado.

## Contrato do frontend

POST http://127.0.0.1:3000/maria/mensagem

```json
{
  "triagem_id": "ID_REAL_DA_TRIAGEM",
  "mensagem": "Estou com febre."
}
```

Resposta HTTP 201 do BFF:

```json
{
  "mensagem": "Há quanto tempo você está com esses sintomas?",
  "finalizada": false
}
```

O frontend não chama o Ollama nem as duas rotas Python diretamente.
Desabilite o envio enquanto aguarda a resposta. Só trate a mensagem como
confirmada após o sucesso HTTP. Em erro, mantenha o texto para nova tentativa.
Ao receber finalizada=true, bloqueie novas mensagens e consulte a ficha.

GET /triagens/:id agora inclui mensagens e chat_finalizado dentro de triagem.
Cada mensagem tem autor (paciente/maria), texto e enviada_em.

## Contrato interno BFF -> IA

POST /chat e POST /triagem recebem:

```json
{
  "triagem_id": "id",
  "messages": [
    { "role": "user", "content": "Estou com febre." },
    { "role": "assistant", "content": "Há quanto tempo?" },
    { "role": "user", "content": "Há dois dias." }
  ]
}
```

O histórico deve terminar com role=user. Não aceita role=system, mensagens
vazias, mais de 100 mensagens ou conteúdo individual maior que 4000 caracteres.
O id é transportado, mas não persistido pela IA.

POST /chat retorna somente mensagem e finalizada.
POST /triagem preserva a ficha direta: dados_paciente, dados_triagem,
resumo_triagem e hipoteses_clinicas_iniciais. Não retorna envelope de chat.

## Regras e limites

- Obrigatórios: nome, idade inteira de 0 a 130, sexo, queixa, pelo menos um
  sintoma, duração e intensidade declarada (leve/moderada/intensa).
- Informações complementares e hipóteses podem ser listas vazias.
- Campos ausentes são null na coleta parcial. Não são substituídos por zero,
  valores inventados ou "Não informado" para conseguir concluir.
- A conclusão é calculada pelo código, não por uma frase do modelo.
- Textos extraídos são comparados com mensagens do paciente. Dados que aparecem
  apenas nas perguntas do assistant não são aceitos como informação fornecida.
- Se houver erro de cópia, há no máximo uma nova tentativa de extração.
  Se houver somente um sintoma conferido e nenhuma queixa, ele preenche a queixa.
  Não há correção de sintomas por semelhança de palavras.
- Idade escrita em palavras pode exigir que o paciente responda em algarismos.
- A conferência textual não prova correção semântica: negações, ambiguidades,
  correções e relatos complexos ainda exigem avaliação da equipe.
- Diante de "não sei", "não lembro", "não quero" ou "prefiro não" com coleta
  incompleta, orienta atendimento presencial, sem finalizar automaticamente.
  Isso não cria fila especial nem fluxo de atendimento manual no sistema.
- Resumo, perguntas e hipóteses continuam dependendo da qualidade do modelo.
- A regra existente leve -> verde, moderada -> amarelo, intensa -> vermelho
  foi mantida como regra do projeto escolar. Não implementa Manchester e não
  deve ser usada como classificação clínica validada ou substituir atendimento.

## Proteções no BFF

- Validação do JSON e de todos os objetos da ficha antes de salvar.
- Strings são aparadas; "Ligeira" vira "leve". Valores desconhecidos são rejeitados.
- Erro de conexão/tempo: HTTP 503. Resposta inválida da IA: HTTP 502.
- Falha em qualquer chamada não grava o turno atual nem uma ficha parcial.
- Uma trava em memória bloqueia envio simultâneo na mesma instância (409).
- Uma condição de versão no MongoDB impede sobrescrita entre instâncias (409).
- Impede chat após coleta finalizada, cor já definida, médico atribuído ou
  atendimento concluído.
- A trava em memória não é fila distribuída; não adicionamos Redis.
- Não há chave de idempotência para falha de rede depois da gravação no banco.
  Se a resposta se perder, consulte GET /triagens/:id antes de reenviar.

## Como iniciar neste computador

Ollama instalado em E:\SISAT-IA\Ollama, modelo llama3 já baixado.
Mantenha o aplicativo Ollama executando e o MongoDB local ativo.

PowerShell da IA:

```powershell
cd "C:\Users\Dell\Desktop\TCC\30-08 backup\SISATProjeto\sisat-triage"
$env:UV_PROJECT_ENVIRONMENT = "E:\SISAT-IA\ambientes\sisat-triage"
$env:UV_CACHE_DIR = "E:\SISAT-IA\cache"
$env:UV_PYTHON_INSTALL_DIR = "E:\SISAT-IA\python"
uv run --no-sync uvicorn main:app --reload
```

PowerShell do BFF:

```powershell
cd "C:\Users\Dell\Desktop\TCC\30-08 backup\SISATProjeto\sisat-bff"
$env:MARIA_API_URL = "http://127.0.0.1:8000"
$env:MARIA_TIMEOUT_MS = "360000"
npm run start:dev
```

O BFF lê variáveis do processo; criar um .env sozinho não as carrega.
A IA usa load_dotenv e admite OLLAMA_MODEL e OLLAMA_BASE_URL, mantendo llama3
e http://127.0.0.1:11434 por padrão.
O timeout do BFF vale para cada chamada Python, não para a soma das duas.
O frontend deve tolerar esse tempo. Não foi modificado neste trabalho.

## Testes reproduzíveis

Na pasta sisat-triage:

```powershell
& "E:\SISAT-IA\ambientes\sisat-triage\Scripts\python.exe" -X utf8 -m unittest tests.test_integracao_chat -v
```

Na pasta sisat-bff:

```powershell
npm test -- --runInBand --runTestsByPath src/maria/maria.service.spec.ts
$env:SISAT_TEST_MONGO = "1"
npm test -- --runInBand --runTestsByPath src/maria/maria.mongo.spec.ts
```

Para incluir Ollama/FastAPI reais no teste Mongo:

```powershell
$env:SISAT_TEST_IA = "1"
npm test -- --runInBand --runTestsByPath src/maria/maria.mongo.spec.ts
Remove-Item Env:SISAT_TEST_IA
Remove-Item Env:SISAT_TEST_MONGO
```

O teste Mongo usa exclusivamente sisat_integracao_codex_teste.
Cria documentos fictícios e remove somente os IDs criados naquela execução.
Não apaga bancos ou coleções e não modifica BD_SISAT.
Testes unitários usam respostas simuladas; não demonstram qualidade clínica.

## Arquivos deste trabalho

BFF:

- src/maria/maria.service.ts: duas chamadas, validação, limites e erros.
- src/triagens/triagem.service.ts: gravação atômica e consulta do histórico.
- src/triagens/schemas/triagem.schema.ts: chat_finalizado e import relativo.
- src/maria/maria.service.spec.ts: testes unitários da integração.
- src/maria/maria.mongo.spec.ts: persistência real isolada e teste HTTP opcional.
- INTEGRACAO_IA.md: este documento.

IA:

- app/presentation_layer/routes.py: /chat, modelos de resposta e erros.
- app/presentation_layer/controller.py: conversão compartilhada e conversa.
- app/presentation_layer/request_models.py: validação do histórico.
- app/cognitive_layer/chat.py: extração, conferência e decisão de conclusão.
- app/cognitive_layer/schemas.py: schemas parcial/chat/final e limites.
- app/cognitive_layer/prompts.py: instruções de coleta e ficha.
- app/cognitive_layer/mar_ia_agent.py: configuração local e limite correto de geração.
- app/cognitive_layer/structured_output.py: coleta validada antes da ficha.
- tests/test_integracao_chat.py: testes independentes do Ollama.

Nenhuma dependência nova foi instalada e os lockfiles foram preservados.

## Verificação executada

- TypeScript: compilação sem emissão de arquivos aprovada.
- ESLint do MariaService aprovado.
- 14 testes Python de contrato e coleta aprovados.
- 23 testes unitários do MariaService aprovados.
- 3 testes de persistência no MongoDB isolado aprovados.
- Teste HTTP completo com FastAPI/Ollama reais aprovado: relato fictício de
  João, 18 anos, febre leve. Retornou HTTP 201/finalizada=true, persistiu duas
  mensagens, idade 18, cor verde e manteve status Aguardando.
  A execução da suíte com esse cenário levou aproximadamente 97 segundos.
- Segundo cenário real aprovado, com duas mensagens: Lucas informou nome,
  idade, sexo e dor de cabeça; a IA perguntou a duração com finalizada=false.
  A segunda mensagem informou apenas duração e intensidade moderada.
  A IA usou o histórico e concluiu com finalizada=true. O MongoDB guardou quatro
  mensagens, nome Lucas, idade 25, intensidade moderada, cor amarela e status
  Aguardando. O cenário completo levou aproximadamente 104 segundos.
- Total: 42 verificações aprovadas (14 Python + 23 BFF + 3 Mongo + 2 cenários
  reais). A base de testes ficou sem documentos ao final.
- Os primeiros ensaios reais detectaram erros de grafia/extração e não passaram.
  Foram ajustados os exemplos e o modo JSON da coleta; os números acima se
referem aos testes aprovados após esses ajustes.

Avisos das bibliotecas: o TestClient instalado emite aviso de futura migração
de httpx para httpx2. Não foi instalada outra dependência apenas para silenciar
esse aviso. Não foram executados os scripts antigos que chamam modelos ao
importar o arquivo; os comandos acima selecionam explicitamente os testes novos.

Referência técnica consultada: a extração usa o modo JSON com validação Pydantic;
a ficha usa JSON Schema, conforme as opções da
[integração oficial ChatOllama](https://reference.langchain.com/python/langchain-ollama/chat_models/ChatOllama/with_structured_output).
