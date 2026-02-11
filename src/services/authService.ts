import { createClient } from '@supabase/supabase-js';
import type { UserProfile } from '../types';
import { getSupabase } from './supabaseService';
import { SUPABASE_TABLES } from '../constants';

/**
 * Check if initial setup (admin creation) has been completed
 */
export async function checkSetupComplete(): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { data, error } = await client.rpc('is_setup_complete');
    if (error) {
      console.warn('is_setup_complete RPC failed, falling back to direct query:', error.message);
      // Fallback: try direct query (works if RLS allows it)
      const { count } = await client
        .from(SUPABASE_TABLES.USER_PROFILES)
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');
      return (count ?? 0) > 0;
    }
    return !!data;
  } catch {
    return false;
  }
}

/**
 * Create the initial admin account (setup flow)
 */
export async function setupAdmin(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Supabase não inicializado.' };

  // Sign up via Supabase Auth
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: 'Falha ao criar usuário.' };
  }

  // Detect fake user (Supabase returns empty identities when email already exists)
  if (!data.user.identities || data.user.identities.length === 0) {
    return { success: false, error: 'Este email já está cadastrado. Remova-o pelo Supabase Dashboard antes de tentar novamente.' };
  }

  // Confirm email + create admin profile via RPC (bypasses RLS/PostgREST schema cache)
  const { data: rpcResult, error: rpcError } = await client.rpc('setup_first_admin', {
    p_user_id: data.user.id,
    p_email: email,
    p_name: name
  });

  if (rpcError) {
    return { success: false, error: `Conta criada mas falha ao salvar perfil: ${rpcError.message}` };
  }

  const result = rpcResult as { success: boolean; error?: string };
  if (!result.success) {
    return { success: false, error: result.error || 'Erro ao configurar admin.' };
  }

  // Sign in immediately (email was confirmed by RPC)
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) {
    return { success: false, error: `Perfil criado mas falha ao entrar: ${signInError.message}` };
  }

  return { success: true };
}

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Supabase não inicializado.' };

  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('Sign in error:', error.message, error.status);
    return { success: false, error: 'Email ou senha incorretos.' };
  }

  return { success: true };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  await client.auth.signOut();
}

/**
 * Get the current user's profile
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;

  const { data, error } = await client
    .from(SUPABASE_TABLES.USER_PROFILES)
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) return null;

  return data as UserProfile;
}

/**
 * List all users (admin only - RLS enforces this)
 */
export async function listUsers(): Promise<UserProfile[]> {
  const client = getSupabase();
  if (!client) return [];

  const { data, error } = await client
    .from(SUPABASE_TABLES.USER_PROFILES)
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error listing users:', error);
    return [];
  }

  return (data as UserProfile[]) || [];
}

/**
 * Create a new user (admin only)
 * Uses a temporary Supabase client so the admin session is not affected.
 * GoTrue handles password hashing correctly this way.
 */
export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Supabase não inicializado.' };

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return { success: false, error: 'Configuração do Supabase não encontrada.' };
  }

  // Create a temporary client (persistSession: false) to sign up without affecting admin session
  const tempClient = createClient(url, anonKey, {
    auth: { persistSession: false }
  });

  const { data, error } = await tempClient.auth.signUp({
    email,
    password,
    options: { data: { name: name || email } }
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: 'Falha ao criar usuário.' };
  }

  // Detect fake user (Supabase returns empty identities when email already exists)
  if (!data.user.identities || data.user.identities.length === 0) {
    return { success: false, error: 'Este email já está cadastrado.' };
  }

  // Confirm email and create profile via RPC (admin's session, SECURITY DEFINER)
  const { data: rpcResult, error: rpcError } = await client.rpc('admin_confirm_and_create_profile', {
    p_user_id: data.user.id,
    p_email: email,
    p_name: name || email
  });

  if (rpcError) {
    return { success: false, error: rpcError.message };
  }

  const result = rpcResult as { success: boolean; error?: string };
  if (!result.success) {
    return { success: false, error: result.error || 'Erro ao confirmar usuário.' };
  }

  return { success: true };
}

/**
 * Delete a user (admin only, via RPC)
 */
export async function deleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Supabase não inicializado.' };

  const { data, error } = await client.rpc('admin_delete_user', {
    p_user_id: userId
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string };

  if (!result.success) {
    return { success: false, error: result.error || 'Erro ao remover usuário.' };
  }

  return { success: true };
}
