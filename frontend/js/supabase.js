/** Supabase client and authentication state helpers. */

const SUPABASE_URL = 'https://cxwyrfngaslvehcodxij.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_NnWB7ZwtU-x4GMVwDLbVeA_mP2mIe99';

let supabaseClient = null;
const appDataCache = new Map();
let appDataUserId = null;

function getSupabaseClient() {
    if (!supabaseClient && window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabaseClient;
}

function isSupabaseConfigured() {
    return !!(window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== 'SUA_URL_DO_SUPABASE' && SUPABASE_ANON_KEY !== 'SUA_CHAVE_ANON');
}

async function getCurrentUserId() {
    const supabase = getSupabaseClient();

    if (!supabase) {
        return null;
    }

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
        return null;
    }

    return data.user.id;
}

window.getSupabaseClient = getSupabaseClient;