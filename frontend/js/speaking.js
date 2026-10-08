
/* =========================================
   SPEAKING PRACTICE
   Google Meet, Practice Journal & Shadowing
   ========================================= */

const MEET_SESSIONS_KEY = 'meuMeet';
const MEET_NOTES_KEY = 'diarioNotasMeet';
const MEET_URL_KEY = 'googleMeetUrl';

/* ---------- Storage helpers ---------- */

function getSpeakingData(key) {
    try {
        const value = appStorage.getItem(key);
        return value ? JSON.parse(value) : [];
    } catch (error) {
        console.error(`Error loading ${key}:`, error);
        return [];
    }
}

function saveSpeakingData(key, data) {
    appStorage.setItem(key, JSON.stringify(data));
}

function escapeSpeakingHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function getLocalSpeakingDate() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset)
        .toISOString()
        .slice(0, 10);
}

function formatSpeakingDate(date) {
    if (!date) return 'No date selected';

    const parts = date.split('-');
    if (parts.length !== 3) return date;

    return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

/* ---------- Main page ---------- */

function renderizarGoogleMeet(container) {
    if (!container) return;

    container.innerHTML = `
        <div class="speaking-page">

            <header class="speaking-header">
            </header>

            <section class="speaking-section meet-section">
                <div class="speaking-section-heading">
                    <div class="speaking-icon" aria-hidden="true">↗</div>
                    <div>
                        <h3>Google Meet</h3>
                        <p>Your meeting link, always within reach.</p>
                    </div>
                </div>

                <form id="meet-link-form" class="meet-link-form">
                    <label for="meet-link-input">Meeting link</label>

                    <div class="meet-link-row">
                        <input
                            id="meet-link-input"
                            type="url"
                            placeholder="https://meet.google.com/..."
                            autocomplete="url"
                        >

                        <button type="submit" class="speaking-button">
                            Save link
                        </button>
                    </div>

                    <div class="meet-link-actions">
                        <button
                            type="button"
                            id="open-meet-button"
                            class="speaking-button speaking-button-secondary"
                        >
                            Open Google Meet ↗
                        </button>

                        <span id="meet-link-message" class="speaking-message"
                              aria-live="polite"></span>
                    </div>
                </form>
            </section>

            <section class="speaking-section">
                <div class="speaking-section-heading">
                    <div class="speaking-icon" aria-hidden="true">▤</div>
                    <div>
                        <h3>Meet Sessions</h3>
                        <p>Keep track of your conversations.</p>
                    </div>

                    <button
                        type="button"
                        id="add-meet-session"
                        class="speaking-button speaking-button-primary"
                    >
                        + New session
                    </button>
                </div>

                <div id="meet-sessions-list" class="meet-sessions-list"></div>
            </section>

            <section class="speaking-section">
                <div class="speaking-section-heading">
                    <div class="speaking-icon" aria-hidden="true">✎</div>
                    <div>
                        <h3>Practice Journal</h3>
                        <p>Reflect on what you learned after each conversation.</p>
                    </div>

                    <button
                        type="button"
                        id="add-speaking-note"
                        class="speaking-button speaking-button-primary"
                    >
                        + New entry
                    </button>
                </div>

                <div id="speaking-notes-list" class="speaking-notes-list"></div>
            </section>

            <section class="speaking-section shadowing-section">
                <div class="speaking-section-heading">
                    <div class="speaking-icon" aria-hidden="true">♫</div>
                    <div>
                        <h3>Shadowing Practice</h3>
                        <p>Listen, repeat, and work on your pronunciation.</p>
                    </div>
                    <button
                        type="button"
                        id="add-shadowing-record"
                        class="speaking-button speaking-button-primary"
                    >
                        + New practice
                    </button>
                </div>

                <div id="shadowing-summary" class="shadowing-summary"></div>
                <div id="shadowing-list" class="shadowing-list"></div>
            </section>

        </div>
    `;

    configurarMeetLink();
    configurarBotoesSpeaking();
    carregarMeetSalvos();
    carregarNotasMeetSalvas();
    configurarBotoesShadowing();
    renderizarShadowing();
}

/* ---------- Google Meet link ---------- */

function configurarMeetLink() {
    const input = document.getElementById('meet-link-input');
    const form = document.getElementById('meet-link-form');
    const openButton = document.getElementById('open-meet-button');
    const message = document.getElementById('meet-link-message');

    if (!input || !form || !openButton) return;

    input.value = appStorage.getItem(MEET_URL_KEY) || '';

    form.addEventListener('submit', event => {
        event.preventDefault();

        const url = input.value.trim();

        if (url && !isValidMeetURL(url)) {
            message.textContent = 'Please enter a valid Google Meet link.';
            return;
        }

        appStorage.setItem(MEET_URL_KEY, url);
        message.textContent = url ? 'Meeting link saved.' : 'Meeting link removed.';
    });

    openButton.addEventListener('click', () => {
        const url = input.value.trim();

        if (!isValidMeetURL(url)) {
            message.textContent = 'Save a valid Google Meet link first.';
            input.focus();
            return;
        }

        window.open(url, '_blank', 'noopener,noreferrer');
    });
}

function isValidMeetURL(value) {
    try {
        const url = new URL(value);

        return url.protocol === 'https:' &&
            (url.hostname === 'meet.google.com' ||
                url.hostname.endsWith('.meet.google.com'));
    } catch {
        return false;
    }
}

/* ---------- Buttons ---------- */

function configurarBotoesSpeaking() {
    document.getElementById('add-meet-session')
        ?.addEventListener('click', adicionarLinhaMeet);

    document.getElementById('add-speaking-note')
        ?.addEventListener('click', adicionarNotaMeet);
}

/* ---------- Meet sessions ---------- */

function carregarMeetSalvos() {
    const container = document.getElementById('meet-sessions-list');
    if (!container) return;

    const sessoes = getSpeakingData(MEET_SESSIONS_KEY);

    if (!sessoes.length) {
        container.innerHTML = `
            <div class="speaking-empty-state">
                <div class="speaking-empty-icon">↗</div>
                <h4>No sessions yet</h4>
                <p>Create a session to keep track of your speaking practice.</p>
                <button
                    type="button"
                    class="speaking-button speaking-button-secondary"
                    onclick="adicionarLinhaMeet()"
                >
                    + Create your first session
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = sessoes.map((item, index) => `
        <article class="meet-session-card">
            <div class="meet-session-card-header">
                <div class="meet-session-title">
                    <input
                        type="text"
                        aria-label="Session name"
                        value="${escapeSpeakingHTML(item.name)}"
                        placeholder="Session name"
                        onchange="salvarEdicaoMeet(${index}, 'name', this.value)"
                    >

                    <span class="session-date">
                        ${escapeSpeakingHTML(formatSpeakingDate(item.date))}
                    </span>
                </div>

                <button
                    type="button"
                    class="speaking-delete-button"
                    aria-label="Delete session"
                    onclick="removerMeet(${index})"
                >Delete</button>
            </div>

            <div class="meet-session-fields">
                <label>
                    Date
                    <input
                        type="date"
                        value="${escapeSpeakingHTML(item.date)}"
                        onchange="salvarEdicaoMeet(${index}, 'date', this.value)"
                    >
                </label>

                <label>
                    Status
                    <select
                        onchange="salvarEdicaoMeet(${index}, 'status', this.value)"
                    >
                        <option value="Not started"
                            ${item.status === 'Not started' ? 'selected' : ''}>
                            Not started
                        </option>
                        <option value="In progress"
                            ${item.status === 'In progress' ? 'selected' : ''}>
                            In progress
                        </option>
                        <option value="Done"
                            ${item.status === 'Done' ? 'selected' : ''}>
                            Done
                        </option>
                    </select>
                </label>

                <label class="session-topic-field">
                    Topic
                    <input
                        type="text"
                        value="${escapeSpeakingHTML(item.topic)}"
                        placeholder="What will you talk about?"
                        onchange="salvarEdicaoMeet(${index}, 'topic', this.value)"
                    >
                </label>
            </div>

            <div class="meet-session-footer">
                <button
                    type="button"
                    class="speaking-button speaking-button-secondary"
                    onclick="abrirMeetSessao()"
                >
                    Open Meet ↗
                </button>

                <button
                    type="button"
                    class="speaking-button speaking-button-secondary"
                    onclick="criarNotaDaSessao(${index})"
                >
                    Add journal entry
                </button>
            </div>
        </article>
    `).join('');
}

function adicionarLinhaMeet() {
    const sessoes = getSpeakingData(MEET_SESSIONS_KEY);

    sessoes.push({
        name: `Speaking Session ${sessoes.length + 1}`,
        date: getLocalSpeakingDate(),
        status: 'Not started',
        topic: ''
    });

    saveSpeakingData(MEET_SESSIONS_KEY, sessoes);
    carregarMeetSalvos();
}

function salvarEdicaoMeet(index, campo, novoValor) {
    const sessoes = getSpeakingData(MEET_SESSIONS_KEY);

    if (!sessoes[index]) return;

    sessoes[index][campo] = novoValor;
    saveSpeakingData(MEET_SESSIONS_KEY, sessoes);

    if (campo === 'date') carregarMeetSalvos();
}

function removerMeet(index) {
    const sessoes = getSpeakingData(MEET_SESSIONS_KEY);

    if (!sessoes[index]) return;

    if (!confirm('Delete this session?')) return;

    sessoes.splice(index, 1);
    saveSpeakingData(MEET_SESSIONS_KEY, sessoes);
    carregarMeetSalvos();
}

function abrirMeetSessao() {
    const url = appStorage.getItem(MEET_URL_KEY) || '';

    if (!isValidMeetURL(url)) {
        alert('Please save your Google Meet link first.');
        document.getElementById('meet-link-input')?.focus();
        return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
}

/* ---------- Practice journal ---------- */

function carregarNotasMeetSalvas() {
    const container = document.getElementById('speaking-notes-list');
    if (!container) return;

    const notas = getSpeakingData(MEET_NOTES_KEY);

    if (!notas.length) {
        container.innerHTML = `
            <div class="speaking-empty-state">
                <div class="speaking-empty-icon">✎</div>
                <h4>Your journal starts here</h4>
                <p>After a conversation, record what you learned and what to practice next.</p>
                <button
                    type="button"
                    class="speaking-button speaking-button-secondary"
                    onclick="adicionarNotaMeet()"
                >
                    + Create your first entry
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = notas.map((item, index) => `
        <article class="speaking-note-card">
            <div class="speaking-note-header">
                <label>
                    Practice date
                    <input
                        type="date"
                        value="${escapeSpeakingHTML(item.data)}"
                        onchange="salvarEdicaoNotaMeet(${index}, 'data', this.value)"
                    >
                </label>

                <button
                    type="button"
                    class="speaking-delete-button"
                    aria-label="Delete journal entry"
                    onclick="removerNotaMeet(${index})"
                >Delete</button>
            </div>

            <label class="speaking-note-field">
                What did you talk about?
                <textarea
                    class="textarea-meet"
                    data-note-index="${index}"
                    data-note-field="topic"
                    placeholder="Describe the topics you discussed..."
                    oninput="autoGrowTextarea(this)"
                    onchange="salvarEdicaoNotaMeet(${index}, 'topic', this.value)"
                >${escapeSpeakingHTML(item.topic)}</textarea>
            </label>

            <label class="speaking-note-field">
                New words and expressions
                <textarea
                    class="textarea-meet"
                    data-note-index="${index}"
                    data-note-field="vocabulary"
                    placeholder="Write down new vocabulary and useful expressions..."
                    oninput="autoGrowTextarea(this)"
                    onchange="salvarEdicaoNotaMeet(${index}, 'vocabulary', this.value)"
                >${escapeSpeakingHTML(item.vocabulary)}</textarea>
            </label>

            <label class="speaking-note-field">
                Areas to improve
                <textarea
                    class="textarea-meet"
                    data-note-index="${index}"
                    data-note-field="improvements"
                    placeholder="Pronunciation, fluency, grammar, vocabulary..."
                    oninput="autoGrowTextarea(this)"
                    onchange="salvarEdicaoNotaMeet(${index}, 'improvements', this.value)"
                >${escapeSpeakingHTML(item.improvements)}</textarea>
            </label>

            <label class="speaking-note-field">
                Additional notes
                <textarea
                    class="textarea-meet"
                    data-note-index="${index}"
                    data-note-field="texto"
                    placeholder="How did the conversation go? What would you like to practice next time?"
                    oninput="autoGrowTextarea(this)"
                    onchange="salvarEdicaoNotaMeet(${index}, 'texto', this.value)"
                >${escapeSpeakingHTML(item.texto)}</textarea>
            </label>
        </article>
    `).join('');

    container.querySelectorAll('.textarea-meet')
        .forEach(textarea => autoGrowTextarea(textarea));
}

function adicionarNotaMeet() {
    const notas = getSpeakingData(MEET_NOTES_KEY);

    notas.push({
        data: getLocalSpeakingDate(),
        topic: '',
        vocabulary: '',
        improvements: '',
        texto: ''
    });

    saveSpeakingData(MEET_NOTES_KEY, notas);
    carregarNotasMeetSalvas();
}

function salvarEdicaoNotaMeet(index, campo, novoValor) {
    const notas = getSpeakingData(MEET_NOTES_KEY);

    if (!notas[index]) return;

    // Keep compatibility with the old "texto" field.
    notas[index][campo] = novoValor;
    saveSpeakingData(MEET_NOTES_KEY, notas);
}

function removerNotaMeet(index) {
    const notas = getSpeakingData(MEET_NOTES_KEY);

    if (!notas[index]) return;

    if (!confirm('Delete this journal entry?')) return;

    notas.splice(index, 1);
    saveSpeakingData(MEET_NOTES_KEY, notas);
    carregarNotasMeetSalvas();
}

function criarNotaDaSessao(index) {
    const sessoes = getSpeakingData(MEET_SESSIONS_KEY);
    const sessao = sessoes[index];

    const notas = getSpeakingData(MEET_NOTES_KEY);

    notas.push({
        data: sessao?.date || getLocalSpeakingDate(),
        topic: sessao?.topic || '',
        vocabulary: '',
        improvements: '',
        texto: '',
        sessionName: sessao?.name || ''
    });

    saveSpeakingData(MEET_NOTES_KEY, notas);
    carregarNotasMeetSalvas();

    document.getElementById('speaking-notes-list')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- Shadowing practice ---------- */

/* ---------- Shadowing practice tracker ---------- */

const SHADOWING_RECORDS_KEY = 'shadowingRecords';

function configurarBotoesShadowing() {
    document
        .getElementById('add-shadowing-record')
        ?.addEventListener('click', adicionarRegistroShadowing);
}

function renderizarShadowing() {
    const container = document.getElementById('shadowing-list');
    const summary = document.getElementById('shadowing-summary');

    if (!container || !summary) return;

    const records = getSpeakingData(SHADOWING_RECORDS_KEY);

    const completed = records.filter(
        record => record.status === 'Completed'
    ).length;

    const lastPractice = records
        .filter(record => record.date)
        .map(record => record.date)
        .sort()
        .pop();

    summary.innerHTML = `
        <div class="shadowing-summary-card">
            <span>Total practices</span>
            <strong>${records.length}</strong>
        </div>

        <div class="shadowing-summary-card">
            <span>Completed</span>
            <strong>${completed}</strong>
        </div>

        <div class="shadowing-summary-card">
            <span>Last practice</span>
            <strong>${lastPractice
                ? escapeSpeakingHTML(formatSpeakingDate(lastPractice))
                : 'Not yet'}</strong>
        </div>
    `;

    if (!records.length) {
        container.innerHTML = `
            <div class="speaking-empty-state">
                <div class="speaking-empty-icon">♫</div>
                <h4>No shadowing practices yet</h4>
                <p>
                    Record the videos, podcasts, or other materials
                    you use to practice English.
                </p>
                <button
                    type="button"
                    class="speaking-button speaking-button-secondary"
                    onclick="adicionarRegistroShadowing()"
                >
                    + Record your first practice
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = records.map((record, index) => `
        <article class="shadowing-card">
            <div class="shadowing-card-header">
                <h4>
                    ${escapeSpeakingHTML(
                        record.material || 'Untitled practice'
                    )}
                </h4>

                <button
                    type="button"
                    class="speaking-delete-button"
                    onclick="removerRegistroShadowing(${index})"
                    aria-label="Delete practice"
                >
                    Delete
                </button>
            </div>

            <div class="shadowing-fields">
                <label>
                    Practice date
                    <input
                        type="date"
                        value="${escapeSpeakingHTML(record.date)}"
                        onchange="salvarRegistroShadowing(${index}, 'date', this.value)"
                    >
                </label>

                <label>
                    Status
                    <select
                        onchange="salvarRegistroShadowing(${index}, 'status', this.value)"
                    >
                        ${['Not completed', 'Partially completed', 'Completed']
                            .map(status => `
                                <option
                                    value="${status}"
                                    ${record.status === status ? 'selected' : ''}
                                >${status}</option>
                            `).join('')}
                    </select>
                </label>

                <label>
                    Media type
                    <select
                        onchange="salvarRegistroShadowing(${index}, 'mediaType', this.value)"
                    >
                        ${['YouTube', 'Podcast', 'TV show', 'Movie', 'Interview', 'Other']
                            .map(type => `
                                <option
                                    value="${type}"
                                    ${record.mediaType === type ? 'selected' : ''}
                                >${type}</option>
                            `).join('')}
                    </select>
                </label>

                <label>
                    Material title
                    <input
                        type="text"
                        value="${escapeSpeakingHTML(record.material)}"
                        placeholder="Video, episode, or podcast title"
                        onchange="salvarRegistroShadowing(${index}, 'material', this.value)"
                    >
                </label>

                <label>
                    Material link
                    <input
                        type="url"
                        value="${escapeSpeakingHTML(record.url)}"
                        placeholder="https://..."
                        onchange="salvarRegistroShadowing(${index}, 'url', this.value)"
                    >
                </label>

                <label>
                    Duration (minutes)
                    <input
                        type="number"
                        min="0"
                        step="1"
                        value="${escapeSpeakingHTML(record.duration)}"
                        placeholder="15"
                        onchange="salvarRegistroShadowing(${index}, 'duration', this.value)"
                    >
                </label>

                <label class="shadowing-full-field">
                    Practice focus
                    <select
                        onchange="salvarRegistroShadowing(${index}, 'focus', this.value)"
                    >
                        ${['Pronunciation', 'Rhythm and stress', 'Intonation', 'Fluency', 'Listening', 'Vocabulary', 'Other']
                            .map(focus => `
                                <option
                                    value="${focus}"
                                    ${record.focus === focus ? 'selected' : ''}
                                >${focus}</option>
                            `).join('')}
                    </select>
                </label>

                <label class="shadowing-full-field">
                    Notes
                    <textarea
                        placeholder="What did you learn? What was difficult?"
                        oninput="autoGrowTextarea(this)"
                        onchange="salvarRegistroShadowing(${index}, 'notes', this.value)"
                    >${escapeSpeakingHTML(record.notes)}</textarea>
                </label>
            </div>
        </article>
    `).join('');

    container.querySelectorAll('textarea')
        .forEach(textarea => autoGrowTextarea(textarea));
}

function adicionarRegistroShadowing() {
    const records = getSpeakingData(SHADOWING_RECORDS_KEY);

    records.unshift({
        date: getLocalSpeakingDate(),
        status: 'Not completed',
        mediaType: 'YouTube',
        material: '',
        url: '',
        duration: '',
        focus: 'Pronunciation',
        notes: ''
    });

    saveSpeakingData(SHADOWING_RECORDS_KEY, records);
    renderizarShadowing();

    const firstInput = document.querySelector(
        '#shadowing-list .shadowing-card input[type="text"]'
    );

    firstInput?.focus();
}

function salvarRegistroShadowing(index, field, value) {
    const records = getSpeakingData(SHADOWING_RECORDS_KEY);

    if (!records[index]) return;

    records[index][field] = value;
    saveSpeakingData(SHADOWING_RECORDS_KEY, records);

    if (field === 'status' || field === 'date') {
        renderizarShadowing();
    }
}

function removerRegistroShadowing(index) {
    const records = getSpeakingData(SHADOWING_RECORDS_KEY);

    if (!records[index]) return;

    if (!confirm('Delete this shadowing practice?')) return;

    records.splice(index, 1);
    saveSpeakingData(SHADOWING_RECORDS_KEY, records);
    renderizarShadowing();
}


/* ---------- Textarea sizing ---------- */

function autoGrowTextarea(textarea) {
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = Math.max(textarea.scrollHeight, 72) + 'px';
}
