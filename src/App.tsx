import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, MapPin, Loader2, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
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
import { useAutoSync } from './hooks/useAutoSync';
import { Header } from './components/Header';
import { SearchControls } from './components/SearchControls';
import { FilterTabs } from './components/FilterTabs';
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
    appTitle,
    appDescription,
    appLogoUrl,
    maxLeadsPerCategory,
    leadsPerPage
  } = useStore();

  // Custom hooks
  const { isSearching, searchStatus, handleSearch, stopSearch } = useSearch();

  // Mark Supabase as connected and sync data when authenticated
  // Call Auto-Sync custom hook
  useAutoSync(isAuthenticated, supabaseReady);

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
      <Header
        appTitle={appTitle}
        appDescription={appDescription}
        appLogoUrl={appLogoUrl}
        isAdmin={isAdmin}
        username={profile?.name || user?.user_metadata?.name || user?.email || 'Usuário'}
        handleSignOut={handleSignOut}
        openCategoryModal={() => setIsCategoryModalOpen(true)}
        openStatusModal={() => setIsStatusModalOpen(true)}
        openLocationModal={() => setIsModalOpen(true)}
        openSettingsModal={() => setIsSettingsModalOpen(true)}
        openUserModal={() => setIsUserModalOpen(true)}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        <div className="bg-card border border-border rounded-lg shadow-lg p-6 mb-6">
          <LocationSelector />

          {/* Search Actions */}
          <SearchControls
            hasLocationSelected={hasLocationSelected}
            isSearching={isSearching}
            isSearchDropdownOpen={isSearchDropdownOpen}
            setIsSearchDropdownOpen={setIsSearchDropdownOpen}
            handleSearchNewPlaces={handleSearchNewPlaces}
            categories={categories}
            stopSearch={stopSearch}
            baseFilteredLeads={baseFilteredLeads}
            handleClearLeads={handleClearLeads}
            activeTab={activeTab}
            searchStatus={searchStatus}
          />
        </div>

        {/* Leads Display Section */}
        <div className="bg-card border border-border rounded-lg shadow-lg p-6">
          {/* Category Tabs and Status Filters */}
          <FilterTabs
            hasLocationSelected={hasLocationSelected}
            baseFilteredLeads={baseFilteredLeads}
            categories={categories}
            categoryCounts={categoryCounts}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            statuses={statuses}
            statusCounts={statusCounts}
            activeStatus={activeStatus}
            setActiveStatus={setActiveStatus}
          />

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
