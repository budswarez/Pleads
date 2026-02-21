import { getSupabase } from './supabaseService';
import type { UserProfile } from '../types';

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase não inicializzato' };

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
};

/**
 * Sign out
 */
export const signOut = async () => {
  const supabase = getSupabase();
  if (!supabase) return { success: false };

  const { error } = await supabase.auth.signOut();
  if (error) return { success: false, error: error.message };
  return { success: true };
};

/**
 * Setup the first admin user (only works if no admin exists)
 */
export const setupAdmin = async (email: string, password: string, name: string) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase não inicializzato' };

  // 1. Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });

  if (authError) return { success: false, error: authError.message };
  if (!authData.user) return { success: false, error: 'Erro ao criar usuário' };

  // 2. Call RPC to promote to admin and confirm email
  const { data: rpcData, error: rpcError } = await supabase.rpc('setup_first_admin', {
    p_user_id: authData.user.id,
    p_email: email,
    p_name: name
  });

  if (rpcError) return { success: false, error: rpcError.message };
  if (!rpcData.success) return { success: false, error: rpcData.error };

  return { success: true };
};

/**
 * Create a new user (Admin only)
 */
export const createUser = async (_email: string, _password: string, _name: string) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase não inicializzato' };

  // 1. Create user using Supabase Admin API (via RPC wrapper or client-side if allowed)
  // Since client-side signUp signs in the user, we use a temporary instance or RPC
  // Here we use a pattern where we create the auth user and then the profile via RPC
  
  // Note: In a real production app, this should be done via Edge Function to avoid session switching
  // For this template, we assume the RPC handles the "admin creates user" logic safely
  
  // Using a secondary client or just signUp might log us out. 
  // Instead, we use a dedicated RPC if available, or we accept that we might need a server-side function.
  // For simplicity in this client-only setup, we'll use the RPC `admin_confirm_and_create_profile`
  // BUT we first need the auth user. 
  
  // WORKAROUND: We can't easily create a user without logging out on the client side without Service Role.
  // We will assume the `admin_confirm_and_create_profile` RPC handles the profile, 
  // but the Auth User creation usually requires Service Role or `signUp` (which logs in).
  
  // For this implementation, we will return an error suggesting to use the Invite feature or Serverless function
  // if we strictly follow client-side only.
  // However, let's try to use the `signUp` and handle the session restoration if needed, 
  // OR better: use a serverless function proxy if configured.
  
  // Assuming we have a serverless function or we accept the limitation.
  // Let's use a placeholder that would call an Edge Function in a full setup.
  
  return { success: false, error: "Criação de usuário requer configuração de Edge Function (ver documentação)" };
};

/**
 * List all users (profiles)
 */
export const listUsers = async (): Promise<UserProfile[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error listing users:', error);
    return [];
  }

  return data as UserProfile[];
};

/**
 * Delete a user (Admin only)
 */
export const deleteUser = async (userId: string) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase não inicializzato' };

  const { data, error } = await supabase.rpc('admin_delete_user', {
    p_user_id: userId
  });

  if (error) return { success: false, error: error.message };
  return { success: data.success, error: data.error };
};

/**
 * Update user password (Admin only)
 * Calls a serverless function because client-side admin API is restricted
 */
export const adminUpdatePassword = async (userId: string, newPassword: string) => {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase não inicializzato' };

  try {
    const { data, error } = await supabase.functions.invoke('admin-update-password', {
      body: { userId, newPassword }
    });

    if (error) throw error;
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao atualizar senha' };
  }
};