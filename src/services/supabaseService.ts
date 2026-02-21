import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Lead, Location, Category, Status, SupabaseTableStatus } from '../types';
import { ERROR_MESSAGES, SUPABASE_TABLES } from '../constants';

let supabaseClient: SupabaseClient | null = null;
let activeSupabaseUrl: string | null = null;

const MAX_LEADS_FETCH_LIMIT = 5000;

/**
 * Supabase operation result
 */
interface SupabaseResult<T = any> {
  data?: T;
  error?: string | any;
  success?: boolean;
  message?: string;
}

/**
 * Connection test result
 */
interface ConnectionTestResult {
  success: boolean;
  message: string;
  needsTables?: boolean;
}

/**
 * Table creation result
 */
interface TableCreationResult {
  success: boolean;
  message: string;
  sql?: string;
  missingTables?: string[];
}

/**
 * Sync result for individual entity
 */
interface EntitySyncResult {
  success: boolean;
  error?: any;
}

/**
 * Complete sync result
 */
interface SyncAllDataResult {
  success: boolean;
  message: string;
  results: {
    leads: EntitySyncResult;
    locations: EntitySyncResult;
    categories: EntitySyncResult;
    statuses: EntitySyncResult;
  };
}

/**
 * Initialize or update the Supabase client
 * @param url - Supabase project URL
 * @param anonKey - Supabase anonymous key
 * @returns Initialized Supabase client or null
 */
export function initSupabase(url: string, anonKey: string): SupabaseClient | null {
  if (!url || !anonKey) {
    console.warn('Supabase init failed: missing URL or Key', { url: !!url, key: !!anonKey });
    supabaseClient = null;
    return null;
  }

  // Se já estiver inicializado com os mesmos parâmetros, retorna o cliente existente
  // Isso evita o erro "Multiple GoTrueClient instances detected"
  if (supabaseClient && activeSupabaseUrl === url) {
    return supabaseClient;
  }

  supabaseClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  activeSupabaseUrl = url;

  return supabaseClient;
}

/**
 * Get current Supabase client
 * @returns Current Supabase client instance or null
 */
export function getSupabase(): SupabaseClient | null {
  return supabaseClient;
}

/**
 * Test connection to Supabase
 * @param url - Supabase project URL
 * @param anonKey - Supabase anonymous key
 * @returns Connection test result
 */
export async function testConnection(url: string, anonKey: string): Promise<ConnectionTestResult> {
  try {
    // Validate URL format
    if (!url.startsWith('https://') || !url.includes('supabase.co')) {
      return {
        success: false,
        message: 'URL inválida. Use o formato: https://seu-projeto.supabase.co'
      };
    }

    const client = createClient(url, anonKey, {
      auth: { persistSession: false }
    });

    // Try to query the leads table to test connection
    const { error } = await client.from(SUPABASE_TABLES.LEADS).select('count').limit(1);

    // Success - table exists and we can query it
    if (!error) {
      return { success: true, message: 'Conexão estabelecida com sucesso!' };
    }

    // Handle different error types
    const errorMsg = error.message || '';

    // Table doesn't exist in schema cache - connection works but table needs to be created
    if (errorMsg.includes('Could not find') || errorMsg.includes('schema cache')) {
      return {
        success: true,
        message: 'Conexão OK! Tabelas precisam ser criadas.',
        needsTables: true
      };
    }

    // Table doesn't exist - connection works, need to create tables
    if (errorMsg.includes('does not exist') || errorMsg.includes('relation')) {
      return {
        success: true,
        message: 'Conexão OK! Tabelas precisam ser criadas.',
        needsTables: true
      };
    }

    // Permission denied - API key might be wrong
    if (errorMsg.includes('permission denied') || errorMsg.includes('not authorized')) {
      return {
        success: false,
        message: 'Permissão negada. Verifique a API Key.'
      };
    }

    // JWT/Auth errors
    if (errorMsg.includes('JWT') || errorMsg.includes('token') || errorMsg.includes('Invalid API')) {
      return {
        success: false,
        message: 'API Key inválida. Use a "anon public" key.'
      };
    }

    // Generic error - still might mean connection works
    return {
      success: true,
      message: 'Conexão OK! Verifique se as tabelas existem.',
      needsTables: true
    };

  } catch (error: any) {
    console.error('Supabase connection test failed:', error);

    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return {
        success: false,
        message: 'Erro de rede. Verifique a URL.'
      };
    }

    return {
      success: false,
      message: `Erro: ${error.message || 'Verifique URL e API Key'}`
    };
  }
}

/**
 * SQL to create all necessary tables
 */
const CREATE_TABLES_SQL = `
-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id BIGSERIAL PRIMARY KEY,
    place_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    category TEXT,
    category_id TEXT,
    phone TEXT,
    website TEXT,
    rating DECIMAL(2,1),
    user_ratings_total INTEGER,
    status TEXT DEFAULT 'NEW',
    notes JSONB DEFAULT '[]'::jsonb,
    location JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
    id BIGSERIAL PRIMARY KEY,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    neighborhoods JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(city, state)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    query TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Statuses table
CREATE TABLE IF NOT EXISTS statuses (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table (for authentication)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Allow authenticated access" ON leads FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON locations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON statuses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON user_profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access" ON settings FOR ALL USING (auth.role() = 'authenticated');


-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_city_state ON leads(city, state);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_place_id ON leads(place_id);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    app_title TEXT,
    app_description TEXT,
    app_logo_url TEXT,
    max_leads_per_category INTEGER DEFAULT 60,
    leads_per_page INTEGER DEFAULT 60,
    google_api_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default settings if not exists
INSERT INTO settings (id, app_title, app_description, max_leads_per_category, leads_per_page)
VALUES (1, 'PLeads', 'Sistema de Gestão de Leads', 60, 60)
ON CONFLICT (id) DO NOTHING;

-- RPC: Check if setup is complete (at least one admin exists)
CREATE OR REPLACE FUNCTION is_setup_complete()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM user_profiles WHERE role = 'admin');
END;
$$;

-- RPC: Setup first admin
CREATE OR REPLACE FUNCTION setup_first_admin(p_user_id UUID, p_email TEXT, p_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Check if any admin already exists
  SELECT count(*) INTO v_count FROM user_profiles WHERE role = 'admin';
  
  IF v_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Setup já foi realizado. Utilize login.');
  END IF;

  -- Create or update profile
  INSERT INTO user_profiles (id, email, name, role)
  VALUES (p_user_id, p_email, p_name, 'admin')
  ON CONFLICT (id) DO UPDATE 
  SET role = 'admin', name = p_name;

  -- Confirm email automatically for the first admin
  UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC: Delete user (Admin only)
CREATE OR REPLACE FUNCTION admin_delete_user(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Não autorizado.');
  END IF;

  -- Delete from auth (cascades to user_profiles due to FK)
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
`;

/**
 * Create all necessary tables in Supabase
 * @param url - Supabase project URL
 * @param anonKey - Supabase anonymous key
 * @returns Table creation result
 */
export async function createTables(url: string, anonKey: string): Promise<TableCreationResult> {
  try {
    const client = createClient(url, anonKey, {
      auth: { persistSession: false }
    });

    // Try to create tables using RPC (requires a function in Supabase)
    const { error: leadsError } = await client.rpc('exec_sql', {
      sql: CREATE_TABLES_SQL
    }).single();

    if (leadsError) {
      // RPC doesn't exist, check if tables already exist
      const tables = [
        SUPABASE_TABLES.LEADS,
        SUPABASE_TABLES.LOCATIONS,
        SUPABASE_TABLES.CATEGORIES,
        SUPABASE_TABLES.STATUSES,
        SUPABASE_TABLES.USER_PROFILES,
        SUPABASE_TABLES.SETTINGS
      ];
      const results: Array<{ table: string; exists: boolean }> = [];

      for (const table of tables) {
        const { error } = await client.from(table).select('*').limit(1);
        results.push({
          table,
          exists: !(error && error.message.includes('does not exist'))
        });
      }

      const missingTables = results.filter(r => !r.exists).map(r => r.table);

      if (missingTables.length > 0) {
        return {
          success: false,
          message: `Tabelas não encontradas: ${missingTables.join(', ')}. Execute o SQL manualmente no Supabase SQL Editor.`,
          sql: CREATE_TABLES_SQL,
          missingTables
        };
      }

      return { success: true, message: 'Todas as tabelas já existem!' };
    }

    return { success: true, message: 'Tabelas criadas com sucesso!' };
  } catch (error: any) {
    console.error('Error creating tables:', error);
    return {
      success: false,
      message: `Erro ao criar tabelas: ${error.message}`,
      sql: CREATE_TABLES_SQL
    };
  }
}

/**
 * Check which tables exist
 * @returns Object with success flag and table status
 */
export async function checkTables(): Promise<{ success: boolean; tables: SupabaseTableStatus }> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      tables: { leads: false, locations: false, categories: false, statuses: false, user_profiles: false, settings: false }
    };
  }

  const tables = [
    SUPABASE_TABLES.LEADS,
    SUPABASE_TABLES.LOCATIONS,
    SUPABASE_TABLES.CATEGORIES,
    SUPABASE_TABLES.STATUSES,
    SUPABASE_TABLES.USER_PROFILES,
    SUPABASE_TABLES.SETTINGS
  ] as const;

  const status: SupabaseTableStatus = {
    leads: false,
    locations: false,
    categories: false,
    statuses: false,
    user_profiles: false,
    settings: false
  };

  for (const table of tables) {
    try {
      const { error } = await client.from(table).select('*').limit(1);
      status[table as keyof SupabaseTableStatus] = !error || !(error.message && error.message.includes('does not exist'));
    } catch {
      status[table as keyof SupabaseTableStatus] = false;
    }
  }

  return { success: true, tables: status };
}

// ============ CRUD Operations ============

// LEADS

/**
 * Fetch leads from Supabase, optionally filtered by location
 * @param city - Optional city filter
 * @param state - Optional state filter
 * @returns Leads data and error
 */
export async function fetchLeads(
  city: string | null = null,
  state: string | null = null
): Promise<SupabaseResult<Lead[]>> {
  const client = getSupabase();
  if (!client) {
    return { data: [], error: ERROR_MESSAGES.SUPABASE_NOT_INITIALIZED };
  }

  let query = client.from(SUPABASE_TABLES.LEADS).select('*');

  if (city && state) {
    query = query.eq('city', city).eq('state', state);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(MAX_LEADS_FETCH_LIMIT);

  // Map snake_case DB columns to camelCase frontend properties
  const mappedData = (data || []).map((row: any) => ({
    ...row,
    categoryId: row.category_id || row.categoryId || undefined,
  })) as Lead[];

  return { data: mappedData, error };
}

/**
 * Upsert leads to Supabase
 * @param leads - Array of leads to upsert
 * @returns Result with data and error
 */
export async function upsertLeads(leads: Lead[]): Promise<SupabaseResult> {
  const client = getSupabase();
  if (!client) {
    return { error: ERROR_MESSAGES.SUPABASE_NOT_INITIALIZED };
  }

  const { data, error } = await client
    .from(SUPABASE_TABLES.LEADS)
    .upsert(leads.map(lead => ({
      place_id: lead.place_id,
      name: lead.name,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      category: lead.category,
      category_id: lead.categoryId,
      phone: lead.phone,
      website: lead.website,
      rating: lead.rating,
      user_ratings_total: lead.user_ratings_total,
      status: lead.status || 'NEW',
      notes: lead.notes || [],
      updated_at: new Date().toISOString()
    })), {
      onConflict: 'place_id',
      ignoreDuplicates: false
    });

  return { data, error };
}

/**
 * Update a specific lead in the database
 * @param placeId - Google Place ID
 * @param updates - Partial lead object with fields to update
 * @returns Result with data and error
 */
export async function updateLeadInDb(
  placeId: string,
  updates: Partial<Lead>
): Promise<SupabaseResult> {
  const client = getSupabase();
  if (!client) {
    return { error: ERROR_MESSAGES.SUPABASE_NOT_INITIALIZED };
  }

  const { data, error } = await client
    .from(SUPABASE_TABLES.LEADS)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('place_id', placeId);

  return { data, error };
}

/**
 * Delete a specific lead from the database
 * @param placeId - Google Place ID
 * @returns Result with data and error
 */
export async function deleteLeadFromDb(placeId: string): Promise<SupabaseResult> {
  const client = getSupabase();
  if (!client) {
    return { error: ERROR_MESSAGES.SUPABASE_NOT_INITIALIZED };
  }

  const { data, error } = await client
    .from(SUPABASE_TABLES.LEADS)
    .delete()
    .eq('place_id', placeId);

  return { data, error };
}

/**
 * Delete leads by location and optionally by category
 * @param city - City name
 * @param state - State abbreviation
 * @param categoryId - Optional category ID filter
 * @returns Result with data and error
 */
export async function deleteLeadsByLocationFromDb(
  city: string,
  state: string,
  categoryId?: string
): Promise<SupabaseResult> {
  const client = getSupabase();
  if (!client) {
    return { error: ERROR_MESSAGES.SUPABASE_NOT_INITIALIZED };
  }

  let query = client.from(SUPABASE_TABLES.LEADS).delete().eq('city', city).eq('state', state);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;

  return { data, error };
}

// LOCATIONS

/**
 * Fetch all locations from Supabase
 * @returns Locations data and error
 */
export async function fetchLocations(): Promise<SupabaseResult<Location[]>> {
  const client = getSupabase();
  if (!client) {
    return { data: [], error: ERROR_MESSAGES.SUPABASE_NOT_INITIALIZED };
  }

  const { data, error } = await client
    .from(SUPABASE_TABLES.LOCATIONS)
    .select('*')
    .order('state', { ascending: true });

  return { data: (data as Location[]) || [], error };
}

/**
 * Upsert a location to Supabase
 * @param city - City name
 * @param state - State abbreviation
 * @returns Result with data and error
 */
export async function upsertLocation(city: string, state: string, neighborhoods: string[] = []): Promise<SupabaseResult> {
  const client = getSupabase();
  if (!client) {
    return { error: ERROR_MESSAGES.SUPABASE_NOT_INITIALIZED };
  }

  const { data, error } = await client
    .from(SUPABASE_TABLES.LOCATIONS)
    .upsert({ city, state, neighborhoods }, { onConflict: 'city,state' });

  return { data, error };
}

/**
 * Delete a location from Supabase
 * @param city - City name
 * @param state - State abbreviation
 * @returns Result with data and error
 */
export async function deleteLocation(city: string, state: string): Promise<SupabaseResult> {
  const client = getSupabase();
  if (!client) {
    return { error: ERROR_MESSAGES.SUPABASE_NOT_INITIALIZED };
  }

  const { data, error } = await client
    .from(SUPABASE_TABLES.LOCATIONS)
    .delete()
    .eq('city', city)
    .eq('state', state);

  return { data, error };
}

// CATEGORIES

/**
 * Fetch all categories from Supabase
 * @returns Categories data and error
 */
export async function fetchCategories(): Promise<SupabaseResult<Category[]>> {
  const client = getSupabase();
  if (!client) {
    return { data: [], error: ERROR_MESSAGES.SUPABASE_NOT_INITIALIZED };
  }

  const { data, error } = await client
    .from(SUPABASE_TABLES.CATEGORIES)
    .select('*')
    .order('label', { ascending: true });

  return { data: (data as Category[]) || [], error };
}

/**
 * Upsert a category to Supabase
 * @param id - Category ID
 * @param label - Category label
 * @param query - Search query
 * @returns Result with data and error
 */
export async function upsertCategory(
  id: string,
  label: string,
  query: string
): Promise<SupabaseResult> {
  const client = getSupabase();
  if (!client) {
    return { error: ERROR_MESSAGES.SUPABASE_NOT_INITIALIZED };
  }

  const { data, error } = await client
    .from(SUPABASE_TABLES.CATEGORIES)
    .upsert({ id, label, query }, { onConflict: 'id' });

  return { data, error };
}

/**
 * Delete a category from Supabase
 * @param id - Category ID
 * @returns Result with data and error
 */
export async function deleteCategory(id: string): Promise<SupabaseResult> {
  const client = getSupabase();
  if (!client) {
    return { error: ERROR_MESSAGES.SUPABASE_NOT_INITIALIZED };
  }

  const { data, error } = await client
    .from(SUPABASE_TABLES.CATEGORIES)
    .delete()
    .eq('id', id);

  return { data, error };
}

// STATUSES

/**
 * Fetch all statuses from Supabase
 * @returns Statuses data and error
 */
export async function fetchStatuses(): Promise<SupabaseResult<Status[]>> {
  const client = getSupabase();
  if (!client) {
    return { data: [], error: ERROR_MESSAGES.SUPABASE_NOT_INITIALIZED };
  }

  const { data, error } = await client
    .from(SUPABASE_TABLES.STATUSES)
    .select('*')
    .order('label', { ascending: true });

  return { data: (data as Status[]) || [], error };
}

/**
 * Upsert a status to Supabase
 * @param id - Status ID
 * @param label - Status label
 * @param color - Status color (hex code)
 * @returns Result with data and error
 */
export async function upsertStatus(
  id: string,
  label: string,
  color: string
): Promise<SupabaseResult> {
  const client = getSupabase();
  if (!client) {
    return { error: ERROR_MESSAGES.SUPABASE_NOT_INITIALIZED };
  }

  const { data, error } = await client
    .from(SUPABASE_TABLES.STATUSES)
    .upsert({ id, label, color }, { onConflict: 'id' });

  return { data, error };
}

/**
 * Delete a status from Supabase
 * @param id - Status ID
 * @returns Result with data and error
 */
export async function deleteStatus(id: string): Promise<SupabaseResult> {
  const client = getSupabase();
  if (!client) {
    return { error: ERROR_MESSAGES.SUPABASE_NOT_INITIALIZED };
  }

  const { data, error } = await client
    .from(SUPABASE_TABLES.STATUSES)
    .delete()
    .eq('id', id);

  return { data, error };
}

/**
 * Sync all local data to Supabase
 * @param localData - Object containing leads, locations, categories, and statuses
 * @returns Sync result with details for each entity type
 */
export async function syncAllData(localData: {
  leads?: Lead[];
  locations?: Location[];
  categories?: Category[];
  statuses?: Status[];
}): Promise<SyncAllDataResult> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: ERROR_MESSAGES.SUPABASE_NOT_INITIALIZED,
      results: {
        leads: { success: false },
        locations: { success: false },
        categories: { success: false },
        statuses: { success: false }
      }
    };
  }

  const results: SyncAllDataResult['results'] = {
    leads: { success: false },
    locations: { success: false },
    categories: { success: false },
    statuses: { success: false }
  };

  try {
    // Sync leads
    if (localData.leads && localData.leads.length > 0) {
      const { error } = await upsertLeads(localData.leads);
      results.leads = { success: !error, error };
    } else {
      results.leads = { success: true };
    }

    // Sync locations
    if (localData.locations && localData.locations.length > 0) {
      let locationsError: any = null;
      for (const loc of localData.locations) {
        const result = await upsertLocation(loc.city, loc.state, loc.neighborhoods || []);
        if (result.error) {
          locationsError = result.error;
          break; // Stop on first error
        }
      }
      results.locations = { success: !locationsError, error: locationsError };
    } else {
      results.locations = { success: true };
    }

    // Sync categories
    if (localData.categories && localData.categories.length > 0) {
      let categoriesError: any = null;
      for (const cat of localData.categories) {
        const result = await upsertCategory(cat.id, cat.label, cat.query);
        if (result.error) {
          categoriesError = result.error;
          break; // Stop on first error
        }
      }
      results.categories = { success: !categoriesError, error: categoriesError };
    } else {
      results.categories = { success: true };
    }

    // Sync statuses
    if (localData.statuses && localData.statuses.length > 0) {
      let statusesError: any = null;
      for (const status of localData.statuses) {
        const result = await upsertStatus(status.id, status.label, status.color);
        if (result.error) {
          statusesError = result.error;
          break; // Stop on first error
        }
      }
      results.statuses = { success: !statusesError, error: statusesError };
    } else {
      results.statuses = { success: true };
    }

    const allSuccess = Object.values(results).every(r => r.success);

    // Build detailed error message if any sync failed
    let errorMessage = 'Alguns dados não foram sincronizados:';
    const failedParts: string[] = [];

    if (!results.leads.success) failedParts.push('Leads');
    if (!results.locations.success) failedParts.push('Localizações');
    if (!results.categories.success) failedParts.push('Categorias');
    if (!results.statuses.success) failedParts.push('Status');

    if (failedParts.length > 0) {
      errorMessage += ' ' + failedParts.join(', ');
    }

    return {
      success: allSuccess,
      message: allSuccess
        ? 'Dados sincronizados com sucesso!'
        : errorMessage,
      results
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Erro ao sincronizar dados',
      results
    };
  }
}

// SETTINGS

/**
 * Fetch settings from Supabase
 * @returns Settings data and error
 */
export async function fetchSettings(): Promise<SupabaseResult> {
  const client = getSupabase();
  if (!client) {
    return { error: ERROR_MESSAGES.SUPABASE_NOT_INITIALIZED };
  }

  const { data, error } = await client
    .from(SUPABASE_TABLES.SETTINGS)
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  return { data, error };
}

/**
 * Update app settings in Supabase
 * @param updates - Partial settings object
 * @returns Result with data and error
 */
export async function updateSettings(updates: any): Promise<SupabaseResult> {
  const client = getSupabase();
  if (!client) {
    return { error: ERROR_MESSAGES.SUPABASE_NOT_INITIALIZED };
  }

  const { data, error } = await client
    .from(SUPABASE_TABLES.SETTINGS)
    .upsert({
      id: 1,
      ...updates,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  return { data, error };
}


/**
 * Get the SQL for creating tables (for manual execution)
 * @returns SQL string for creating all tables
 */
export function getCreateTablesSql(): string {
  return CREATE_TABLES_SQL;
}
