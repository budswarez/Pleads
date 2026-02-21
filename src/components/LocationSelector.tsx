import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, MapPinOff } from 'lucide-react';
import useStore from '../store/useStore';
import { EmptyState } from './EmptyState';
import { ThemedSelect } from './ThemedSelect';

/**
 * Componente para seleção de localização (Estado, Cidade, Bairros)
 * Permite filtrar os leads por localização e selecionar múltiplos bairros
 */
const LocationSelector = () => {
  const {
    selectedState,
    selectedCity,
    selectedNeighborhoods,
    setSelectedState,
    setSelectedCity,
    setSelectedNeighborhoods,
    getStates,
    getCitiesByState,
    getNeighborhoodsByLocation
  } = useStore();

  const [isNeighborhoodDropdownOpen, setIsNeighborhoodDropdownOpen] = useState(false);
  const neighborhoodDropdownRef = useRef<HTMLDivElement>(null);

  const states = getStates();
  const cities = selectedState ? getCitiesByState(selectedState) : [];
  const neighborhoods = (selectedState && selectedCity)
    ? getNeighborhoodsByLocation(selectedCity, selectedState)
    : [];

  const toggleNeighborhood = (neighborhood: string) => {
    const isSelected = selectedNeighborhoods.includes(neighborhood);
    if (isSelected) {
      setSelectedNeighborhoods(selectedNeighborhoods.filter(n => n !== neighborhood));
    } else {
      setSelectedNeighborhoods([...selectedNeighborhoods, neighborhood]);
    }
  };

  const selectAll = () => {
    setSelectedNeighborhoods([...neighborhoods]);
  };

  const clearSelection = () => {
    setSelectedNeighborhoods([]);
  };

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (neighborhoodDropdownRef.current && !neighborhoodDropdownRef.current.contains(target)) {
        setIsNeighborhoodDropdownOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNeighborhoodDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const getDropdownLabel = () => {
    if (!selectedCity) return 'Selecione uma cidade primeiro';
    if (neighborhoods.length === 0) return 'Nenhum bairro cadastrado';
    if (selectedNeighborhoods.length === 0) return 'Todos (cidade inteira)';
    if (selectedNeighborhoods.length === 1) return selectedNeighborhoods[0];
    return `${selectedNeighborhoods.length} bairros selecionados`;
  };

  const showEmptyState = selectedCity && neighborhoods.length === 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* State Selector */}
      <ThemedSelect
        label="Estado (UF)"
        options={states.map(s => ({ id: s, label: s }))}
        value={selectedState || ''}
        onChange={setSelectedState}
        disabled={states.length === 0}
        placeholder={states.length === 0 ? 'Nenhum estado cadastrado' : 'Selecione o estado...'}
      />

      {/* City Selector */}
      <ThemedSelect
        label="Cidade"
        options={cities.map(c => ({ id: c, label: c }))}
        value={selectedCity || ''}
        onChange={setSelectedCity}
        disabled={!selectedState || cities.length === 0}
        placeholder={!selectedState ? 'Selecione um estado primeiro' : cities.length === 0 ? 'Nenhuma cidade cadastrada' : 'Selecione a cidade...'}
      />

      {/* Neighborhood Multi-Select */}
      <div className="md:col-span-2 space-y-2" ref={neighborhoodDropdownRef}>
        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1">
          Bairros (Opcional)
        </label>

        {showEmptyState ? (
          <EmptyState
            icon={MapPinOff}
            description={
              <span className="text-xs font-medium">
                Nenhum bairro cadastrado. A busca será feita em toda a cidade.
                <br />
                <span className="opacity-60">Cadastre bairros na Gestão de Locais para filtrar.</span>
              </span>
            }
            className="p-4 py-8 border-dashed bg-secondary/10 rounded-xl"
          />
        ) : (
          <>
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  if (selectedCity && neighborhoods.length > 0) {
                    setIsNeighborhoodDropdownOpen(!isNeighborhoodDropdownOpen);
                  }
                }}
                disabled={!selectedCity || neighborhoods.length === 0}
                className="w-full bg-secondary/30 hover:bg-secondary/50 text-foreground border border-border/50 rounded-xl px-4 py-3 pr-10 text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                aria-label="Selecionar bairros"
              >
                <span className={`font-medium ${!selectedCity || neighborhoods.length === 0 || selectedNeighborhoods.length === 0 ? 'text-muted-foreground/50' : 'text-primary animate-in fade-in'}`}>
                  {getDropdownLabel()}
                </span>
              </button>
              <ChevronDown
                size={18}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none transition-all duration-300 ${isNeighborhoodDropdownOpen ? 'rotate-180 text-primary' : 'group-hover:text-primary'}`}
                aria-hidden="true"
              />

              {/* Dropdown */}
              {isNeighborhoodDropdownOpen && neighborhoods.length > 0 && (
                <div className="absolute z-[60] mt-1 w-full bg-card border border-border rounded-xl shadow-2xl overflow-hidden min-w-[200px]">
                  {/* Select all / Clear */}
                  <div className="flex items-center justify-between px-4 py-2 bg-secondary/20 border-b border-border">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                      Selecionar todos
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Limpar
                    </button>
                  </div>

                  {/* Options */}
                  <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                    {neighborhoods.map((neighborhood) => {
                      const isSelected = selectedNeighborhoods.includes(neighborhood);
                      return (
                        <button
                          key={neighborhood}
                          type="button"
                          onClick={() => toggleNeighborhood(neighborhood)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-secondary/50 rounded-lg transition-all text-left"
                        >
                          <div className={`w-4 h-4 rounded-md border flex-shrink-0 flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary scale-110' : 'border-border bg-secondary/30'}`}>
                            {isSelected && <Check size={10} className="text-primary-foreground stroke-[3]" />}
                          </div>
                          <span className={isSelected ? 'font-medium text-primary' : ''}>
                            {neighborhood}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {neighborhoods.length > 0
                ? 'Selecione bairros para refinar a busca. Deixe em branco para buscar em toda a cidade.'
                : 'Cadastre bairros na Gestão de Locais para poder selecioná-los aqui.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default LocationSelector;
