/** Coursebook progress helpers. */

// -- My Coursebook --

function renderizarCoursebook(container) {
    container.innerHTML = `
        <div class="coursebook-page">
            <div class="coursebook-header">
                <button
                    type="button"
                    class="coursebook-add-button"
                    onclick="adicionarLivroCoursebook()"
                >
                    <span aria-hidden="true">+</span>
                    Add book
                </button>
            </div>

            <div class="coursebook-card">
                <div class="coursebook-table-wrapper">
                    <table class="coursebook-table">
                        <thead>
                            <tr>
                                <th>Book name</th>
                                <th>Page / Chapter</th>
                                <th>Date</th>
                                <th aria-label="Actions"></th>
                            </tr>
                        </thead>

                        <tbody id="corpo-tabela-coursebook"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    carregarCoursebookSalvo();
}


function carregarCoursebookSalvo() {
    const corpoTabela = document.getElementById('corpo-tabela-coursebook');
    if (!corpoTabela) return;
    let livros = JSON.parse(appStorage.getItem('meuCoursebook')) || [];

    corpoTabela.innerHTML = '';
    livros.forEach((item, index) => {
        corpoTabela.innerHTML += `
            <tr>
                <td><input type="text" class="input-meet" value="${item.nome}" onchange="salvarEdicaoCoursebook(${index}, 'nome', this.value)" placeholder="Ex: English Grammar in Use"></td>
                <td><input type="text" class="input-meet" value="${item.parada}" onchange="salvarEdicaoCoursebook(${index}, 'parada', this.value)" placeholder="Ex: Cap. 4 / Pág. 45"></td>
                <td><input type="date" class="input-meet" value="${item.data}" onchange="salvarEdicaoCoursebook(${index}, 'data', this.value)"></td>
                <td><button class="btn-remover" onclick="removerCoursebook(${index})">X</button></td>
            </tr>
        `;
    });
}


function carregarCoursebookSalvo() {
    const corpoTabela = document.getElementById('corpo-tabela-coursebook');
    if (!corpoTabela) return;

    const livros = JSON.parse(appStorage.getItem('meuCoursebook')) || [];

    const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);

    if (livros.length === 0) {
        corpoTabela.innerHTML = `
            <tr>
                <td colspan="4" class="coursebook-empty">
                    <span aria-hidden="true">📚</span>
                    <strong>Your reading list is empty</strong>
                    <p>Add a book to start tracking your progress.</p>
                </td>
            </tr>
        `;
        return;
    }

    corpoTabela.innerHTML = livros.map((item, index) => `
        <tr>
            <td>
                <input
                    type="text"
                    class="coursebook-input"
                    value="${escapeHTML(item.nome)}"
                    onchange="salvarEdicaoCoursebook(${index}, 'nome', this.value)"
                    placeholder="Book title"
                    aria-label="Book name"
                >
            </td>

            <td>
                <input
                    type="text"
                    class="coursebook-input"
                    value="${escapeHTML(item.parada)}"
                    onchange="salvarEdicaoCoursebook(${index}, 'parada', this.value)"
                    placeholder="Chapter or page"
                    aria-label="Page or chapter"
                >
            </td>

            <td>
                <input
                    type="date"
                    class="coursebook-input coursebook-date"
                    value="${escapeHTML(item.data)}"
                    onchange="salvarEdicaoCoursebook(${index}, 'data', this.value)"
                    aria-label="Reading date"
                >
            </td>

            <td class="coursebook-action-cell">
                <button
                    type="button"
                    class="coursebook-delete-button"
                    onclick="removerCoursebook(${index})"
                    aria-label="Delete book"
                    title="Delete book"
                >
                    &times;
                </button>
            </td>
        </tr>
    `).join('');
}


function adicionarLivroCoursebook() {
    const livros = JSON.parse(appStorage.getItem('meuCoursebook')) || [];
    livros.push({ nome: '', parada: '', data: new Date().toISOString().slice(0, 10) });
    appStorage.setItem('meuCoursebook', JSON.stringify(livros));
    carregarCoursebookSalvo();
    document.querySelector('#corpo-tabela-coursebook tr:last-child input[aria-label="Book name"]')?.focus();
}

async function avancarParaFlashcards() {
    if (window.Home?.completeCoursebook) {
        await window.Home.completeCoursebook();
        return;
    }

    try {
        const client = getSupabaseClient();
        const userId = await getCurrentUserId();
        if (!client || !userId) return;

        const { error } = await client
            .from('learning_progress')
            .upsert({
                user_id: userId,
                current_step: 'flashcards',
                practice_choice: null,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) throw error;
    } catch (error) {
        console.error('Could not advance the learning path to flashcards:', error);
    }
}

function salvarEdicaoCoursebook(index, campo, novoValor) {
    let livros = JSON.parse(appStorage.getItem('meuCoursebook')) || [];
    livros[index][campo] = novoValor;
    appStorage.setItem('meuCoursebook', JSON.stringify(livros));
}

function removerCoursebook(index) {
    let livros = JSON.parse(appStorage.getItem('meuCoursebook')) || [];
    livros.splice(index, 1);
    appStorage.setItem('meuCoursebook', JSON.stringify(livros));
    carregarCoursebookSalvo();
}
