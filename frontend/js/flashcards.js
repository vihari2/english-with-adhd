// -- Flashcards --
function obterFlashcards() {
    try {
        return JSON.parse(appStorage.getItem('meusFlashcards')) || [];
    } catch (error) {
        return [];
    }
}

async function carregarFlashcardsDoSupabase() {
    const supabase = getSupabaseClient();

    if (!supabase) {
        console.error('Supabase não configurado.');
        return [];
    }

    const userId = await getCurrentUserId();

    if (!userId) {
        console.error('Nenhum usuário autenticado.');
        return [];
    }

    const { data, error } = await supabase
        .from('flashcards')
        .select(`
            id,
            user_id,
            baralho_id,
            frente,
            verso,
            status,
            baralhos (
                nome
            )
        `)
        .eq('user_id', userId);

    if (error) {
        console.error('Erro ao carregar flashcards:', error);
        return [];
    }

    return data.map(card => ({
        id: card.id,
        user_id: card.user_id,
        baralho_id: card.baralho_id,
        deck: card.baralhos?.nome || 'Default',
        front: card.frente,
        back: card.verso,
        category: card.baralhos?.nome || 'Default',
        word: card.frente,
        meaning: card.verso,
        status: card.status
    }));
}

async function carregarBaralhosDoSupabase() {
    const supabase = getSupabaseClient();
    const userId = await getCurrentUserId();

    if (!supabase || !userId) {
        return [];
    }

    const { data, error } = await supabase
        .from('baralhos')
        .select('id, nome')
        .eq('user_id', userId)
        .order('nome');

    if (error) {
        console.error('Erro ao carregar baralhos:', error);
        return [];
    }

    return data;
}

function escaparHtml(valor) {
    const elemento = document.createElement('div');
    elemento.textContent = valor || '';
    return elemento.innerHTML;
}

function obterBaralhoDoCard(card) {
    // "category" é usado como baralho para manter os cards criados na versão anterior.
    const baralho = card.deck || card.category || 'Default';
    return baralho === 'Padrão' ? 'Default' : baralho;
}

function obterFrenteDoCard(card) {
    return card.front || card.word || '';
}

function obterVersoDoCard(card) {
    return card.back || card.meaning || '';
}

function obterBaralhos() {
    const nomesDosCards = obterFlashcards().map(obterBaralhoDoCard);
    let baralhosSalvos = [];
    try {
        baralhosSalvos = JSON.parse(appStorage.getItem('meusBaralhos')) || [];
    } catch (error) {
        baralhosSalvos = [];
    }
    const baralhosEmIngles = baralhosSalvos.map((baralho) => baralho === 'Padrão' ? 'Default' : baralho);
    return [...new Set(['Default', ...baralhosEmIngles, ...nomesDosCards])];
}

function renderizarTabelaFlashcards(container) {
    container.innerHTML = `
        <div class="flashcards-header">
            <div class="flashcards-tabs" role="tablist" aria-label="Flashcard navigation">
                <button id="aba-baralhos" class="flashcards-tab ativo" type="button" onclick="mostrarBaralhos()">Decks</button>
                <button id="aba-adicionar" class="flashcards-tab" type="button" onclick="mostrarFormularioFlashcard()">Add</button>
            </div>
        </div>
        <div id="flashcards-area"></div>
    `;
    mostrarBaralhos();
}

function atualizarAbaFlashcards(abaAtiva) {
    document.querySelectorAll('.flashcards-tab').forEach((botao) => {
        const ativa = botao.id === `aba-${abaAtiva}`;
        botao.classList.toggle('ativo', ativa);
        botao.setAttribute('aria-selected', ativa);
    });
}

async function mostrarBaralhos() {
    const area = document.getElementById('flashcards-area');

    if (!area) return;

    atualizarAbaFlashcards('baralhos');

    // Busca os dados do Supabase
    const baralhos = await carregarBaralhosDoSupabase();
    const cards = await carregarFlashcardsDoSupabase();

    // Atualiza o cache local utilizado pelas outras funções
    appStorage.setItem(
        'meusBaralhos',
        JSON.stringify(baralhos.map(baralho => baralho.nome))
    );

    appStorage.setItem(
        'meusFlashcards',
        JSON.stringify(cards)
    );

    // Renderiza a tela
    area.innerHTML = `
        <div class="baralhos-acoes">
            <button
                class="btn-criar-baralho"
                id="btn-criar-baralho"
                type="button">
                Criar baralho
            </button>
        </div>

        <form id="form-criar-baralho">
            <label for="nome-novo-baralho">
                Nome do baralho
            </label>

            <input
                type="text"
                id="nome-novo-baralho"
                placeholder="Ex.: Inglês"
                required
            >

            <button type="submit">
                Create
            </button>

            <p id="aviso-novo-baralho"></p>
        </form>

        <section class="lista-baralhos">
            ${baralhos.length === 0
            ? '<p>Você ainda não possui baralhos. Crie um para começar!</p>'
            : baralhos.map(baralho => {
                const quantidade = cards.filter(
                    card => obterBaralhoDoCard(card) === baralho.nome
                ).length;

                return `
                            <button
                                class="baralho-item"
                                data-baralho="${escaparHtml(baralho.nome)}"
                                type="button">

                                <span>
                                    ${escaparHtml(baralho.nome)}
                                </span>

                                <span>
                                    ${quantidade} flashcards
                                </span>

                            </button>
                        `;
            }).join('')
        }
        </section>
    `;

    // Evento do formulário para criar baralhos
    document
        .getElementById('form-criar-baralho')
        .addEventListener('submit', criarBaralho);

    // Eventos para abrir cada baralho
    document.querySelectorAll('.baralho-item').forEach(botao => {
        botao.addEventListener('click', () => {
            abrirBaralho(botao.dataset.baralho);
        });
    });
}

function exibirCriacaoBaralho() {
    const formulario = document.getElementById('form-criar-baralho');
    formulario.classList.remove('oculto');
    document.getElementById('nome-novo-baralho').focus();
}

async function criarBaralho(evento) {
    evento.preventDefault();

    const campoNome = document.getElementById('nome-novo-baralho');
    const nome = campoNome.value.trim();
    const aviso = document.getElementById('aviso-novo-baralho');

    if (!nome) return;

    const supabase = getSupabaseClient();
    const userId = await getCurrentUserId();

    if (!supabase || !userId) {
        aviso.textContent = 'Please log in again';
        return;
    }

    const { data: existente, error: erroBusca } = await supabase
        .from('baralhos')
        .select('id')
        .eq('user_id', userId)
        .ilike('nome', nome);

    if (erroBusca) {
        console.error(erroBusca);
        aviso.textContent = 'Error checking deck';
        return;
    }

    if (existente.length > 0) {
        aviso.textContent = 'This deck already exists';
        return;
    }

    const { data, error } = await supabase
        .from('baralhos')
        .insert({
            user_id: userId,
            nome: nome
        })
        .select()
        .single();

    if (error) {
        console.error(error);
        aviso.textContent = 'Error creating deck';
        return;
    }

    let baralhosSalvos = [];

    try {
        baralhosSalvos =
            JSON.parse(appStorage.getItem('meusBaralhos')) || [];
    } catch (error) {
        baralhosSalvos = [];
    }

    baralhosSalvos.push(nome);

    appStorage.setItem(
        'meusBaralhos',
        JSON.stringify(baralhosSalvos)
    );

    campoNome.value = '';
    aviso.textContent = 'Deck created';

    mostrarBaralhos();
}

function obterEstadoDoCard(card) {
    return ['new', 'learning', 'review'].includes(card.status)
        ? card.status
        : 'new';
}

function obterContagensDoBaralho(baralho) {
    return obterFlashcards()
        .filter(card => obterBaralhoDoCard(card) === baralho)
        .reduce((contagens, card) => {
            contagens[obterEstadoDoCard(card)] += 1;

            return contagens;
        }, {
            new: 0,
            learning: 0,
            review: 0
        });
}

function abrirBaralho(baralho) {
    const area = document.getElementById('flashcards-area');
    if (!area) return;
    atualizarAbaFlashcards('baralhos');
    const contagens = obterContagensDoBaralho(baralho);
    const total = contagens.new + contagens.learning + contagens.review;

    area.innerHTML = `
        <section class="visao-baralho">
            <button class="btn-voltar-baralhos" type="button" onclick="mostrarBaralhos()">← Decks</button>
            <h3>${escaparHtml(baralho)}</h3>
            <div class="contagens-estudo" aria-label="Cards para estudar">
                <div class="contador novo"><strong>${contagens.new}</strong><span>New</span></div>
                <div class="contador aprendizagem"><strong>${contagens.learning}</strong><span>Learning</span></div>
                <div class="contador revisar"><strong>${contagens.review}</strong><span>To Review</span></div>
            </div>
            <button id="btn-estudar-agora" class="btn-estudar-agora" type="button" ${total === 0 ? 'disabled' : ''}>
                Study now
            </button>

            <button id="btn-excluir-baralho" class="btn-excluir-baralho" type="button">
                Excluir baralho
            </button>

${total === 0 ? '<p class="estudo-vazio">Add cards to this deck to start studying.</p>' : ''}
        </section>
    `;
    document.getElementById('btn-estudar-agora').addEventListener('click', () => iniciarEstudo(baralho));
    document.getElementById('btn-excluir-baralho').addEventListener('click', () => excluirBaralho(baralho));
}

function iniciarEstudo(baralho) {
    const indices = obterFlashcards()
        .map((card, indice) => ({ card, indice }))
        .filter(({ card }) => obterBaralhoDoCard(card) === baralho && obterFrenteDoCard(card) && obterVersoDoCard(card))
        .map(({ indice }) => indice);

    sessaoFlashcards = { baralho, indices, posicao: 0, respostaVisivel: false };
    renderizarEstudoAtivo();
}

function renderizarEstudoAtivo() {
    const area = document.getElementById('flashcards-area');
    if (!area || !sessaoFlashcards) return;
    const { baralho, indices, posicao, respostaVisivel } = sessaoFlashcards;

    if (posicao >= indices.length) {
        const contagens = obterContagensDoBaralho(baralho);
        area.innerHTML = `
            <section class="fim-estudo">
                <h3>Session complete</h3>
                <p>You reviewed ${indices.length} ${indices.length === 1 ? 'card' : 'cards'} from ${escaparHtml(baralho)}.</p>
                <div class="contadores-compactos"><span class="novo">${contagens.new}</span> + <span class="aprendizagem">${contagens.learning}</span> + <span class="revisar">${contagens.review}</span></div>
                <button id="btn-voltar-ao-baralho" class="btn-estudar-agora" type="button">Back to deck</button>
            </section>
        `;
        document.getElementById('btn-voltar-ao-baralho').addEventListener('click', () => abrirBaralho(baralho));
        sessaoFlashcards = null;
        return;
    }

    const cards = obterFlashcards();
    const card = cards[indices[posicao]];
    const contagens = obterContagensDoBaralho(baralho);
    area.innerHTML = `
        <section class="tela-estudo" aria-label="Revisão de flashcard">
            <div class="estudo-topo"><span>${escaparHtml(baralho)}</span><span>${posicao + 1} / ${indices.length}</span></div>
            <div class="card-estudo">
                <p class="card-frente">${escaparHtml(obterFrenteDoCard(card))}</p>
                ${respostaVisivel ? `<div class="card-verso"><span>Back</span><p>${escaparHtml(obterVersoDoCard(card))}</p></div>` : ''}
            </div>
            <div class="contadores-compactos" aria-label="New, learning and to review"><span class="novo">${contagens.new}</span> + <span class="aprendizagem">${contagens.learning}</span> + <span class="revisar">${contagens.review}</span></div>
            ${respostaVisivel
            ? `<div class="avaliacao-card"><button type="button" class="btn-avaliacao novamente" onclick="avaliarCard('learning')">Again</button><button type="button" class="btn-avaliacao bom" onclick="avaliarCard('review')">Good</button></div>`
            : `<div class="acoes-estudo"><button type="button" class="btn-skip" onclick="pularCard()">Skip</button><button type="button" class="btn-mostrar-resposta" onclick="mostrarResposta()">Show Answer</button></div>`}
        </section>
    `;
}

function mostrarResposta() {
    if (!sessaoFlashcards) return;
    sessaoFlashcards.respostaVisivel = true;
    renderizarEstudoAtivo();
}

function pularCard() {
    if (!sessaoFlashcards) return;
    sessaoFlashcards.posicao += 1;
    sessaoFlashcards.respostaVisivel = false;
    renderizarEstudoAtivo();
}

async function avaliarCard(status) {

    if (!sessaoFlashcards) return;

    const indice = sessaoFlashcards.indices[sessaoFlashcards.posicao];

    const cards = obterFlashcards();

    const card = cards[indice];

    if (!card || !card.id) {
        console.error('Flashcard não encontrado ou sem ID.');
        return;
    }

    const supabase = getSupabaseClient();
    const userId = await getCurrentUserId();

    if (!supabase || !userId) {
        console.error('Usuário não autenticado.');
        return;
    }

    // Atualiza o status no Supabase
    const { error } = await supabase
        .from('flashcards')
        .update({ status: status })
        .eq('id', card.id)
        .eq('user_id', userId);

    if (error) {
        console.error('Erro ao atualizar flashcard:', error);
        alert('Não foi possível salvar a avaliação. Tente novamente.');
        return;
    }

    // Atualiza o cache local
    cards[indice].status = status;

    appStorage.setItem(
        'meusFlashcards',
        JSON.stringify(cards)
    );

    // Avança para o próximo card
    pularCard();
}

function mostrarFormularioFlashcard() {
    const area = document.getElementById('flashcards-area');
    if (!area) return;
    atualizarAbaFlashcards('adicionar');

    const opcoesBaralho = obterBaralhos()
        .map((baralho) => `<option value="${escaparHtml(baralho)}">${escaparHtml(baralho)}</option>`)
        .join('');
    area.innerHTML = `
        <form id="form-adicionar-flashcard" class="form-flashcard">
            <label for="flashcard-baralho">Deck</label>
            <select id="flashcard-baralho" required>${opcoesBaralho}</select>

            <label for="flashcard-frente">Front</label>
            <textarea id="flashcard-frente" rows="4" placeholder="Write the question or word" required></textarea>

            <label for="flashcard-verso">Back</label>
            <textarea id="flashcard-verso" rows="4" placeholder="Write the answer or meaning" required></textarea>

            <p id="flashcard-aviso" class="flashcard-aviso" role="status" aria-live="polite"></p>
            <div class="flashcard-acoes">
                <button class="btn-salvar-flashcard" type="submit">Add</button>
                <button class="btn-cancelar-flashcard" type="button" onclick="mostrarBaralhos()">Cancel</button>
            </div>
        </form>
    `;

    document.getElementById('form-adicionar-flashcard').addEventListener('submit', adicionarFlashcard);
    document.getElementById('flashcard-frente').focus();
}

async function adicionarFlashcard(evento) {
    evento.preventDefault();

    const baralho = document.getElementById('flashcard-baralho').value.trim();
    const frente = document.getElementById('flashcard-frente').value.trim();
    const verso = document.getElementById('flashcard-verso').value.trim();
    const aviso = document.getElementById('flashcard-aviso');

    if (!baralho || !frente || !verso) return;

    const supabase = getSupabaseClient();
    const userId = await getCurrentUserId();

    if (!supabase || !userId) {
        aviso.textContent = 'Please log in again';
        return;
    }

    // Buscar o ID do baralho selecionado
    const { data: dadosBaralho, error: erroBaralho } = await supabase
        .from('baralhos')
        .select('id')
        .eq('user_id', userId)
        .eq('nome', baralho)
        .single();

    if (erroBaralho || !dadosBaralho) {
        console.error(erroBaralho);
        aviso.textContent = 'Deck not found';
        return;
    }

    // Salvar o flashcard no Supabase
    const { data, error } = await supabase
        .from('flashcards')
        .insert({
            user_id: userId,
            baralho_id: dadosBaralho.id,
            frente: frente,
            verso: verso,
            status: 'new'
        })
        .select()
        .single();

    if (error) {
        console.error(error);
        aviso.textContent = 'Error adding card';
        return;
    }

    // Cache temporário para manter compatibilidade com a interface atual
    const flashcards = obterFlashcards();

    flashcards.push({
        id: data.id,
        user_id: userId,
        baralho_id: dadosBaralho.id,
        deck: baralho,
        front: frente,
        back: verso,
        category: baralho,
        word: frente,
        meaning: verso,
        status: 'new'
    });

    appStorage.setItem(
        'meusFlashcards',
        JSON.stringify(flashcards)
    );

    document.getElementById('flashcard-frente').value = '';
    document.getElementById('flashcard-verso').value = '';

    aviso.textContent = 'Card added';

    document.getElementById('flashcard-frente').focus();
}

async function excluirBaralho(baralho) {
    const confirmar = confirm(
        `Tem certeza de que deseja excluir o baralho "${baralho}" e todos os seus flashcards?`
    );

    if (!confirmar) return;

    const supabase = getSupabaseClient();
    const userId = await getCurrentUserId();

    if (!supabase || !userId) {
        alert('Você precisa estar autenticada para excluir um baralho.');
        return;
    }

    // Buscar o baralho do usuário
    const { data: baralhoEncontrado, error: erroBusca } = await supabase
        .from('baralhos')
        .select('id')
        .eq('nome', baralho)
        .eq('user_id', userId)
        .single();

    if (erroBusca || !baralhoEncontrado) {
        console.error('Erro ao encontrar baralho:', erroBusca);
        alert('Não foi possível encontrar o baralho.');
        return;
    }

    // Excluir os flashcards associados
    const { error: erroFlashcards } = await supabase
        .from('flashcards')
        .delete()
        .eq('baralho_id', baralhoEncontrado.id)
        .eq('user_id', userId);

    if (erroFlashcards) {
        console.error('Erro ao excluir flashcards:', erroFlashcards);
        alert('Não foi possível excluir os flashcards do baralho.');
        return;
    }

    // Excluir o baralho
    const { error: erroBaralho } = await supabase
        .from('baralhos')
        .delete()
        .eq('id', baralhoEncontrado.id)
        .eq('user_id', userId);

    if (erroBaralho) {
        console.error('Erro ao excluir baralho:', erroBaralho);
        alert('Não foi possível excluir o baralho.');
        return;
    }

    // Atualizar o cache local
    const baralhos = obterBaralhos().filter(
        item => item.nome !== baralho
    );

    appStorage.setItem('meusBaralhos', JSON.stringify(baralhos));

    const flashcards = obterFlashcards().filter(
        card => card.baralho_id !== baralhoEncontrado.id
    );

    appStorage.setItem('meusFlashcards', JSON.stringify(flashcards));

    alert('Baralho excluído com sucesso!');

    mostrarBaralhos();
}
