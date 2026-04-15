/**
 * API Response Wrapper
 */
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface EnumOption {
  value: string;
  description: string;
}

/**
 * Authentication Models
 */
export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthLoginResponse {
  token: string;
}

export interface AuthMeResponse {
  userId: number;
  email: string;
  name: string;
  personaId: number;
  churchId: number;
  churchName: string;
  roles: string[];
}

export interface SessionUser {
  userId: number;
  email: string;
  name: string;
  personaId: number;
  churchId: number;
  churchName: string;
  roles: string[];
  token: string;
}

/**
 * Churches Models
 */
export interface Church {
  id: number;
  name: string;
  cnpj: string;
  city: string;
  state: string;
}

export interface ChurchRequest {
  name: string;
  cnpj: string;
  city: string;
  state: string;
}

/**
 * Personas Models
 */
export interface Persona {
  id: number;
  churchId: number;
  personaType: string;
  taxId: string;
  name: string;
  birthDate: string;
  maritalStatus: string;
  phone: string;
  email: string;
  address: string;
}

export interface PersonaRequest {
  churchId: number;
  personaType: string;
  taxId: string;
  name: string;
  birthDate: string;
  maritalStatus: string;
  phone: string;
  email: string;
  address: string;
}

/**
 * Members Models
 */
export interface Member {
  id: number;
  personaId: number;
  persona?: Persona;
  membershipDate: string;
  baptismDate: string;
  baptized: boolean;
  ministry: string;
  statusMember: string;
  notes: string;
}

export interface MemberRequest {
  personaId: number;
  membershipDate: string;
  baptismDate: string;
  baptized: boolean;
  ministry: string;
  statusMember: string;
  notes: string;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * Enums
 */
export enum PersonaTypeEnum {
  NATURAL_PERSON = 'NATURAL_PERSON',
  LEGAL_PERSON = 'LEGAL_PERSON'
}

export enum MaritalStatusEnum {
  SOLTEIRO = 'SOLTEIRO',
  CASADO = 'CASADO',
  DIVORCIADO = 'DIVORCIADO',
  VIUVO = 'VIUVO'
}

export enum MinistryEnum {
  WORSHIP = 'WORSHIP',
  WOMEN = 'WOMEN',
  MEN = 'MEN',
  YOUTH = 'YOUTH',
  CHILDREN = 'CHILDREN',
  PASTORAL = 'PASTORAL'
}

export enum MemberStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  VISITOR = 'VISITOR'
}

export enum RoleEnum {
  ROLE_ADMIN = 'ROLE_ADMIN',
  ROLE_SECRETARY = 'ROLE_SECRETARY'
}
