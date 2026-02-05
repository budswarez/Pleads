import { useState, useEffect } from 'react';
import { Settings, X, Key, Eye, EyeOff, CheckCircle, AlertCircle, Database, RefreshCw, Loader2, Copy, Check } from 'lucide-react';
import useStore from '../store/useStore';
import {
    initSupabase,
    testConnection,
    createTables,
    syncAllData,
    getCreateTablesSql,
    fetchLeads,
    fetchLocations,
    fetchCategories,
    fetchStatuses
} from '../services/supabaseService';

const SettingsModal = ({ isOpen, onClose }) => {
    const {
        apiKey, setApiKey, getApiKey,
        supabaseUrl, supabaseAnonKey, supabaseConnected,
        setSupabaseConfig, setSupabaseConnected,
        getAllDataForSync, loadFromSupabase,
        appTitle, appDescription, appLogoUrl, setBranding
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
    const [supabaseStatus, setSupabaseStatus] = useState({ type: null, message: '' });
    const [creatingTables, setCreatingTables] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [showSql, setShowSql] = useState(false);
    const [sqlCopied, setSqlCopied] = useState(false);

    // Branding State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [logoUrl, setLogoUrl] = useState('');

    useEffect(() => {
        if (isOpen) {
            setLocalApiKey(apiKey || '');
            setLocalSupabaseUrl(supabaseUrl || '');
            setLocalSupabaseKey(supabaseAnonKey || '');
            setTitle(appTitle || '');
            setDescription(appDescription || '');
            setLogoUrl(appLogoUrl || '');
            setApiKeySaved(false);
            setSupabaseStatus({ type: null, message: '' });
        }
    }, [isOpen, apiKey, supabaseUrl, supabaseAnonKey, appTitle, appDescription, appLogoUrl]);

    if (!isOpen) return null;

    const handleSaveApiKey = (e) => {
        e.preventDefault();
        setApiKey(localApiKey.trim());
        setApiKeySaved(true);
        setTimeout(() => setApiKeySaved(false), 2000);
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
        setTimeout(() => setSupabaseStatus({ type: null, message: '' }), 2000);
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
            message: result.message
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
            setSupabaseStatus({ type: 'success', message: result.message });
        } else {
            setSupabaseStatus({ type: 'error', message: result.message });
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
            // Upload local data to Supabase
            const localData = getAllDataForSync();
            const uploadResult = await syncAllData(localData);

            if (uploadResult.success) {
                // Fetch data from Supabase to ensure we have the latest
                const [leadsRes, locationsRes, categoriesRes, statusesRes] = await Promise.all([
                    fetchLeads(),
                    fetchLocations(),
                    fetchCategories(),
                    fetchStatuses()
                ]);

                loadFromSupabase({
                    leads: leadsRes.data,
                    locations: locationsRes.data?.map(l => ({ ...l, id: l.id })),
                    categories: categoriesRes.data,
                    statuses: statusesRes.data
                });

                setSupabaseStatus({ type: 'success', message: 'Dados sincronizados com sucesso!' });
            } else {
                setSupabaseStatus({ type: 'error', message: uploadResult.message });
            }
        } catch (error) {
            setSupabaseStatus({ type: 'error', message: `Erro: ${error.message}` });
        }

        setSyncing(false);
    };

    const handleCopySql = () => {
        navigator.clipboard.writeText(getCreateTablesSql());
        setSqlCopied(true);
        setTimeout(() => setSqlCopied(false), 2000);
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
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Branding Section */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <span className="bg-primary/10 p-1 rounded-md text-primary">🎨</span> Personalização
                            </h3>
                            <button
                                onClick={() => setBranding(title, description, logoUrl)}
                                className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-opacity-90"
                            >
                                Salvar Aparência
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">Nome da Aplicação</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Ex: Minha Empresa Leads"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-foreground">URL do Logo</label>
                                <input
                                    type="text"
                                    value={logoUrl}
                                    onChange={(e) => setLogoUrl(e.target.value)}
                                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="/logo.png ou https://..."
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-xs font-medium text-foreground">Descrição / Slogan</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Ex: Sistema de Gestão..."
                                />
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
                                    type={showApiKey ? 'text' : 'password'}
                                    value={localApiKey}
                                    onChange={(e) => setLocalApiKey(e.target.value)}
                                    placeholder="Cole sua API Key aqui..."
                                    className="w-full bg-input border border-border rounded-md pl-3 pr-20 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                >
                                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                <button
                                    type="submit"
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs font-medium transition-all ${apiKeySaved ? 'bg-green-500 text-white' : 'bg-primary text-primary-foreground hover:bg-opacity-90'
                                        }`}
                                >
                                    {apiKeySaved ? <Check size={14} /> : 'Salvar'}
                                </button>
                            </div>

                            <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs ${hasApiKey ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                {hasApiKey ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                <span>{hasApiKey ? 'API Key configurada' : 'Nenhuma API Key configurada'}</span>
                            </div>
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
                                <label className="text-xs text-muted-foreground mb-1 block">Project URL</label>
                                <input
                                    type="text"
                                    value={localSupabaseUrl}
                                    onChange={(e) => setLocalSupabaseUrl(e.target.value)}
                                    placeholder="https://seu-projeto.supabase.co"
                                    className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Anon/Public Key</label>
                                <div className="relative">
                                    <input
                                        type={showSupabaseKey ? 'text' : 'password'}
                                        value={localSupabaseKey}
                                        onChange={(e) => setLocalSupabaseKey(e.target.value)}
                                        placeholder="sb_publishable_..."
                                        className="w-full bg-input border border-border rounded-md pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showSupabaseKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Status message */}
                            {supabaseStatus.message && (
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs ${supabaseStatus.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                    }`}>
                                    {supabaseStatus.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                    <span>{supabaseStatus.message}</span>
                                </div>
                            )}

                            {/* Connection status */}
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs ${supabaseConnected ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                {supabaseConnected ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                <span>{supabaseConnected ? 'Conectado ao Supabase' : 'Não conectado'}</span>
                            </div>

                            {/* Action buttons */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={handleTestConnection}
                                    disabled={supabaseTesting}
                                    className="flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-foreground rounded-md text-xs font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
                                >
                                    {supabaseTesting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                    {supabaseTesting ? 'Testando...' : 'Testar Conexão'}
                                </button>

                                <button
                                    onClick={handleSaveSupabase}
                                    className="flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-opacity-90 transition-colors"
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
                                >
                                    {creatingTables ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
                                    {creatingTables ? 'Criando...' : 'Criar Tabelas'}
                                </button>

                                <button
                                    onClick={handleSyncData}
                                    disabled={syncing || !supabaseConnected}
                                    className="flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50"
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
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
