import { StateCreator } from 'zustand';
import type { StoreState, ConfigSlice } from '../../types';
import { DEFAULT_BRANDING, DEFAULT_MAX_LEADS_PER_CATEGORY, DEFAULT_LEADS_PER_PAGE } from '../../constants';

export const createConfigSlice: StateCreator<
    StoreState,
    [],
    [],
    ConfigSlice
> = (set, get) => ({
    apiKey: import.meta.env.VITE_GOOGLE_PLACES_KEY || '',
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    supabaseConnected: false,

    appTitle: DEFAULT_BRANDING.TITLE,
    appDescription: DEFAULT_BRANDING.DESCRIPTION,
    appLogoUrl: DEFAULT_BRANDING.LOGO_URL,

    maxLeadsPerCategory: DEFAULT_MAX_LEADS_PER_CATEGORY,
    leadsPerPage: DEFAULT_LEADS_PER_PAGE,

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

    setLeadsPerPage: (n: number) => {
        set({ leadsPerPage: n });
    },

    setApiKey: (key: string) => {
        set({ apiKey: key });
    },

    getApiKey: (): string => {
        const stateKey = get().apiKey;
        return stateKey && stateKey.trim() !== ''
            ? stateKey
            : (import.meta.env.VITE_GOOGLE_PLACES_KEY || '');
    },

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

    getAllDataForSync: () => {
        const state = get();
        return {
            leads: state.leads,
            locations: state.locations,
            categories: state.categories,
            statuses: state.statuses
        };
    },

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
});
