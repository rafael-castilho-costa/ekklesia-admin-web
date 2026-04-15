# Ekklesia Web Admin - Guia de Setup

## Visão Geral

Aplicação Angular 17+ para administração de igrejas, integrada com REST API. Oferece funcionalidades completas de CRUD para igrejas, pessoas (personas) e membros, com autenticação JWT e controle de acesso baseado em roles.

## Pré-requisitos

- Node.js 18+ com npm 9+
- Angular CLI 17+
- API REST rodando em `http://localhost:8081` (desenvolvimento) ou `https://api.ekklesia.com` (produção)

### Instalação do Node.js

Se não tiver Node.js instalado:
1. Baixe em https://nodejs.org (versão LTS recomendada)
2. Instale seguindo o installer
3. Verifique com: `node -v` e `npm -v`

### Instalação do Angular CLI

```bash
npm install -g @angular/cli@17
```

## Setup do Projeto

### 1. Instalar Dependências

```bash
cd ekklesia-web-admin
npm install
```

### 2. Configurar URL da API

#### Para Desenvolvimento (localhost:8081)

Arquivo: `src/environments/environment.development.ts`

```typescript
export const environment = {
  apiBaseUrl: 'http://localhost:8081'
};
```

#### Para Produção

Arquivo: `src/environments/environment.ts`

```typescript
export const environment = {
  apiBaseUrl: 'https://api.ekklesia.com'
};
```

### 3. Iniciar o Servidor de Desenvolvimento

```bash
npm start
# ou
ng serve
```

O aplicativo estará disponível em: `http://localhost:4200`

## Usando a Aplicação

### 1. Login

- URL: `http://localhost:4200/login`
- Email: `admin@ekklesia.com` (exemplo)
- Senha: `123456` (exemplo)

O sistema carrega automaticamente os dados do usuário autenticado via `/auth/me` e armazena a sessão com localStorage + Angular Signals.

### 2. Dashboard

Após login, o usuário vê:
- Contagem de igrejas, pessoas e membros
- Nome do usuário e igreja
- Role do usuário
- Links rápidos para módulos de CRUD

### 3. Módulos de Gerenciamento

#### Igrejas (`/churches`)
- **Listar**: Visualizar todas as igrejas com busca
- **Criar**: Novo botão leva para formulário vazio
- **Editar**: Clique no ícone de lápis para editar
- **Deletar**: Clique no ícone de lixo com confirmação

Campos:
- Nome (obrigatório)
- CNPJ (obrigatório)
- Cidade (obrigatório)
- Estado (obrigatório)

#### Pessoas (`/personas`)
- **Listar**: Visualizar todas as pessoas com busca por nome/email
- **Criar/Editar**: Formulário completo com seleção de igreja

Campos:
- Igreja (select obrigatório)
- Tipo de Pessoa (select obrigatório)
- CPF/CNPJ (obrigatório)
- Nome (obrigatório)
- Data de Nascimento (obrigatório)
- Estado Civil (select)
- Telefone (obrigatório)
- Email (obrigatório, válido)
- Endereço (obrigatório)

#### Membros (`/members`)
- **Listar**: Visualizar todos os membros com busca por nome da pessoa
- **Criar/Editar**: Formulário com 7 campos

Campos:
- Pessoa (select obrigatório)
- Data de Filiação (obrigatório)
- Data de Batismo
- Batizado? (checkbox)
- Ministério (select)
- Status do Membro (select obrigatório)
- Notas (textarea)

## Arquitetura

```
src/app/
├── core/
│   ├── api/          # Serviços de consumo da REST API
│   ├── auth/         # SessionService, PermissionService
│   ├── guards/       # AuthGuard para proteção de rotas
│   └── interceptors/ # AuthInterceptor para injeção de JWT
├── features/
│   ├── dashboard/    # Dashboard com métricas
│   ├── churches/     # CRUD de igrejas
│   ├── personas/     # CRUD de pessoas
│   └── members/      # CRUD de membros
├── shared/
│   ├── models/       # Interfaces TypeScript (api.models.ts)
│   └── components/   # DataTableComponent reutilizável
├── authentication/   # LoginComponent
└── app.routes.ts     # Routing configuration
```

## Fluxo de Autenticação

1. Usuário submete email/senha em `/login`
2. Sistema faz POST `/auth/login` com credenciais
3. API retorna `{ token, userId, email, ... }`
4. Frontend faz GET `/auth/me` com token no header Authorization
5. SessionService armazena completo SessionUser com `signal()`
6. Sinal persiste automaticamente em localStorage via `effect()`
7. AuthGuard valida autenticação antes de acessar rotas protegidas
8. AuthInterceptor adiciona `Authorization: Bearer {token}` a todos os requests
9. Erro 401 → logout e redireciona para `/login`

## Controle de Acesso

Baseado em roles (ROLE_ADMIN, ROLE_SECRETARY):

- `isAdmin()`: Usuário é administrador
- `canManageChurches()`: Pode criar/editar igrejas (admin)
- `canManagePersonas()`: Pode criar/editar pessoas (admin ou secretary)
- `canManageMembers()`: Pode criar/editar membros (admin ou secretary)
- `canDelete()`: Pode deletar recursos (admin)

Botões de editar/deletar aparecem condicionalmente baseado em permissões.

## Modelos de Dados

Todos os tipos estão centralizados em `src/app/shared/models/api.models.ts`:

- `SessionUser`: Usuário autenticado em memória
- `Church`: Igreja
- `Persona`: Pessoa/indivíduo
- `Member`: Membro da Igreja
- `ApiError`: Estrutura de erro padrão
- Enums: PersonaTypeEnum, MaritalStatusEnum, MinistryEnum, MemberStatusEnum, RoleEnum

## Desenvolvimento

### Adicionar Novo Módulo de CRUD

1. Criar pasta em `src/app/features/{recurso}/`
2. Criar `{recurso}-list.component.ts` com DataTableComponent
3. Criar `{recurso}-form.component.ts` com Reactive Forms
4. Adicionar types em `src/app/shared/models/api.models.ts`
5. Criar API service em `src/app/core/api/{recurso}-api.service.ts`
6. Atualizar rotas em `app.routes.ts`

### Responsive Design

Todos os componentes incluem media queries para:
- **1024px**: Desktop
- **768px**: Tablets
- **600px**: Smartphones grandes
- **480px**: Smartphones pequenos

Tabelas passam para layout de cards em telas pequenas automaticamente.

## Testes

Para rodar testes unitários:

```bash
npm test
# ou
ng test
```

## Build para Produção

```bash
npm run build
# ou
ng build --configuration production
```

Outputs em `dist/ekklesia-web-admin/browser/`

## Troubleshooting

### Erro "Cannot read property 'token' of undefined"
- **Causa**: SessionService não tem sessão ativa
- **Solução**: Fazer login novamente, limpar localStorage em DevTools

### HTTP 401 Unauthorized
- **Causa**: Token expirado ou inválido
- **Solução**: Aplicação faz logout automático, fazer login novamente

### "Import not found: FormsModule"
- **Causa**: Faltou adicionar FormsModule em imports do componente
- **Solução**: Adicionar `FormsModule` ao array `imports` do @Component

### API retorna CORS error
- **Causa**: API não permite requisições de http://localhost:4200
- **Solução**: Configurar CORS na API ou usar proxy dev (ng serve --proxy-config)

## Documentação da API Esperada

A aplicação espera endpoints:

```
POST   /auth/login           { email, password } → { token, userId, ... }
GET    /auth/me              → { userId, email, name, churchId, roles, ... }

GET    /churches             → Church[]
GET    /churches/:id         → Church
POST   /churches             { name, cnpj, city, state } → Church
PUT    /churches/:id         → Church
DELETE /churches/:id         → success

GET    /personas             → Persona[]
GET    /personas/:id         → Persona
POST   /personas             { churchId, personaType, taxId, ... } → Persona
PUT    /personas/:id         → Persona
DELETE /personas/:id         → success

GET    /members              → Member[]
GET    /members/:id          → Member
POST   /members              { personaId, membershipDate, ... } → Member
PUT    /members/:id          → Member
DELETE /members/:id          → success

GET    /metadata/personaTypes     → { id, name }[]
GET    /metadata/maritalStatuses  → { id, name }[]
GET    /metadata/ministries       → { id, name }[]
GET    /metadata/memberStatuses   → { id, name }[]
```

Paginação opcional (aplicação suporta PaginatedResponse<T> com page/size).

## Suporte

Para problemas ou dúvidas:
1. Verifique se a API está rodando
2. Abra DevTools (F12) e verifique Network/Console
3. Verifique logs da API
4. Clone e rode localmente com `ng serve`

---

**Última Atualização**: 2024
**Versão**: 1.0.0
**Mantido por**: Ekklesia Team
