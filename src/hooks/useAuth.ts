import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../types';
import { getSupabase, initSupabase } from '../services/supabaseService';
import {
  checkSetupComplete,
  getUserProfile,
  signIn as authSignIn,
  signOut as authSignOut
} from '../services/authService';

interface UseAuthReturn {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  setupRequired: boolean;
  supabaseReady: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

/**
 * Hook para gerenciar estado de autenticação
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [supabaseReady, setSupabaseReady] = useState(false);

  const refreshProfile = useCallback(async () => {
    const p = await getUserProfile();
    setProfile(p);
  }, []);

  // Initialize Supabase and check auth state
  useEffect(() => {
    const init = async () => {
      const url = import.meta.env.VITE_SUPABASE_URL || '';
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

      if (!url || !anonKey) {
        setSupabaseReady(false);
        setIsLoading(false);
        return;
      }

      initSupabase(url, anonKey);
      setSupabaseReady(true);

      const client = getSupabase();
      if (!client) {
        setIsLoading(false);
        return;
      }

      // Check existing session
      const { data: { session } } = await client.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        const p = await getUserProfile();
        setProfile(p);
      } else {
        // No session - check if setup is needed
        const setupDone = await checkSetupComplete();
        setSetupRequired(!setupDone);
      }

      setIsLoading(false);

      // Listen for auth state changes
      const { data: { subscription } } = client.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user);
            const p = await getUserProfile();
            setProfile(p);
            setSetupRequired(false);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            // Re-check setup state
            const setupDone = await checkSetupComplete();
            setSetupRequired(!setupDone);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    };

    init();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    return authSignIn(email, password);
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
    setProfile(null);
  }, []);

  return {
    user,
    profile,
    isAdmin: profile?.role === 'admin',
    isLoading,
    isAuthenticated: !!user,
    setupRequired,
    supabaseReady,
    signIn,
    signOut,
    refreshProfile
  };
}
