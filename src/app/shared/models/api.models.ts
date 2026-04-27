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
  id: number;
  userId?: number;
  email: string;
  name: string;
  personaId: number;
  churchId: number;
  churchName: string;
  roles: string[];
}

export interface SessionUser {
  id: number;
  userId?: number;
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
  churchName?: string;
  personaType: string;
  taxId: string;
  name: string;
  birthDate: string | null;
  maritalStatus: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface PersonaRequest {
  personaType: string;
  taxId: string;
  name: string;
  churchId?: number;
  birthDate?: string | null;
  maritalStatus?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface PersonaRelationship {
  id: number;
  personaId: number;
  relatedPersonaId: number;
  relationshipType: string;
}

export interface PersonaRelationshipRequest {
  personaId: number;
  relatedPersonaId: number;
  relationshipType: string;
}

/**
 * Members Models
 */
export interface Member {
  id: number;
  personaId: number;
  persona: Persona;
  membershipDate: string | null;
  baptismDate: string | null;
  baptized: boolean | null;
  ministry: string | null;
  statusMember: string;
  notes: string | null;
}

export interface MemberRequest {
  personaId: number;
  membershipDate?: string | null;
  baptismDate?: string | null;
  baptized?: boolean | null;
  ministry?: string | null;
  statusMember: string;
  notes?: string | null;
}

/**
 * Finance Models
 */
export type FinanceTransactionType = 'INCOME' | 'EXPENSE';

export interface FinanceTransaction {
  id: number;
  type: FinanceTransactionType;
  description: string;
  category: string;
  paymentMethod: string;
  amount: number;
  transactionDate: string;
  notes?: string | null;
}

export interface FinanceTransactionRequest {
  type: FinanceTransactionType;
  description: string;
  category: string;
  paymentMethod: string;
  amount: number;
  transactionDate: string;
  notes?: string | null;
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
