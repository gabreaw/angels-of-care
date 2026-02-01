# Arquitetura do Projeto Angels of Care

## Visão Geral

O **Angels of Care** é uma aplicação web completa para gestão de cuidados domiciliares, conectando famílias a cuidadores qualificados. O sistema é desenvolvido em **React** com **Vite**, utilizando **Supabase** como backend (banco de dados, autenticação e armazenamento) e **Tailwind CSS** para estilização.

---

## Estrutura de Diretórios

```
angels-of-care/
├── public/                  # Arquivos estáticos públicos
├── src/
│   ├── assets/              # Imagens e recursos estáticos da aplicação
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── auth/            # Componentes de autenticação
│   │   ├── financeiro/      # Componentes do módulo financeiro
│   │   ├── layout/          # Componentes de layout (Navbar, Footer)
│   │   └── ui/              # Componentes de UI genéricos
│   ├── lib/                 # Configurações de bibliotecas externas
│   ├── pages/               # Páginas principais da aplicação
│   │   └── financeiro/      # Páginas do módulo financeiro
│   ├── sections/            # Seções de páginas (Hero, Services, Trust)
│   ├── services/            # Serviços de comunicação com API
│   ├── utils/               # Funções utilitárias
│   ├── App.jsx              # Componente principal com rotas
│   ├── index.css            # Estilos globais (Tailwind)
│   └── main.jsx             # Ponto de entrada da aplicação
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── README.md
├── TODO.md
└── vite.config.js
```

---

## Detalhamento dos Arquivos

### Arquivos de Configuração

| Arquivo | Descrição |
|---------|-----------|
| `package.json` | Define dependências (React 19, Supabase, Recharts, Lucide, etc.) e scripts npm |
| `vite.config.js` | Configuração do bundler Vite |
| `tailwind.config.js` | Configuração do Tailwind CSS com tema personalizado (cores: primary, sage, paper, etc.) |
| `postcss.config.js` | Configuração do PostCSS para Tailwind |
| `eslint.config.js` | Configuração do ESLint para linting |

### Pasta `public/`

Contém arquivos estáticos acessíveis diretamente pelo navegador:
- `.htaccess` - Configurações do servidor Apache
- `favicon.png` - Ícone do site
- `imagem-de-capa.jpg` - Imagem principal
- `sitemap.xml` - Mapa do site para SEO

### Pasta `src/assets/`

Recursos visuais da aplicação:
- `logo.png` - Logo principal da Angels of Care
- `logo2.png` - Variação do logo
- `close-up-medico-segurando-paciente.jpg` - Imagem hero

---

## Componentes (`src/components/`)

### `src/components/auth/`

| Arquivo | Descrição |
|---------|-----------|
| `ProtectedRoute.jsx` | **Componente de proteção de rotas**. Verifica autenticação e papel do usuário (admin, prestador, cliente), redirecionando conforme necessário. |

### `src/components/layout/`

| Arquivo | Descrição |
|---------|-----------|
| `Navbar.jsx` | Barra de navegação responsiva com menu mobile e links para páginas públicas |
| `Footer.jsx` | Rodapé com informações de contato e links |

### `src/components/ui/`

| Arquivo | Descrição |
|---------|-----------|
| `FloatingWhatsApp.jsx` | Botão flutuante do WhatsApp com link direto para contato |

### `src/components/financeiro/`

Módulo completo de gestão financeira com os seguintes componentes:

| Arquivo | Descrição |
|---------|-----------|
| `GerenciarCategoriasModal.jsx` | Modal para CRUD de categorias financeiras |
| `InformarPagamentoModal.jsx` | Modal para registrar pagamento de despesas |
| `InformarRecebimentoModal.jsx` | Modal para registrar recebimento de receitas |
| `ListaContasModal.jsx` | Modal para listar/gerenciar contas bancárias |
| `ListaFornecedoresModal.jsx` | Modal para listar fornecedores/clientes |
| `NovaContaModal.jsx` | Modal para criar nova conta bancária |
| `NovaDespesaModal.jsx` | Modal completo para criar/editar despesas com suporte a parcelamento, recorrência e rateio |
| `NovaReceitaModal.jsx` | Modal para criar receitas |
| `NovoContratoModal.jsx` | Modal para criar contratos |
| `NovoFornecedorModal.jsx` | Modal para criar fornecedores/clientes |
| `NovoOrcamentoModal.jsx` | Modal para criar orçamentos/propostas |

---

## Serviços (`src/services/`)

| Arquivo | Descrição |
|---------|-----------|
| `pacientesService.js` | **Service centralizado para operações com pacientes**. Inclui métodos para: fetch de pacientes, evoluções, medicamentos, sinais vitais, plantões, histórico clínico, upload de arquivos e CRUD completo. |
| `supabaseClient.js` | Configuração do cliente Supabase com validação de variáveis de ambiente |

---

## Biblioteca (`src/lib/`)

| Arquivo | Descrição |
|---------|-----------|
| `supabase.js` | Exporta a instância do cliente Supabase criada com URL e chave anônima das variáveis de ambiente |

---

## Utilitários (`src/utils/`)

| Arquivo | Descrição |
|---------|-----------|
| `gerarPropostaDocx.js` | **Geração de documentos Word (.docx)** usando Docxtemplater e PizZip. Preenche templates com dados de orçamentos e baixa automaticamente |
| `whatsapp.js` | Função utilitária `getWhatsAppLink()` para gerar links diretos para WhatsApp com mensagem pré-definida |

---

## Páginas (`src/pages/`)

### Páginas Públicas

| Arquivo | Rota | Descrição |
|---------|------|-----------|
| `Home.jsx` | `/` | Página inicial com seções Hero, Services, Trust e call-to-actions |
| `LoginPage.jsx` | `/login` | Página de autenticação com login por email/senha |
| `CadastroParceiro.jsx` | `/seja-parceiro` | Formulário para profissionais se cadastrarem |
| `CadastroExtra.jsx` | `/seja-parceiro-extra` | Formulário adicional de cadastro |
| `TrabalheConosco.jsx` | `/trabalhe-conosco` | Página de oportunidades de trabalho |

### Portal do Administrador (protegido)

| Arquivo | Rota | Descrição |
|---------|------|-----------|
| `Dashboard.jsx` | `/admin` | Painel principal com cards para Operacional e Administrativo |
| `AdminListaFuncionarios.jsx` | `/admin/funcionarios` | Lista de prestadores com filtros e status |
| `AdminFuncionarios.jsx` | `/admin/funcionarios/novo` | Formulário de novo prestador |
| `AdminDetalhes.jsx` | `/admin/funcionarios/:id` | Detalhes de um prestador |
| `AdminEditar.jsx` | `/admin/funcionarios/:id/editar` | Edição de prestador |
| `AdminPacientes.jsx` | `/admin/pacientes` | Gestão de pacientes com busca e abas (ativos/arquivados) |
| `AdminPacientesNovo.jsx` | `/admin/pacientes/novo` | Cadastro de novo paciente |
| `AdminPacientesDetalhes.jsx` | `/admin/pacientes/:id` | Prontuário completo do paciente |
| `AdminEscalas.jsx` | `/admin/escalas` | Calendário mensal de plantões com filtros por paciente |
| `AdminConfirmacaoEscala.jsx` | `/admin/escalas/confirmacao` | Envio de confirmações via WhatsApp |
| `AdminFinanceiro.jsx` | `/admin/financeiro` | Painel principal financeiro com abas |
| `AdminCandidatos.jsx` | `/admin/candidatos` | Banco de talentos (currículos) |

### Portal do Prestador (protegido)

| Arquivo | Rota | Descrição |
|---------|------|-----------|
| `ProviderHome.jsx` | `/app/home` | Página inicial do prestador |
| `ProviderPaciente.jsx` | `/app/pacientes/:id` | Visualização de paciente para prestador |

### Portal do Cliente (protegido)

| Arquivo | Rota | Descrição |
|---------|------|-----------|
| `ClientHome.jsx` | `/portal/home` | Página inicial do cliente/responsável |

### Páginas do Módulo Financeiro

| Arquivo | Rota | Descrição |
|---------|------|-----------|
| `ContasPagar.jsx` | (via AdminFinanceiro) | Gestão de contas a pagar com filtros, resumo e expansão de linhas |
| `ContasReceber.jsx` | (via AdminFinanceiro) | Gestão de contas a receber |
| `Orcamentos.jsx` | (via AdminFinanceiro) | Lista de orçamentos com geração de proposta Word |
| `Contratos.jsx` | (via AdminFinanceiro) | Gestão de contratos |
| `Relatorios.jsx` | (via AdminFinanceiro) | Relatórios financeiros |

---

## Seções (`src/sections/`)

Componentes de seções reutilizáveis para páginas públicas:

| Arquivo | Descrição |
|---------|-----------|
| `Hero.jsx` | Seção principal com título, descrição e call-to-actions |
| `Services.jsx` | Seção de serviços oferecidos |
| `Trust.jsx` | Seção de confiança/prova social |

---

## Arquivo Principal (`src/App.jsx`)

**Responsável pelo roteamento** da aplicação utilizando `react-router-dom`. Define todas as rotas e quais são protegidas por função:

```jsx
- Rotas públicas: Home, LoginPage, CadastroParceiro, CadastroExtra, TrabalheConosco
- Rotas admin (protegidas): Dashboard, Funcionarios, Pacientes, Escalas, Financeiro
- Rotas prestador (protegidas): ProviderHome, ProviderPaciente
- Rotas cliente (protegidas): ClientHome
```

---

## Tecnologias e Dependências Principais

### Frontend
- **React 19** - Framework UI
- **React Router DOM 7** - Roteamento
- **Tailwind CSS 3.4** - Estilização utility-first
- **Lucide React** - Ícones
- **Recharts** - Gráficos para relatórios
- **React Toastify** - Notificações

### Backend as a Service
- **Supabase** - Autenticação, Banco de dados PostgreSQL, Storage

### Utilitários
- **PizZip** - Manipulação de arquivos ZIP
- **Docxtemplater** - Geração de documentos Word
- **FileSaver** - Download de arquivos

---

## Fluxo de Autenticação

1. Usuário acessa `/login`
2. Faz login com email/senha
3. Sistema verifica papel (`role`) na tabela `funcionarios` ou `pacientes`
4. Redireciona conforme papel:
   - `admin` → `/admin`
   - `prestador` → `/app/home`
   - `cliente` → `/portal/home`

---

## Modelagem de Dados (Principais Tabelas)

- `funcionarios` - Prestadores de serviço (role, nome, telefone, email, status)
- `pacientes` - Pacientes (nome, diagnóstico, responsável, status)
- `plantoes` - Escalas de trabalho (data, horário, status, FKs para paciente e funcionário)
- `evolucoes` - Registros de evolução clínica
- `medicamentos` - Medicações do paciente
- `sinais_vitais` - Aferições de sinais vitais
- `historico_clinico` - Histórico médico
- `financeiro_transacoes` - Transações (receitas/despesas)
- `financeiro_categorias` - Categorias financeiras
- `financeiro_entidades` - Fornecedores/Clientes
- `financeiro_contas` - Contas bancárias
- `financeiro_orcamentos` - Orçamentos/Propostas
- `financeiro_contratos` - Contratos
- `candidatos` - Currículos recebidos

---

## Variáveis de Ambiente (.env)

```
VITE_SUPABASE_URL=URL do projeto Supabase
VITE_SUPABASE_ANON_KEY=Chave anônima do Supabase
VITE_WHATSAPP_PHONE=Número de WhatsApp para contato
```

---

## Como Executar

```bash
# Instalação
npm install

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

---

## Autor

Desenvolvido para **Angels of Care** - Cuidado que conforta, presença que acolhe.

