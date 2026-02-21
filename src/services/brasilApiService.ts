/**
 * Service for fetching Brazilian states and cities using BrasilAPI
 * This helps avoid typos and provides a better user experience when adding locations.
 */

export interface State {
    id: number;
    sigla: string;
    nome: string;
}

export interface City {
    nome: string;
    codigo_ibge: string;
}

const BASE_URL = 'https://brasilapi.com.br/api/ibge';

/**
 * Fetch all Brazilian states
 */
export const fetchStates = async (): Promise<State[]> => {
    try {
        const response = await fetch(`${BASE_URL}/uf/v1`);
        if (!response.ok) throw new Error(`BrasilAPI Error: ${response.status}`);
        const data = await response.json();
        return data.sort((a: State, b: State) => a.nome.localeCompare(b.nome));
    } catch (error) {
        console.error('Error fetching states:', error);
        return [];
    }
};

/**
 * Fetch all cities for a given state
 */
export const fetchCities = async (stateAbbreviation: string): Promise<City[]> => {
    if (!stateAbbreviation) return [];

    try {
        const response = await fetch(`${BASE_URL}/municipios/v1/${stateAbbreviation}?providers=dados-abertos-br,gov`);
        if (!response.ok) throw new Error(`BrasilAPI Error: ${response.status}`);
        const data = await response.json();
        return data.sort((a: City, b: City) => a.nome.localeCompare(b.nome));
    } catch (error) {
        console.error(`Error fetching cities for ${stateAbbreviation}:`, error);
        return [];
    }
};
