import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: 'Supabase configuration missing on server' });
    }

    // Verificar autenticação do caller via JWT
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.replace('Bearer ', '');

    const { userId, newPassword } = req.body || {};

    if (!userId || !newPassword) {
        return res.status(400).json({ error: 'Missing userId or newPassword' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        // Cliente com anon key para verificar o JWT do caller
        const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
        if (!anonKey) {
            return res.status(500).json({ error: 'Supabase anon key missing on server' });
        }

        const anonClient = createClient(supabaseUrl, anonKey, {
            auth: { persistSession: false },
            global: { headers: { Authorization: `Bearer ${token}` } }
        });

        // Verificar que o caller é admin
        const { data: { user: callerUser }, error: authError } = await anonClient.auth.getUser(token);
        if (authError || !callerUser) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Verificar role admin no user_profiles
        const { data: profile, error: profileError } = await anonClient
            .from('user_profiles')
            .select('role')
            .eq('id', callerUser.id)
            .single();

        if (profileError || !profile || profile.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can change user passwords' });
        }

        // Cliente com service_role para operação admin
        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false }
        });

        const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
            password: newPassword
        });

        if (updateError) {
            return res.status(400).json({ error: updateError.message });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Admin update password error:', error);
        return res.status(500).json({ error: 'Failed to update password' });
    }
}
