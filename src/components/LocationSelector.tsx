import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, MapPinOff } from 'lucide-react';
import useStore from '../store/useStore';
import { EmptyState } from './EmptyState';

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

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const states = getStates();
  const cities = selectedState ? getCitiesByState(selectedState) : [];
  const neighborhoods = (selectedState && selectedCity)
    ? getNeighborhoodsByLocation(selectedCity, selectedState)
    : [];

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value || null);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value || null);
  };

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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      <div className="space-y-2">
        <label
          htmlFor="state-selector"
          className="block text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1"
        >
          Estado (UF)
        </label>
        <div className="relative group">
          <select
            id="state-selector"
            value={selectedState || ''}
            onChange={handleStateChange}
            disabled={states.length === 0}
            className="w-full bg-secondary/30 hover:bg-secondary/50 text-foreground border border-border/50 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 appearance-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            aria-label="Selecione o Estado"
          >
            <option value="">
              {states.length === 0 ? 'Nenhum estado cadastrado' : 'Selecione o estado...'}
            </option>
            {states.map((state, index) => (
              <option key={`state-${index}`} value={state}>
                {state}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none group-hover:text-primary transition-colors"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* City Selector */}
      <div className="space-y-2">
        <label
          htmlFor="city-selector"
          className="block text-xs font-bold uppercase tracking-widest text-muted-foreground/70 ml-1"
        >
          Cidade
        </label>
        <div className="relative group">
          <select
            id="city-selector"
            value={selectedCity || ''}
            onChange={handleCityChange}
            disabled={!selectedState || cities.length === 0}
            className="w-full bg-secondary/30 hover:bg-secondary/50 text-foreground border border-border/50 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 appearance-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            aria-label="Selecione a Cidade"
          >
            <option value="">
              {!selectedState
                ? 'Selecione um estado primeiro'
                : cities.length === 0
                  ? 'Nenhuma cidade cadastrada'
                  : 'Selecione a cidade...'}
            </option>
            {cities.map((city, index) => (
              <option key={`city-${index}`} value={city}>
                {city}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none group-hover:text-primary transition-colors"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Neighborhood Multi-Select */}
      <div className="md:col-span-2 space-y-2" ref={dropdownRef}>
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
                    setIsDropdownOpen(!isDropdownOpen);
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
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none transition-all duration-300 ${isDropdownOpen ? 'rotate-180 text-primary' : 'group-hover:text-primary'}`}
                aria-hidden="true"
              />

              {/* Dropdown */}
              {isDropdownOpen && neighborhoods.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {/* Select all / Clear */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs text-primary hover:underline"
                    >
                      Selecionar todos
                    </button>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Limpar
                    </button>
                  </div>

                  {/* Options */}
                  {neighborhoods.map((neighborhood) => {
                    const isSelected = selectedNeighborhoods.includes(neighborhood);
                    return (
                      <button
                        key={neighborhood}
                        type="button"
                        onClick={() => toggleNeighborhood(neighborhood)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-secondary/50 transition-colors text-left"
                      >
                        <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-input'}`}>
                          {isSelected && <Check size={10} className="text-primary-foreground" />}
                        </div>
                        {neighborhood}
                      </button>
                    );
                  })}
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
