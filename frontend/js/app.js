/** Main dashboard behavior and application startup. */

let isRedirecting = false;
let sessaoFlashcards = null;

// --- Lógica para salvar a foto do avatar ---

async function redirectIfNeeded() {
    if (isRedirecting) return true;

    const pathname = window.location.pathname;
    const isLoginPage = pathname.endsWith('/') || pathname.endsWith('/index.html');
    let isLoggedIn = false;

    try {
        isLoggedIn = !!(await getCurrentUserId());
    } catch (error) {
        console.error('Could not verify the current session:', error);
    }

    if (!isLoginPage && !isLoggedIn) {
        isRedirecting = true;
        window.location.href = '../index.html';
        return true;
    }

    if (isLoginPage && isLoggedIn) {
        isRedirecting = true;
        window.location.href = 'frontend/dashboard.html';
        return true;
    }

    return false;
}

async function initializeApp() {
    initAuth();
    if (await redirectIfNeeded()) return;

    await inicializarDadosDoApp();
    aplicarTemaSalvo();
    loadProfileData();
    if (typeof renderizarPaginaRecurso === 'function') {
        renderizarPaginaRecurso();
    }
    document.dispatchEvent(new Event('app:ready'));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
} else {
    initializeApp();
}
