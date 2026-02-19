import { StateCreator } from 'zustand';
import type { StoreState, StatusCategorySlice, Status } from '../../types';
import { DEFAULT_STATUSES, DEFAULT_CATEGORIES } from '../../constants';
import { getSupabase, upsertStatus, upsertCategory } from '../../services/supabaseService';

export const createStatusCategorySlice: StateCreator<
    StoreState,
    [],
    [],
    StatusCategorySlice
> = (set, get) => ({
    statuses: [...DEFAULT_STATUSES],
    categories: [...DEFAULT_CATEGORIES],

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
});
