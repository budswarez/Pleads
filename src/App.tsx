import { useState } from 'react';
import { Search, MapPin, Loader2, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import VirtualLeadsGrid from './components/VirtualLeadsGrid';
import LocationSelector from './components/LocationSelector';
import LocationManagementModal from './components/LocationManagementModal';
import SettingsModal from './components/SettingsModal';
import StatusManagementModal from './components/StatusManagementModal';
import CategoryManagementModal from './components/CategoryManagementModal';
import UserManagementModal from './components/UserManagementModal';
import LoginPage from './components/LoginPage';
import SetupPage from './components/SetupPage';
import { ToastProvider } from './components/ToastProvider';
import useStore from './store/useStore';
import { initSupabase } from './services/supabaseService';
import { useSearch } from './hooks/useSearch';
import { useFilteredLeads } from './hooks/useFilteredLeads';
import { useEscapeKey } from './hooks/useEscapeKey';
import { useAuth } from './hooks/useAuth';
import { useAutoSync } from './hooks/useAutoSync';
import { Header } from './components/Header';
import { SearchControls } from './components/SearchControls';
import { FilterTabs } from './components/FilterTabs';
import { useModals } from './hooks/useModals';
import { ProgressBar } from './components/ProgressBar';
import { EmptyState } from './components/EmptyState';


/**
 * Main application component for PLeads
 * Manages lead generation and tracking using Google Places API
 */
function App() {
  // Initialize Supabase from env vars on mount if not already initialized
  useState(() => {
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const { supabaseUrl, supabaseAnonKey } = useStore.getState();

    const url = supabaseUrl || envUrl;
    const key = supabaseAnonKey || envKey;

    if (url && key) {
      initSupabase(url, key);
    }
  });

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

  // Modal management hook
  const {
    isLocationModalOpen, openLocationModal, closeLocationModal,
    isStatusModalOpen, openStatusModal, closeStatusModal,
    isCategoryModalOpen, openCategoryModal, closeCategoryModal,
    isSettingsModalOpen, openSettingsModal, closeSettingsModal,
    isUserModalOpen, openUserModal, closeUserModal
  } = useModals();

  // UI states
  const [activeTab, setActiveTab] = useState('all');
  const [activeStatus, setActiveStatus] = useState<string | null>('all');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [searchProgress, setSearchProgress] = useState({ current: 0, total: 0 });

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
    deleteLeadNote,
    removeLead,
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
    maxLeadsPerCategory
  } = useStore();

  // Custom hooks
  const { isSearching, searchStatus, handleSearch, stopSearch } = useSearch();

  // Mark Supabase as connected and sync data when authenticated
  // Call Auto-Sync custom hook - reactive to location changes
  useAutoSync(isAuthenticated, supabaseReady, selectedCity, selectedState);

  // Get filtered leads from store
  const baseFilteredLeads = getFilteredLeads();
  const hasLocationSelected = !!(selectedState && selectedCity);

  // Use filtering hook
  const { filteredLeads, categoryCounts, statusCounts } = useFilteredLeads(
    baseFilteredLeads,
    categories,
    statuses,
    activeTab,
    activeStatus,
    nameFilter
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

    // Calcular total esperado para a barra de progresso
    const categoriesCount = targetCategoryId ? 1 : categories.length;
    const totalExpected = maxLeadsPerCategory * categoriesCount;
    setSearchProgress({ current: 0, total: totalExpected });

    let totalAddedCount = 0;
    let totalFetchedCount = 0;

    const result = await handleSearch(
      selectedState,
      selectedCity,
      selectedNeighborhoods,
      categories,
      getApiKey(),
      maxLeadsPerCategory,
      targetCategoryId,
      async (batch) => {
        const added = await addLeads(batch);
        totalAddedCount += added;
        totalFetchedCount += batch.length;
        setSearchProgress(prev => ({ ...prev, current: totalFetchedCount }));
      }
    );

    setSearchProgress({ current: 0, total: 0 });

    if (result.success) {
      if (totalAddedCount > 0) {
        // Disparar confete para celebrar novos leads!
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#3b82f6', '#eab308', '#ef4444'], // Cores do app (verde, azul, amarelo, vermelho)
          disableForReducedMotion: true
        });

        const message = result.wasStopped
          ? `Busca interrompida. ${totalAddedCount} novos leads adicionados de ${result.newLeads.length} encontrados.`
          : `Varredura concluída! ${totalAddedCount} novos leads adicionados de ${result.newLeads.length} encontrados.`;
        toast.success(message);
      } else if (result.newLeads.length > 0) {
        toast('Todos os leads encontrados já estavam na sua base.', { icon: 'ℹ️' });
      } else {
        toast('Nenhum lead novo encontrado.', { icon: 'ℹ️' });
      }
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

  /**
   * Handle individual lead removal with Undo capability
   */
  const handleRemoveLead = (placeId: string) => {
    // Encontrar o lead antes de remover para poder restaurar (usando closure do render atual)
    const leadToRemove = baseFilteredLeads.find(l => l.place_id === placeId);

    if (!leadToRemove) return;

    removeLead(placeId);

    toast.success((t) => (
      <div className="flex items-center gap-2">
        <span>Lead excluído</span>
        <button
          onClick={() => {
            addLeads([leadToRemove]);
            toast.dismiss(t.id);
          }}
          className="px-2 py-1 bg-primary-foreground text-primary text-xs rounded font-bold hover:bg-opacity-90 transition-colors border border-border shadow-sm"
        >
          Desfazer
        </button>
      </div>
    ), { duration: 5000, icon: '🗑️' });
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
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans transition-colors duration-300">
      {/* Header */}
      <Header
        appTitle={appTitle}
        appDescription={appDescription}
        appLogoUrl={appLogoUrl}
        isAdmin={isAdmin}
        username={profile?.name || user?.user_metadata?.name || user?.email || 'Usuário'}
        handleSignOut={handleSignOut}
        openCategoryModal={openCategoryModal}
        openStatusModal={openStatusModal}
        openLocationModal={openLocationModal}
        openSettingsModal={openSettingsModal}
        openUserModal={openUserModal}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto space-y-6">
        <div className="glass-effect rounded-2xl shadow-xl p-4 md:p-6 transition-all duration-500 hover:shadow-primary/5 border border-border/50">
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
            nameFilter={nameFilter}
            setNameFilter={setNameFilter}
            setActiveTab={setActiveTab}
          />
        </div>

        {/* Leads Display Section */}
        <div className="glass-effect rounded-2xl shadow-xl p-4 md:p-6 transition-all duration-500 hover:shadow-primary/5 border border-border/50">
          {/* Barra de Progresso */}
          <ProgressBar
            current={searchProgress.current}
            total={searchProgress.total}
            isSearching={isSearching}
          />

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
            isSearching={isSearching}
          />

          {/* Empty States and Leads Grid */}
          {!hasLocationSelected ? (
            <EmptyState
              icon={MapPin}
              description={
                <>
                  Selecione um <strong>Estado</strong> e <strong>Cidade</strong> para começar.
                </>
              }
            />
          ) : baseFilteredLeads.length === 0 ? (
            <EmptyState
              icon={Search}
              description={
                <>
                  Nenhum lead encontrado para esta localização. Clique em <strong>Buscar Leads</strong> para começar a varredura.
                </>
              }
            />
          ) : filteredLeads.length === 0 ? (
            <EmptyState
              description="Nenhum lead encontrado com os filtros aplicados."
            />
          ) : (
            <VirtualLeadsGrid
              leads={filteredLeads}
              statuses={statuses}
              categories={categories}
              onStatusUpdate={updateLeadStatus}
              onNotesUpdate={updateLeadNotes}
              onNoteDelete={deleteLeadNote}
              onRemoveLead={handleRemoveLead}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <LocationManagementModal isOpen={isLocationModalOpen} onClose={closeLocationModal} />

      <StatusManagementModal
        isOpen={isStatusModalOpen}
        onClose={closeStatusModal}
        statuses={statuses}
        addStatus={addStatus}
        removeStatus={removeStatus}
      />

      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
        categories={categories}
        addCategory={addCategory}
        removeCategory={removeCategory}
      />

      <SettingsModal isOpen={isSettingsModalOpen} onClose={closeSettingsModal} />

      {isAdmin && user && (
        <UserManagementModal
          isOpen={isUserModalOpen}
          onClose={closeUserModal}
          currentUserId={user.id}
        />
      )}

      {/* Toast notifications */}
      <ToastProvider />
    </div>
  );
}

export default App;
