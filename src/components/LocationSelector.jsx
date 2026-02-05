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
        </div>
    );
};

export default LocationSelector;
