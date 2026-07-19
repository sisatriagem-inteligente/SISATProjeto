// Decorators utilizados para criar as rotas HTTP.
import {
  Body,
  Controller,
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

  /*
   * Cadastro público de pacientes.
   *
   * Rota completa:
   * POST /auth/paciente/cadastro
   *
   * Como esta rota cria um novo recurso, o NestJS
   * responde por padrão com HTTP 201 Created.
   */
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