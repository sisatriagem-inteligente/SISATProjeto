import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '../auth/enums/user-role.enum';

export type RequisicaoPaciente = Request & { pacienteId?: string };

/** Valida o JWT apenas na operação de abandono da própria triagem. */
@Injectable()
export class PacienteTriagemGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequisicaoPaciente>();
    const autorizacao = request.headers.authorization;
    const token = /^Bearer\s+(.+)$/i.exec(autorizacao ?? '')?.[1];

    if (!token) {
      throw new UnauthorizedException('Faça login para abandonar a triagem.');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException(
        'Sessão inválida ou expirada. Faça login novamente.',
      );
    }

    if (payload.role !== UserRole.PACIENTE) {
      throw new ForbiddenException(
        'Somente o paciente pode abandonar sua triagem.',
      );
    }
    if (!/^[0-9a-fA-F]{24}$/.test(payload.sub)) {
      throw new UnauthorizedException('Sessão inválida. Faça login novamente.');
    }

    request.pacienteId = payload.sub;
    return true;
  }
}
