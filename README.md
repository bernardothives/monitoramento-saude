# 📊 Monitoramento PAS 2026 - Saúde

Bem-vindo ao repositório oficial do projeto **Monitoramento PAS 2026**.

## 📖 Visão Geral do Projeto

O **Monitoramento PAS 2026** é uma plataforma web desenvolvida especificamente para a Secretaria de Saúde da Prefeitura, com o objetivo central de acompanhar, gerenciar e auditar o cumprimento das metas estabelecidas no **Plano Anual de Saúde de 2026**.

A aplicação foi desenhada para atender dois perfis principais de usuários:
1.  **Departamentos/Setores:** Cada setor possui acesso restrito às suas próprias diretrizes, objetivos e metas. Eles são responsáveis por atualizar o progresso (através de monitoramentos quadrimestrais) e registrar a execução das ações planejadas.
2.  **Administrador (Planejamento):** Uma visão privilegiada global. Este perfil tem acesso a um painel consolidado com indicadores de toda a secretaria, estatísticas de progresso e a capacidade de exportar relatórios físicos e documentais de todos os setores para prestação de contas.

---

## ✨ Principais Funcionalidades

*   **Painel Departamental:** Visualização hierárquica (Diretriz > Objetivo > Meta > Ação) focada apenas nas responsabilidades do usuário logado.
*   **Monitoramento Quadrimestral:** Sistema de atualização de progresso dividido em 3 quadrimestres. Calcula automaticamente o status da meta baseado no valor alcançado.
*   **Status RAG:** Classificação visual de desempenho das metas (🟩 **VERDE**: Atingida, 🟨 **AMARELO**: Atenção, 🟥 **VERMELHO**: Crítico/Não atingida). Exige justificativa detalhada para metas não atingidas.
*   **Gestão de Ações:** Acompanhamento binário (pendente/em execução) das ações táticas atreladas a cada meta.
*   **Painel Administrativo:** Visão global de todas as metas da secretaria com gráficos e totalizadores.
*   **Geração Avançada de Relatórios:** Exportação nativa de relatórios em PDF com compactação em lote (ZIP) utilizando Streams, otimizado para não sobrecarregar o servidor.

---

## 🛠️ Arquitetura e Stack Tecnológico

Este projeto adota uma arquitetura Full-Stack baseada em **Server-Side Rendering (SSR)**, garantindo performance, SEO e segurança nas mutações de dados.

*   **Core:** [Next.js](https://nextjs.org/) (App Router, v16+) com [React 19](https://react.dev/).
*   **Linguagem:** TypeScript (Fortemente tipado de ponta a ponta).
*   **Estilização e UI:** 
    *   [Tailwind CSS v4](https://tailwindcss.com/)
    *   [Radix UI](https://www.radix-ui.com/) (Componentes acessíveis)
    *   Padrões do [Shadcn UI](https://ui.shadcn.com/)
    *   Ícones via `lucide-react`
*   **Banco de Dados & ORM:** 
    *   PostgreSQL (Nuvem - Neon/Prisma Postgres)
    *   [Prisma ORM](https://www.prisma.io/) (v5.22.0)
*   **Visualização de Dados:** Gráficos responsivos com [Recharts](https://recharts.org/).
*   **Geração de Documentos:** `pdf-lib` (PDFs nativos sem dependência de headless browsers) e `archiver` (ZIP streams).
*   **Testes Automatizados:** Testes End-to-End (E2E) com [Playwright](https://playwright.dev/).

---

## 📂 Estrutura do Projeto

Abaixo a organização dos principais diretórios e arquivos:

```text
monitoramento-saude/
├── app/                  # Rotas do Next.js (App Router)
│   ├── actions.ts        # ⚡ Core backend: Server Actions e queries Prisma
│   ├── api/              # Endpoints RESTful (ex: geração de relatórios)
│   ├── dashboard/        # Views dos painéis departamentais e admin
│   ├── login/            # Sistema de autenticação customizado
│   └── ...
├── components/           # Componentes React
│   ├── dashboard/        # Componentes de negócio (tabelas, cards de meta, etc)
│   └── ui/               # Componentes genéricos de design system (Shadcn UI)
├── lib/                  # Utilitários e configurações
│   ├── db.ts             # Cliente Singleton do Prisma
│   └── utils.ts          # Helpers gerais (ex: formatação de classes Tailwind)
├── prisma/               # Camada de Dados
│   ├── schema.prisma     # Modelagem do Banco de Dados
│   └── seed.ts           # Script para popular o banco inicial
├── tests/e2e/            # Cenários de testes automatizados E2E (Playwright)
└── public/               # Assets estáticos (imagens, SVGs, documentos PDF)
```

---

## 🗄️ Modelo de Dados (Entidades)

O banco de dados relacional foi modelado para refletir a estrutura de planejamento governamental:

1.  **Departamento:** Entidade de acesso (Usuários). O departamento "Planejamento" possui a flag `isAdmin = true` para acesso irrestrito.
2.  **Diretriz:** O pilar macro estratégico. (Ex: "Fortalecer a Atenção Básica")
3.  **Objetivo:** Os passos para alcançar a diretriz. Pertence a uma Diretriz.
4.  **Meta:** O indicador mensurável. Pertence a um Objetivo e está associada a um Departamento responsável. Contém alvos numéricos (Linha Base, Meta 2026, Meta 2029).
5.  **Ação:** Passos táticos executáveis para cumprir a meta (Pendente / Em Execução).
6.  **Monitoramento:** O "check-in" periódico. Gerado por Meta a cada Quadrimestre. Registra o valor alcançado, calcula o status RAG e exige justificativa em caso de falha.

---

## 🚀 Como Iniciar o Projeto (Setup Local)

### Pré-requisitos
*   Node.js (versão 18+ recomendada)
*   npm, yarn, pnpm ou bun
*   Instância local do PostgreSQL ou banco em nuvem (Neon, Supabase, etc).

### 1. Clonar e Instalar Dependências
```bash
git clone <url-do-repositorio>
cd projetoMonitoramento/monitoramento-saude
npm install
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz da pasta `monitoramento-saude` e adicione a URL de conexão com o banco de dados:
```env
# Exemplo de conexão PostgreSQL
DATABASE_URL="postgres://<usuario>:<senha>@<host>:5432/<banco>?sslmode=require"
```

### 3. Configurar Banco de Dados
Sincronize o schema com seu banco e popule os dados iniciais:
```bash
# Sincroniza o schema com o banco de dados
npx prisma db push

# (Opcional) Executa o seed para criar departamentos e dados de teste
npm run prisma db seed
```

> ⚠️ **CUIDADO COM `prisma db seed`** — esse comando é **DESTRUTIVO**:
> apaga todos os monitoramentos quadrimestrais e o status de execução das
> ações antes de recriar tudo a partir do `dados.json`. **Use apenas no
> bootstrap inicial de um banco vazio.**
>
> Para atualizar textos/metas em um banco em uso (sem perder dados de
> preenchimento), use o script não-destrutivo:
>
> ```bash
> # 1. Veja o que seria alterado (dry-run, não escreve nada)
> npm run update-metas
>
> # 2. Aplique as mudanças (preserva monitoramentos e ações em execução)
> npm run update-metas:apply
> ```
>
> O `update-metas` faz `upsert` em Diretrizes, Objetivos, Metas e Ações
> baseado em chaves naturais estáveis (`nome` do dept, `titulo` da diretriz,
> `numero` da meta, `id` da ação no JSON). **Nunca toca em Monitoramento
> nem no campo `emExecucao` das ações.**
>
> Se algum item foi **removido** do JSON, o script avisa mas não apaga.
> Para remover de fato, adicione `--apply-deletes` ao comando — **lembrando
> que apagar uma Meta também apaga seus monitoramentos em cascata**.
>
> **Antes de qualquer manutenção em produção**, crie um snapshot do banco
> no console do Prisma (https://console.prisma.io).

### 4. Rodar a Aplicação
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🛠️ Manutenção: Atualizar Diretrizes, Objetivos, Metas ou Ações

Quando precisar alterar **textos, valores ou estrutura** (ex.: corrigir
descrição de uma diretriz, mudar `meta_fisica_2026`, adicionar uma nova
ação a uma meta existente, incluir novas metas), **NÃO** rode o seed
em produção — você perderá todos os preenchimentos dos departamentos.

### Procedimento correto

1. **Backup** — antes de qualquer mudança em produção, crie um snapshot
   no console do Prisma: https://console.prisma.io
2. **Edite o arquivo `dados.json`** com as alterações desejadas.
3. **Dry-run** — veja o que seria alterado, sem tocar no banco:
   ```bash
   npm run update-metas
   ```
   O script imprime cada Diretriz/Objetivo/Meta/Ação que seria criada
   ou atualizada, e avisa sobre itens que existem no banco mas sumiram
   do JSON (órfãos).
4. **Aplicar** — se o dry-run estiver correto:
   ```bash
   npm run update-metas:apply
   ```
   Os dados de preenchimento (Monitoramentos quadrimestrais e
   `emExecucao` das Ações) são **integralmente preservados**.

### Identificação dos registros

O `update-metas` usa chaves naturais estáveis para casar JSON ↔ banco:

| Entidade   | Chave natural                                       |
|------------|-----------------------------------------------------|
| Departamento | `nome`                                            |
| Diretriz   | `titulo` (montado como `DIRETRIZ ${id_no_json}`)    |
| Objetivo   | `titulo` + diretriz pai                             |
| Meta       | `numero` + objetivo + departamento                  |
| Ação       | `id` (do JSON, dentro da meta) + meta pai           |

⚠️ **Não mude o `id` de uma diretriz/objetivo nem o `numero` de uma meta
em uso** — o script trataria como item novo e deixaria o antigo órfão.
Para renomear, ajuste só `descricao`/`indicador`/etc.

### Remover itens

Se você remover uma meta/ação do JSON, o `update-metas` **apenas avisa**
— não apaga. Pra apagar de fato:

```bash
npx tsx prisma/update-from-json.ts --apply --apply-deletes
```

⚠️ Apagar uma Meta apaga em cascata seus Monitoramentos. Considere se
não é melhor manter a meta no JSON e apenas pará-la de preencher.

### Por que não usar `prisma db seed`?

O `seed.ts` é destrutivo por design — faz `deleteMany` em tudo antes
de recriar. Foi feito para bootstrap inicial de banco vazio. Hoje
possui uma trava que aborta se houver Monitoramentos ou Ações em
execução; só roda em banco vazio ou com `CONFIRM_DESTRUCTIVE_SEED=true`.

---

## 🔒 Autenticação e Regras de Segurança

*   **Custom Authentication:** A autenticação foi desenvolvida *in-house* baseada em Cookies (`dept_id` e `is_admin`), validada exclusivamente via **Server Actions**.
*   **Proteção de Rotas:** O middleware e as actions garantem que rotas protegidas não sejam acessadas sem cookie válido.
*   **Prevenção de IDOR:** Uma regra de ouro do projeto. Mesmo autenticado, o backend **sempre** verifica se o usuário (que não é Admin) é dono do recurso que está tentando visualizar ou modificar. Exemplo: um departamento só pode editar `Monitoramentos` cuja `departamentoId` seja idêntica ao seu cookie.

---

## 🧪 Testes Automatizados

O projeto utiliza o Playwright para garantir que fluxos críticos (login, preenchimento de monitoramento, visualização de painéis) não sofram regressões.

Para rodar os testes localmente:
```bash
# Instalar navegadores do Playwright (apenas na primeira vez)
npx playwright install --with-deps

# Rodar todos os testes E2E em modo headless
npx playwright test

# Rodar testes E2E com interface gráfica para debug
npx playwright test --ui
```

---

## 📜 Convenções de Desenvolvimento (Para o Próximo Dev)

Se você está assumindo este projeto, por favor, atente-se a estas regras fundamentais:

1.  **Mutações de Dados:** Use sempre **Server Actions** (`'use server'` no arquivo `app/actions.ts`). Os dados processados devem ser passados como *props* para os Client Components. Evite criar endpoints na pasta `api/` para mutações CRUD padrão do frontend.
2.  **Serverless & Arquivos:** Cuidado com bibliotecas que acessam o sistema de arquivos (`fs`). Como a aplicação faz deploy em ambientes Serverless (como Vercel), evite salvar arquivos localmente. Para gerar PDFs, usamos `pdf-lib` que processa em memória.
3.  **Design System:** Se precisar de um novo componente visual, verifique primeiro se ele já não existe na pasta `components/ui/` ou se pode ser instalado via `npx shadcn@latest add <componente>`.
4.  **Ícones:** Mantenha a consistência utilizando a biblioteca `lucide-react`.

---
