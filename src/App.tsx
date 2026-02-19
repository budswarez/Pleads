import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { MapPin, Settings, Loader2, Square, Palette, ChevronDown, Search, Users, LogOut, Menu, X } from 'lucide-react';
import { usePagination } from './hooks/usePagination';
import LocationSelector from './components/LocationSelector';
import LocationManagementModal from './components/LocationManagementModal';
import SettingsModal from './components/SettingsModal';
import StatusManagementModal from './components/StatusManagementModal';
import CategoryManagementModal from './components/CategoryManagementModal';
import UserManagementModal from './components/UserManagementModal';
import LeadCard from './components/LeadCard';
import LoginPage from './components/LoginPage';
import SetupPage from './components/SetupPage';
import { ToastProvider } from './components/ToastProvider';
import useStore from './store/useStore';
import { useSearch } from './hooks/useSearch';
import { useFilteredLeads } from './hooks/useFilteredLeads';
import { useEscapeKey } from './hooks/useEscapeKey';
import { useAuth } from './hooks/useAuth';
import { fetchLeads, fetchLocations, fetchCategories, fetchStatuses, syncAllData } from './services/supabaseService';
import type { Lead, Status, Category } from './types';

/**
 * Subcomponent: Paginated grid of LeadCards with navigation controls
 */
function PaginatedLeadsGrid({
  filteredLeads,
  leadsPerPage,
  statuses,
  categories,
  onStatusUpdate,
  onNotesUpdate,
}: {
  filteredLeads: Lead[];
  leadsPerPage: number;
  statuses: Status[];
  categories: Category[];
  onStatusUpdate: (placeId: string, status: string) => void;
  onNotesUpdate: (placeId: string, notes: string) => void;
}) {
  const {
    paginatedItems,
    currentPage,
    totalPages,
    totalItems,
    goToNextPage,
    goToPreviousPage,
  } = usePagination(filteredLeads, leadsPerPage);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedItems.map((lead) => (
          <LeadCard
            key={lead.place_id}
            lead={lead}
            statuses={statuses}
            categories={categories}
            onStatusUpdate={onStatusUpdate}
            onNotesUpdate={onNotesUpdate}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <span className="text-sm text-muted-foreground">
            Exibindo {(currentPage - 1) * leadsPerPage + 1}–{Math.min(currentPage * leadsPerPage, totalItems)} de {totalItems} leads
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage <= 1}
              className="p-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-opacity-80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>

            <span className="text-sm font-medium text-foreground px-3 tabular-nums">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-opacity-80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              aria-label="Próxima página"
            >
              Próxima
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Main application component for PLeads
 * Manages lead generation and tracking using Google Places API
 */
function App() {
  // Auth
  const {
    user,
    profile,
    isAdmin,
    isLoading: isAuthLoading,
    isAuthenticated,
    setupRequired,
    supabaseReady,
    signIn,
    signOut,
    refreshProfile
  } = useAuth();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setSupabaseConnected,
    loadFromSupabase,
    getAllDataForSync,
    appTitle,
    appDescription,
    appLogoUrl,
    maxLeadsPerCategory,
    leadsPerPage
  } = useStore();

  // Custom hooks
  const { isSearching, searchStatus, handleSearch, stopSearch } = useSearch();

  // Mark Supabase as connected and sync data when authenticated
  useEffect(() => {
    if (isAuthenticated && supabaseReady) {
      setSupabaseConnected(true);

      // Auto-sync: upload local data then download from Supabase
      const autoSync = async () => {
        try {
          // Upload local data first
          const localData = getAllDataForSync();
          await syncAllData(localData);

          // Download from Supabase
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
        } catch (err) {
          console.error('Auto-sync failed:', err);
        }
      };

      autoSync();
    }
  }, [isAuthenticated, supabaseReady, setSupabaseConnected, loadFromSupabase, getAllDataForSync]);

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

  const handleSignOut = async () => {
    await signOut();
    setSupabaseConnected(false);
  };

  // --- Auth Guards ---

  // Loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
        <ToastProvider />
      </div>
    );
  }

  // Supabase not configured
  if (!supabaseReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-lg shadow-lg p-8 max-w-md text-center">
          <Settings size={48} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Supabase Não Configurado</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Configure as variáveis de ambiente <code className="text-primary">VITE_SUPABASE_URL</code> e <code className="text-primary">VITE_SUPABASE_ANON_KEY</code> no arquivo <code className="text-primary">.env</code> para habilitar o sistema de autenticação.
          </p>
        </div>
        <ToastProvider />
      </div>
    );
  }

  // Setup required (no admin exists)
  if (setupRequired && !isAuthenticated) {
    return (
      <>
        <SetupPage onSetupComplete={() => refreshProfile()} />
        <ToastProvider />
      </>
    );
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onSignIn={signIn} />
        <ToastProvider />
      </>
    );
  }

  // --- Authenticated App ---
  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans transition-colors duration-300">
      {/* Header */}
      <header className="mb-4 md:mb-8 max-w-7xl mx-auto border-b md:border-none pb-4 md:pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {appLogoUrl && (
              <img
                src={appLogoUrl}
                alt="Logo"
                className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-lg shadow-inner bg-black"
              />
            )}
            <div>
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-primary">{appTitle}</h1>
              <p className="text-xs md:text-base text-muted-foreground mt-1 hidden sm:block">{appDescription}</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center gap-2"
              aria-label="Abrir gestão de categorias"
            >
              <Loader2 size={16} />
              Categorias
            </button>
            <button
              onClick={() => setIsStatusModalOpen(true)}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center gap-2"
              aria-label="Abrir gestão de status"
            >
              <Palette size={16} />
              Status
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center gap-2"
              aria-label="Abrir gestão de locais"
            >
              <MapPin size={16} />
              Locais
            </button>
            {isAdmin && (
              <button
                onClick={() => setIsUserModalOpen(true)}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center gap-2"
                aria-label="Abrir gestão de usuários"
              >
                <Users size={16} />
                Usuários
              </button>
            )}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center gap-2"
              aria-label="Abrir configurações"
            >
              <Settings size={16} />
            </button>

            {/* User info & Logout */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
              <span className="text-xs text-muted-foreground hidden lg:block">
                {profile?.name || user?.user_metadata?.name || user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-secondary/50 transition-colors"
                title="Sair"
                aria-label="Sair do sistema"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-foreground hover:bg-secondary rounded-md"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 space-y-2 border-t pt-4 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between px-2 mb-4">
              <span className="text-sm font-medium text-muted-foreground">
                {profile?.name || user?.user_metadata?.name || user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-secondary/50 transition-colors flex items-center gap-2"
                aria-label="Sair do sistema"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setIsCategoryModalOpen(true); setIsMobileMenuOpen(false); }}
                className="bg-secondary text-secondary-foreground px-4 py-3 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2"
              >
                <Loader2 size={16} />
                Categorias
              </button>
              <button
                onClick={() => { setIsStatusModalOpen(true); setIsMobileMenuOpen(false); }}
                className="bg-secondary text-secondary-foreground px-4 py-3 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2"
              >
                <Palette size={16} />
                Status
              </button>
              <button
                onClick={() => { setIsModalOpen(true); setIsMobileMenuOpen(false); }}
                className="bg-secondary text-secondary-foreground px-4 py-3 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2"
              >
                <MapPin size={16} />
                Locais
              </button>
              <button
                onClick={() => { setIsSettingsModalOpen(true); setIsMobileMenuOpen(false); }}
                className="bg-secondary text-secondary-foreground px-4 py-3 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2"
              >
                <Settings size={16} />
                Configurações
              </button>
              {isAdmin && (
                <button
                  onClick={() => { setIsUserModalOpen(true); setIsMobileMenuOpen(false); }}
                  className="bg-secondary text-secondary-foreground px-4 py-3 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2 col-span-2"
                >
                  <Users size={16} />
                  Usuários
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <div className="bg-card border border-border rounded-lg shadow-lg p-6 mb-6">
          <LocationSelector />

          {/* Search Actions */}
          {hasLocationSelected && (
            <div className="mt-6 flex flex-col md:flex-row flex-wrap gap-3">
              <div className="relative w-full md:w-auto">
                <button
                  onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}
                  disabled={isSearching}
                  className="w-full md:w-auto bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  <div className="absolute top-full mt-2 left-0 w-full md:w-auto bg-card border border-border rounded-md shadow-lg py-1 z-10 min-w-[200px]">
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
                  className="w-full md:w-auto bg-destructive text-destructive-foreground px-6 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
                  aria-label="Parar busca"
                >
                  <Square size={16} />
                  Parar Busca
                </button>
              )}

              {baseFilteredLeads.length > 0 && !isSearching && (
                <button
                  onClick={handleClearLeads}
                  className="w-full md:w-auto bg-secondary text-secondary-foreground px-6 py-2 rounded-md font-medium hover:bg-opacity-80 transition-colors"
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
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'all'
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
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === cat.id
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
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${activeStatus === 'all'
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
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${activeStatus === status.id
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
            <PaginatedLeadsGrid
              filteredLeads={filteredLeads}
              leadsPerPage={leadsPerPage}
              statuses={statuses}
              categories={categories}
              onStatusUpdate={updateLeadStatus}
              onNotesUpdate={updateLeadNotes}
            />
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

      {isAdmin && user && (
        <UserManagementModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          currentUserId={user.id}
        />
      )}

      {/* Toast notifications */}
      <ToastProvider />
    </div>
  );
}

export default App;
