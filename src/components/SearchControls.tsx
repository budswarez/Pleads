import { Search, ChevronDown, Square, Filter, FilterX, Loader2 } from 'lucide-react';
import type { Category, Lead } from '../types';
import { ExportButton } from './ExportButton';

interface SearchControlsProps {
    hasLocationSelected: boolean;
    isSearching: boolean;
    isSearchDropdownOpen: boolean;
    setIsSearchDropdownOpen: (open: boolean) => void;
    handleSearchNewPlaces: (categoryId: string | null) => Promise<void>;
    categories: Category[];
    stopSearch: () => void;
    baseFilteredLeads: Lead[];
    handleClearLeads: () => void;
    activeTab: string;
    searchStatus: string;
    nameFilter: string;
    setNameFilter: (name: string) => void;
    setActiveTab: (tab: string) => void;
}

export function SearchControls({
    hasLocationSelected,
    isSearching,
    isSearchDropdownOpen,
    setIsSearchDropdownOpen,
    handleSearchNewPlaces,
    categories,
    stopSearch,
    baseFilteredLeads,
    handleClearLeads,
    activeTab,
    searchStatus,
    nameFilter,
    setNameFilter,
    setActiveTab
}: SearchControlsProps) {
    if (!hasLocationSelected && !isSearching) return null;

    const activeFiltersCount = (nameFilter ? 1 : 0) + (activeTab !== 'all' ? 1 : 0);

    return (
        <>
            <div className="mt-6 flex flex-col md:flex-row flex-wrap gap-3">
                <div className="relative w-full md:w-auto">
                    <button
                        onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}
                        disabled={isSearching}
                        className="w-full md:w-auto bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        aria-label={isSearching ? "Buscando leads" : "Buscar leads"}
                        aria-expanded={isSearchDropdownOpen}
                        aria-haspopup="true"
                    >
                        {isSearching ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Buscando...
                            </>
                        ) : (
                            <>
                                <Search size={16} />
                                Buscar Leads
                                <ChevronDown size={14} />
                            </>
                        )}
                    </button>

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
                        title="Os resultados já encontrados serão preservados"
                    >
                        <Square size={16} />
                        Parar Busca
                    </button>
                )}

                {/* Filtro de Texto */}
                <div className="relative flex-grow md:flex-grow-0 md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Filter size={14} className="text-muted-foreground" />
                    </div>
                    <input
                        type="text"
                        placeholder="Filtrar resultados por nome..."
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-input text-foreground border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                        aria-label="Filtrar leads por nome"
                    />
                </div>

                {(nameFilter || activeTab !== 'all') && (
                    <button
                        onClick={() => {
                            setNameFilter('');
                            setActiveTab('all');
                        }}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground bg-secondary/50 hover:bg-secondary hover:text-foreground rounded-md transition-colors flex items-center justify-center gap-2"
                        aria-label="Limpar filtros"
                    >
                        <FilterX size={16} />
                        <span className="hidden sm:inline">Limpar Filtros</span>
                        <span className="ml-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center flex items-center justify-center h-5">
                            {activeFiltersCount}
                        </span>
                    </button>
                )}

                <ExportButton leads={baseFilteredLeads} disabled={isSearching} />

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

            {isSearching && searchStatus && (
                <div className="mt-4 bg-primary/10 text-primary px-4 py-2 rounded-md text-sm animate-pulse">
                    {searchStatus}
                </div>
            )}
        </>
    );
}
