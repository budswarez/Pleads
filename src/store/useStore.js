import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';


const useStore = create(
    persist(
        (set, get) => ({
            // Locations (City/State pairs to scan)
            locations: [],

            // Leads (captured businesses)
            leads: [],

            // Selected location for filtering
            selectedState: null,
            selectedCity: null,

            // Dynamic Lead Statuses
            statuses: [
                { id: 'NEW', label: 'Novo', color: '#eab308' },
                { id: 'CONTACTED', label: 'Em contato', color: '#3b82f6' },
                { id: 'CLIENT', label: 'Cliente', color: '#22c55e' },
                { id: 'REFUSED', label: 'Recusado', color: '#ef4444' }
            ],

            // Dynamic Business Categories
            categories: [
                { id: 'restaurant', label: 'Restaurantes', query: 'restaurante' },
                { id: 'gas_station', label: 'Postos de Gasolina', query: 'posto de gasolina' },
                { id: 'convenience_store', label: 'Lojas de Conveniência', query: 'loja de conveniencia' }
            ],

            // API Configuration
            apiKey: import.meta.env.VITE_GOOGLE_PLACES_KEY || '',

            // Supabase Configuration
            supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
            supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
            supabaseConnected: false,

            // Set API Key
            setApiKey: (key) => {
                set({ apiKey: key });
            },

            // Get API Key (for service to consume)
            getApiKey: () => {
                return get().apiKey || import.meta.env.VITE_GOOGLE_PLACES_KEY || '';
            },

            // Supabase setters
            setSupabaseConfig: (url, anonKey) => {
                set({ supabaseUrl: url, supabaseAnonKey: anonKey });
            },

            setSupabaseConnected: (connected) => {
                set({ supabaseConnected: connected });
            },

            getSupabaseConfig: () => {
                return {
                    url: get().supabaseUrl,
                    anonKey: get().supabaseAnonKey,
                    connected: get().supabaseConnected
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
                const updates = {};
                if (data.leads?.length > 0) updates.leads = data.leads;
                if (data.locations?.length > 0) updates.locations = data.locations;
                if (data.categories?.length > 0) updates.categories = data.categories;
                if (data.statuses?.length > 0) updates.statuses = data.statuses;
                if (Object.keys(updates).length > 0) {
                    set(updates);
                }
            },

            // Add a new location to scan
            addLocation: (city, state) => {
                const exists = get().locations.some(
                    loc => loc.city.toLowerCase() === city.toLowerCase() &&
                        loc.state.toLowerCase() === state.toLowerCase()
                );

                if (!exists) {
                    set(prevState => ({
                        locations: [...prevState.locations, { city, state, id: Date.now() }]
                    }));
                    return true;
                }
                return false;
            },

            // Remove a location
            removeLocation: (id) => {
                set(prevState => ({
                    locations: prevState.locations.filter(loc => loc.id !== id)
                }));
            },

            // Add leads with deduplication by place_id and merge/update capability
            addLeads: (newLeads) => {
                const { leads: currentLeads } = get();
                const existingMap = new Map(currentLeads.map(l => [l.place_id, l]));
                let addedCount = 0;

                newLeads.forEach(newLead => {
                    if (existingMap.has(newLead.place_id)) {
                        const existing = existingMap.get(newLead.place_id);
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

                set({ leads: Array.from(existingMap.values()) });
                return addedCount;
            },

            // Clear leads for the selected location or all leads
            clearLeads: (onlySelected = true) => {
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
            removeLeadsByCategory: (categoryId) => {
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
            updateLeadStatus: (placeId, status) => {
                set(prevState => ({
                    leads: prevState.leads.map(lead =>
                        lead.place_id === placeId ? { ...lead, status } : lead
                    )
                }));
            },

            // Update lead notes (renamed and logic simplified for single field if preferred, but keep array for history)
            updateLeadNotes: (placeId, noteText) => {
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
            setSelectedState: (state) => {
                set({ selectedState: state, selectedCity: null });
            },

            // Set selected city
            setSelectedCity: (city) => {
                set({ selectedCity: city });
            },

            // Get unique list of states from locations
            getStates: () => {
                const states = [...new Set(get().locations.map(loc => loc.state))];
                return states.sort();
            },

            // Get cities for a specific state
            getCitiesByState: (state) => {
                const cities = get().locations
                    .filter(loc => loc.state === state)
                    .map(loc => loc.city);
                return [...new Set(cities)].sort();
            },

            // Get filtered leads by selected location
            getFilteredLeads: () => {
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
            addStatus: (label, color) => {
                const id = label.toUpperCase().replace(/\s+/g, '_') + '_' + Date.now();
                set(prevState => ({
                    statuses: [...prevState.statuses, { id, label, color }]
                }));
            },

            removeStatus: (id) => {
                set(prevState => ({
                    statuses: prevState.statuses.filter(s => s.id !== id)
                }));
            },

            updateStatus: (id, updates) => {
                set(prevState => ({
                    statuses: prevState.statuses.map(s =>
                        s.id === id ? { ...s, ...updates } : s
                    )
                }));
            },

            // Manage Categories
            addCategory: (label, query) => {
                const id = label.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
                set(prevState => ({
                    categories: [...prevState.categories, { id, label, query }]
                }));
            },

            removeCategory: (id) => {
                set(prevState => ({
                    categories: prevState.categories.filter(c => c.id !== id)
                }));
            },
        }),
        {
            name: 'pleads-storage',
        }
    )
);

export default useStore;
