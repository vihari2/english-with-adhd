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
    const pageName = window.location.pathname.split('/').pop();
    document.querySelector('.guide-open-button')?.remove();
    if (window.showPageGuide && ['coursebook.html', 'speaking.html', 'writing-journal.html'].includes(pageName)) {
        const title = document.getElementById('page-title');
        let headingRow = title.closest('.resource-heading-row');
        if (!headingRow) {
            headingRow = document.createElement('div');
            headingRow.className = 'resource-heading-row';
            title.before(headingRow);
            headingRow.appendChild(title);
        }
        const guideButton = document.createElement('button');
        guideButton.type = 'button';
        guideButton.className = 'guide-open-button';
        guideButton.textContent = 'More information';
        guideButton.addEventListener('click', () => window.showPageGuide(pageName));
        headingRow.appendChild(guideButton);
    }
    page.render(content);
}

// Render immediately so the page is never left as an empty white panel while
// authentication or remote data finishes loading. App startup renders again
// after its saved data has been loaded.
renderizarPaginaRecurso();
document.addEventListener('app:ready', renderizarPaginaRecurso);
