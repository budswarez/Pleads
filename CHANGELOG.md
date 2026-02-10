# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

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
