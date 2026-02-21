import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { MapPin, X, Trash2, Search, Plus, Loader2 } from 'lucide-react';
import useStore from '../store/useStore';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { fetchNeighborhoods } from '../services/placesService';
import { fetchStates, fetchCities, type State, type City } from '../services/brasilApiService';
import { EmptyState } from './EmptyState';

interface LocationManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal para gerenciar localizações (Cidade + Estado) e seus bairros
 * Permite adicionar e remover locais para busca de leads
 */
const LocationManagementModal = ({ isOpen, onClose }: LocationManagementModalProps) => {
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loadingLocationId, setLoadingLocationId] = useState<number | null>(null);
  const [newNeighborhood, setNewNeighborhood] = useState<Record<number, string>>({});
  const [expandedLocationId, setExpandedLocationId] = useState<number | null>(null);

  // States for city/state selection
  const [availableStates, setAvailableStates] = useState<State[]>([]);
  const [availableCities, setAvailableCities] = useState<City[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  const { locations, addLocation, removeLocation, updateLocationNeighborhoods, getApiKey } = useStore();

  // Load states on mount
  useEffect(() => {
    const loadStates = async () => {
      setIsLoadingStates(true);
      const states = await fetchStates();
      setAvailableStates(states);
      setIsLoadingStates(false);
    };
    loadStates();
  }, []);

  // Load cities when state changes
  useEffect(() => {
    const loadCities = async () => {
      if (!state) {
        setAvailableCities([]);
        return;
      }
      setIsLoadingCities(true);
      const cities = await fetchCities(state);
      setAvailableCities(cities);
      setIsLoadingCities(false);
    };
    loadCities();
  }, [state]);

  const handleAddLocation = async () => {
    if (!city.trim() || !state.trim()) {
      toast.error('Por favor, selecione Cidade e Estado');
      return;
    }

    const added = await addLocation(city.trim(), state.trim());
    if (added) {
      setCity('');
      // setState(''); // Keep state selected for easier multiple additions in same state
      toast.success(`${city.trim()}, ${state.trim()} adicionado com sucesso!`);
    } else {
      toast.error('Esta localização já foi cadastrada');
    }
  };

  const handleFetchNeighborhoods = async (location: typeof locations[0]) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      toast.error('Configure a API Key do Google Places primeiro.');
      return;
    }

    setLoadingLocationId(location.id);
    try {
      const neighborhoods = await fetchNeighborhoods(location.city, location.state, apiKey);
      if (neighborhoods.length === 0) {
        toast('Nenhum bairro encontrado para esta cidade.', { icon: 'ℹ️' });
      } else {
        // Merge with existing neighborhoods (don't lose manually added ones)
        const existing = location.neighborhoods || [];
        const merged = [...new Set([...existing, ...neighborhoods])].sort();
        await updateLocationNeighborhoods(location.id, merged);
        toast.success(`${neighborhoods.length} bairros encontrados!`);
      }
      setExpandedLocationId(location.id);
    } catch (error) {
      toast.error(`Erro ao buscar bairros: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoadingLocationId(null);
    }
  };

  const handleAddNeighborhood = async (locationId: number) => {
    const rawInput = newNeighborhood[locationId]?.trim();
    if (!rawInput) return;

    const location = locations.find(l => l.id === locationId);
    if (!location) return;

    const existing = location.neighborhoods || [];
    const newNames = rawInput
      .split(',')
      .map(n => n.trim())
      .filter(n => n !== '' && !existing.some(ext => ext.toLowerCase() === n.toLowerCase()));

    if (newNames.length === 0) {
      if (rawInput.includes(',')) {
        toast.error('Todos esses bairros já foram cadastrados ou a entrada é inválida');
      } else {
        toast.error('Este bairro já foi cadastrado');
      }
      return;
    }

    const merged = [...existing, ...newNames].sort();
    await updateLocationNeighborhoods(locationId, merged);
    setNewNeighborhood(prev => ({ ...prev, [locationId]: '' }));

    if (newNames.length > 1) {
      toast.success(`${newNames.length} bairros adicionados!`);
    }
  };

  const handleRemoveNeighborhood = async (locationId: number, neighborhood: string) => {
    const location = locations.find(l => l.id === locationId);
    if (!location) return;

    const updated = (location.neighborhoods || []).filter(n => n !== neighborhood);
    await updateLocationNeighborhoods(locationId, updated);
  };

  const handleClearNeighborhoods = async (locationId: number) => {
    if (window.confirm('Tem certeza que deseja remover TODOS os bairros deste local?')) {
      try {
        await updateLocationNeighborhoods(locationId, []);
        toast.success('Todos os bairros foram removidos.');
      } catch (error) {
        toast.error('Erro ao limpar bairros.');
      }
    }
  };

  // Close modal on Escape key
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <MapPin size={24} />
            <h2 className="text-xl font-semibold text-foreground">Gestão de Locais</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-muted-foreground mb-4 text-sm">
            Cadastre cidades e estados para realizar a varredura de leads. Use "Buscar Bairros" para descobrir bairros automaticamente.
          </p>

          {/* Add Location Form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label
                htmlFor="state-select"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Estado (UF)
              </label>
              <select
                id="state-select"
                className="w-full bg-input text-foreground border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setCity(''); // Clear city when state changes
                }}
                disabled={isLoadingStates}
              >
                <option value="">Selecione...</option>
                {availableStates.map((s) => (
                  <option key={s.sigla} value={s.sigla}>
                    {s.nome} ({s.sigla})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="city-select"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Cidade
              </label>
              {isLoadingCities ? (
                <div className="w-full bg-input border border-input rounded-md px-3 py-2 text-sm flex items-center gap-2 text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" />
                  Carregando cidades...
                </div>
              ) : (
                <select
                  id="city-select"
                  className="w-full bg-input text-foreground border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!state || availableCities.length === 0}
                >
                  <option value="">{state ? 'Selecione a cidade...' : 'Selecione o estado primeiro'}</option>
                  {availableCities.map((c) => (
                    <option key={c.codigo_ibge} value={c.nome}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAddLocation}
                disabled={!city || !state}
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                aria-label="Adicionar localização"
              >
                <MapPin size={16} />
                Adicionar
              </button>
            </div>
          </div>

          {/* Locations List */}
          {locations.length > 0 ? (
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Locais Cadastrados ({locations.length})
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {locations.map((location) => {
                  const neighborhoods = location.neighborhoods || [];
                  const isExpanded = expandedLocationId === location.id;
                  const isLoading = loadingLocationId === location.id;

                  return (
                    <div
                      key={location.id}
                      className="bg-secondary/50 rounded-md border border-border"
                    >
                      {/* Location header */}
                      <div className="flex items-center justify-between px-4 py-3">
                        <button
                          className="flex items-center gap-2 flex-1 text-left"
                          onClick={() => setExpandedLocationId(isExpanded ? null : location.id)}
                        >
                          <MapPin size={16} className="text-primary flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground">
                            {location.city}, {location.state}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({neighborhoods.length} bairros)
                          </span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleFetchNeighborhoods(location)}
                            disabled={isLoading}
                            className="text-primary hover:bg-primary/10 p-1.5 rounded transition-colors disabled:opacity-50"
                            title="Buscar bairros automaticamente"
                            aria-label={`Buscar bairros de ${location.city}`}
                          >
                            {isLoading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Search size={14} />
                            )}
                          </button>

                          {neighborhoods.length > 0 && (
                            <button
                              onClick={() => handleClearNeighborhoods(location.id)}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1.5 rounded transition-colors"
                              title="Limpar todos os bairros"
                            >
                              <X size={14} />
                            </button>
                          )}

                          <button
                            onClick={async () => {
                              const loadingToast = toast.loading(`Removendo ${location.city}...`);
                              await removeLocation(location.id);
                              toast.dismiss(loadingToast);
                              toast.success('Local removido com sucesso');
                            }}
                            className="text-destructive hover:bg-destructive/10 p-1.5 rounded transition-colors"
                            title={`Remover ${location.city}, ${location.state}`}
                            aria-label={`Remover ${location.city}, ${location.state}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded: neighborhoods */}
                      {isExpanded && (
                        <div className="px-4 pb-3 border-t border-border/50 pt-3">
                          {/* Add neighborhood input */}
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="Adicionar bairro (separe por vírgula)..."
                              className="flex-1 bg-input text-foreground border border-input rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                              value={newNeighborhood[location.id] || ''}
                              onChange={(e) => setNewNeighborhood(prev => ({ ...prev, [location.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddNeighborhood(location.id);
                              }}
                            />
                            <button
                              onClick={() => handleAddNeighborhood(location.id)}
                              className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs hover:bg-opacity-90 transition-colors"
                              aria-label="Adicionar bairro"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          {/* Neighborhoods list */}
                          {neighborhoods.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {neighborhoods.map((neighborhood) => (
                                <span
                                  key={neighborhood}
                                  className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                                >
                                  {neighborhood}
                                  <button
                                    onClick={() => handleRemoveNeighborhood(location.id, neighborhood)}
                                    className="hover:text-destructive transition-colors"
                                    aria-label={`Remover ${neighborhood}`}
                                  >
                                    <X size={10} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Nenhum bairro cadastrado. Clique em <Search size={10} className="inline" /> para buscar automaticamente.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={MapPin}
              description="Nenhum local cadastrado ainda."
              className="mt-6 border-dashed bg-muted/20 shadow-none"
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <button
            onClick={onClose}
            className="w-full bg-secondary text-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
            aria-label="Fechar modal"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationManagementModal;
