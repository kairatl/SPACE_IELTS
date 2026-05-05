/**
 * Supabase client for the browser — loads the SDK from CDN (no bundler).
 * Uses https://esm.sh — serve the site over http(s), not file://, so imports resolve.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function getSupabaseBrowserClient() {
    return null;
}

export async function getSupabaseBrowserClientAsync() {
    try {
        const res = await fetch('/api/public-config', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        const url = typeof data?.supabaseUrl === 'string' ? data.supabaseUrl.trim() : '';
        const key =
            typeof data?.supabaseAnonKey === 'string'
                ? data.supabaseAnonKey.trim()
                : '';
        if (!res.ok || !url || !key) return null;
        return createClient(url, key);
    } catch {
        return null;
    }
}
