/*
 * Enum responsável por definir os perfis
 * de usuário existentes no sistema.
 *
 * Utilizar enum evita escrever valores diferentes
 * para o mesmo perfil, como:
 *
 * "medico"
 * "médico"
 * "MEDICO"
 * "doctor"
 */
export enum UserRole {
  /*
   * Representa o perfil de paciente.
   *
   * No código será utilizado como:
   *
   * UserRole.PACIENTE
   *
   * O valor armazenado no JWT será:
   *
   * "paciente"
   */
  PACIENTE = 'paciente',

  /*
   * Representa o perfil de médico.
   *
   * No código será utilizado como:
   *
   * UserRole.MEDICO
   *
   * O valor armazenado no JWT será:
   *
   * "medico"
   */
  MEDICO = 'medico',
}


/**
 * Como o enum é utilizado

No login do paciente:

role: UserRole.PACIENTE

Isso gera no token:

{
  "role": "paciente"
}

No login médico:

role: UserRole.MEDICO

Isso gera:

{
  "role": "medico"
}

A vantagem é que o TypeScript detecta valores inválidos.

Isto é correto:

role: UserRole.MEDICO

Isto não seria aceito como UserRole:

role: 'doutor'

Esse campo será especialmente importante quando forem criadas as permissões:

Paciente → rotas de paciente
Médico   → rotas médicas
 */