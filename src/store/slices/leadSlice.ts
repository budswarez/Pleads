import { StateCreator } from 'zustand';
import type { StoreState, LeadSlice, Lead } from '../../types';
import { getSupabase, upsertLeads } from '../../services/supabaseService';

export const createLeadSlice: StateCreator<
    StoreState,
    [],
    [],
    LeadSlice
> = (set, get) => ({
    leads: [],

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

    removeLeadsByCategory: (categoryId: string) => {
        const { selectedState, selectedCity, leads } = get();

        if (!selectedState || !selectedCity) return;

        const filteredLeads = leads.filter(lead => {
            const cityMatch = lead.city?.toLowerCase() === selectedCity.toLowerCase();
            const stateMatch = lead.state?.toLowerCase() === selectedState.toLowerCase();
            const categoryMatch = lead.categoryId === categoryId;

            return !(cityMatch && stateMatch && categoryMatch);
        });

        set({ leads: filteredLeads });
    },

    updateLeadStatus: (placeId: string, status: string) => {
        set(prevState => ({
            leads: prevState.leads.map(lead =>
                lead.place_id === placeId ? { ...lead, status } : lead
            )
        }));
    },

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
});
