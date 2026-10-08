/** Supabase-backed app data cache and persistence. */

const appStorage = {
    getItem(key) {
        return appDataCache.has(key) ? appDataCache.get(key) : null;
    },
    setItem(key, value) {
        const stringValue = String(value);
        appDataCache.set(key, stringValue);
        salvarDadoDoApp(key, stringValue);
    },
    removeItem(key) {
        appDataCache.delete(key);
        removerDadoDoApp(key);
    }
};

async function inicializarDadosDoApp() {
    const client = getSupabaseClient();
    const userId = await getCurrentUserId();
    if (!client || !userId) return;

    appDataUserId = userId;
    const { data, error } = await client.from('user_app_data')
        .select('data_key, data_value').eq('user_id', userId);
    if (error) {
        console.error('Não foi possível carregar os dados do app:', error);
        return;
    }

    appDataCache.clear();
    (data || []).forEach(row => appDataCache.set(row.data_key, String(row.data_value ?? '')));

}

async function salvarDadoDoApp(key, value) {
    const client = getSupabaseClient();
    const userId = appDataUserId || await getCurrentUserId();
    if (!client || !userId) return;
    appDataUserId = userId;
    const { error } = await client.from('user_app_data').upsert({
        user_id: userId, data_key: key, data_value: value
    }, { onConflict: 'user_id,data_key' });
    if (error) console.error(`Não foi possível salvar ${key}:`, error);
}

async function removerDadoDoApp(key) {
    const client = getSupabaseClient();
    const userId = appDataUserId || await getCurrentUserId();
    if (!client || !userId) return;
    const { error } = await client.from('user_app_data').delete()
        .eq('user_id', userId).eq('data_key', key);
    if (error) console.error(`Não foi possível remover ${key}:`, error);
}
