import { useEffect } from 'react';
import useStore from '../store/useStore';
import {
    fetchLeads, fetchLocations,
    fetchCategories,
    fetchStatuses,
    fetchSettings
} from '../services/supabaseService';

/**
 * Hook to automatically synchronize local Zustand state with Supabase
 * Uploads local data first, then downloads any remote changes.
 */
export function useAutoSync(
    isAuthenticated: boolean,
    supabaseReady: boolean,
    selectedCity: string | null = null,
    selectedState: string | null = null
) {
    const { setSupabaseConnected, loadFromSupabase } = useStore();

    useEffect(() => {
        if (isAuthenticated && supabaseReady) {
            setSupabaseConnected(true);

            const autoSync = async () => {
                try {
                    // Download from Supabase as source of truth
                    // Passing city/state filters to fetchLeads to ensure we get relevant data efficiently
                    const [leadsRes, locationsRes, categoriesRes, statusesRes, settingsRes] = await Promise.all([
                        fetchLeads(selectedCity, selectedState),
                        fetchLocations(),
                        fetchCategories(),
                        fetchStatuses(),
                        fetchSettings()
                    ]);

                    loadFromSupabase({
                        leads: leadsRes.data || undefined,
                        locations: locationsRes.data?.map(l => ({ ...l, id: l.id })) || undefined,
                        categories: categoriesRes.data || undefined,
                        statuses: statusesRes.data || undefined,
                        settings: settingsRes.data || undefined
                    });
                } catch (err) {
                    console.error('Auto-sync failed:', err);
                }
            };

            autoSync();
        }
    }, [
        isAuthenticated,
        supabaseReady,
        selectedCity,
        selectedState,
        setSupabaseConnected,
        loadFromSupabase
    ]);
}
