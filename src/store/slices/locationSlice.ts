import { StateCreator } from 'zustand';
import { StoreState, LocationSlice, Location } from '../../types';
import { upsertLocation, deleteLocation } from '../../services/supabaseService';

export const createLocationSlice: StateCreator<StoreState, [], [], LocationSlice> = (set, get) => ({
  locations: [],
  selectedState: null,
  selectedCity: null,
  selectedNeighborhoods: [],

  addLocation: async (city, state) => {
    const { locations, supabaseConnected } = get();
    const exists = locations.some(
      l => l.city.toLowerCase() === city.toLowerCase() &&
        l.state.toLowerCase() === state.toLowerCase()
    );

    if (exists) return false;

    if (supabaseConnected) {
      await upsertLocation(city, state);
    }

    const newLocation: Location = {
      id: Date.now(),
      city,
      state,
      neighborhoods: []
    };

    set({ locations: [...locations, newLocation] });
    return true;
  },

  removeLocation: async (id) => {
    const { locations, supabaseConnected } = get();
    const location = locations.find(l => l.id === id);

    if (location && supabaseConnected) {
      await deleteLocation(location.city, location.state);
    }

    set(state => ({
      locations: state.locations.filter(l => l.id !== id),
      // Reset selection if removed
      selectedCity: null,
      selectedState: null,
      selectedNeighborhoods: []
    }));
  },

  getStates: () => {
    const { locations } = get();
    const states = new Set(locations.map(l => l.state));
    return Array.from(states).sort();
  },

  getCitiesByState: (state) => {
    const { locations } = get();
    return locations
      .filter(l => l.state === state)
      .map(l => l.city)
      .sort();
  },

  setSelectedState: (state) => set({
    selectedState: state,
    selectedCity: null,
    selectedNeighborhoods: []
  }),

  setSelectedCity: (city) => set({
    selectedCity: city,
    selectedNeighborhoods: []
  }),

  setSelectedNeighborhoods: (neighborhoods) => set({ selectedNeighborhoods: neighborhoods }),

  updateLocationNeighborhoods: async (locationId, neighborhoods) => {
    const { locations, supabaseConnected } = get();
    const location = locations.find(l => l.id === locationId);

    if (location && supabaseConnected) {
      await upsertLocation(location.city, location.state, neighborhoods);
    }

    set(state => ({
      locations: state.locations.map(l => l.id === locationId ? { ...l, neighborhoods } : l)
    }));
  },

  getNeighborhoodsByLocation: (city, state) => {
    const loc = get().locations.find(l => l.city === city && l.state === state);
    return loc ? loc.neighborhoods : [];
  }
});
