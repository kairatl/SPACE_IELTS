export default function handler(req, res) {
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json({
        supabaseUrl,
        supabaseAnonKey,
    });
}

