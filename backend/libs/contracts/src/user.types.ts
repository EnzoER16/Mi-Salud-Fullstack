export enum UserRole {
  PATIENT = 'Paciente',
  DOCTOR = 'Doctor',
}

export interface RegisterUserPayload {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginUserPayload {
  email: string;
  password: string;
}

export interface PublicUser {
  id_user: string;
  username: string;
  email: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
}