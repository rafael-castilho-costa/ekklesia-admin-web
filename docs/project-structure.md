# Estrutura do Projeto

## Pastas Principais

- `src/app/core`: infraestrutura da aplicação, como API services, auth, guards, interceptors e tenant.
- `src/app/features`: telas é fluxos de negocio agrupados por dominio.
- `src/app/layout`: componentes de layout, shell e navegacao.
- `src/app/shared`: modelos, componentes reutilizaveis, utilitarios e recursos compartilhados.

## Convencoes

- Novas telas devem ficar em `src/app/features/<feature>`.
- Services que conversam com backend devem ficar em `src/app/core/api`.
- Componentes de layout devem ficar em `src/app/layout`.
- Funções reutilizaveis de formatacao, data e erro devem ficar em `src/app/shared/utils`.
- Rotas e pastas usam ingles; textos visiveis ao usuario continuam em portugues.
- Ao renomear rotas antigas, manter redirect temporario para evitar quebra de links.

## Exemplos

```txt
src/app/
  core/
    api/
    auth/
    guards/
    tenant/
  features/
    finance/
    members/
    visitors/
  layout/
    full/
  shared/
    models/
    utils/
```
