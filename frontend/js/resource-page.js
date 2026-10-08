const resourcePages = {
    'flashcards.html': { title: 'Flashcards', render: renderizarTabelaFlashcards },
    'speaking.html': { title: 'Speaking Notes', render: renderizarGoogleMeet },
    'writing-journal.html': { title: 'Writing Journal', render: renderizarWritingJournal },
    'coursebook.html': { title: 'My Coursebook', render: renderizarCoursebook },
    'resources.html': { title: 'Other Resources', render: renderizarOtherResources },
    'pomodoro.html': { title: 'Pomodoro', render: renderizarPomodoro },
    'profile.html': { title: 'Profile', render: renderizarPerfil }
};

function renderizarPaginaRecurso() {
    const page = resourcePages[window.location.pathname.split('/').pop()];
    const content = document.getElementById('page-content');
    if (!page || !content) return;

    document.title = `${page.title} - English with ADHD`;
    document.getElementById('page-title').textContent = page.title;
    page.render(content);
}

// Render immediately so the page is never left as an empty white panel while
// authentication or remote data finishes loading. App startup renders again
// after its saved data has been loaded.
renderizarPaginaRecurso();
document.addEventListener('app:ready', renderizarPaginaRecurso);
