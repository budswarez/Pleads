import { StateCreator } from 'zustand';
import type { StoreState, LocationSlice } from '../../types';
import { getSupabase, upsertLocation } from '../../services/supabaseService';

export const createLocationSlice: StateCreator<
    StoreState,
    [],
    [],
    LocationSlice
> = (set, get) => ({
    locations: [],
    selectedState: null,
    selectedCity: null,
    selectedNeighborhoods: [],

    addLocation: (city: string, state: string): boolean => {
        const exists = get().locations.some(
            loc => loc.city.toLowerCase() === city.toLowerCase() &&
                loc.state.toLowerCase() === state.toLowerCase()
        );

        if (!exists) {
            set(prevState => ({
                locations: [...prevState.locations, { city, state, id: Date.now(), neighborhoods: [] }]
            }));

            // Auto-sync to Supabase if connected
            const { supabaseConnected } = get();
            if (supabaseConnected && getSupabase()) {
                upsertLocation(city, state, []).catch(err =>
                    console.error('[Auto-sync] Failed to sync location:', err)
                );
            }

            return true;
        }
        return false;
    },

    removeLocation: (id: number) => {
        set(prevState => ({
            locations: prevState.locations.filter(loc => loc.id !== id)
        }));
    },

    setSelectedState: (state: string | null) => {
        set({ selectedState: state, selectedCity: null, selectedNeighborhoods: [] });
    },

    setSelectedCity: (city: string | null) => {
        set({ selectedCity: city, selectedNeighborhoods: [] });
    },

    setSelectedNeighborhoods: (neighborhoods: string[]) => {
        set({ selectedNeighborhoods: neighborhoods });
    },

    updateLocationNeighborhoods: (locationId: number, neighborhoods: string[]) => {
        set(prevState => ({
            locations: prevState.locations.map(loc =>
                loc.id === locationId ? { ...loc, neighborhoods } : loc
            )
        }));

        // Auto-sync to Supabase if connected
        const { supabaseConnected } = get();
        const location = get().locations.find(loc => loc.id === locationId);
        if (supabaseConnected && getSupabase() && location) {
            upsertLocation(location.city, location.state, neighborhoods).catch(err =>
                console.error('[Auto-sync] Failed to sync location neighborhoods:', err)
            );
        }
    },

    getNeighborhoodsByLocation: (city: string, state: string): string[] => {
        const location = get().locations.find(
            loc => loc.city.toLowerCase() === city.toLowerCase() &&
                loc.state.toLowerCase() === state.toLowerCase()
        );
        return location?.neighborhoods || [];
    },

    getStates: (): string[] => {
        const states = [...new Set(get().locations.map(loc => loc.state))];
        return states.sort();
    },

    getCitiesByState: (state: string): string[] => {
        const cities = get().locations
            .filter(loc => loc.state === state)
            .map(loc => loc.city);
        return [...new Set(cities)].sort();
    },
});
