/** Login, signup, and profile initialization. */

let authInitialized = false;

function setAuthStatus(message, isError = false) {
    const status = document.getElementById('auth-status');
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? '#b91c1c' : '#475569';
}

async function ensureProfile(user) {
    if (!user || !isSupabaseConfigured()) return;

    const client = getSupabaseClient();
    const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error(error);
        return;
    }

    if (!data) {
        const { error: insertError } = await client.from('profiles').insert([
            {
                user_id: user.id,
                nome: user.email?.split('@')[0] || 'User',
                avatar_url: null
            }
        ]);

        if (insertError) {
            console.error(insertError);
        }
    }
}

async function signUpWithEmail() {
    const email = document.getElementById('email-input')?.value?.trim();
    const password = document.getElementById('password-input')?.value?.trim();

    if (!email || !password) {
        setAuthStatus('Please enter email and password.', true);
        return;
    }

    if (!isSupabaseConfigured()) {
        setAuthStatus('Configure Supabase to enable multi-user login.', true);
        return;
    }

    const client = getSupabaseClient();
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) {
        setAuthStatus(error.message, true);
        return;
    }

    if (data?.user) await ensureProfile(data.user);

    setAuthStatus('Account created. Check your email to confirm your registration, then sign in.');
}

async function signInWithEmail() {
    const email = document.getElementById('email-input')?.value?.trim();
    const password = document.getElementById('password-input')?.value?.trim();

    if (!email || !password) {
        setAuthStatus('Please enter email and password.', true);
        return;
    }

    if (!isSupabaseConfigured()) {
        setAuthStatus('Configure Supabase to enable multi-user login.', true);
        return;
    }

    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
        setAuthStatus(error.message, true);
        return;
    }

    if (data?.user) {
        await ensureProfile(data.user);
        await loadProfileFromSupabase();
        setAuthStatus(`Connected as ${data.user.email}`);
        updateAuthUI();
        setTimeout(() => {
            isRedirecting = true;
            window.location.href = 'dashboard.html';
        }, 1500);
        return;
    }

    setAuthStatus('Could not sign in.', true);
}

async function signOut() {
    const client = getSupabaseClient();

    if (isSupabaseConfigured() && client?.auth) {
        await client.auth.signOut();
    }

    appDataCache.clear();
    appDataUserId = null;
    updateAuthUI();

    setTimeout(() => {
        isRedirecting = true;
        window.location.href = 'index.html';
    }, 300);
}

async function updateAuthUI() {
    const logoutBtn = document.getElementById('auth-logout');
    const submitBtn = document.getElementById('auth-submit');
    const signupBtn = document.getElementById('auth-signup');

    if (!logoutBtn || !submitBtn || !signupBtn) return;

    const loggedIn = isSupabaseConfigured() && !!(await getCurrentUserId());
    logoutBtn.classList.toggle('hidden', !loggedIn);
    signupBtn.classList.toggle('hidden', loggedIn);
    submitBtn.textContent = 'Enter';
}

function initAuth() {
    // Evita executar mais de uma vez
    if (authInitialized) return;
    authInitialized = true;

    // Redirecionamento desabilitado temporariamente
    const form = document.getElementById('auth-form');
    const signUpBtn = document.getElementById('auth-signup');
    const logoutBtn = document.getElementById('auth-logout');

    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            signInWithEmail();
        });
    }

    if (signUpBtn) {
        signUpBtn.addEventListener('click', signUpWithEmail);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', signOut);
    }

    updateAuthUI();

    if (!isSupabaseConfigured()) {
        setAuthStatus('Configure Supabase to enable multi-user login.');
    }
}

window.signUpWithEmail = signUpWithEmail;
window.signInWithEmail = signInWithEmail;
window.signOut = signOut;
