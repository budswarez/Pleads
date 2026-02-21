# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).
 
## [2.7.0] - 2026-02-21

### ✨ Novas Funcionalidades

#### 🏢 Rebranding: Pichau Power Leads
- **Nova Identidade**: O projeto foi oficialmente renomeado de "Pichau Energy Leads" para **Pichau Power Leads**.
- **Branding Premium**: Atualização do título da página, descrições do sistema e logotipo de alta visibilidade em toda a plataforma.

#### 🚀 Performance Extrema (Virtual Scrolling)
- **Grid Virtualizado**: Implementado `@tanstack/react-virtual` para gerenciar a renderização de leads. O sistema agora suporta milhares de cards sem perda de performance, renderizando apenas o que é visível na tela.
- **Fim da Paginação**: Substituição do sistema de páginas por uma rolagem infinita e fluida, proporcionando uma experiência de uso mais moderna e rápida.

#### 🎨 UI/UX Redesign
- **Estética de Vidro (Glassmorphism)**: Aplicação de efeitos de transparência e desfoque em camadas no cabeçalho e containers principais.
- **Micro-Animações**: Adição de efeitos de "respiração" no logo, transições suaves de hover e gradientes animados para um visual de alta qualidade.
- **Responsividade Aprimorada**: O grid virtualizado se adapta dinamicamente entre 1, 2 e 3 colunas conforme o tamanho da tela.

### 🐛 Correções e Ajustes
- **Exportador CSV**: O botão de exportação foi movido para a área de filtros e corrigido para usar a lógica mais robusta de exportação de dados, garantindo arquivos íntegros e bem formatados.
- **Limpeza de Código**: Removidos hooks e componentes obsoletos de paginação, reduzindo o tamanho do bundle e melhorando a manutenibilidade.

## [2.6.1] - 2026-02-21

### ✨ Novas Funcionalidades

#### 📍 Gestão Avançada de Locais (BrasilAPI)
- **Seleção de Cidade/Estado**: Substituído o campo de texto manual por listas de seleção inteligentes alimentadas pela BrasilAPI. Isso elimina erros de digitação e garante que apenas cidades válidas sejam cadastradas.
- **Carregamento Dinâmico**: As cidades são carregadas automaticamente após a seleção do estado.

#### 📊 Exportação de Dados
- **Ferramenta de Exportação CSV**: Adicionado botão "Exportar CSV" que converte a base de leads atual em um arquivo compatível com Excel e Google Sheets.
- **Detalhamento Completo**: O arquivo exportado inclui nome, endereço, telefone, website, categoria, avaliações e todas as notas com data.

#### 🎨 Identidade e Branding
- **Novo Logotipo de Alta Resolução**: Integração de novo ícone estilizado com acabamento metálico e 3D.
- **Branding de Alto Impacto**: Logo 40% maior com efeitos de brilho (glow) e animações interativas.
- **Tipografia Reforçada**: Ajustes de escala e estilo nos títulos para maior autoridade visual.

#### 🏘️ Experiência do Usuário (UX)
- **Redesign Visual Premium**: Interface completamente reformulada com Glassmorphism, gradientes, micro-animações e tipografia refinada para um visual profissional e moderno.
- **Adição de Bairros em Massa**: Agora é possível cadastrar múltiplos bairros de uma só vez separando-os por vírgula no campo de entrada.
- **Filtro de Locais por Estado**: A lista de locais cadastrados agora é filtrada automaticamente pelo estado selecionado, facilitando a gestão em grandes bases.
- **Deduplicação Inteligente**: O sistema remove espaços e evita a adição de bairros duplicados automaticamente.

#### 🐛 Correções de Bugs
- **BrasilAPI (SC)**: Corrigido bug onde nomes de cidades em Santa Catarina apareciam como "ORD" devido a uma instabilidade no provedor Wikipedia.

## [2.6.0] - 2026-02-21
 
### ✨ Novas Funcionalidades
 
#### ⚙️ Persistência Global de Configurações
- **Sincronização de Branding**: Título, descrição e logotipo do sistema agora são persistidos no Supabase e sincronizados entre todos os usuários.
- **Limites de Busca**: Configurações de "Leads por Página" e "Máximo de Leads por Categoria" agora são salvas no banco de dados.
- **Persistência de API Key**: A Google Places API Key agora pode ser salva opcionalmente no banco de dados para facilitar a configuração multiplataforma.
 
#### 🚀 Fluxo de Instalação e Setup
- **RPCs de Configuração**: Adicionadas funções `is_setup_complete` e `setup_first_admin` diretamente no script de inicialização SQL, garantindo que novas instalações funcionem perfeitamente.
- **Configuração Inicial Automática**: O primeiro administrador agora é confirmado e promovido automaticamente pelo banco durante o setup.
 
### 🐛 Correções e Melhorias
- **Credenciais no Modal**: Corrigido bug onde Project URL e Anon Key apareciam vazios no Modal de Configurações. Agora eles exibem os valores do `.env` como fallback.
- **Segurança de Tabelas**: Adicionada a tabela `settings` à verificação automática de integridade do banco de dados.
 
## [2.5.1] - 2026-02-19

### ✨ Novas Funcionalidades

#### 🛡️ Busca Resiliente e Performance
- **Mecanismo de Retry & Skip**: Implementado sistema de nova tentativa automática para falhas de rede na busca de leads. Caso a falha persista, o sistema pula a área problemática e continua a varredura, evitando travamentos.
- **Otimização de API**: Removidas chamadas redundantes ao Google Places Details. Agora o sistema utiliza o `fieldMask` da API New para obter telefone e website diretamente na busca inicial, reduzindo drasticamente o consumo de cotas e aumentando a velocidade.
- **Sleep Interruptível**: A função de espera entre requisições agora respeita o comando de "Parar Busca" instantaneamente via `AbortSignal`.

#### 📱 Contato e Gestão de Leads
- **Contato Inteligente via WhatsApp**: Botão de WhatsApp agora posicionado abaixo do telefone com detecção automática de celular (início 6, 7, 8 ou 9 após o DDD). Botão fica desativado para números fixos.
- **Exclusão de Anotações**: Adicionada funcionalidade para remover anotações individuais através de um ícone de lixeira com confirmação visual (hover).
- **Sincronização Reativa**: O sistema agora busca leads do Supabase automaticamente ao trocar de cidade ou estado, garantindo que os dados locais estejam sempre atualizados com a nuvem.
- **Aumento de Limite de Sync**: Limite de busca no Supabase aumentado de 1000 para 5000 leads para suportar grandes volumes de dados.

## [2.5.0] - 2026-02-19

### ✨ Novas Funcionalidades

#### 🏗️ Arquitetura e Estado (Zustand Slices)
- **Modularização do Store**: O estado global (`useStore.ts`) foi refatorado utilizando o padrão de "Slices" do Zustand. Foram criados slices independentes para Locais, Leads, Status e Configurações, facilitando a manutenção e testes.
- **Hook de Sincronização**: A lógica de sincronização com o banco de dados Supabase foi extraída para o hook dedicado `useAutoSync.ts`.

#### 🧩 Componentização da UI
- **UI Desacoplada**: A interface principal em `App.tsx` foi decomposta em componentes reutilizáveis menores: `Header.tsx`, `SearchControls.tsx` e `FilterTabs.tsx`, reduzindo drasticamente o tamanho do arquivo principal e melhorando a legibilidade.
- **Modal de Anotações (LeadNotesModal)**: A edição de notas dos leads foi movida de textareas inline para um modal dedicado, permitindo um histórico mais limpo e economizando espaço na grade.

#### 🔒 Segurança Reforçada (Supabase Edge Functions)
- **Migração do Proxy Google Places**: As chamadas para a API do Google Places foram migradas para uma **Edge Function nativa no Supabase** (`google-places`). As requisições agora usam de modo seguro o `supabase.functions.invoke`, limitando totalmente a visibilidade da API Key externa do Google no front.

#### 📑 Paginação de Cards
- **Paginação Client-Side**: Implementada paginação para a grade de leads, exibindo inicialmente 60 cards por página para melhorar a performance de renderização em listas grandes.
- **Configuração Flexível**: O limite de cards por página agora pode ser ajustado diretamente no painel de Configurações.
- **Controles Intuitivos**: Adicionados botões de navegação (Anterior/Próxima) e contador de progresso ("Exibindo X–Y de Z leads") no rodapé da grade.
- **Hook Reutilizável**: Criado `usePagination.ts` para abstrair a lógica de fatiamento e controle de estado da página.

### 🐛 Correções e Melhorias

#### 📍 Extração de Bairros (Curitiba)
- **Regex Aprimorado**: Refinada a lógica de extração de nomes de bairros para evitar capturar prefixos indesejados (ex: "Loja", "Apartamento") em endereços complexos de Curitiba.
- **Limpeza de Strings**: Implementada normalização mais rigorosa para garantir que apenas o nome puro do bairro seja extraído e exibido nos filtros.

#### 🧹 Refatoração e IDE
- **Limpeza de Código**: Removidas declarações de variáveis não utilizadas (ex: `setCurrentPage` no `App.tsx`) para eliminar avisos (warnings) em ambientes de desenvolvimento e IDEs.

---

## [2.4.2] - 2026-02-12

### 📱 Melhorias de Responsividade Mobile

#### Interface Mobile Otimizada
- **Menu Hambúrguer**: Implementado menu retrátil no cabeçalho para dispositivos móveis, limpando a navegação e escondendo botões de gestão (Categorias, Status, etc.) em uma gaveta acessível.
- **Busca Mobile Friendly**: Botões de ação ("Buscar Leads", "Parar Busca", "Limpar") agora se empilham verticalmente em telas pequenas, aumentando a área de toque e prevenindo quebra de layout.
- **LeadCard Compacto**: Reduzido padding (`p-4`) e ajustados tamanhos de fonte nos cards de leads para exibir mais informações em telas estreitas (iPhone SE/Mini) sem perder legibilidade.

### 🐛 Correções e Melhorias

#### Autenticação e Estado
- **Sincronização de Login**: Corrigido bug onde o nome do usuário não aparecia imediatamente após login (agora usa `user_metadata` como fallback instantâneo).
- **Logout Robusto**: Corrigido botão de logout que às vezes falhava ou causava erro 403. Implementada limpeza forçada do estado local mesmo se a chamada ao servidor falhar.
- **Supabase Client Idempotente**: Corrigida inicialização múltipla do cliente Supabase (`Multiple GoTrueClient instances detected`), garantindo singleton e melhor gerenciamento de sessão com `autoRefreshToken`.

#### Configuração
- **Prioridade de Variáveis de Ambiente**: Corrigido carregamento da API Key do Google Places para priorizar sempre o valor do `.env` (`VITE_GOOGLE_PLACES_KEY`), ignorando valores antigos/vazios no localStorage.
- **Alteração de Senha**: Corrigido bug na alteração de senha do próprio admin, agora utilizando o SDK diretamente para self-updates (funciona melhor em localhost).
- **Build Fix**: Removida declaração duplicada de estado em `App.tsx` que quebrava o build de produção.

---

## [2.4.1] - 2026-02-11

### 🐛 Correções - Configuração TypeScript

- **tsconfig.node.json**: Corrigido erro onde `allowImportingTsExtensions` exigia `noEmit` ou `emitDeclarationOnly`. 
- Implementado `"emitDeclarationOnly": true` para manter compatibilidade com o modo `composite` exigido pelas referências de projeto no `tsconfig.json`.

---

## [2.4.0] - 2026-02-11

### ✨ Novas Funcionalidades - Alteração de Senha pelo Admin

Admins agora podem alterar a senha de qualquer usuário diretamente pelo painel de Gestão de Usuários.

#### 🔒 Segurança
- **Serverless Admin API**: Criada function `api/admin-update-password.ts` que utiliza a `service_role` key do Supabase no lado do servidor.
- **Verificação de Papel**: A serverless function valida o JWT do solicitante e confirma se ele possui papel de `admin` antes de processar a alteração.
- **Isolamento de Chaves**: A `service_role` key nunca é exposta ao frontend.

#### 🎨 UI/UX
- **Botão de Chave (🔑)**: Adicionado à lista de usuários para abrir o formulário de alteração.
- **Formulário Inline**: Permite digitar a nova senha diretamente na lista, com suporte a `Enter` para salvar e `Escape` para cancelar.
- **Feedback Visual**: Estados de loading e toasts de sucesso/erro integrados.

#### 🗂️ Arquivos Criados
- `api/admin-update-password.ts`

#### 🗂️ Arquivos Modificados
- `src/services/authService.ts` (Adicionada `adminUpdatePassword`)
- `src/components/UserManagementModal.tsx` (Nova UI de alteração de senha)
- `.env` / `.env.example` (Adicionada `SUPABASE_SERVICE_ROLE_KEY`)

---

## [2.3.0] - 2026-02-11

### 🔒 Segurança - Proxy Serverless para Google Places API

A API key do Google Places agora **nunca é exposta no browser**. Todas as requisições ao Google passam por serverless functions na Vercel que injetam a chave no servidor.

#### Arquitetura
```
Frontend → /api/places-search → Vercel Serverless → Google Places API
                                 (API key aqui)
```

#### Novas Serverless Functions
- `api/places-search.ts` - Proxy para Text Search (`POST`)
- `api/places-details.ts` - Proxy para Place Details (`GET` com `?placeId=`)
- Ambas suportam chave customizada via header `X-Api-Key` (fallback para `GOOGLE_PLACES_KEY` do servidor)

#### Alterações no Frontend
- `placesService.ts` - Removido `X-Goog-Api-Key` de todas as chamadas; API key enviada via `X-Api-Key` (o proxy converte)
- `constants/index.ts` - URLs atualizadas: `/api/places-search`, `/api/places-details`
- `getPlaceDetails()` agora usa query param `?placeId=` ao invés de path segment

#### Configuração
- `vite.config.ts` - Proxy dev atualizado para novas rotas com rewrite de `X-Api-Key` → `X-Goog-Api-Key`
- `.env` / `.env.example` - Adicionada `GOOGLE_PLACES_KEY` (server-side, sem prefixo `VITE_`)
- `@vercel/node` adicionado como devDependency

#### Testes
- Todos os 41 testes atualizados e passando (novas URLs, novo header)

### 🔄 Mudanças de Compatibilidade
- **Vercel**: Adicione `GOOGLE_PLACES_KEY` em Settings → Environment Variables
- Frontend não envia mais `X-Goog-Api-Key` diretamente ao Google
- `getPlaceDetails` usa `?placeId=` ao invés de `/placeId` no path

---

## [2.2.0] - 2026-02-11

### 🔐 Sistema de Autenticação

#### Login e Gestão de Usuários
- Implementado sistema de autenticação completo via **Supabase Auth**
- Dois papéis: **Admin** (gerencia usuários) e **Usuário** (usa a ferramenta)
- **Tela de Setup**: Primeiro acesso exibe formulário para criar conta administrador
- **Tela de Login**: Formulário com email e senha, sessão persiste entre recarregamentos
- **Gestão de Usuários**: Modal exclusivo para admins criar/remover usuários
- Badges visuais: "Admin" (verde) e "Usuário" (azul) na lista de usuários
- Botão de logout e nome do usuário no header
- Detecção de "usuário falso" (proteção anti-enumeração do Supabase)

#### Arquitetura de Auth
- `authService.ts` - Serviço com signIn, signOut, setupAdmin, createUser, deleteUser
- `useAuth.ts` - Hook com estado de autenticação, sessão, perfil e role
- `LoginPage.tsx` - Tela de login com branding do app
- `SetupPage.tsx` - Tela de setup inicial do administrador
- `UserManagementModal.tsx` - Modal de gestão de usuários (admin only)

#### RPCs de Segurança (SECURITY DEFINER)
- `setup_first_admin()` - Cria admin no primeiro acesso + confirma email
- `admin_confirm_and_create_profile()` - Admin cria usuário + confirma email
- `admin_delete_user()` - Admin remove usuário do sistema
- `is_setup_complete()` - Verifica se setup foi concluído (público)
- `is_admin()` / `has_any_users()` - Helpers para políticas RLS sem recursão

#### Políticas RLS Atualizadas
- Tabelas de dados agora exigem autenticação: `auth.role() = 'authenticated'`
- `user_profiles` usa funções SECURITY DEFINER para evitar recursão infinita
- Política de insert permite setup (sem usuários) OU admin

### 🔄 Sincronização Pós-Login
- Dados sincronizados automaticamente com Supabase após login bem-sucedido
- Upload de dados locais + download do Supabase em segundo plano
- `persistSession: true` garante recuperação automática da sessão

### 🐛 Correções
- **Recursão infinita em RLS**: Políticas de `user_profiles` que consultavam a própria tabela causavam loop infinito. Corrigido com funções `is_admin()` e `has_any_users()` (SECURITY DEFINER)
- **Email não confirmado**: SignUp via Supabase não confirmava email automaticamente. Corrigido com RPCs que confirmam explicitamente (`email_confirmed_at = NOW()`)
- **Schema cache**: PostgREST não expunha `user_profiles` para usuários não autenticados. Corrigido usando RPCs que bypassam o cache
- **Side-effect no render**: `setSupabaseConnected` era chamado durante render, causando re-renders infinitos. Movido para `useEffect`

### 🗂️ Arquivos Criados
```
src/
├── components/
│   ├── LoginPage.tsx
│   ├── SetupPage.tsx
│   └── UserManagementModal.tsx
├── hooks/
│   └── useAuth.ts
├── services/
│   └── authService.ts
```

### 🗂️ Arquivos Modificados
- `types/index.ts` - Adicionado tipo `UserProfile`, atualizado `SupabaseTableStatus`
- `constants/index.ts` - Adicionado `USER_PROFILES` ao `SUPABASE_TABLES`
- `supabaseService.ts` - `persistSession: true`, tabela `user_profiles` no SQL
- `App.tsx` - Auth guard completo, UI de usuário no header, auto-sync pós-login

---

## [2.1.0] - 2026-02-11

### ✨ Novas Funcionalidades

#### Migração para Google Places API (New)
- Migração completa da API Legacy (`maps.googleapis.com`) para a API New (`places.googleapis.com/v1`)
- Requisições agora usam método POST com body JSON ao invés de query parameters
- Autenticação via headers `X-Goog-Api-Key` e `X-Goog-FieldMask` (mais seguro)
- Campo `nextPageToken` adicionado ao field mask para paginação funcional
- Proxy do Vite atualizado para o novo endpoint

#### Busca Automática de Bairros
- Nova função `fetchNeighborhoods()` em `placesService.ts`
- Busca bairros automaticamente via Google Places Text Search (`"bairros de {cidade}, {estado}, Brasil"`)
- Suporte a paginação para capturar o máximo de bairros possível
- Bairros ficam salvos na Location e persistidos no Zustand + Supabase

#### Gestão de Bairros (LocationManagementModal)
- Botão "Buscar Bairros" (ícone Search) em cada cidade cadastrada
- Cards expansíveis com lista de bairros como tags/chips
- Adição manual de bairros via input de texto
- Remoção individual de bairros (botão X em cada tag)
- Indicador de quantidade: "(12 bairros)"
- Estado de loading com spinner durante busca na API

#### Seleção Múltipla de Bairros (LocationSelector)
- Dropdown customizado com checkboxes substituindo o input de texto
- Botões "Selecionar todos" e "Limpar"
- Label dinâmico: "3 bairros selecionados", "Todos (cidade inteira)"
- Fecha automaticamente ao clicar fora (click outside)
- Em branco = busca na cidade toda (comportamento padrão)

#### Varredura por Bairros
- Hook `useSearch` reescrito com função auxiliar `searchCategoryInArea()`
- Itera por cada bairro selecionado, gerando queries separadas por bairro
- Deduplicação por `place_id` entre bairros diferentes (usando `Set`)
- Respeita `maxLeadsPerCategory` total (não por bairro)
- Status de busca mostra progresso: `"Restaurantes - Centro: 15/60 leads"`
- Multiplicação de resultados: ~60 leads/bairro ao invés de ~60 total

### 🐛 Correções

- **Paginação não funcionava**: `nextPageToken` estava ausente do `X-Goog-FieldMask`, impedindo a API de retornar o token de próxima página
- **RLS bloqueando sync**: Criadas políticas de acesso público (`true`) para todas as 4 tabelas no Supabase após ativação do Row-Level Security

### 🔧 Configuração

#### Vite Proxy
- Target atualizado de `https://maps.googleapis.com` para `https://places.googleapis.com`
- Rewrite path simplificado: `/api/google` → raiz

#### Supabase Schema
- Nova coluna `neighborhoods JSONB DEFAULT '[]'::jsonb` na tabela `locations`
- `upsertLocation()` atualizado para incluir neighborhoods
- CREATE TABLE SQL atualizado para novos setups

### 🔄 Mudanças de Compatibilidade

- **Google Places API (New)** deve estar habilitada no Google Cloud Console (separada da Legacy)
- Field mask controla **todos** os campos retornados, incluindo `nextPageToken`
- Respostas usam nomes diferentes: `displayName.text`, `nationalPhoneNumber`, `websiteUri`, etc.
- `getPlaceDetails` agora só é chamado quando phone E website estão ausentes (otimização de custo)

### 📊 Estatísticas

- **41 testes passando** (27 store + 14 services)
- Testes de `placesService` reescritos para formato da API New
- Novo teste para `fetchNeighborhoods`

---

## [2.0.0] - 2026-02-10

### 🔒 Segurança

- **CRÍTICO**: Rotacionadas chaves de API expostas no repositório
- Removidas credenciais do histórico do Git
- Adicionada validação de entrada para URLs e textos de notas (`src/utils/validation.ts`)
- Implementada verificação de Row-Level Security no Supabase
- Atualizado README com instruções de segurança e obtenção de API keys
- Melhorado `.env.example` com documentação detalhada

### ✨ Novas Funcionalidades

#### TypeScript (Migração Completa)
- Migração completa da aplicação de JavaScript para TypeScript
- Criadas definições de tipos centralizadas (`src/types/index.ts`)
- Configurado TypeScript strict mode
- Adicionado `env.d.ts` para variáveis de ambiente tipadas
- Conversão de todos os componentes (.jsx → .tsx)
- Conversão de todos os services e hooks

#### Sistema de Notificações Toast
- Instalado e configurado `react-hot-toast`
- Criado componente `ToastProvider` com temas customizados
- Substituídos **6 alerts nativos** por notificações toast elegantes:
  - `toast.error()` - Erros (vermelho)
  - `toast.success()` - Sucessos (verde)
  - `toast.info()` - Informações (azul)

#### Navegação por Teclado
- Criado hook `useEscapeKey` para suporte à tecla ESC
- Implementado em 5 componentes:
  - App.tsx (fecha dropdown de busca)
  - LocationManagementModal
  - StatusManagementModal
  - CategoryManagementModal
  - SettingsModal

#### Error Boundary
- Adicionado `ErrorBoundary` component para captura graceful de erros
- UI amigável com detalhes técnicos expansíveis
- Previne crash completo da aplicação
- Botões para recarregar ou tentar novamente

#### Testes Automatizados
- Instalado e configurado **Vitest 2.1.9** + Testing Library
- Criado ambiente de testes com jsdom e mocks
- **40 testes implementados (100% passando)**:
  - 27 testes do store (useStore)
  - 13 testes dos services (placesService)
- Configurada cobertura de código com meta de 70%+
- Scripts de teste adicionados ao package.json

### ♻️ Refatoração

#### Arquitetura de Componentes
- **App.tsx** reduzido de 853 → ~350 linhas (-59%)
- Extraídos modais inline para componentes separados:
  - `StatusManagementModal.tsx`
  - `CategoryManagementModal.tsx`
- Criado componente `LeadCard.tsx` memoizado
- Criado componente `ToastProvider.tsx`
- Criado componente `ErrorBoundary.tsx`

#### Custom Hooks
- Criado `useSearch.ts` - Lógica de busca com paginação
- Criado `useFilteredLeads.ts` - Filtragem consolidada com useMemo
- Criado `useEscapeKey.ts` - Navegação por teclado

#### Organização de Código
- Criado arquivo de constantes centralizadas (`src/constants/index.ts`)
- Removido código morto (`LocationSelector_old.jsx`)
- Separação clara de responsabilidades entre componentes
- Estrutura de pastas mais organizada

### 🚀 Performance

#### Otimizações de Renderização
- Memoizado `LeadCard` component com `React.memo()`
- Otimizada filtragem de leads com `useMemo`:
  - `leadsByCategory` - Cache de filtragem por categoria
  - `finalFilteredLeads` - Cache de filtragem por categoria + status
  - `categoryCounts` - Cache de contagens por categoria
  - `statusCounts` - Cache de contagens por status
- Evita re-computações desnecessárias em listas grandes

#### Limpeza de Dependências
- Movido `playwright` de dependencies → devDependencies
- Reduz tamanho do bundle de produção
- Melhora tempo de instalação em ambientes de produção

#### Gestão de Recursos
- Cleanup automático de event listeners (useEscapeKey)
- Limpeza adequada de timeouts em modais
- Prevenção de memory leaks

### ♿️ Acessibilidade

#### ARIA Labels
- Auditados todos os botões da aplicação
- Adicionados aria-labels descritivos:
  - Botões de dropdown de busca
  - Botões de ação em modais
  - Controles de formulário
- Associados labels com inputs usando htmlFor/id
- Adicionados títulos e textos alternativos a indicadores visuais

#### Navegação
- Suporte completo à tecla ESC para fechar modais e dropdowns
- Navegação por teclado funcional em todos os componentes interativos
- Feedback visual adequado para estados de foco

### 📝 Documentação

#### README
- Corrigido typo "tor" → "for"
- Adicionadas instruções de segurança detalhadas
- Guia de obtenção de API Keys (Google Places e Supabase)
- Seção de troubleshooting expandida
- Documentação de comandos de teste

#### .env.example
- Comentários detalhados para cada variável
- Links para dashboards de obtenção de chaves
- Avisos de segurança sobre Row-Level Security

#### Código
- Comentários JSDoc em funções principais
- Tipos TypeScript auto-documentados
- Documentação inline de lógica complexa

### 🗂️ Estrutura de Arquivos

#### Arquivos Criados
```
src/
├── components/
│   ├── CategoryManagementModal.tsx (extraído)
│   ├── ErrorBoundary.tsx (novo)
│   ├── LeadCard.tsx (extraído)
│   ├── StatusManagementModal.tsx (extraído)
│   └── ToastProvider.tsx (novo)
├── constants/
│   └── index.ts (novo)
├── hooks/
│   ├── useEscapeKey.ts (novo)
│   ├── useFilteredLeads.ts (novo)
│   └── useSearch.ts (novo)
├── services/
│   └── __tests__/
│       └── placesService.test.ts (novo)
├── store/
│   └── __tests__/
│       └── useStore.test.ts (novo)
├── test/
│   └── setup.ts (novo)
├── types/
│   └── index.ts (novo)
├── utils/
│   └── validation.ts (novo)
├── env.d.ts (novo)
└── main.tsx (convertido de .jsx)

vitest.config.ts (novo)
CHANGELOG.md (novo)
```

#### Arquivos Removidos
- `src/components/LocationSelector_old.jsx` (código morto)
- `src/main.jsx` (substituído por main.tsx)

#### Arquivos Convertidos para TypeScript
- `src/App.jsx` → `App.tsx`
- `src/components/*.jsx` → `*.tsx`
- `src/services/*.js` → `*.ts`
- `src/store/useStore.js` → `useStore.ts`
- `src/main.jsx` → `main.tsx`

### 🔧 Configuração

#### TypeScript
- Criado `tsconfig.json` com strict mode
- Criado `tsconfig.node.json` para Vite config
- Configurado composite projects para melhor performance

#### Vitest
- Criado `vitest.config.ts` com configuração completa
- Ambiente jsdom para testes de componentes React
- Coverage configurado com v8 provider
- Metas de cobertura: 70%+ em todas as métricas

#### Vite
- Atualizado para Vite 7.3.1 (compatibilidade com Vitest 2.x)
- Configurado plugin React atualizado

### 🐛 Correções

- Corrigido teste de armazenamento de localização (whitespace handling)
- Corrigido teste de remoção de leads por categoria (requer seleção de localização)
- Ajustadas expectativas de mensagens de erro em testes (regex patterns)
- Resolvido conflito de versões Vitest 4.x → 2.x
- Corrigidas importações após conversão TypeScript

### 🔄 Mudanças de Compatibilidade

#### Dependências Principais Atualizadas
- `vite`: 5.1.0 → 7.3.1
- `@vitejs/plugin-react`: 4.2.1 → 5.1.4
- Adicionado `vitest`: 2.1.9
- Adicionado `react-hot-toast`: 2.6.0
- Adicionado `typescript`: 5.9.3

#### Scripts do package.json
```json
{
  "type-check": "tsc --noEmit",
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:run": "vitest run",
  "test:coverage": "vitest run --coverage"
}
```

### 📊 Estatísticas do Projeto

#### Antes da Refatoração
- **Segurança**: 🔴 Chaves expostas, sem validação
- **Manutenibilidade**: 🟡 App.jsx com 853 linhas
- **Testabilidade**: 🔴 0 testes
- **Type Safety**: 🔴 JavaScript puro
- **Performance**: 🟡 Re-renders desnecessários
- **Acessibilidade**: 🟡 ARIA labels parciais
- **UX**: 🟡 Alerts nativos

#### Depois da Refatoração
- **Segurança**: 🟢 Chaves protegidas, validação completa
- **Manutenibilidade**: 🟢 Componentes < 400 linhas
- **Testabilidade**: 🟢 40 testes (100% passing)
- **Type Safety**: 🟢 TypeScript strict mode
- **Performance**: 🟢 useMemo, memoização, Error Boundary
- **Acessibilidade**: 🟢 WCAG 2.1 AA, navegação completa
- **UX**: 🟢 Toasts, feedback claro, keyboard navigation

### 🎯 Cobertura de Testes

**40 testes passando (100%)**

- **Store Tests** (27/27):
  - Location Management
  - Lead Management
  - Status Management
  - Category Management
  - API Key Management
  - Supabase Configuration
  - Branding Configuration
  - Data Sync

- **Service Tests** (13/13):
  - searchPlaces (API calls, pagination, error handling)
  - getPlaceDetails (field fetching, error handling)
  - sleep utility

### 🚧 Trabalho Futuro

#### Testes Pendentes
- [ ] Testes de componentes React (LocationManagementModal, SettingsModal, etc.)
- [ ] Testes de integração E2E
- [ ] Testes de acessibilidade automatizados

#### Melhorias Potenciais
- [ ] Virtual scrolling para listas com 300+ leads
- [ ] Service Worker para cache offline
- [ ] Internacionalização (i18n)
- [ ] Dark mode toggle
- [ ] Exportação de leads para CSV/Excel
- [ ] Analytics e tracking de uso
- [x] ~~Busca por bairros para multiplicar resultados~~ (implementado em 2.1.0)
- [x] ~~Sistema de autenticação com gestão de usuários~~ (implementado em 2.2.0)

---

## [1.0.0] - 2025-01-XX

### Lançamento Inicial
- Sistema de gestão de leads
- Integração com Google Places API
- Integração com Supabase
- Gerenciamento de localizações
- Categorização de leads
- Sistema de status customizáveis
- Interface com Leaflet maps

---

**Legenda:**
- 🔒 Segurança
- ✨ Novas Funcionalidades
- ♻️ Refatoração
- 🚀 Performance
- ♿️ Acessibilidade
- 📝 Documentação
- 🐛 Correções
- 🔧 Configuração
- 🗑️ Removido
- 🔄 Mudanças de Compatibilidade

---

**Desenvolvido com ❤️ usando React, TypeScript, Zustand, e Vite**

🤖 *Refatoração assistida por [Claude Sonnet 4.5](https://claude.com/claude-code)*
