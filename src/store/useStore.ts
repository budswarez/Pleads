import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoreState, Lead, Status } from '../types';
import { DEFAULT_STATUSES, DEFAULT_CATEGORIES, DEFAULT_BRANDING, DEFAULT_MAX_LEADS_PER_CATEGORY, STORAGE_KEYS } from '../constants';
import { getSupabase, upsertLocation, upsertCategory, upsertStatus, upsertLeads } from '../services/supabaseService';

const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Locations (City/State pairs to scan)
      locations: [],

      // Leads (captured businesses)
      leads: [],

      // Selected location for filtering
      selectedState: null,
      selectedCity: null,
      selectedNeighborhoods: [],

      // Dynamic Lead Statuses
      statuses: [...DEFAULT_STATUSES],

      // Dynamic Business Categories
      categories: [...DEFAULT_CATEGORIES],

      // API Configuration
      apiKey: import.meta.env.VITE_GOOGLE_PLACES_KEY || '',

      // Supabase Configuration
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      supabaseConnected: false,

      // Branding Configuration
      appTitle: DEFAULT_BRANDING.TITLE,
      appDescription: DEFAULT_BRANDING.DESCRIPTION,
      appLogoUrl: DEFAULT_BRANDING.LOGO_URL,

      // Search Configuration
      maxLeadsPerCategory: DEFAULT_MAX_LEADS_PER_CATEGORY,

      setBranding: (title: string, description: string, logoUrl: string) => {
        set({
          appTitle: title,
          appDescription: description,
          appLogoUrl: logoUrl
        });
      },

      setMaxLeadsPerCategory: (max: number) => {
        set({ maxLeadsPerCategory: max });
      },

      // Set API Key
      setApiKey: (key: string) => {
        set({ apiKey: key });
      },

      // Get API Key (for service to consume)
      getApiKey: (): string => {
        const stateKey = get().apiKey;
        // Se a chave no estado for vazia, tenta pegar da variável de ambiente
        return stateKey && stateKey.trim() !== ''
          ? stateKey
          : (import.meta.env.VITE_GOOGLE_PLACES_KEY || '');
      },

      // Supabase setters
      setSupabaseConfig: (url: string, anonKey: string) => {
        set({ supabaseUrl: url, supabaseAnonKey: anonKey });
      },

      setSupabaseConnected: (connected: boolean) => {
        set({ supabaseConnected: connected });
      },

      getSupabaseConfig: () => {
        const state = get();
        return {
          url: state.supabaseUrl,
          anonKey: state.supabaseAnonKey,
          connected: state.supabaseConnected
        };
      },

      // Get all data for sync
      getAllDataForSync: () => {
        const state = get();
        return {
          leads: state.leads,
          locations: state.locations,
          categories: state.categories,
          statuses: state.statuses
        };
      },

      // Load data from Supabase
      loadFromSupabase: (data) => {
        const updates: Partial<StoreState> = {};
        if (data.leads && data.leads.length > 0) updates.leads = data.leads;
        if (data.locations && data.locations.length > 0) updates.locations = data.locations;
        if (data.categories && data.categories.length > 0) updates.categories = data.categories;
        if (data.statuses && data.statuses.length > 0) updates.statuses = data.statuses;

        if (Object.keys(updates).length > 0) {
          set(updates);
        }
      },

      // Add a new location to scan
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

      // Remove a location
      removeLocation: (id: number) => {
        set(prevState => ({
          locations: prevState.locations.filter(loc => loc.id !== id)
        }));
      },

      // Add leads with deduplication by place_id and merge/update capability
      addLeads: (newLeads: Lead[]): number => {
        const { leads: currentLeads } = get();
        const existingMap = new Map(currentLeads.map(l => [l.place_id, l]));
        let addedCount = 0;

        newLeads.forEach(newLead => {
          if (existingMap.has(newLead.place_id)) {
            const existing = existingMap.get(newLead.place_id)!;
            existingMap.set(newLead.place_id, {
              ...existing,
              ...newLead,
              status: existing.status, // Preserve existing status
              notes: existing.notes,   // Preserve existing notes
              // Update categoryId if present in new search, otherwise keep existing
              categoryId: newLead.categoryId || existing.categoryId
            });
          } else {
            existingMap.set(newLead.place_id, newLead);
            addedCount++;
          }
        });

        const allLeads = Array.from(existingMap.values());
        set({ leads: allLeads });

        // Auto-sync to Supabase if connected (sync all leads)
        const { supabaseConnected } = get();
        if (supabaseConnected && getSupabase() && allLeads.length > 0) {
          upsertLeads(allLeads).catch(err =>
            console.error('[Auto-sync] Failed to sync leads:', err)
          );
        }

        return addedCount;
      },

      // Clear leads for the selected location or all leads
      clearLeads: (onlySelected: boolean = true) => {
        const { selectedState, selectedCity, leads } = get();

        if (onlySelected) {
          if (!selectedState || !selectedCity) return;

          const filteredLeads = leads.filter(lead => {
            const cityMatch = lead.city?.toLowerCase() === selectedCity.toLowerCase();
            const stateMatch = lead.state?.toLowerCase() === selectedState.toLowerCase();
            return !(cityMatch && stateMatch);
          });

          set({ leads: filteredLeads });
        } else {
          set({ leads: [] });
        }
      },

      // Remove leads for a specific category in the current location
      removeLeadsByCategory: (categoryId: string) => {
        const { selectedState, selectedCity, leads } = get();

        if (!selectedState || !selectedCity) return;

        const filteredLeads = leads.filter(lead => {
          const cityMatch = lead.city?.toLowerCase() === selectedCity.toLowerCase();
          const stateMatch = lead.state?.toLowerCase() === selectedState.toLowerCase();
          const categoryMatch = lead.categoryId === categoryId;

          // Keep the lead if it's NOT in the current location OR if it's NOT the target category
          // i.e. Remove only matches of (Location AND Category)
          return !(cityMatch && stateMatch && categoryMatch);
        });

        set({ leads: filteredLeads });
      },

      // Update lead status
      updateLeadStatus: (placeId: string, status: string) => {
        set(prevState => ({
          leads: prevState.leads.map(lead =>
            lead.place_id === placeId ? { ...lead, status } : lead
          )
        }));
      },

      // Update lead notes
      updateLeadNotes: (placeId: string, noteText: string) => {
        set(prevState => ({
          leads: prevState.leads.map(lead =>
            lead.place_id === placeId
              ? {
                ...lead,
                notes: [
                  ...(lead.notes || []),
                  { id: Date.now(), text: noteText, date: new Date().toISOString() }
                ]
              }
              : lead
          )
        }));
      },

      // Set selected state
      setSelectedState: (state: string | null) => {
        set({ selectedState: state, selectedCity: null, selectedNeighborhoods: [] });
      },

      // Set selected city
      setSelectedCity: (city: string | null) => {
        set({ selectedCity: city, selectedNeighborhoods: [] });
      },

      // Set selected neighborhoods
      setSelectedNeighborhoods: (neighborhoods: string[]) => {
        set({ selectedNeighborhoods: neighborhoods });
      },

      // Update neighborhoods for a location
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

      // Get neighborhoods for a specific city/state
      getNeighborhoodsByLocation: (city: string, state: string): string[] => {
        const location = get().locations.find(
          loc => loc.city.toLowerCase() === city.toLowerCase() &&
            loc.state.toLowerCase() === state.toLowerCase()
        );
        return location?.neighborhoods || [];
      },

      // Get unique list of states from locations
      getStates: (): string[] => {
        const states = [...new Set(get().locations.map(loc => loc.state))];
        return states.sort();
      },

      // Get cities for a specific state
      getCitiesByState: (state: string): string[] => {
        const cities = get().locations
          .filter(loc => loc.state === state)
          .map(loc => loc.city);
        return [...new Set(cities)].sort();
      },

      // Get filtered leads by selected location
      getFilteredLeads: (): Lead[] => {
        const { leads, selectedState, selectedCity } = get();

        if (!selectedState || !selectedCity) {
          return [];
        }

        return leads.filter(lead =>
          lead.city?.toLowerCase() === selectedCity.toLowerCase() &&
          lead.state?.toLowerCase() === selectedState.toLowerCase()
        );
      },

      // Manage Statuses
      addStatus: (label: string, color: string) => {
        const id = label.toUpperCase().replace(/\s+/g, '_') + '_' + Date.now();
        set(prevState => ({
          statuses: [...prevState.statuses, { id, label, color }]
        }));

        // Auto-sync to Supabase if connected
        const { supabaseConnected } = get();
        if (supabaseConnected && getSupabase()) {
          upsertStatus(id, label, color).catch(err =>
            console.error('[Auto-sync] Failed to sync status:', err)
          );
        }
      },

      removeStatus: (id: string) => {
        set(prevState => ({
          statuses: prevState.statuses.filter(s => s.id !== id)
        }));
      },

      updateStatus: (id: string, updates: Partial<Status>) => {
        set(prevState => ({
          statuses: prevState.statuses.map(s =>
            s.id === id ? { ...s, ...updates } : s
          )
        }));
      },

      // Manage Categories
      addCategory: (label: string, query: string) => {
        const id = label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
        set(prevState => ({
          categories: [...prevState.categories, { id, label, query }]
        }));

        // Auto-sync to Supabase if connected
        const { supabaseConnected } = get();
        if (supabaseConnected && getSupabase()) {
          upsertCategory(id, label, query).catch(err =>
            console.error('[Auto-sync] Failed to sync category:', err)
          );
        }
      },

      removeCategory: (id: string) => {
        set(prevState => ({
          categories: prevState.categories.filter(c => c.id !== id)
        }));
      },
    }),
    {
      name: STORAGE_KEYS.PLEADS_STORE,
      partialize: (state) => {
        // Exclui chaves de API e configurações de Supabase da persistência
        // para que elas sempre sejam lidas do .env no carregamento
        const { apiKey, supabaseUrl, supabaseAnonKey, ...rest } = state;
        return rest;
      },
    }
  )
);

export default useStore;
