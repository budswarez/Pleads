import { StateCreator } from 'zustand';
import toast from 'react-hot-toast';
import type { StoreState, LeadSlice, Lead } from '../../types';
import { getSupabase, upsertLeads, updateLeadInDb } from '../../services/supabaseService';

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

        // Obter apenas os leads que acabaram de ser adicionados/atualizados
        // (usamos o estado mesclado do existingMap para manter o status/notas atuais)
        const upsertPayload = newLeads.map(newLead => existingMap.get(newLead.place_id)!);

        // Auto-sync to Supabase if connected
        const { supabaseConnected } = get();
        if (supabaseConnected && getSupabase() && upsertPayload.length > 0) {
            upsertLeads(upsertPayload).then(({ error }) => {
                if (error) {
                    console.error('[Auto-sync] Failed to sync new leads:', error);
                    toast.error(`Falha ao sincronizar leads com a nuvem: ${error.message}`);
                }
            }).catch(err => {
                console.error('[Auto-sync] Exception syncing new leads:', err);
                toast.error('Erro inesperado ao sincronizar com a nuvem.');
            });
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

        const { supabaseConnected } = get();
        if (supabaseConnected && getSupabase()) {
            updateLeadInDb(placeId, { status }).catch((err: any) =>
                console.error('[Auto-sync] Failed to sync lead status:', err)
            );
        }
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

        const { supabaseConnected, leads } = get();
        if (supabaseConnected && getSupabase()) {
            const updatedLead = leads.find(l => l.place_id === placeId);
            if (updatedLead) {
                updateLeadInDb(placeId, { notes: updatedLead.notes }).catch((err: any) =>
                    console.error('[Auto-sync] Failed to sync lead notes:', err)
                );
            }
        }
    },

    deleteLeadNote: (placeId: string, noteId: number) => {
        set(prevState => ({
            leads: prevState.leads.map(lead =>
                lead.place_id === placeId
                    ? {
                        ...lead,
                        notes: (lead.notes || []).filter(note => note.id !== noteId)
                    }
                    : lead
            )
        }));

        const { supabaseConnected, leads } = get();
        if (supabaseConnected && getSupabase()) {
            const updatedLead = leads.find(l => l.place_id === placeId);
            if (updatedLead) {
                updateLeadInDb(placeId, { notes: updatedLead.notes }).catch((err: any) =>
                    console.error('[Auto-sync] Failed to sync lead note deletion:', err)
                );
            }
        }
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
