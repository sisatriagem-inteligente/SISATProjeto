// Decorators utilizados para criar as rotas HTTP.
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';

// Service que contém as regras de autenticação.
import { AuthService } from './auth.service';

// DTO do cadastro do paciente.
import { CadastroDto } from './dto/cadastro.dto';

// DTO do login do paciente.
import { LoginDto } from './dto/login.dto';

// DTO do login do médico.
import { LoginMedicoDto } from './dto/login-medico.dto';
import { ValidateRecoveryAnswerDto } from './dto/validate-recovery-answer.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetupRecoveryDto } from './dto/setup-recovery.dto';
import { CompleteRecoverySetupDto } from './dto/complete-recovery-setup.dto';
import { RECOVERY_QUESTIONS } from './recovery-questions';

/*
 * Define o prefixo de todas as rotas deste controller.
 *
 * Todas as rotas começarão com:
 * /auth
 */
@Controller('auth')
export class AuthController {
  /*
   * O NestJS injeta automaticamente o AuthService
   * para que os métodos do controller possam utilizá-lo.
   */
  constructor(
    private readonly authService: AuthService,
  ) {}
//a rota devolve as três perguntas fixas na ordem usada no cadastro
  @Get('paciente/perguntas-recuperacao')
  obterPerguntasRecuperacao() {
    return { questions: RECOVERY_QUESTIONS };
  }

  /*
   * Cadastro público de pacientes.
   *
   * Rota completa:
   * POST /auth/paciente/cadastro
   *
   * Como esta rota cria um novo recurso, o NestJS
   * responde por padrão com HTTP 201 Created.
   */
  //as respostas de recuperação poder sem configuradas na etapa seguinte
  @Post('paciente/cadastro')
  cadastrarPaciente(
    /*
     * @Body() captura o JSON enviado pelo frontend.
     *
     * O CadastroDto valida CPF, e-mail e senha antes
     * de o método do service ser executado.
     */
    @Body() cadastroDto: CadastroDto,
  ) {
    /*
     * Encaminha os dados já validados para o service.
     */
    return this.authService.register(cadastroDto);
  }
//a rota recebe o setup token e as três respostas para concluir a configuração inicial
  @HttpCode(HttpStatus.OK)
  @Post('paciente/concluir-cadastro')
  concluirCadastro(@Body() dto: CompleteRecoverySetupDto) {
    return this.authService.completeRecoverySetup(dto);
  }
//essa é a alternativa para configurar ou substituir as respostas usando CPF e senha atual.
  @HttpCode(HttpStatus.OK)
  @Post('paciente/configurar-recuperacao')
  configurarRecuperacao(@Body() dto: SetupRecoveryDto) {
    return this.authService.setupRecovery(dto);
  }
//confere uma resposta e devolve uma autorização temporária
  @HttpCode(HttpStatus.OK)
  @Post('paciente/validar-resposta-recuperacao')
  validarRespostaRecuperacao(@Body() dto: ValidateRecoveryAnswerDto) {
    return this.authService.validateRecoveryAnswer(dto);
  }
//usa essa autorização para salvar a nova senha.
  @HttpCode(HttpStatus.OK)
  @Post('paciente/redefinir-senha')
  redefinirSenha(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  /*
   * Login do paciente.
   *
   * Rota completa:
   * POST /auth/paciente/login
   */
  @HttpCode(HttpStatus.OK)
  @Post('paciente/login')
  loginPaciente(
    /*
     * O LoginDto valida o CPF e a senha enviados.
     */
    @Body() loginDto: LoginDto,
  ) {
    /*
     * Chama o método responsável pela autenticação
     * do paciente.
     */
    return this.authService.login(loginDto);
  }

  /*
   * Login do médico.
   *
   * Rota completa:
   * POST /auth/medico/login
   */
  @HttpCode(HttpStatus.OK)
  @Post('medico/login')
  loginMedico(
    /*
     * O LoginMedicoDto valida o formato do e-mail,
     * o domínio @sisat.com e a senha.
     */
    @Body() loginMedicoDto: LoginMedicoDto,
  ) {
    /*
     * Encaminha os dados ao método específico
     * de autenticação médica.
     */
    return this.authService.loginMedico(
      loginMedicoDto,
    );
  }
}
