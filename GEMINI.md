# Projeto Monitoramento PAS 2026

## Visão Geral do Projeto
O **Monitoramento PAS 2026** é uma plataforma web desenvolvida para a Prefeitura com o objetivo de acompanhar e gerenciar o cumprimento do Plano Anual de Saúde de 2026. A aplicação permite que diferentes departamentos visualizem suas diretrizes e atualizem o progresso (monitoramentos quadrimestrais) e a execução de ações de suas metas específicas. Existe também uma visão privilegiada de "Administrador" (restrita ao perfil de Planejamento) que acessa um painel global com indicadores e a funcionalidade de exportar relatórios físicos/documentais de todos os setores.

## Arquitetura e Tecnologias
Este é um projeto Full-Stack focado em Server-Side Rendering e fortemente tipado.

*   **Framework Base:** Next.js (App Router, v16+) e React 19.
*   **Linguagem:** TypeScript.
*   **Estilização:** Tailwind CSS v4, componentes Radix UI (padrão Shadcn UI) e `lucide-react` para ícones.
*   **Banco de Dados & ORM:** PostgreSQL hospedado na nuvem (Neon/Prisma Postgres) gerenciado através do Prisma ORM (v5.22.0).
*   **Visualização de Dados:** Gráficos de barra empilhada e percentual usando `recharts`.
*   **Geração de Relatórios:** Utiliza `pdf-lib` para montar PDFs nativamente no backend e `archiver` para compactar pacotes ZIP via Streams de Node.js sem gargalos de I/O de disco.
*   **Autenticação:** Sistema customizado *in-house* via Cookies (`dept_id` e `is_admin`) e validação via Server Actions.

## Estrutura de Diretórios Principal
*   `app/`: Contém as rotas do Next.js (App Router).
    *   `app/actions.ts`: Camada principal de serviço do backend. Contém todas as **Server Actions** e *queries* do banco.
    *   `app/dashboard/`: Painel departamental e administrativo.
    *   `app/api/reports/pdf/route.ts`: Endpoint da API responsável por processar e zipar os relatórios em PDF.
*   `components/`: Componentes visuais. Os subdiretórios dividem componentes de interface (`ui/`) de componentes de negócio (`dashboard/`).
*   `lib/`: Utilitários gerais (`utils.ts`) e o cliente *singleton* do Prisma (`db.ts`).
*   `prisma/`: Modelagem do esquema de banco de dados (`schema.prisma`) e *seeds* iniciais.
*   `tests/e2e/`: Cenários de testes End-to-End.

## Mapa de Entidades (Prisma)
1.  **Departamento:** Usuários/Setores do sistema. O departamento "Planejamento" possui a flag `isAdmin = true`.
2.  **Diretriz -> Objetivo -> Meta:** Hierarquia de negócio do planejamento de saúde.
3.  **Acao:** Tarefas binárias (pendente/em execução) atreladas às metas.
4.  **Monitoramento:** Registro gerado por Meta/Quadrimestre. Contém o cálculo do status de andamento (`VERDE`, `AMARELO`, `VERMELHO`), o valor alcançado e a justificativa documental obrigatória caso a meta não seja cumprida no período.

## Compilação e Execução

### Comandos Locais
*   **Servidor de Desenvolvimento:** `npm run dev`
*   **Build de Produção:** `npm run build`
*   **Inicializar o servidor após build:** `npm run start`
*   **Rodar Linting:** `npm run lint`

### Configuração do Banco
Para testes locais e sincronização, garanta que o arquivo `.env` na raiz do projeto possua o apontamento correto para a base de produção/staging no Vercel/Prisma Data Platform:
```env
DATABASE_URL="postgres://<usuario>:<senha>@<host>:5432/<banco>?sslmode=require"
```

## Convenções de Desenvolvimento e Diretrizes
*   **Server Actions:** Todas as mutações e buscas de dados devem ocorrer no backend utilizando Server Actions (`'use server'`). Os dados são passados como *props* para os Client Components.
*   **Componentes de UI:** Siga os padrões do Shadcn UI presentes na pasta `components/ui/`. Prefira `lucide-react` para os ícones e `recharts` para as estatísticas.
*   **Autenticação Restrita:** Para todas as funções em `actions.ts` e rotas de API, o acesso deve ser conferido localmente via Cookie antes de qualquer query (`getCurrentUser`). Funcionalidades exclusivas da secretaria usam verificação imperativa `user.isAdmin === true`.
*   **Prevenção de IDOR:** Mesmo quando logado, sempre confira se o usuário (que não é Admin) é dono do recurso que está tentando alterar (exemplo: atualizar apenas o monitoramento que tem a `departamentoId` igual ao cookie do usuário).
*   **Testes E2E:** Funcionalidades críticas (como Autenticação e Monitoramento de Fluxos) devem ser cobertas usando os recursos do `@playwright/test` na pasta `tests/e2e/`.
*   **Ambiente Serverless Vercel:** Devido às restrições do Vercel Webpack, ao gerar documentos PDF, não use bibliotecas que tentam carregar dados dinâmicos utilizando `fs` (File System do Node) para evitar quebras em produção com o erro *500 Internal Server Error*. Prefira bibliotecas que não tocam o disco como `pdf-lib`.