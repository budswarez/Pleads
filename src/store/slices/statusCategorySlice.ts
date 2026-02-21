import { StateCreator } from 'zustand';
import { StoreState, StatusCategorySlice } from '../../types';
import { upsertStatus, deleteStatus, upsertCategory, deleteCategory } from '../../services/supabaseService';

export const createStatusCategorySlice: StateCreator<StoreState, [], [], StatusCategorySlice> = (set, get) => ({
  statuses: [],
  categories: [],

  addStatus: async (label, color) => {
    const { supabaseConnected } = get();
    const id = label.toUpperCase().replace(/\s+/g, '_');

    if (supabaseConnected) {
      await upsertStatus(id, label, color);
    }

    set(state => ({
      statuses: [...state.statuses, { id, label, color }]
    }));
  },

  removeStatus: async (id) => {
    const { supabaseConnected } = get();

    if (supabaseConnected) {
      await deleteStatus(id);
    }

    set(state => ({
      statuses: state.statuses.filter(s => s.id !== id)
    }));
  },

  updateStatus: async (id, updates) => {
    const { statuses, supabaseConnected } = get();
    const status = statuses.find(s => s.id === id);
    if (!status) return;

    const updatedStatus = { ...status, ...updates };

    if (supabaseConnected) {
      await upsertStatus(id, updatedStatus.label, updatedStatus.color);
    }

    set(state => ({
      statuses: state.statuses.map(s => s.id === id ? updatedStatus : s)
    }));
  },

  addCategory: async (label, query) => {
    const { supabaseConnected } = get();
    const id = label.toLowerCase().replace(/\s+/g, '_');

    if (supabaseConnected) {
      await upsertCategory(id, label, query);
    }

    set(state => ({
      categories: [...state.categories, { id, label, query }]
    }));
  },

  removeCategory: async (id) => {
    const { supabaseConnected } = get();

    if (supabaseConnected) {
      await deleteCategory(id);
    }

    set(state => ({
      categories: state.categories.filter(c => c.id !== id)
    }));
  }
});
