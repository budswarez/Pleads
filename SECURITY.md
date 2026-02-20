# Guia de Segurança - PLeads

## ⚠️ ATENÇÃO: Documentação de Incidente de Segurança

**NOTA IMPORTANTE**: Este documento registra um incidente de segurança passado onde credenciais foram acidentalmente expostas. **As credenciais listadas abaixo foram REDUZIDAS e devem ter sido ROTACIONADAS**. Se você é o proprietário deste projeto e ainda não rotacionou as chaves, **FAÇA ISSO IMEDIATAMENTE**.

---

## 1. Rotação Imediata de Chaves de API

### Google Places API Key

**Padrão de chave exposta**: `AIzaSy...zbQ` (reduzido por segurança)

**Passos para rotacionar**:

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Navegue até **APIs & Services > Credentials**
3. Localize a API Key exposta e **REVOGUE/DELETE** imediatamente
4. Crie uma nova API Key:
   - Clique em "Create Credentials" > "API Key"
   - **IMPORTANTE**: Configure restrições:
     - **Application restrictions**: Restrinja por HTTP referrer ou IP address
     - **API restrictions**: Limitar apenas à "Places API"
5. Copie a nova chave e adicione ao seu arquivo `.env` local
6. **NÃO** comite o arquivo `.env`

### Supabase Credentials

**Padrão de credenciais expostas** (reduzido por segurança):
- URL: `https://[project-id].supabase.co`
- Anon Key: `sb_publishable_[redacted]`

**Passos para rotacionar**:

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá para **Settings > API**
4. Clique em **"Reset anon key"** para gerar uma nova chave pública
5. Copie a nova URL e anon key para o arquivo `.env` local
6. **CRÍTICO**: Habilite Row-Level Security (RLS) em todas as tabelas:
   ```sql
   -- Para cada tabela (leads, locations, categories, statuses)
   ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;

   -- Criar políticas de acesso apropriadas
   CREATE POLICY "Allow authenticated access"
     ON nome_da_tabela
     FOR ALL
     USING (auth.uid() IS NOT NULL);
   ```

### Supabase Service Role Key (CRÍTICO)

**Esta chave dá acesso total ao seu banco de dados, ignorando Row-Level Security.**

- **Padrão**: `sb.service_role.[redacted]`
- **Uso**: Apenas em ambientes seguros (Server-side, API Routes, Edge Functions no próprio Supabase). **NUNCA** no frontend.
- **Rotação**:
  1. Acesse o Supabase Dashboard > Settings > API.
  2. Role até a seção "Service Role Keys".
  3. Gere uma nova chave.
  4. Atualize a variável `SUPABASE_SERVICE_ROLE_KEY` no seu ambiente (ex: Vercel, .env local).
  5. **NUNCA** adicione esta chave com prefixo `VITE_`.

---

## 2. Limpar Histórico do Git

**IMPORTANTE**: Mesmo após rotacionar as chaves, as antigas ainda estarão no histórico do Git. Você DEVE removê-las.

### Opção A: Usando git-filter-repo (Recomendado)

```bash
# Instalar git-filter-repo
pip install git-filter-repo

# Remover o arquivo .env de todo o histórico
git filter-repo --invert-paths --path .env --force

# Force push para o remote
git push origin --force --all
git push origin --force --tags
```

### Opção B: Usando BFG Repo-Cleaner (Mais rápido)

```bash
# Download BFG: https://rtyley.github.io/bfg-repo-cleaner/
# Executar:
java -jar bfg.jar --delete-files .env

# Limpar refs e fazer GC
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
git push origin --force --tags
```

### Opção C: Usando git filter-branch (Nativo, mais lento)

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Limpar refs
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
git push origin --force --tags
```

**⚠️ AVISO**: Force push reescreve o histórico. Coordene com sua equipe antes de fazer isso.

---

## 3. Prevenir Futuros Commits de Credenciais

### Verificar .gitignore

Confirme que `.gitignore` contém:

```gitignore
# Environment variables
.env
.env.local
.env.production
.env.development

# Logs e arquivos sensíveis
*.log
*.key
*.pem
secrets/
```

### Configurar Pre-commit Hook

Crie `.git/hooks/pre-commit` (ou use [git-secrets](https://github.com/awslabs/git-secrets)):

```bash
#!/bin/sh

# Verificar se .env está sendo commitado
if git diff --cached --name-only | grep -E '\.env$'; then
  echo "ERRO: Tentativa de commitar arquivo .env!"
  echo "Remova o arquivo .env do commit:"
  echo "  git reset HEAD .env"
  exit 1
fi

# Verificar padrões de API keys
if git diff --cached | grep -E 'AIza[0-9A-Za-z_-]{35}'; then
  echo "ERRO: Possível Google API Key detectada!"
  exit 1
fi

if git diff --cached | grep -E 'sb_publishable_[A-Za-z0-9_-]+'; then
  echo "ERRO: Possível Supabase key detectada!"
  exit 1
fi

if git diff --cached | grep -E 'sb\.service_role\.[A-Za-z0-9_-]+'; then
  echo "ERRO: CRÍTICO - Supabase SERVICE ROLE key detectada! NÃO COMITE!"
  exit 1
fi

exit 0
```

Tornar executável:
```bash
chmod +x .git/hooks/pre-commit
```

---

## 4. Configuração Segura do .env

### Criar .env Local (NÃO COMMITAR)

```env
# Google Places API Key
# Obtenha em: https://console.cloud.google.com/
VITE_GOOGLE_PLACES_KEY=sua_nova_chave_aqui

# Supabase Project URL
# Obtenha em: https://app.supabase.com/ -> Settings -> API
VITE_SUPABASE_URL=https://seu-projeto.supabase.co

# Supabase Anonymous Key (anon/public key, NÃO service role key)
VITE_SUPABASE_ANON_KEY=sua_nova_anon_key_aqui

# Supabase Service Role Key (APENAS Servidor/API - NUNCA expor ao cliente)
SUPABASE_SERVICE_ROLE_KEY=sua_nova_service_role_key_aqui
```

### Usar .env.example para Documentação

O arquivo `.env.example` deve conter apenas placeholders:

```env
VITE_GOOGLE_PLACES_KEY=your_google_places_api_key_here
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## 5. Configurar Row-Level Security no Supabase

**CRÍTICO**: Com a anon key exposta, qualquer pessoa pode acessar seu Supabase. RLS é OBRIGATÓRIO.

### Habilitar RLS em Todas as Tabelas

```sql
-- Leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own leads"
  ON leads
  FOR ALL
  USING (auth.uid() = user_id);

-- Locations
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own locations"
  ON locations
  FOR ALL
  USING (auth.uid() = user_id);

-- Categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own categories"
  ON categories
  FOR ALL
  USING (auth.uid() = user_id);

-- Statuses
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own statuses"
  ON statuses
  FOR ALL
  USING (auth.uid() = user_id);
```

**Nota**: Ajuste as políticas conforme seu modelo de dados (pode ser que você precise usar `org_id` ao invés de `user_id`, por exemplo).

---

## 6. Validação de Entrada

Para prevenir vulnerabilidades de injeção e XSS, o projeto agora inclui utilitários de validação em `src/utils/validation.ts`:

```typescript
import { isValidUrl, sanitizeText } from './utils/validation';

// Validar URLs antes de renderizar
if (lead.website && isValidUrl(lead.website)) {
  // Seguro para renderizar
}

// Sanitizar notas de usuário
const sanitizedNote = sanitizeText(userInput);
```

---

## 7. Monitoramento Contínuo

### Configurar Alertas de Uso

1. **Google Cloud Console**:
   - Configure budget alerts em "Billing"
   - Monitor uso da Places API em "APIs & Services > Dashboard"

2. **Supabase Dashboard**:
   - Configure alertas de uso em "Settings > Billing"
   - Monitor queries em "Database > Query Performance"

### Revisar Logs Regularmente

- Verificar logs de acesso no Supabase
- Monitorar requests anormais
- Configurar alertas de segurança

---

## 8. Checklist de Segurança

Após seguir este guia, verifique:

- [ ] Google Places API Key rotacionada e antiga revogada
- [ ] Supabase anon key rotacionada
- [ ] Histórico do Git limpo (arquivo `.env` removido)
- [ ] `.gitignore` configurado corretamente
- [ ] Pre-commit hooks instalados
- [ ] Row-Level Security habilitado em todas as tabelas do Supabase
- [ ] Políticas de RLS testadas e funcionando
- [ ] Monitoramento de uso configurado
- [ ] Equipe notificada sobre a mudança das credenciais
- [ ] Ambiente de produção atualizado com novas credenciais (se aplicável)

---

## 9. Em Caso de Comprometimento

Se você suspeitar que suas credenciais foram usadas indevidamente:

1. **Rotacione IMEDIATAMENTE** todas as chaves
2. **Revogue** as antigas
3. **Revise logs** de acesso no Google Cloud e Supabase
4. **Verifique faturamento** para uso não autorizado
5. **Considere contatar o suporte** se houver cobranças fraudulentas
6. **Documente o incidente** para referência futura

---

## 10. Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Google Cloud API Security Best Practices](https://cloud.google.com/docs/security/best-practices)
- [git-secrets (AWS)](https://github.com/awslabs/git-secrets)
- [TruffleHog (Scan for secrets)](https://github.com/trufflesecurity/trufflehog)

---

## Contato

Se você encontrou este repositório e identificou credenciais expostas, por favor entre em contato com o proprietário imediatamente através dos issues do GitHub.

---

## Nota sobre Este Arquivo

Este arquivo documenta um incidente de segurança e fornece orientações para prevenir futuros problemas. **As credenciais reais foram reduzidas** para evitar exposição pública.

Se você está documentando um incidente real com credenciais específicas, considere:
1. Manter este arquivo apenas localmente (adicione `SECURITY.md` ao `.gitignore`)
2. Ou manter apenas padrões reduzidos como exemplos (como está atualmente)
3. Nunca commitar credenciais reais, mesmo em documentação

---

**Última atualização**: 2026-02-19 (Revisão periódica de segurança e auditoria de funcionalidades)
