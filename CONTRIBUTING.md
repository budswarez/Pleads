# Guia de Contribuição - PLeads

Obrigado pelo interesse em contribuir para o **PLeads**! Este documento fornece diretrizes para ajudá-lo a começar, entender a estrutura do projeto e garantir que suas contribuições sejam integradas sem problemas.

## 🚀 Começando

### Pré-requisitos
- **Node.js** (v18 ou superior)
- **npm** (gerenciador de pacotes)
- **Git**

### Instalação

1. **Fork** o repositório no GitHub.
2. **Clone** o seu fork localmente:
   ```bash
   git clone https://github.com/SEU_USUARIO/pleads.git
   cd pleads
   ```
3. **Instale as dependências**:
   ```bash
   npm install
   ```
4. **Configure as variáveis de ambiente**:
   Copie o arquivo `.env.example` para `.env` e preencha as chaves necessárias (Google Places API, Supabase).
   ```bash
   cp .env.example .env
   ```

### Executando o Projeto
Para iniciar o servidor de desenvolvimento:
```bash
npm run dev
```
O aplicativo estará disponível em `http://localhost:5173`.

---

## 🧪 Testes

Mantemos uma alta cobertura de testes para garantir a estabilidade do sistema. Utilizamos **Vitest** e **React Testing Library**.

### Comandos de Teste

| Comando | Descrição |
|---------|-----------|
| `npm test` | Executa os testes em modo **watch** (interativo). Use este durante o desenvolvimento. |
| `npm run test:run` | Executa todos os testes uma única vez e sai. |
| `npm run test:ui` | Abre a interface gráfica do Vitest para visualizar testes e logs. |
| `npm run test:coverage` | Gera um relatório de cobertura de código. |
| `npm run test:ci` | Executa testes e cobertura, otimizado para ambientes de CI/CD. |

### Diretrizes de Teste
*   **Unitários:** Teste a lógica de negócios isolada (ex: `src/utils`, `src/hooks`).
*   **Componentes:** Use snapshots para garantir consistência visual e testes de interação para comportamento (ex: clicar em botões, preencher formulários).
*   **Integração:** Teste fluxos críticos que envolvem múltiplos componentes ou stores (ex: `src/__tests__`).
*   **Snapshots:** Se você alterar a UI intencionalmente, atualize os snapshots pressionando `u` no modo watch.

---

## 📂 Estrutura do Projeto

```
src/
├── components/          # Componentes React (UI)
│   ├── settings/        # Subcomponentes do modal de configurações
│   └── ...
├── hooks/               # Custom Hooks (Lógica reutilizável)
├── services/            # Integrações com APIs (Supabase, Google Places)
├── store/               # Gerenciamento de estado global (Zustand)
│   └── slices/          # Fatias do estado para modularização
├── types/               # Definições de tipos TypeScript
├── utils/               # Funções utilitárias e validações
├── constants/           # Constantes globais
└── __tests__/           # Testes de integração globais
```

---

## 📝 Diretrizes de Código

### TypeScript
*   O projeto utiliza **Strict Mode**. Evite o uso de `any` sempre que possível.
*   Defina interfaces claras para Props de componentes e respostas de API.

### Estilização
*   Utilizamos **Tailwind CSS**.
*   Mantenha as classes utilitárias organizadas.
*   Para estilos condicionais complexos, prefira usar template literals ou bibliotecas como `clsx` (se disponível).

### Gerenciamento de Estado
*   Utilizamos **Zustand**.
*   O estado é dividido em "Slices" (`src/store/slices`) para manter o código limpo.
*   Evite colocar estados locais de UI (ex: abrir/fechar um modal simples) no store global, a menos que seja necessário em múltiplos lugares.

### Commits
Recomendamos seguir o padrão **Conventional Commits**:
*   `feat:` Nova funcionalidade
*   `fix:` Correção de bug
*   `docs:` Alterações na documentação
*   `style:` Formatação, ponto e vírgula, etc.
*   `refactor:` Refatoração de código sem alteração de funcionalidade
*   `test:` Adição ou correção de testes

---

## 🤝 Processo de Pull Request

1. Crie uma **branch** para sua feature ou correção: `git checkout -b feat/minha-nova-feature`.
2. Faça suas alterações e **commit**.
3. **Rode os testes** para garantir que nada quebrou: `npm run test:run`.
4. Faça o **push** para o seu fork.
5. Abra um **Pull Request** para a branch `main` do repositório original.
6. Descreva suas alterações detalhadamente no PR.

---

## 🔧 Troubleshooting

### Problemas Comuns

*   **Erro de API Key**: Verifique se o arquivo `.env` está configurado corretamente e se as chaves têm as permissões necessárias.
*   **Testes Falhando**: Se os snapshots falharem após uma mudança intencional de UI, pressione `u` no modo watch para atualizá-los.
*   **Erro de Tipagem**: Execute `npm run type-check` para ver erros de TypeScript que podem não aparecer no Vitest.

Dúvidas? Abra uma issue no GitHub!