import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

/**
 * Initialize or update the Supabase client
 */
export function initSupabase(url, anonKey) {
    if (!url || !anonKey) {
        supabaseClient = null;
        return null;
    }

    supabaseClient = createClient(url, anonKey, {
        auth: {
            persistSession: false
        }
    });

    return supabaseClient;
}

/**
 * Get current Supabase client
 */
export function getSupabase() {
    return supabaseClient;
}

/**
 * Test connection to Supabase
 */
export async function testConnection(url, anonKey) {
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
        const { data, error } = await client.from('leads').select('count').limit(1);

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

    } catch (error) {
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
    phone TEXT,
    website TEXT,
    rating DECIMAL(2,1),
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_city_state ON leads(city, state);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_place_id ON leads(place_id);
`;

/**
 * Create all necessary tables in Supabase
 */
export async function createTables(url, anonKey) {
    try {
        const client = createClient(url, anonKey, {
            auth: { persistSession: false }
        });

        // Try to create tables using RPC (requires a function in Supabase)
        // If RPC doesn't exist, we'll create tables individually

        // Create leads table
        const { error: leadsError } = await client.rpc('exec_sql', {
            sql: CREATE_TABLES_SQL
        }).single();

        if (leadsError) {
            // RPC doesn't exist, try creating tables via REST API
            // This requires the tables to be created manually or via migrations
            // Let's try a simpler approach - just verify if tables exist

            const tables = ['leads', 'locations', 'categories', 'statuses'];
            const results = [];

            for (const table of tables) {
                const { error } = await client.from(table).select('*').limit(1);
                if (error && error.message.includes('does not exist')) {
                    results.push({ table, exists: false });
                } else {
                    results.push({ table, exists: true });
                }
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
    } catch (error) {
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
 */
export async function checkTables() {
    const client = getSupabase();
    if (!client) return { success: false, tables: {} };

    const tables = ['leads', 'locations', 'categories', 'statuses'];
    const status = {};

    for (const table of tables) {
        try {
            const { error } = await client.from(table).select('*').limit(1);
            status[table] = !error || !error.message.includes('does not exist');
        } catch {
            status[table] = false;
        }
    }

    return { success: true, tables: status };
}

// ============ CRUD Operations ============

// LEADS
export async function fetchLeads(city = null, state = null) {
    const client = getSupabase();
    if (!client) return { data: [], error: 'Cliente não inicializado' };

    let query = client.from('leads').select('*');

    if (city && state) {
        query = query.eq('city', city).eq('state', state);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    return { data: data || [], error };
}

export async function upsertLeads(leads) {
    const client = getSupabase();
    if (!client) return { error: 'Cliente não inicializado' };

    const { data, error } = await client
        .from('leads')
        .upsert(leads.map(lead => ({
            place_id: lead.place_id,
            name: lead.name,
            address: lead.address,
            city: lead.city,
            state: lead.state,
            category: lead.category,
            phone: lead.phone,
            website: lead.website,
            rating: lead.rating,
            status: lead.status || 'NEW',
            notes: lead.notes || [],
            location: lead.location,
            updated_at: new Date().toISOString()
        })), {
            onConflict: 'place_id',
            ignoreDuplicates: false
        });

    return { data, error };
}

export async function updateLeadInDb(placeId, updates) {
    const client = getSupabase();
    if (!client) return { error: 'Cliente não inicializado' };

    const { data, error } = await client
        .from('leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('place_id', placeId);

    return { data, error };
}

// LOCATIONS
export async function fetchLocations() {
    const client = getSupabase();
    if (!client) return { data: [], error: 'Cliente não inicializado' };

    const { data, error } = await client
        .from('locations')
        .select('*')
        .order('state', { ascending: true });

    return { data: data || [], error };
}

export async function upsertLocation(city, state) {
    const client = getSupabase();
    if (!client) return { error: 'Cliente não inicializado' };

    const { data, error } = await client
        .from('locations')
        .upsert({ city, state }, { onConflict: 'city,state' });

    return { data, error };
}

export async function deleteLocation(city, state) {
    const client = getSupabase();
    if (!client) return { error: 'Cliente não inicializado' };

    const { data, error } = await client
        .from('locations')
        .delete()
        .eq('city', city)
        .eq('state', state);

    return { data, error };
}

// CATEGORIES
export async function fetchCategories() {
    const client = getSupabase();
    if (!client) return { data: [], error: 'Cliente não inicializado' };

    const { data, error } = await client
        .from('categories')
        .select('*')
        .order('label', { ascending: true });

    return { data: data || [], error };
}

export async function upsertCategory(id, label, query) {
    const client = getSupabase();
    if (!client) return { error: 'Cliente não inicializado' };

    const { data, error } = await client
        .from('categories')
        .upsert({ id, label, query }, { onConflict: 'id' });

    return { data, error };
}

export async function deleteCategory(id) {
    const client = getSupabase();
    if (!client) return { error: 'Cliente não inicializado' };

    const { data, error } = await client
        .from('categories')
        .delete()
        .eq('id', id);

    return { data, error };
}

// STATUSES
export async function fetchStatuses() {
    const client = getSupabase();
    if (!client) return { data: [], error: 'Cliente não inicializado' };

    const { data, error } = await client
        .from('statuses')
        .select('*')
        .order('label', { ascending: true });

    return { data: data || [], error };
}

export async function upsertStatus(id, label, color) {
    const client = getSupabase();
    if (!client) return { error: 'Cliente não inicializado' };

    const { data, error } = await client
        .from('statuses')
        .upsert({ id, label, color }, { onConflict: 'id' });

    return { data, error };
}

export async function deleteStatus(id) {
    const client = getSupabase();
    if (!client) return { error: 'Cliente não inicializado' };

    const { data, error } = await client
        .from('statuses')
        .delete()
        .eq('id', id);

    return { data, error };
}

/**
 * Sync all local data to Supabase
 */
export async function syncAllData(localData) {
    const client = getSupabase();
    if (!client) return { success: false, message: 'Cliente não inicializado' };

    const results = {
        leads: { success: false },
        locations: { success: false },
        categories: { success: false },
        statuses: { success: false }
    };

    try {
        // Sync leads
        if (localData.leads?.length > 0) {
            const { error } = await upsertLeads(localData.leads);
            results.leads = { success: !error, error };
        } else {
            results.leads = { success: true };
        }

        // Sync locations
        if (localData.locations?.length > 0) {
            for (const loc of localData.locations) {
                await upsertLocation(loc.city, loc.state);
            }
            results.locations = { success: true };
        } else {
            results.locations = { success: true };
        }

        // Sync categories
        if (localData.categories?.length > 0) {
            for (const cat of localData.categories) {
                await upsertCategory(cat.id, cat.label, cat.query);
            }
            results.categories = { success: true };
        } else {
            results.categories = { success: true };
        }

        // Sync statuses
        if (localData.statuses?.length > 0) {
            for (const status of localData.statuses) {
                await upsertStatus(status.id, status.label, status.color);
            }
            results.statuses = { success: true };
        } else {
            results.statuses = { success: true };
        }

        const allSuccess = Object.values(results).every(r => r.success);

        return {
            success: allSuccess,
            message: allSuccess ? 'Dados sincronizados com sucesso!' : 'Alguns dados não foram sincronizados',
            results
        };
    } catch (error) {
        return { success: false, message: error.message, results };
    }
}

/**
 * Get the SQL for creating tables (for manual execution)
 */
export function getCreateTablesSql() {
    return CREATE_TABLES_SQL;
}
