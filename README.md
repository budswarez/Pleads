# PLeads - Lead Capture System

Modern TypeScript application for capturing and managing business leads using Google Places API and Supabase.

**Features**: Google Places API (New) • Auto-fetch neighborhoods • Multi-select search by neighborhood • Auto-sync with Supabase • TypeScript strict mode • 41 automated tests • Toast notifications • Keyboard navigation

## Prerequisites

- [Node.js](https://nodejs.org/) (Version 18 or higher recommended)
- [Git](https://git-scm.com/)

## Installation

1. **Clone the repository** (or copy the files):
   ```bash
   git clone <repository-url>
   cd PLeads
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   - Copy the `.env.example` file to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` and add your Google Places API key:
     ```
     VITE_GOOGLE_PLACES_KEY=your_api_key_here
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

## Running Locally

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

---

## Obtendo as Chaves de API

### Google Places API

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. No menu lateral, vá para **APIs & Services > Library**
4. Busque por **"Places API (New)"** e clique em **Enable**
   - **IMPORTANTE**: Este projeto usa a API **New** (`places.googleapis.com`), não a Legacy (`maps.googleapis.com`)
5. Vá para **APIs & Services > Credentials**
6. Clique em **Create Credentials** e selecione **API Key**
7. **IMPORTANTE - Configure restrições de segurança**:
   - Clique na API key criada para editá-la
   - Em **Application restrictions**, selecione:
     - **HTTP referrers** (para desenvolvimento web)
     - Adicione `http://localhost:*` e seu domínio de produção
   - Em **API restrictions**, selecione **Restrict key**
     - Marque apenas "Places API"
   - Clique em **Save**
8. Copie a API key e adicione ao arquivo `.env`

**Custo**: A Places API tem uma camada gratuita de $200/mês. [Veja os preços aqui](https://cloud.google.com/maps-platform/pricing).

### Supabase

1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Clique em **New Project**
3. Preencha os dados do projeto:
   - **Name**: Nome do seu projeto
   - **Database Password**: Senha forte (salve-a em local seguro)
   - **Region**: Escolha a região mais próxima
4. Aguarde a criação do projeto (leva ~2 minutos)
5. No dashboard do projeto, vá para **Settings > API**
6. Copie as seguintes informações para o `.env`:
   - **Project URL**: `VITE_SUPABASE_URL`
   - **anon public**: `VITE_SUPABASE_ANON_KEY`
   - **⚠️ NÃO use a service_role key** (ela tem acesso total ao banco)

### Configurar Row-Level Security no Supabase (CRÍTICO)

Para proteger seus dados, você DEVE habilitar Row-Level Security:

1. No Supabase Dashboard, vá para **SQL Editor**
2. Execute o seguinte SQL para criar as tabelas com RLS:

```sql
-- Criar tabelas com RLS habilitado
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  category TEXT,
  category_id TEXT,
  phone TEXT,
  website TEXT,
  rating NUMERIC,
  user_ratings_total INTEGER,
  status TEXT DEFAULT 'NEW',
  notes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  neighborhoods JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(city, state)
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  query TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE statuses (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso público (ajuste conforme necessário)
CREATE POLICY "Allow public access" ON leads FOR ALL USING (true);
CREATE POLICY "Allow public access" ON locations FOR ALL USING (true);
CREATE POLICY "Allow public access" ON categories FOR ALL USING (true);
CREATE POLICY "Allow public access" ON statuses FOR ALL USING (true);
```

**Nota**: O exemplo acima usa políticas públicas. Para produção, implemente autenticação e restrinja o acesso por `user_id`.

---

## Segurança

### ⚠️ IMPORTANTE: Nunca Comite o Arquivo .env

O arquivo `.env` contém credenciais sensíveis e **NUNCA deve ser commitado** ao Git. Ele já está no `.gitignore`, mas verifique antes de fazer commit:

```bash
# Verificar o que será commitado
git status

# Se o .env aparecer, remova-o
git rm --cached .env
```

### Rotação de Chaves

Se você suspeita que suas chaves foram expostas:

1. **Google Places API**: Revogue a key antiga no Google Cloud Console e crie uma nova
2. **Supabase**: Gere uma nova anon key no Supabase Dashboard (Settings > API > Reset anon key)
3. Atualize o `.env` local com as novas credenciais
4. Se as chaves foram commitadas no Git, veja o arquivo [SECURITY.md](SECURITY.md) para limpar o histórico

---

## Comandos Disponíveis

### Desenvolvimento
```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build de produção
npm run preview

# Verificação de tipos TypeScript
npm run type-check

# Linter
npm run lint
```

### Testes
```bash
# Rodar todos os testes (watch mode)
npm test

# Rodar testes uma vez
npm run test:run

# Rodar testes com interface visual
npm run test:ui

# Gerar relatório de cobertura
npm run test:coverage
```

**Cobertura de testes atual**: 41 testes passando (27 store + 14 services)

---

## Troubleshooting

### Erro: "API Key inválida"
- Verifique se a API Key está correta no arquivo `.env`
- Confirme que a **Places API (New)** está habilitada no Google Cloud Console (não a Legacy)
- Verifique se não há restrições de domínio bloqueando `localhost`
- Tente criar uma nova API key sem restrições para testar

### Busca retorna apenas 20 resultados
- Este é o limite por página da Google Places API (New). A paginação busca até ~60 resultados por query
- Para mais resultados, cadastre bairros na "Gestão de Locais" e selecione múltiplos na varredura
- Cada bairro gera uma query separada, multiplicando os resultados encontrados

### Erro: "Could not find schema cache" (Supabase)
- Execute o SQL de criação das tabelas no SQL Editor do Supabase
- Verifique se as tabelas foram criadas corretamente em **Database > Tables**
- Confirme que o RLS está habilitado e as políticas estão configuradas

### Erro de CORS ao fazer requisições
- Verifique se a URL do Supabase está correta (deve terminar com `.supabase.co`)
- Confirme que está usando a anon key (não a service_role key)

### Leads não aparecem após busca
- Verifique se você selecionou Estado e Cidade antes de buscar
- Confirme que há localizações cadastradas em "Gestão de Locais"
- Abra o console do navegador (F12) e verifique se há erros
- Verifique se a Places API está retornando resultados para sua localização

### Erro ao sincronizar com Supabase
- Confirme que as credenciais do Supabase estão corretas
- Verifique se as tabelas foram criadas com os nomes corretos
- Teste a conexão clicando em "Testar Conexão" nas configurações

---

## Funcionalidades

### 📍 Busca Inteligente por Bairros

O sistema maximiza a captação de leads buscando por bairros individuais:

- **Busca Automática de Bairros** - Ao cadastrar uma cidade, clique no ícone 🔍 para descobrir bairros automaticamente via Google Places API
- **Gestão Manual** - Adicione ou remova bairros individualmente por cidade
- **Seleção Múltipla** - Escolha quais bairros incluir na varredura (ou deixe em branco para cidade toda)
- **Deduplicação Inteligente** - Resultados duplicados entre bairros são removidos por `place_id`
- **Multiplicação de Resultados** - Cada bairro gera uma query separada, multiplicando os leads encontrados (~60/bairro vs ~60/cidade)

### 🔄 Sincronização Automática com Supabase

A aplicação sincroniza automaticamente os dados com o Supabase sempre que você:

- ✅ **Adiciona uma localização** - Sincroniza imediatamente ao criar novo local
- ✅ **Atualiza bairros** - Bairros buscados ou editados são sincronizados
- ✅ **Adiciona um status** - Novos status são enviados automaticamente
- ✅ **Adiciona uma categoria** - Categorias criadas são sincronizadas
- ✅ **Finaliza uma busca de leads** - Todos os leads são sincronizados após a busca

A sincronização é **não-bloqueante**, mantendo a interface responsiva. Os dados são salvos localmente via Zustand e sincronizados em segundo plano quando o Supabase está conectado.

**Logs**: Erros de sincronização aparecem no console do navegador com o prefixo `[Auto-sync]`.

### 🎨 Interface e UX

- **Toast Notifications** - Feedback visual elegante ao invés de alerts nativos
- **Navegação por Teclado** - Pressione `ESC` para fechar modais e dropdowns
- **Error Boundary** - Captura erros gracefully sem travar a aplicação
- **ARIA Labels** - Totalmente acessível para leitores de tela
- **Dark Mode Ready** - Interface preparada para tema escuro

### 🧪 Qualidade de Código

- **TypeScript Strict Mode** - 100% type-safe
- **41 Testes Automatizados** - 100% passando (27 store + 14 services)
- **Validação de Entrada** - URLs e textos validados antes de salvar
- **Memoização** - Performance otimizada com `React.memo()` e `useMemo()`

---

## Project Structure

```
PLeads/
├── src/
│   ├── components/          # React components (.tsx)
│   │   ├── settings/        # Settings modal sub-components
│   │   ├── CategoryManagementModal.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LeadCard.tsx
│   │   ├── LocationManagementModal.tsx
│   │   ├── LocationSelector.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── StatusManagementModal.tsx
│   │   └── ToastProvider.tsx
│   ├── services/            # API integrations (Google Places, Supabase)
│   │   ├── __tests__/       # Service tests (13 tests)
│   │   ├── placesService.ts
│   │   └── supabaseService.ts
│   ├── store/               # Zustand state management
│   │   ├── __tests__/       # Store tests (27 tests)
│   │   └── useStore.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useEscapeKey.ts
│   │   ├── useFilteredLeads.ts
│   │   └── useSearch.ts
│   ├── utils/               # Utility functions (validation, helpers)
│   │   └── validation.ts
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   ├── constants/           # Application constants
│   │   └── index.ts
│   ├── test/                # Test configuration
│   │   └── setup.ts
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   ├── index.css            # Global styles
│   └── env.d.ts             # Environment variable types
├── dist/                    # Production build output
├── vitest.config.ts         # Vitest test configuration
├── vite.config.ts           # Vite bundler configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── tsconfig.node.json       # TypeScript config for Node files
├── package.json             # Dependencies and scripts
├── CHANGELOG.md             # Version history and changes
└── README.md                # This file
```

### Tech Stack

- **TypeScript 5.9** - Type-safe development
- **React 18** - UI library
- **Vite 7** - Fast build tool and dev server
- **Zustand 5** - State management with persistence
- **Tailwind CSS 3** - Utility-first CSS framework
- **Vitest 2** - Unit testing framework (41 tests, 100% passing)
- **Google Places API (New)** - Business data source (Text Search, Place Details, Neighborhood fetch)
- **Supabase** - Backend database with real-time sync
- **React Hot Toast** - Toast notifications

---

## Recursos Adicionais

### APIs e Backend
- [Google Places API (New) Documentation](https://developers.google.com/maps/documentation/places/web-service/op-overview)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Row-Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Frontend
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Documentation](https://vitejs.dev/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Hot Toast](https://react-hot-toast.com/)

### Testing
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)

---

## Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## Licença

Este projeto é de código aberto e está disponível sob a licença MIT.
