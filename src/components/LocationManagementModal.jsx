import { useState } from 'react';
import { MapPin, X, Trash2 } from 'lucide-react';
import useStore from '../store/useStore';

const LocationManagementModal = ({ isOpen, onClose }) => {
    const [city, setCity] = useState('');
    const [state, setState] = useState('');

    const { locations, addLocation, removeLocation } = useStore();

    const handleAddLocation = () => {
        if (!city.trim() || !state.trim()) {
            alert('Por favor, preencha Cidade e Estado');
            return;
        }

        const added = addLocation(city.trim(), state.trim());
        if (added) {
            setCity('');
            setState('');
        } else {
            alert('Esta localização já foi cadastrada');
        }
    };

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
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <p className="text-muted-foreground mb-4 text-sm">
                        Cadastre cidades e estados para realizar a varredura de leads.
                    </p>

                    {/* Add Location Form */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                Estado (UF)
                            </label>
                            <input
                                type="text"
                                placeholder="SP"
                                maxLength={2}
                                className="w-full bg-input text-foreground border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring uppercase"
                                value={state}
                                onChange={(e) => setState(e.target.value.toUpperCase())}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                Cidade
                            </label>
                            <input
                                type="text"
                                placeholder="Ex: São Paulo"
                                className="w-full bg-input text-foreground border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleAddLocation}
                                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
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
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {locations.map((location) => (
                                    <div
                                        key={location.id}
                                        className="flex items-center justify-between bg-secondary/50 rounded-md px-4 py-3 border border-border"
                                    >
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-primary" />
                                            <span className="text-sm font-medium text-foreground">
                                                {location.city}, {location.state}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => removeLocation(location.id)}
                                            className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors"
                                            title={`Remover ${location.city}, ${location.state}`}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            Nenhum local cadastrado ainda.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border">
                    <button
                        onClick={onClose}
                        className="w-full bg-secondary text-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationManagementModal;
