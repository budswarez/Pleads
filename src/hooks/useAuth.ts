import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import useStore from '../store/useStore';
import { getSupabase } from '../services/supabaseService';
import { signIn as authSignIn, signOut as authSignOut } from '../services/authService';
import type { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  
  const { setSupabaseConnected } = useStore();
  const supabase = getSupabase();

  // Check if setup is required (no admin exists)
  const checkSetup = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.rpc('is_setup_complete');
      if (!error) {
        setSetupRequired(!data);
      }
    } catch (e) {
      console.error('Error checking setup status:', e);
    }
  };

  const fetchProfile = async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data as UserProfile);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        setSupabaseConnected(true);
      } else {
        checkSetup();
      }
      setIsLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        setSupabaseConnected(true);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = async (email: string, pass: string) => {
    return authSignIn(email, pass);
  };

  const signOut = async () => {
    const res = await authSignOut();
    if (res.success) {
      setUser(null);
      setProfile(null);
    }
  };

  return {
    user,
    profile,
    isAdmin: profile?.role === 'admin',
    isLoading,
    isAuthenticated: !!user,
    setupRequired,
    supabaseReady: !!supabase,
    signIn,
    signOut,
    refreshProfile: () => user && fetchProfile(user.id)
  };
}