import { useEffect } from 'react';
import useStore from '../store/useStore';
import { fetchLeads, fetchLocations, fetchCategories, fetchStatuses, syncAllData } from '../services/supabaseService';

/**
 * Hook to automatically synchronize local Zustand state with Supabase
 * Uploads local data first, then downloads any remote changes.
 */
export function useAutoSync(isAuthenticated: boolean, supabaseReady: boolean) {
    const { setSupabaseConnected, loadFromSupabase, getAllDataForSync } = useStore();

    useEffect(() => {
        if (isAuthenticated && supabaseReady) {
            setSupabaseConnected(true);

            const autoSync = async () => {
                try {
                    // Upload local data first
                    const localData = getAllDataForSync();
                    await syncAllData(localData);

                    // Download from Supabase
                    const [leadsRes, locationsRes, categoriesRes, statusesRes] = await Promise.all([
                        fetchLeads(),
                        fetchLocations(),
                        fetchCategories(),
                        fetchStatuses()
                    ]);

                    loadFromSupabase({
                        leads: leadsRes.data || undefined,
                        locations: locationsRes.data?.map(l => ({ ...l, id: l.id })) || undefined,
                        categories: categoriesRes.data || undefined,
                        statuses: statusesRes.data || undefined
                    });
                } catch (err) {
                    console.error('Auto-sync failed:', err);
                }
            };

            autoSync();
        }
    }, [isAuthenticated, supabaseReady, setSupabaseConnected, loadFromSupabase, getAllDataForSync]);
}
