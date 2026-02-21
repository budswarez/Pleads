import { StateCreator } from 'zustand';
import { StoreState, ConfigSlice } from '../../types';
import { updateSettings } from '../../services/supabaseService';

export const createConfigSlice: StateCreator<StoreState, [], [], ConfigSlice> = (set, get) => ({
  apiKey: '',
  supabaseUrl: '',
  supabaseAnonKey: '',
  supabaseConnected: false,
  appTitle: 'Pichau Power Leads',
  appDescription: 'Sistema de Gestão de Leads e Prospecção',
  appLogoUrl: '/logo.png',
  maxLeadsPerCategory: 60,
  leadsPerPage: 60,

  setApiKey: async (key) => {
    const { supabaseConnected } = get();
    if (supabaseConnected) {
      await updateSettings({ google_api_key: key });
    }
    set({ apiKey: key });
  },

  getApiKey: () => {
    // Priority: Store > Env Var
    return get().apiKey || import.meta.env.VITE_GOOGLE_PLACES_KEY || '';
  },

  setSupabaseConfig: async (url, anonKey) => {
    // We don't save DB config IN the DB for obvious reasons,
    // but we can save it to localStorage via Zustand persist.
    set({ supabaseUrl: url, supabaseAnonKey: anonKey });
  },

  setSupabaseConnected: (connected) => set({ supabaseConnected: connected }),

  getSupabaseConfig: () => {
    const { supabaseUrl, supabaseAnonKey, supabaseConnected } = get();
    return {
      url: supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '',
      anonKey: supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      connected: supabaseConnected
    };
  },

  setBranding: async (title, description, logoUrl) => {
    const { supabaseConnected } = get();
    if (supabaseConnected) {
      await updateSettings({
        app_title: title,
        app_description: description,
        app_logo_url: logoUrl
      });
    }
    set({
      appTitle: title,
      appDescription: description,
      appLogoUrl: logoUrl
    });
  },

  setMaxLeadsPerCategory: async (max) => {
    const { supabaseConnected } = get();
    if (supabaseConnected) {
      await updateSettings({ max_leads_per_category: max });
    }
    set({ maxLeadsPerCategory: max });
  },

  setLeadsPerPage: async (n) => {
    const { supabaseConnected } = get();
    if (supabaseConnected) {
      await updateSettings({ leads_per_page: n });
    }
    set({ leadsPerPage: n });
  },

  getAllDataForSync: () => {
    const { leads, locations, categories, statuses } = get();
    return { leads, locations, categories, statuses };
  },

  loadFromSupabase: (data) => {
    set((state) => ({
      leads: data.leads || state.leads,
      locations: data.locations || state.locations,
      categories: data.categories || state.categories,
      statuses: data.statuses || state.statuses,
      appTitle: data.settings?.app_title || state.appTitle,
      appDescription: data.settings?.app_description || state.appDescription,
      appLogoUrl: data.settings?.app_logo_url || state.appLogoUrl,
      maxLeadsPerCategory: data.settings?.max_leads_per_category || state.maxLeadsPerCategory,
      leadsPerPage: data.settings?.leads_per_page || state.leadsPerPage,
      apiKey: data.settings?.google_api_key || state.apiKey
    }));
  }
});
