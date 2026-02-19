import { Search, ChevronDown, Square } from 'lucide-react';
import type { Category, Lead } from '../types';

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
    searchStatus
}: SearchControlsProps) {
    if (!hasLocationSelected && !isSearching) return null;

    return (
        <>
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

            {isSearching && searchStatus && (
                <div className="mt-4 bg-primary/10 text-primary px-4 py-2 rounded-md text-sm animate-pulse">
                    {searchStatus}
                </div>
            )}
        </>
    );
}
