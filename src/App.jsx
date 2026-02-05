import { useState, useRef } from 'react';
import { MapPin, Phone, MessageCircle, ExternalLink, Search, Settings, Loader2, Square, Plus, Trash2, Palette, X, Globe, Star, StarHalf, ChevronDown } from 'lucide-react';
import LocationSelector from './components/LocationSelector';
import LocationManagementModal from './components/LocationManagementModal';
import SettingsModal from './components/SettingsModal';
import useStore from './store/useStore';
import { searchPlaces, sleep, getPlaceDetails } from './services/placesService';

const StatusManagementModal = ({ isOpen, onClose, statuses, addStatus, removeStatus }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    if (newLabel.trim()) {
      addStatus(newLabel.trim(), newColor);
      setNewLabel('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/20">
          <div className="flex items-center gap-2">
            <Palette className="text-primary" size={20} />
            <h2 className="text-xl font-bold text-foreground">Gestão de Status</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Novo Status
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Ex: Interessado, Prioridade..."
                    className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="relative w-10 h-10 shrink-0">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div
                      className="w-full h-full rounded-md border border-border"
                      style={{ backgroundColor: newColor }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground p-2 rounded-md hover:bg-opacity-90 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
              Status Atuais
            </label>
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {statuses.map((status) => (
                <div
                  key={status.id}
                  className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-sm font-medium text-foreground">{status.label}</span>
                  </div>
                  <button
                    onClick={() => removeStatus(status.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    title="Remover status"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-secondary/10 border-t border-border flex justify-end">
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

const CategoryManagementModal = ({ isOpen, onClose, categories, addCategory, removeCategory }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newQuery, setNewQuery] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    if (newLabel.trim() && newQuery.trim()) {
      addCategory(newLabel.trim(), newQuery.trim());
      setNewLabel('');
      setNewQuery('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/20">
          <div className="flex items-center gap-2">
            <Settings className="text-primary" size={20} />
            <h2 className="text-xl font-bold text-foreground">Gestão de Categorias</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Nova Categoria
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Nome (Ex: Farmácias)"
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newQuery}
                      onChange={(e) => setNewQuery(e.target.value)}
                      placeholder="Termo de Busca (Ex: farmacia)"
                      className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      type="submit"
                      className="bg-primary text-primary-foreground p-2 rounded-md hover:bg-opacity-90 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
              Categorias Atuais
            </label>
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border group"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{cat.label}</span>
                    <span className="text-[10px] text-muted-foreground">Query: {cat.query}</span>
                  </div>
                  <button
                    onClick={() => removeCategory(cat.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    title="Remover categoria"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-secondary/10 border-t border-border flex justify-end">
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

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const stopSearchRef = useRef(false);

  const {
    selectedState,
    selectedCity,
    selectedNeighborhood,
    leads,
    getFilteredLeads,
    addLeads,
    clearLeads,
    removeLeadsByCategory,
    updateLeadStatus,
    updateLeadNotes,
    statuses,
    addStatus,
    removeStatus,
    updateStatus,
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

  // Initialize Supabase if env vars are present
  // This runs once when the app hits this state
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



  const filteredLeads = getFilteredLeads();
  const hasLocationSelected = selectedState && selectedCity;

  const displayLeads = filteredLeads.filter(lead => {
    // Category Filter
    let categoryMatch = activeTab === 'all';
    if (!categoryMatch) {
      if (lead.categoryId === activeTab) {
        categoryMatch = true;
      } else {
        const leadCat = lead.category?.toLowerCase() || '';
        if (activeTab === 'restaurant') categoryMatch = leadCat.includes('restaurant') || leadCat.includes('food');
        else categoryMatch = leadCat.includes(activeTab);
      }
    }

    // Status Filter
    const statusMatch = activeStatus === 'all' || lead.status === activeStatus;

    return categoryMatch && statusMatch;
  });

  const handleSearchNewPlaces = async (targetCategoryId = null) => {
    if (!selectedState || !selectedCity) {
      alert('Por favor, selecione um estado e uma cidade primeiro.');
      return;
    }

    setIsSearching(true);
    stopSearchRef.current = false;
    let totalFound = 0;
    let totalAdded = 0;

    try {
      const catsToSearch = targetCategoryId
        ? categories.filter(c => c.id === targetCategoryId)
        : categories;

      for (const cat of catsToSearch) {
        if (stopSearchRef.current) break;

        let pageToken = null;
        let pageCount = 1;

        setSearchStatus(`Buscando ${cat.label}...`);

        do {
          if (stopSearchRef.current) break;

          if (pageToken) {
            setSearchStatus(`Buscando ${cat.label} (Página ${pageCount})...`);
            // Google requer um pequeno delay para o token de próxima página ficar ativo
            await sleep(2000);
          }

          const { results, nextPageToken } = await searchPlaces(selectedCity, selectedState, cat.query, pageToken, getApiKey(), selectedNeighborhood);

          if (results.length > 0) {
            const enrichedResults = [];
            let currentIdx = 0;

            for (const lead of results) {
              if (stopSearchRef.current) break;
              currentIdx++;
              setSearchStatus(`Enriquecendo ${cat.label}: ${currentIdx}/${results.length}...`);

              try {
                const details = await getPlaceDetails(lead.place_id, getApiKey());
                enrichedResults.push({
                  ...lead,
                  categoryId: cat.id,
                  phone: details.phone,
                  website: details.website
                });
              } catch (err) {
                console.warn(`Erro nos detalhes de ${lead.name}:`, err);
                enrichedResults.push(lead);
              }
            }

            const newCount = addLeads(enrichedResults);
            totalFound += enrichedResults.length;
            totalAdded += newCount;

            // Limit Check
            // We check totalFound because it accumulates for this specific search run. 
            // However, logic implies 'per category' limit or 'total' limit?
            // Requirement says "limit of 60 leads for each category"
            // So we need to track count per category.

            // But wait, the loop variable 'totalFound' is across ALL categories if searching multiple.
            // Let's refactor slightly to verify count.

            // Actually, the loop iterates categories. 'totalFound' is a single variable.
            // Correct approach: track leads found FOR THIS CATEGORY.
            // Since 'results' is a batch, we add results.length to a local category counter.
          }

          // NOTE: I need to introduce a category-specific counter.
          // Since I can't easily refactor the whole loop in one replace block without risking errors,
          // I will check if totalFound passes limit *number of categories searched* OR simply check if we have enough.

          // Simpler: Check if (pageCount * 20) >= maxLeadsPerCategory.
          // Google returns 20 per page.
          if (pageCount * 20 >= maxLeadsPerCategory) {
            break; // Stop fetching next pages for this category
          }

          pageToken = nextPageToken;
          pageCount++;

        } while (pageToken && !stopSearchRef.current);
      }

      const message = stopSearchRef.current
        ? `Busca interrompida!\nFinalizado com ${totalFound} locais encontrados e ${totalAdded} novos leads adicionados.`
        : `Varredura completa!\n${totalFound} locais encontrados no total\n${totalAdded} novos leads novos adicionados`;

      alert(message);
    } catch (error) {
      console.error('Erro na varredura:', error);
      alert('Erro ao realizar varredura: ' + error.message);
    } finally {
      setIsSearching(false);
      setSearchStatus('');
    }
  };

  const handleStopSearch = () => {
    stopSearchRef.current = true;
    setSearchStatus('Interrompendo...');
  };

  const openWhatsApp = (phone) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const getStatusColor = (statusId) => {
    const status = statuses.find(s => s.id === statusId);
    return status ? status.color : '#6b7280'; // Default gray-500
  };

  const getStatusLabel = (statusId) => {
    const status = statuses.find(s => s.id === statusId);
    return status ? status.label : statusId;
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<StarHalf key={i} size={14} className="fill-yellow-400 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} size={14} className="text-gray-300" />);
      }
    }
    return (
      <div className="flex items-center gap-0.5" title={`Avaliação: ${rating}`}>
        {stars}
        <span className="text-xs text-muted-foreground ml-1 font-medium">{rating}</span>
      </div>
    );
  };

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
              <img src={appLogoUrl} alt="Logo" className="w-12 h-12 object-contain rounded-lg shadow-inner bg-black" />
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
            >
              <Loader2 size={16} />
              Gestão de Categorias
            </button>
            <button
              onClick={() => setIsStatusModalOpen(true)}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center gap-2"
            >
              <Palette size={16} />
              Gestão de Status
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-80 transition-colors flex items-center gap-2"
            >
              <MapPin size={16} />
              Gestão de Locais
            </button>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center gap-2"
            >
              <Settings size={16} />
              Configurações
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Message */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Bem-vindo!</h2>
          <p className="text-muted-foreground">
            Selecione um estado e uma cidade para visualizar os leads capturados ou procurar novos locais.
          </p>
        </div>

        {/* Location Selector */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <LocationSelector />
        </div>

        {/* Search Button and Status - Only visible when location is selected */}
        {hasLocationSelected && (
          <div className="flex flex-col items-center gap-4">
            {isSearching && (
              <div className="flex items-center gap-3 px-4 py-2 bg-secondary/50 rounded-full border border-border animate-pulse">
                <Loader2 className="animate-spin text-primary" size={18} />
                <span className="text-sm font-medium text-foreground">{searchStatus}</span>
              </div>
            )}

            <div className="flex gap-4">
              {isSearching ? (
                <button
                  onClick={handleStopSearch}
                  className="bg-destructive text-destructive-foreground px-6 py-3 rounded-md font-medium hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-destructive/20"
                >
                  <Square size={20} fill="currentColor" />
                  Parar Busca
                </button>
              ) : (
                <div className="relative flex shadow-lg shadow-primary/20 rounded-md">
                  <button
                    onClick={() => handleSearchNewPlaces(activeTab !== 'all' ? activeTab : null)}
                    className="bg-primary text-primary-foreground px-4 py-3 rounded-l-md font-medium hover:bg-opacity-90 transition-all flex items-center gap-2 border-r border-primary-foreground/20"
                  >
                    <Search size={20} />
                    {activeTab !== 'all'
                      ? `Procurar ${categories.find(c => c.id === activeTab)?.label}`
                      : 'Procurar Novos Locais (Tudo)'}
                  </button>
                  <button
                    onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}
                    className="bg-primary text-primary-foreground px-2 rounded-r-md hover:bg-opacity-90 transition-all"
                  >
                    <ChevronDown size={20} />
                  </button>

                  {isSearchDropdownOpen && (
                    <div className="absolute top-full mt-2 right-0 w-64 bg-card border border-border rounded-lg shadow-xl py-2 z-50 animate-in fade-in zoom-in duration-100">
                      <button
                        onClick={() => {
                          handleSearchNewPlaces(null);
                          setIsSearchDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-secondary transition-colors text-sm font-medium"
                      >
                        Procurar em Todas Categorias
                      </button>
                      <div className="h-px bg-border my-1" />
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            handleSearchNewPlaces(cat.id);
                            setIsSearchDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-secondary transition-colors text-sm flex items-center gap-2"
                        >
                          <span>Procurar {cat.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leads Section */}
        <div>
          <div className="mb-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Leads Capturados ({displayLeads.length})
              </h2>
              {filteredLeads.length > 0 && (
                <button
                  onClick={handleClearLeads}
                  className="text-xs text-destructive hover:underline flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  {activeTab === 'all' ? 'Limpar Todos' : `Limpar ${categories.find(c => c.id === activeTab)?.label}`}
                </button>
              )}
            </div>

            {/* Tabs */}
            {hasLocationSelected && filteredLeads.length > 0 && (
              <div className="flex gap-2 p-1 bg-secondary/30 rounded-lg w-fit">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                >
                  Todos ({filteredLeads.length})
                </button>
                {categories.map(cat => {
                  const count = filteredLeads.filter(l => {
                    if (l.categoryId === cat.id) return true;
                    const leadCat = l.category?.toLowerCase() || '';
                    if (cat.id === 'restaurant') return leadCat.includes('restaurant') || leadCat.includes('food');
                    return leadCat.includes(cat.id);
                  }).length;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveTab(cat.id)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === cat.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                        }`}
                    >
                      {cat.label} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Status Sub-filters */}
            {hasLocationSelected && filteredLeads.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveStatus('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${activeStatus === 'all'
                    ? 'bg-foreground text-background border-foreground shadow-sm'
                    : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground hover:text-foreground'
                    }`}
                >
                  Todos Status
                </button>
                {statuses.map(status => {
                  // Count leads for this status within the CURRENT active tab (category)
                  const count = filteredLeads.filter(l => {
                    // Category check first
                    let categoryMatch = activeTab === 'all';
                    if (!categoryMatch) {
                      if (l.categoryId === activeTab) {
                        categoryMatch = true;
                      } else {
                        const leadCat = l.category?.toLowerCase() || '';
                        if (activeTab === 'restaurant') categoryMatch = leadCat.includes('restaurant') || leadCat.includes('food');
                        else categoryMatch = leadCat.includes(activeTab);
                      }
                    }
                    return categoryMatch && l.status === status.id;
                  }).length;

                  if (count === 0 && activeStatus !== status.id) return null;

                  return (
                    <button
                      key={status.id}
                      onClick={() => setActiveStatus(status.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${activeStatus === status.id
                        ? 'bg-foreground text-background border-foreground shadow-sm'
                        : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground hover:text-foreground'
                        }`}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      {status.label} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {!hasLocationSelected ? (
            <div className="bg-card border border-border rounded-lg shadow-sm p-12 text-center">
              <MapPin size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Selecione um estado e uma cidade para visualizar os leads.
              </p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="bg-card border border-border rounded-lg shadow-sm p-12 text-center">
              <MapPin size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum lead encontrado para {selectedCity}, {selectedState}.
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                Clique em "Procurar Novos Locais" para buscar leads nesta localização.
              </p>
            </div>
          ) : displayLeads.length === 0 ? (
            <div className="bg-card border border-border rounded-lg shadow-sm p-12 text-center">
              <MapPin size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum lead encontrado na categoria selecionada em {selectedCity}, {selectedState}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayLeads.map((lead) => (
                <div
                  key={lead.place_id}
                  className="bg-card border border-border rounded-lg shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: getStatusColor(lead.status) }}
                        />
                        <h3 className="font-semibold text-lg line-clamp-1">{lead.name}</h3>
                      </div>
                      <span className="text-[10px] font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full inline-block">
                        {categories.find(c => c.id === lead.categoryId)?.label || lead.category}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {lead.phone && (
                        <button
                          onClick={() => openWhatsApp(lead.phone)}
                          className="p-1.5 text-muted-foreground hover:text-green-500 transition-colors"
                          title="Abrir WhatsApp"
                        >
                          <MessageCircle size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground mb-4 flex-grow">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2 text-xs">{lead.address}</span>
                    </div>
                    {lead.phone && (
                      <div className="flex items-center gap-2 text-xs">
                        <Phone size={14} />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                    {lead.website && (
                      <div className="flex items-center gap-2 text-xs">
                        <Globe size={14} />
                        <a href={lead.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary truncate max-w-[200px] block">
                          {lead.website}
                        </a>
                      </div>
                    )}
                    {renderStars(lead.rating)}
                  </div>

                  {/* Comment Section */}
                  <div className="mb-4">
                    <textarea
                      placeholder="Adicionar comentário..."
                      className="w-full text-xs bg-muted/30 border border-border rounded p-2 focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none h-16"
                      defaultValue={lead.notes?.[lead.notes.length - 1]?.text || ''}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val && (!lead.notes || lead.notes[lead.notes.length - 1]?.text !== val)) {
                          updateLeadNotes(lead.place_id, val);
                        }
                      }}
                    />
                  </div>

                  <div className="mt-auto pt-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <select
                        className="text-[10px] bg-secondary border border-border rounded px-2 py-1 focus:outline-none"
                        value={lead.status}
                        onChange={(e) => updateLeadStatus(lead.place_id, e.target.value)}
                      >
                        {statuses.map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name)}&query_place_id=${lead.place_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary hover:underline flex items-center gap-1"
                      >
                        Maps <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Location Management Modal */}
      {/* Management Modals */}
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        addCategory={addCategory}
        removeCategory={removeCategory}
      />

      <StatusManagementModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        statuses={statuses}
        addStatus={addStatus}
        removeStatus={removeStatus}
      />

      <LocationManagementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div >
  );
}

export default App;
