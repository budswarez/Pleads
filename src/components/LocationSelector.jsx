import { ChevronDown } from 'lucide-react';
import useStore from '../store/useStore';

const LocationSelector = () => {
    const {
        selectedState,
        selectedCity,
        setSelectedState,
        setSelectedCity,
        getStates,
        getCitiesByState
    } = useStore();

    const states = getStates();
    const cities = selectedState ? getCitiesByState(selectedState) : [];

    const handleStateChange = (e) => {
        const newState = e.target.value;
        setSelectedState(newState || null);
    };

    const handleCityChange = (e) => {
        const newCity = e.target.value;
        setSelectedCity(newCity || null);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* State Selector */}
            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Selecione o Estado
                </label>
                <div className="relative">
                    <select
                        value={selectedState || ''}
                        onChange={handleStateChange}
                        disabled={states.length === 0}
                        className="w-full bg-input text-foreground border border-input rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">
                            {states.length === 0 ? 'Nenhum estado cadastrado' : 'Selecione...'}
                        </option>
                        {states.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                </div>
            </div>

            {/* City Selector */}
            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Selecione a Cidade
                </label>
                <div className="relative">
                    <select
                        value={selectedCity || ''}
                        onChange={handleCityChange}
                        disabled={!selectedState || cities.length === 0}
                        className="w-full bg-input text-foreground border border-input rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <option value="">
                            {!selectedState
                                ? 'Selecione um estado primeiro'
                                : cities.length === 0
                                    ? 'Nenhuma cidade cadastrada'
                                    : 'Selecione...'}
                        </option>
                        {cities.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        size={16}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                </div>
            </div>

            {/* Neighborhood Input */}
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Bairro (Opcional)
                </label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Ex: Savassi, Centro, etc."
                        className="w-full bg-input text-foreground border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-muted-foreground/50"
                        onChange={(e) => useStore.getState().setSelectedNeighborhood(e.target.value)}
                        disabled={!selectedCity}
                    />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                    Digite um bairro para refinar a busca. Deixe em branco para buscar em toda a cidade.
                </p>
            </div>
        </div>
    );
};

export default LocationSelector;
