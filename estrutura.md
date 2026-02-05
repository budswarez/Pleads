# 🛸 Antigravity - Sistema de Gerenciamento de Leads

O **Antigravity** é uma plataforma Web de listagem comercial e prospecção B2B (CRM). O foco é oferecer uma experiência de usuário (UX) fluida, com design moderno e ferramentas eficientes para gerenciar contatos de estabelecimentos físicos.

---

## 📋 Escopo do Projeto

O objetivo principal é permitir que o usuário filtre locais por localização geográfica e categoria, mantendo um registro histórico de interações com cada estabelecimento.

### 📍 Segmentação
* **Estado (UF) e Cidade:** Filtros geográficos.
* **Categoria:** Tipo de estabelecimento (Restaurante, Adega, Posto, Conveniência).

---

## 🛠️ Funcionalidades Principais

### 1. Cadastro e Visualização
- [ ] **Interface de Cartões (Cards):** Visualização elegante dos locais com "Glassmorphism".
- [ ] **Ações Rápidas:** Botões flutuantes para WhatsApp e Telefone.
- [ ] **Gestão de Locais de Busca:** Interface dedicada para cadastrar e gerenciar lista de Cidades/Estados alvo.
- [ ] **Processo de Captura:**
    - Selecionar uma cidade cadastrada.
    - Botão "Atualizar/Buscar Leads".
    - **Lógica de Deduplicação:** Verificar se o `place_id` já existe antes de salvar. Nunca duplicar registros.




### 2. CRM (Gestão de Leads)
- [ ] **Status Visual:** Indicadores coloridos para status (Novo, Contatado, Negociação).
- [ ] **Histórico:** Timeline de anotações por lead.
- [ ] **Filtros Inteligentes:** "Mostrar apenas não contatados na cidade X".

---

## 💻 Stack Tecnológica Definida

Para atender aos requisitos de **design premium**, **agilidade** e **web application**, utilizaremos a seguinte stack:

### 1. Linguagens e Core
*   **HTML5 & JavaScript (ES6+):** Base estrutural e lógica.
*   **React.js (via Vite):** Framework para criar uma SPA (Single Page Application) rápida e reativa.
*   **Node.js:** Ambiente de execução para ferramentas de desenvolvimento.

### 2. Estilização e Design (Premium UI)
*   **Vanilla CSS3 (Moderno):**
    *   Uso de **CSS Variables** para temas (Dark/Light).
    *   **Flexbox & Grid** para layouts responsivos.
    *   Efeitos de **Backdrop-filter** (vidro) e **Gradients** vibrantes.
    *   Efeitos de **Backdrop-filter** (vidro) e **Gradients** vibrantes.
    *   Animações nativas (`@keyframes`) + Transições suaves.
*   **Design Tokens:** Cores HSL curadas para garantir harmonia visual.
*   **Tema Padrão:** **Dark Mode** (Escuro) com estética premium ("Midnight/Glass").


### 3. Pacotes e Bibliotecas (Libs)
*   **Roteamento:**
    *   `react-router-dom`: Para navegação fluida entre páginas (Dashboard, Detalhes, Configurações) sem recarregar.
*   **Ícones:**
    *   `lucide-react`: Ícones vetoriais leves, modernos e consistentes.
*   **Animações de Interface:**
    *   `framer-motion`: Para micro-interações complexas, entradas de listas e feedback visual "wow".
*   **Mapas:**
    *   `react-leaflet` + `leaflet`: Para renderização de mapas interativos (sem custos iniciais).
*   **Dados e Enriquecimento:**
    *   **Google Places API:** Fonte primária para busca de nomes de estabelecimentos, endereços, telefones e geolocalização.
*   **Gerenciamento de Estado/Dados:**
    *   `zustand`: Gerenciamento de estado global leve e simples.

    *   `localforage`: Persistência de dados local (IndexedDB) para funcionamento offline ou MVP sem backend complexo inicial.
*   **Utilitários:**
    *   `clsx`: Para manipulação condicional de classes CSS de forma limpa.

---

## 🗂️ Estrutura de Dados (Schema Simplificado)

Objeto `Lead`:
```json
{
  "id": "uuid-v4",
  "name": "Nome do Local",
  "category": "Restaurante",
  "address": {
    "street": "Rua Exemplo, 123",
    "city": "Sorocaba",
    "state": "SP",
    "coords": [-23.501, -47.458]
  },
  "contacts": {
    "phone": "15999999999",
    "whatsapp": "5515999999999"
  },
  "crm": {
    "status": "OPEN", // OPEN, CONTACTED, CLOSED
    "notes": [
      { "id": 1, "date": "2023-10-27T10:00:00", "text": "Ligação realizada." }
    ]
  }
}
```

---

## 📝 Próximos Passos
1.  **Setup do Ambiente:** Criar projeto Vite + React.
2.  **Arquitetura CSS:** Definir variáves de cores e estrutura base.
3.  **Componentes Base:** Criar Botões, Inputs e Cards com design system definido.