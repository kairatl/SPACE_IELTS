import { createClient } from '@supabase/supabase-js';

/** For browser + CDN (no bundler), use `supabase-browser.js` and `registration.js`. */

/**
 * Reads URL and anon key from:
 * - Node: process.env (load .env via `node --env-file=.env` or dotenv in your entry script)
 * - Vite: import.meta.env.VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (duplicate values in .env)
 */
const supabaseUrl =
    (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    '';

const supabaseAnonKey =
    (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    '';

/** null until SUPABASE_URL and SUPABASE_ANON_KEY are set (or Vite VITE_* equivalents). */
export const supabase =
    supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey)
        : null;
