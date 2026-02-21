import { useState, useEffect } from 'react';
import { Settings, X, Key, Eye, EyeOff, CheckCircle, AlertCircle, Database, RefreshCw, Loader2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import { useEscapeKey } from '../hooks/useEscapeKey';
import {
  initSupabase,
  testConnection,
  createTables,
  getCreateTablesSql,
  fetchLeads,
  fetchLocations,
  fetchCategories,
  fetchStatuses
} from '../services/supabaseService';
import { EmptyState } from './EmptyState';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StatusMessage {
  type: 'success' | 'error' | null;
  message: string;
}

/**
 * Modal de configurações da aplicação
 * Gerencia Google Places API Key, Supabase, e configurações de branding
 */
const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const {
    apiKey, setApiKey, getApiKey,
    supabaseUrl, supabaseAnonKey, supabaseConnected,
    setSupabaseConfig, setSupabaseConnected, getSupabaseConfig,
    loadFromSupabase,
    appTitle, appDescription, appLogoUrl, setBranding,
    maxLeadsPerCategory, setMaxLeadsPerCategory,
    leadsPerPage, setLeadsPerPage
  } = useStore();

  // Google API Key state
  const [localApiKey, setLocalApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);

  // Supabase state
  const [localSupabaseUrl, setLocalSupabaseUrl] = useState('');
  const [localSupabaseKey, setLocalSupabaseKey] = useState('');
  const [showSupabaseKey, setShowSupabaseKey] = useState(false);
  const [supabaseTesting, setSupabaseTesting] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<StatusMessage>({ type: null, message: '' });
  const [creatingTables, setCreatingTables] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  // Branding State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [localMaxLeads, setLocalMaxLeads] = useState(60);
  const [localLeadsPerPage, setLocalLeadsPerPage] = useState(60);

  // Close modal on Escape key
  useEscapeKey(onClose, isOpen);

  useEffect(() => {
    if (isOpen) {
      setLocalApiKey(apiKey || import.meta.env.VITE_GOOGLE_PLACES_KEY || '');
      const config = getSupabaseConfig();
      setLocalSupabaseUrl(config.url || '');
      setLocalSupabaseKey(config.anonKey || '');
      setTitle(appTitle || '');
      setDescription(appDescription || '');
      setLogoUrl(appLogoUrl || '');
      setLocalMaxLeads(maxLeadsPerCategory || 60);
      setLocalLeadsPerPage(leadsPerPage || 60);
      setApiKeySaved(false);
      setSupabaseStatus({ type: null, message: '' });
    }
  }, [isOpen, apiKey, supabaseUrl, supabaseAnonKey, appTitle, appDescription, appLogoUrl, maxLeadsPerCategory, leadsPerPage]);

  // Auto-hide success messages
  useEffect(() => {
    if (apiKeySaved) {
      const timer = setTimeout(() => setApiKeySaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [apiKeySaved]);

  useEffect(() => {
    if (supabaseStatus.type === 'success') {
      const timer = setTimeout(() => setSupabaseStatus({ type: null, message: '' }), 2000);
      return () => clearTimeout(timer);
    }
  }, [supabaseStatus.type]);

  useEffect(() => {
    if (sqlCopied) {
      const timer = setTimeout(() => setSqlCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [sqlCopied]);

  if (!isOpen) return null;

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(localApiKey.trim());
    setApiKeySaved(true);
  };

  const handleSaveSupabase = async () => {
    const url = localSupabaseUrl.trim();
    const key = localSupabaseKey.trim();

    if (!url || !key) {
      setSupabaseStatus({ type: 'error', message: 'Preencha URL e API Key' });
      return;
    }

    setSupabaseConfig(url, key);
    initSupabase(url, key);
    setSupabaseStatus({ type: 'success', message: 'Configurações salvas!' });
  };

  const handleTestConnection = async () => {
    const url = localSupabaseUrl.trim();
    const key = localSupabaseKey.trim();

    if (!url || !key) {
      setSupabaseStatus({ type: 'error', message: 'Preencha URL e API Key' });
      return;
    }

    setSupabaseTesting(true);
    setSupabaseStatus({ type: null, message: '' });

    const result = await testConnection(url, key);

    setSupabaseTesting(false);
    setSupabaseStatus({
      type: result.success ? 'success' : 'error',
      message: result.message || ''
    });

    if (result.success) {
      setSupabaseConfig(url, key);
      setSupabaseConnected(true);
      initSupabase(url, key);
    } else {
      setSupabaseConnected(false);
    }
  };

  const handleCreateTables = async () => {
    const url = localSupabaseUrl.trim();
    const key = localSupabaseKey.trim();

    if (!url || !key) {
      setSupabaseStatus({ type: 'error', message: 'Preencha URL e API Key primeiro' });
      return;
    }

    setCreatingTables(true);
    setSupabaseStatus({ type: null, message: '' });

    const result = await createTables(url, key);

    setCreatingTables(false);

    if (result.success) {
      setSupabaseStatus({ type: 'success', message: result.message || 'Tabelas criadas com sucesso!' });
    } else {
      setSupabaseStatus({ type: 'error', message: result.message || 'Erro ao criar tabelas' });
      if (result.sql) {
        setShowSql(true);
      }
    }
  };

  const handleSyncData = async () => {
    if (!supabaseConnected) {
      setSupabaseStatus({ type: 'error', message: 'Conecte ao Supabase primeiro' });
      return;
    }

    setSyncing(true);
    setSupabaseStatus({ type: null, message: '' });

    try {
      // Fetch data from Supabase to ensure we have the latest
      const [leadsRes, locationsRes, categoriesRes, statusesRes] = await Promise.all([
        fetchLeads(),
        fetchLocations(),
        fetchCategories(),
        fetchStatuses()
      ]);

      const hasErrors = [leadsRes, locationsRes, categoriesRes, statusesRes].some(res => res.error);

      if (!hasErrors) {
        loadFromSupabase({
          leads: leadsRes.data,
          locations: locationsRes.data?.map((l: any) => ({ ...l, id: l.id })),
          categories: categoriesRes.data,
          statuses: statusesRes.data
        });

        setSupabaseStatus({ type: 'success', message: 'Dados sincronizados e baixados com sucesso!' });
      } else {
        setSupabaseStatus({ type: 'error', message: 'Houve um erro ao baixar os dados da nuvem.' });
      }
    } catch (error) {
      setSupabaseStatus({
        type: 'error',
        message: `Erro: ${error instanceof Error ? error.message : String(error)}`
      });
    }

    setSyncing(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(getCreateTablesSql());
    setSqlCopied(true);
  };

  const handleSaveBranding = async () => {
    const loadingToast = toast.loading('Salvando configurações...');
    await setBranding(title, description, logoUrl);
    await setMaxLeadsPerCategory(Number(localMaxLeads));
    await setLeadsPerPage(Number(localLeadsPerPage));
    toast.dismiss(loadingToast);
    toast.success('Aparência e limites salvos com sucesso!');
  };

  const hasApiKey = !!getApiKey();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/20 shrink-0">
          <div className="flex items-center gap-2">
            <Settings className="text-primary" size={20} />
            <h2 className="text-xl font-bold text-foreground">Configurações</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar modal de configurações"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Branding Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="bg-primary/10 p-1 rounded-md text-primary" aria-hidden="true">🎨</span>
                Personalização
              </h3>
              <button
                onClick={handleSaveBranding}
                className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-opacity-90"
                aria-label="Salvar configurações de aparência e limites"
              >
                Salvar Aparência e Limites
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="app-title" className="text-xs font-medium text-foreground">
                  Nome da Aplicação
                </label>
                <input
                  id="app-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Ex: Minha Empresa Leads"
                  aria-label="Nome da aplicação"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="app-logo" className="text-xs font-medium text-foreground">
                  URL do Logo
                </label>
                <input
                  id="app-logo"
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="/logo.png ou https://..."
                  aria-label="URL do logo"
                />
              </div>
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label htmlFor="app-description" className="text-xs font-medium text-foreground">
                  Descrição / Slogan
                </label>
                <input
                  id="app-description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Ex: Sistema de Gestão..."
                  aria-label="Descrição ou slogan"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="max-leads" className="text-xs font-medium text-foreground flex items-center gap-1">
                  Limite de Leads (por Categoria)
                  <span className="text-[10px] text-muted-foreground font-normal">(Padrão: 60)</span>
                </label>
                <input
                  id="max-leads"
                  type="number"
                  min="1"
                  max="200"
                  value={localMaxLeads}
                  onChange={(e) => setLocalMaxLeads(Number(e.target.value))}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="Limite de leads por categoria"
                />
                <p className="text-[10px] text-muted-foreground">
                  Nota: O Google geralmente limita a 60 resultados. Aumentar não garante mais leads.
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="leads-per-page" className="text-xs font-medium text-foreground flex items-center gap-1">
                  Leads por Página
                  <span className="text-[10px] text-muted-foreground font-normal">(Padrão: 60)</span>
                </label>
                <input
                  id="leads-per-page"
                  type="number"
                  min="1"
                  max="200"
                  value={localLeadsPerPage}
                  onChange={(e) => setLocalLeadsPerPage(Number(e.target.value))}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="Leads exibidos por página"
                />
                <p className="text-[10px] text-muted-foreground">
                  Quantidade de cards exibidos simultaneamente na tela.
                </p>
              </div>
            </div>
            <hr className="border-border" />
          </section>

          {/* Google Places API Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Key size={16} className="text-primary" />
              Google Places API
            </h3>

            <form onSubmit={handleSaveApiKey} className="space-y-3">
              <div className="relative">
                <input
                  id="google-api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  placeholder="Cole sua API Key aqui..."
                  className="w-full bg-input border border-border rounded-md pl-3 pr-20 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="Google Places API Key"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showApiKey ? 'Ocultar API Key' : 'Mostrar API Key'}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  type="submit"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs font-medium transition-all ${apiKeySaved ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-opacity-90'
                    }`}
                  aria-label="Salvar API Key"
                >
                  {apiKeySaved ? <Check size={14} /> : 'Salvar'}
                </button>
              </div>

              {hasApiKey ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md text-xs bg-green-500/10 text-green-500">
                  <CheckCircle size={14} />
                  <span>API Key configurada</span>
                </div>
              ) : (
                <EmptyState
                  icon={AlertCircle}
                  description="Nenhuma API Key configurada."
                  className="py-4 border-dashed bg-yellow-500/5 border-yellow-500/20 shadow-none"
                />
              )}
            </form>
          </section>

          <hr className="border-border" />

          {/* Supabase Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Database size={16} className="text-primary" />
              Supabase (Banco de Dados)
            </h3>

            <div className="space-y-3">
              <div>
                <label htmlFor="supabase-url" className="text-xs text-muted-foreground mb-1 block">
                  Project URL
                </label>
                <input
                  id="supabase-url"
                  type="text"
                  value={localSupabaseUrl}
                  onChange={(e) => setLocalSupabaseUrl(e.target.value)}
                  placeholder="https://seu-projeto.supabase.co"
                  className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="Supabase Project URL"
                />
              </div>

              <div>
                <label htmlFor="supabase-key" className="text-xs text-muted-foreground mb-1 block">
                  Anon/Public Key
                </label>
                <div className="relative">
                  <input
                    id="supabase-key"
                    type={showSupabaseKey ? 'text' : 'password'}
                    value={localSupabaseKey}
                    onChange={(e) => setLocalSupabaseKey(e.target.value)}
                    placeholder="sb_publishable_..."
                    className="w-full bg-input border border-border rounded-md pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    aria-label="Supabase Anon/Public Key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showSupabaseKey ? 'Ocultar Supabase Key' : 'Mostrar Supabase Key'}
                  >
                    {showSupabaseKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Status message */}
              {supabaseStatus.message && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs ${supabaseStatus.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}
                  role="alert"
                >
                  {supabaseStatus.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  <span>{supabaseStatus.message}</span>
                </div>
              )}

              {/* Connection status */}
              {supabaseConnected ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md text-xs bg-green-500/10 text-green-500" role="status">
                  <CheckCircle size={14} />
                  <span>Conectado ao Supabase</span>
                </div>
              ) : (
                <EmptyState
                  icon={Database}
                  description="Não conectado ao Supabase."
                  className="py-4 border-dashed bg-muted/20 shadow-none"
                />
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleTestConnection}
                  disabled={supabaseTesting}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-md text-xs font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                  aria-label="Testar conexão com Supabase"
                >
                  {supabaseTesting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  {supabaseTesting ? 'Testando...' : 'Testar Conexão'}
                </button>

                <button
                  onClick={handleSaveSupabase}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-opacity-90 transition-colors"
                  aria-label="Salvar configurações do Supabase"
                >
                  <Check size={14} />
                  Salvar Config
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCreateTables}
                  disabled={creatingTables || !localSupabaseUrl || !localSupabaseKey}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-md text-xs font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                  aria-label="Criar tabelas no Supabase"
                >
                  {creatingTables ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
                  {creatingTables ? 'Criando...' : 'Criar Tabelas'}
                </button>

                <button
                  onClick={handleSyncData}
                  disabled={syncing || !supabaseConnected}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50"
                  aria-label="Sincronizar dados com Supabase"
                >
                  {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                  {syncing ? 'Sincronizando...' : 'Sincronizar Dados'}
                </button>
              </div>

              {/* SQL Preview */}
              {showSql && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Execute este SQL no Supabase:</span>
                    <button
                      onClick={handleCopySql}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                      aria-label="Copiar SQL para clipboard"
                    >
                      {sqlCopied ? <Check size={12} /> : <Copy size={12} />}
                      {sqlCopied ? 'Copiado!' : 'Copiar SQL'}
                    </button>
                  </div>
                  <pre className="bg-secondary/50 rounded-md p-3 text-[10px] text-muted-foreground overflow-x-auto max-h-32 overflow-y-auto">
                    {getCreateTablesSql()}
                  </pre>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground">
                Acesse{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Supabase Dashboard
                </a>
                {' '}para obter suas credenciais.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 bg-secondary/10 border-t border-border flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded-md transition-colors"
            aria-label="Fechar modal de configurações"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
