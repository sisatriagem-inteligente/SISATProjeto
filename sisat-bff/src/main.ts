/*
 * NestFactory é responsável por criar a aplicação NestJS.
 */
import { NestFactory } from '@nestjs/core';

/*
 * ValidationPipe executa automaticamente as validações
 * definidas nos DTOs com class-validator.
 */
import { ValidationPipe } from '@nestjs/common';

/*
 * AppModule é o módulo principal da aplicação.
 *
 * A partir dele, o NestJS encontra os outros módulos,
 * controllers, services e configurações.
 */
import { AppModule } from './app.module';

/*
 * Função principal responsável por iniciar o backend.
 *
 * Ela é assíncrona porque a criação do servidor
 * e a abertura da porta precisam ser aguardadas.
 */
async function bootstrap() {
  /*
   * Cria a aplicação NestJS utilizando o AppModule
   * como módulo raiz.
   */
  const app = await NestFactory.create(AppModule);

  /*
   * Ativa o CORS.
   *
   * CORS permite que o frontend, que roda em uma origem
   * diferente, faça requisições para o backend.
   *
   * Durante o desenvolvimento:
   *
   * Frontend: http://localhost:5173
   * Backend:  http://localhost:3000
   *
   * origin: '*' permite requisições vindas de qualquer
   * endereço.
   *
   * Isso é conveniente no desenvolvimento, mas em produção
   * deve ser substituído pelo endereço real do frontend.
   */
  app.enableCors({
    origin: '*',
  });

  /*
   * Ativa um ValidationPipe para toda a aplicação.
   *
   * Assim, todos os DTOs usados nos controllers são
   * validados automaticamente.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      /*
       * Remove campos que não estejam declarados no DTO.
       *
       * Exemplo:
       *
       * Se o CadastroDto aceita:
       * cpf, email e password
       *
       * e alguém enviar também:
       * role: "medico"
       *
       * esse campo não será aceito.
       */
      whitelist: true,

      /*
       * Em vez de apenas remover campos extras, faz o
       * NestJS retornar um erro 400 quando eles aparecem.
       *
       * Essa configuração reforça a segurança da API.
       */
      forbidNonWhitelisted: true,

      /*
       * Permite transformar automaticamente o corpo da
       * requisição em uma instância da classe DTO.
       *
       * Isso ajuda o NestJS a aplicar corretamente as
       * validações e conversões de tipos.
       */
      transform: true,
    }),
  );

  /*
   * Inicia o servidor HTTP na porta 3000.
   *
   * O backend ficará disponível em:
   *
   * http://localhost:3000
   */
  await app.listen(3000);
}

/*
 * Executa a função que inicia a aplicação.
 *
 * O uso de void deixa explícito que não precisamos utilizar
 * o valor retornado pela Promise da função bootstrap.
 */
void bootstrap();


/**Como o ValidationPipe age

Quando o frontend envia:

{
  "cpf": "123",
  "password": "123456"
}

o LoginDto rejeita o CPF e o NestJS responde antes de executar o AuthService.

O fluxo fica assim:

Requisição do frontend
        ↓
Controller
        ↓
ValidationPipe
        ↓
DTO
        ↓
Dados válidos?
   ┌────┴────┐
  não       sim
   ↓         ↓
erro 400   AuthService
Sobre o CORS

Durante o desenvolvimento, isto está adequado:

app.enableCors({
  origin: '*',
});

Mais adiante, será melhor limitar para o frontend:

app.enableCors({
  origin: 'http://localhost:5173',
});

Em produção, o endereço seria o domínio oficial do site. */