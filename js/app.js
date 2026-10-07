/** Main dashboard behavior and application startup. */

let blocoAtual = '';
let isRedirecting = false;
let sessaoFlashcards = null;

function hideDevBanner() {
    const banner = document.querySelector('.dev-banner');
    if (banner) {
        banner.classList.add('hidden');
    }
}

function showDevBanner() {
    const banner = document.querySelector('.dev-banner');
    if (banner) {
        banner.classList.remove('hidden');
    }
}

function abrirAnotacao(nomeBloco) {
    blocoAtual = nomeBloco;
    hideDevBanner();
    document.getElementById('modal-titulo').innerText = nomeBloco;

    const areaConteudo = document.getElementById('modal-conteudo');
    areaConteudo.innerHTML = '';

    if (nomeBloco === 'Flashcards') {
        renderizarTabelaFlashcards(areaConteudo);
    } else if (nomeBloco === 'Speaking Notes') {
        renderizarGoogleMeet(areaConteudo);
    } else if (nomeBloco === 'Other Resources') {
        renderizarOtherResources(areaConteudo);
    } else if (nomeBloco === 'Writing Journal') {
        renderizarWritingJournal(areaConteudo);
    } else if (nomeBloco === 'My Coursebook') {
        renderizarCoursebook(areaConteudo);
    } else if (nomeBloco === 'Pomodoro') {
        renderizarPomodoro(areaConteudo);
    } else {
        renderizarBlocoDeTexto(areaConteudo, nomeBloco);
    }

    document.getElementById('modal').style.display = 'flex';
}

function fecharModal() {
    if (blocoAtual === 'Google Meet') {
        const obsTexto = document.getElementById('obs-meet');
        if (obsTexto) {
            appStorage.setItem('obs_Google Meet', obsTexto.value);
        }
    } else if (blocoAtual !== 'Flashcards' && blocoAtual !== 'Other Resources' && blocoAtual !== 'Google Meet' && blocoAtual !== 'Writing Journal' && blocoAtual !== 'My Coursebook') {
        const campoTexto = document.getElementById('modal-texto');
        if (campoTexto) {
            appStorage.setItem('notas_' + blocoAtual, campoTexto.value);
        }
    }

    document.getElementById('modal').style.display = 'none';
    showDevBanner();
}

function renderizarBlocoDeTexto(container, nomeBloco) {
    const textoSalvo = appStorage.getItem('notas_' + nomeBloco) || '';
    container.innerHTML = `<textarea id="modal-texto" placeholder="Write your notes here...">${textoSalvo}</textarea>`;
}

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
        window.location.href = 'index.html';
        return true;
    }

    if (isLoginPage && isLoggedIn) {
        isRedirecting = true;
        window.location.href = 'dashboard.html';
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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
} else {
    initializeApp();
}
