import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { MapPin, Settings, Loader2, Square, Palette, ChevronDown, Search } from 'lucide-react';
import LocationSelector from './components/LocationSelector';
import LocationManagementModal from './components/LocationManagementModal';
import SettingsModal from './components/SettingsModal';
import StatusManagementModal from './components/StatusManagementModal';
import CategoryManagementModal from './components/CategoryManagementModal';
import LeadCard from './components/LeadCard';
import { ToastProvider } from './components/ToastProvider';
import useStore from './store/useStore';
import { useSearch } from './hooks/useSearch';
import { useFilteredLeads } from './hooks/useFilteredLeads';
import { useEscapeKey } from './hooks/useEscapeKey';

/**
 * Main application component for PLeads
 * Manages lead generation and tracking using Google Places API
 */
function App() {
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // UI states
  const [activeTab, setActiveTab] = useState('all');
  const [activeStatus, setActiveStatus] = useState<string | null>('all');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  // Store
  const {
    selectedState,
    selectedCity,
    selectedNeighborhoods,
    getFilteredLeads,
    addLeads,
    clearLeads,
    removeLeadsByCategory,
    updateLeadStatus,
    updateLeadNotes,
    statuses,
    addStatus,
    removeStatus,
    categories,
    addCategory,
    removeCategory,
    getApiKey,
    supabaseUrl,
    supabaseAnonKey,
    setSupabaseConnected,
    appTitle,
    appDescription,
    appLogoUrl,
    maxLeadsPerCategory
  } = useStore();

  // Custom hooks
  const { isSearching, searchStatus, handleSearch, stopSearch } = useSearch();

  // Initialize Supabase if env vars are present
  const initializedRef = useRef(false);
  if (!initializedRef.current && supabaseUrl && supabaseAnonKey) {
    import('./services/supabaseService').then(({ initSupabase, testConnection }) => {
      initSupabase(supabaseUrl, supabaseAnonKey);
      testConnection(supabaseUrl, supabaseAnonKey).then(result => {
        if (result.success) {
          setSupabaseConnected(true);
          console.log('Supabase auto-connected from env vars');
        }
      });
    });
    initializedRef.current = true;
  }

  // Get filtered leads from store
  const baseFilteredLeads = getFilteredLeads();
  const hasLocationSelected = !!(selectedState && selectedCity);

  // Use filtering hook
  const { filteredLeads, categoryCounts, statusCounts } = useFilteredLeads(
    baseFilteredLeads,
    categories,
    statuses,
    activeTab,
    activeStatus
  );

  // Close dropdown on Escape key
  useEscapeKey(() => setIsSearchDropdownOpen(false), isSearchDropdownOpen);

  /**
   * Handle search for a specific category or all categories
   */
  const handleSearchNewPlaces = async (targetCategoryId: string | null = null) => {
    if (!selectedState || !selectedCity) {
      toast.error('Por favor, selecione um estado e uma cidade primeiro.');
      return;
    }

    const result = await handleSearch(
      selectedState,
      selectedCity,
      selectedNeighborhoods,
      categories,
      getApiKey(),
      maxLeadsPerCategory,
      targetCategoryId
    );

    if (result.success && result.newLeads.length > 0) {
      const addedCount = addLeads(result.newLeads);
      const message = result.wasStopped
        ? `Busca interrompida. ${addedCount} novos leads adicionados de ${result.newLeads.length} encontrados.`
        : `Varredura concluída! ${addedCount} novos leads adicionados de ${result.newLeads.length} encontrados.`;
      toast.success(message);
    } else if (!result.success) {
      toast.error(result.message);
    } else {
      toast('Nenhum lead novo encontrado.', { icon: 'ℹ️' });
    }
  };

  /**
   * Handle clearing leads (all or by category)
   */
  const handleClearLeads = () => {
    if (activeTab === 'all') {
      if (window.confirm('Tem certeza que deseja limpar todos os leads desta localização?')) {
        clearLeads(true);
      }
    } else {
      const catLabel = categories.find(c => c.id === activeTab)?.label;
      if (window.confirm(`Tem certeza que deseja limpar apenas os leads de ${catLabel} desta localização?`)) {
        removeLeadsByCategory(activeTab);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans transition-colors duration-300">
      {/* Header */}
      <header className="mb-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {appLogoUrl && (
              <img
                src={appLogoUrl}
                alt="Logo"
                className="w-12 h-12 object-contain rounded-lg shadow-inner bg-black"
              />
            )}
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-primary">{appTitle}</h1>
              <p className="text-muted-foreground mt-1">{appDescription}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center gap-2"
              aria-label="Abrir gestão de categorias"
            >
              <Loader2 size={16} />
              Gestão de Categorias
            </button>
            <button
              onClick={() => setIsStatusModalOpen(true)}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center gap-2"
              aria-label="Abrir gestão de status"
            >
              <Palette size={16} />
              Gestão de Status
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center gap-2"
              aria-label="Abrir gestão de locais"
            >
              <MapPin size={16} />
              Gestão de Locais
            </button>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center gap-2"
              aria-label="Abrir configurações"
            >
              <Settings size={16} />
              Configurações
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <div className="bg-card border border-border rounded-lg shadow-lg p-6 mb-6">
          <LocationSelector />

          {/* Search Actions */}
          {hasLocationSelected && (
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="relative">
                <button
                  onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}
                  disabled={isSearching}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  aria-label="Buscar leads"
                  aria-expanded={isSearchDropdownOpen}
                  aria-haspopup="true"
                >
                  <Search size={16} />
                  Buscar Leads
                  <ChevronDown size={14} />
                </button>

                {/* Dropdown for category-specific search */}
                {isSearchDropdownOpen && (
                  <div className="absolute top-full mt-2 left-0 bg-card border border-border rounded-md shadow-lg py-1 z-10 min-w-[200px]">
                    <button
                      onClick={() => {
                        handleSearchNewPlaces(null);
                        setIsSearchDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-secondary/50 transition-colors"
                      aria-label="Buscar em todas as categorias"
                    >
                      Todas as Categorias
                    </button>
                    <div className="border-t border-border my-1" />
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          handleSearchNewPlaces(cat.id);
                          setIsSearchDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-secondary/50 transition-colors"
                        aria-label={`Buscar apenas ${cat.label}`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isSearching && (
                <button
                  onClick={stopSearch}
                  className="bg-destructive text-destructive-foreground px-6 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors flex items-center gap-2"
                  aria-label="Parar busca"
                >
                  <Square size={16} />
                  Parar Busca
                </button>
              )}

              {baseFilteredLeads.length > 0 && !isSearching && (
                <button
                  onClick={handleClearLeads}
                  className="bg-secondary text-secondary-foreground px-6 py-2 rounded-md font-medium hover:bg-opacity-80 transition-colors"
                  aria-label={activeTab === 'all' ? 'Limpar todos os leads' : 'Limpar leads da categoria'}
                >
                  Limpar {activeTab === 'all' ? 'Todos' : categories.find(c => c.id === activeTab)?.label}
                </button>
              )}
            </div>
          )}

          {/* Search Status */}
          {isSearching && searchStatus && (
            <div className="mt-4 bg-primary/10 text-primary px-4 py-2 rounded-md text-sm animate-pulse">
              {searchStatus}
            </div>
          )}
        </div>

        {/* Leads Display Section */}
        <div className="bg-card border border-border rounded-lg shadow-lg p-6">
          {/* Category Tabs */}
          {hasLocationSelected && baseFilteredLeads.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-border">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
                aria-label="Todas as categorias"
              >
                Todas ({baseFilteredLeads.length})
              </button>
              {categories.map(cat => {
                const count = categoryCounts.get(cat.id) || 0;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      activeTab === cat.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                    aria-label={`Filtrar por ${cat.label}`}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Status Sub-filters */}
          {hasLocationSelected && baseFilteredLeads.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setActiveStatus('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                  activeStatus === 'all'
                    ? 'bg-foreground text-background border-foreground shadow-sm'
                    : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground hover:text-foreground'
                }`}
                aria-label="Todos os status"
              >
                Todos Status
              </button>
              {statuses.map(status => {
                const count = statusCounts.get(status.id) || 0;
                if (count === 0 && activeStatus !== status.id) return null;

                return (
                  <button
                    key={status.id}
                    onClick={() => setActiveStatus(status.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      activeStatus === status.id
                        ? 'bg-foreground text-background border-foreground shadow-sm'
                        : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground hover:text-foreground'
                    }`}
                    aria-label={`Filtrar por status ${status.label}`}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: status.color }}
                      aria-hidden="true"
                    />
                    {status.label} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty States and Leads Grid */}
          {!hasLocationSelected ? (
            <div className="bg-card border border-border rounded-lg shadow-sm p-12 text-center">
              <MapPin size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Selecione um <strong>Estado</strong> e <strong>Cidade</strong> para começar.
              </p>
            </div>
          ) : baseFilteredLeads.length === 0 ? (
            <div className="bg-card border border-border rounded-lg shadow-sm p-12 text-center">
              <Search size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum lead encontrado para esta localização. Clique em <strong>Buscar Leads</strong> para começar a varredura.
              </p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="bg-card border border-border rounded-lg shadow-sm p-12 text-center">
              <p className="text-muted-foreground">Nenhum lead encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLeads.map((lead) => (
                <LeadCard
                  key={lead.place_id}
                  lead={lead}
                  statuses={statuses}
                  categories={categories}
                  onStatusUpdate={updateLeadStatus}
                  onNotesUpdate={updateLeadNotes}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <LocationManagementModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <StatusManagementModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        statuses={statuses}
        addStatus={addStatus}
        removeStatus={removeStatus}
      />

      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        addCategory={addCategory}
        removeCategory={removeCategory}
      />

      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />

      {/* Toast notifications */}
      <ToastProvider />
    </div>
  );
}

export default App;
