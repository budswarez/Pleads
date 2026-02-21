import { StateCreator } from 'zustand';
import { StoreState, LeadSlice } from '../../types';
import { deleteLeadFromDb, deleteLeadsByLocationFromDb, upsertLeads, updateLeadInDb } from '../../services/supabaseService';

export const createLeadSlice: StateCreator<StoreState, [], [], LeadSlice> = (set, get) => ({
  leads: [],

  addLeads: async (newLeads) => {
    const { leads, supabaseConnected } = get();
    const existingIds = new Set(leads.map(l => l.place_id));
    const uniqueNewLeads = newLeads.filter(l => !existingIds.has(l.place_id));

    if (uniqueNewLeads.length > 0) {
      if (supabaseConnected) {
        await upsertLeads(uniqueNewLeads);
      }
      set({ leads: [...leads, ...uniqueNewLeads] });
    }
    return uniqueNewLeads.length;
  },

  clearLeads: async (onlySelected = false) => {
    if (onlySelected) {
      const { selectedCity, selectedState, supabaseConnected } = get();
      if (!selectedCity || !selectedState) return;

      if (supabaseConnected) {
        await deleteLeadsByLocationFromDb(selectedCity, selectedState);
      }

      set(state => ({
        leads: state.leads.filter(l => l.city !== selectedCity || l.state !== selectedState)
      }));
    } else {
      // For clearing everything local without affecting DB or if confirmed
      set({ leads: [] });
    }
  },

  removeLeadsByCategory: async (categoryId) => {
    const { selectedCity, selectedState, supabaseConnected } = get();
    if (!selectedCity || !selectedState) return;

    if (supabaseConnected) {
      await deleteLeadsByLocationFromDb(selectedCity, selectedState, categoryId);
    }

    set(state => ({
      leads: state.leads.filter(l => {
        // Keep if not in current location OR not in category
        const inLocation = l.city === selectedCity && l.state === selectedState;
        const inCategory = l.categoryId === categoryId;
        return !(inLocation && inCategory);
      })
    }));
  },

  updateLeadStatus: async (placeId, status) => {
    const { supabaseConnected } = get();

    if (supabaseConnected) {
      await updateLeadInDb(placeId, { status });
    }

    set(state => ({
      leads: state.leads.map(l => l.place_id === placeId ? { ...l, status } : l)
    }));
  },

  updateLeadNotes: async (placeId, noteText) => {
    const { leads, supabaseConnected } = get();
    const lead = leads.find(l => l.place_id === placeId);

    if (!lead) return;

    const notes = lead.notes || [];
    const newNote = {
      id: Date.now(),
      text: noteText,
      date: new Date().toISOString()
    };
    const updatedNotes = [...notes, newNote];

    if (supabaseConnected) {
      await updateLeadInDb(placeId, { notes: updatedNotes });
    }

    set(state => ({
      leads: state.leads.map(l => l.place_id === placeId ? { ...l, notes: updatedNotes } : l)
    }));
  },

  deleteLeadNote: async (placeId, noteId) => {
    const { leads, supabaseConnected } = get();
    const lead = leads.find(l => l.place_id === placeId);

    if (lead && lead.notes) {
      const updatedNotes = lead.notes.filter(n => n.id !== noteId);

      if (supabaseConnected) {
        await updateLeadInDb(placeId, { notes: updatedNotes });
      }

      set(state => ({
        leads: state.leads.map(l => {
          if (l.place_id === placeId) {
            return { ...l, notes: updatedNotes };
          }
          return l;
        })
      }));
    }
  },

  removeLead: async (placeId) => {
    const { supabaseConnected } = get();

    if (supabaseConnected) {
      await deleteLeadFromDb(placeId);
    }

    set(state => ({
      leads: state.leads.filter(l => l.place_id !== placeId)
    }));
  },

  getFilteredLeads: () => {
    const { leads, selectedCity, selectedState } = get();
    if (!selectedCity || !selectedState) return [];

    return leads.filter(l => l.city === selectedCity && l.state === selectedState);
  }
});
