/** Pomodoro timer and controls. */

let pomodoroIntervalo = null;
let pomodoroSegundos = 25 * 60;
let pomodoroAtivo = false;
let atividadePomodoro = 'Coursebook';
let duracaoPomodoro = 25 * 60;
let descansoMinutos = 5;

function renderizarPomodoro(container) {
    const atividades = ['Coursebook', 'Flashcards', 'Speak', 'Journal', 'Spaced Review', 'Rest'];
    container.innerHTML = `
        <section class="pomodoro-panel" aria-label="Pomodoro timer">
            <p class="pomodoro-caption">Choose what you want to work on</p>
            <div class="pomodoro-activities">
                ${atividades.map((atividade) => `<button type="button" class="pomodoro-activity${atividade === atividadePomodoro ? ' selected' : ''}" aria-pressed="${atividade === atividadePomodoro}" onclick="selecionarAtividadePomodoro('${atividade}')">${atividade}</button>`).join('')}
            </div>
            <div class="pomodoro-rest-options${atividadePomodoro === 'Rest' ? ' visible' : ''}" id="pomodoro-rest-options" aria-label="Rest duration">
                <span>Rest length:</span>
                <button type="button" class="pomodoro-rest-choice${descansoMinutos === 5 ? ' selected' : ''}" aria-pressed="${descansoMinutos === 5}" onclick="definirDescansoPomodoro(5)">5 min</button>
                <button type="button" class="pomodoro-rest-choice${descansoMinutos === 20 ? ' selected' : ''}" aria-pressed="${descansoMinutos === 20}" onclick="definirDescansoPomodoro(20)">20 min</button>
            </div>
            <div class="pomodoro-clock" id="pomodoro-clock" role="timer" aria-live="polite">${formatarTempoPomodoro()}</div>
            <p class="pomodoro-current">Focus: <strong id="pomodoro-current">${atividadePomodoro}</strong></p>
            <div class="pomodoro-controls">
                <button type="button" onclick="alternarPomodoro()" id="pomodoro-toggle">${pomodoroAtivo ? 'Pause' : 'Start'}</button>
                <button type="button" class="pomodoro-reset" onclick="reiniciarPomodoro()">Reset</button>
            </div>
        </section>`;
}

function formatarTempoPomodoro() {
    return `${String(Math.floor(pomodoroSegundos / 60)).padStart(2, '0')}:${String(pomodoroSegundos % 60).padStart(2, '0')}`;
}

function selecionarAtividadePomodoro(atividade) {
    atividadePomodoro = atividade;
    duracaoPomodoro = atividade === 'Rest' ? descansoMinutos * 60 : 25 * 60;
    reiniciarPomodoro();
    document.querySelectorAll('.pomodoro-activity').forEach((botao) => {
        const selecionado = botao.textContent === atividade;
        botao.classList.toggle('selected', selecionado);
        botao.setAttribute('aria-pressed', selecionado);
    });
    const atual = document.getElementById('pomodoro-current');
    if (atual) atual.textContent = atividade;
    document.getElementById('pomodoro-rest-options')?.classList.toggle('visible', atividade === 'Rest');
}

function definirDescansoPomodoro(minutos) {
    descansoMinutos = minutos;
    duracaoPomodoro = minutos * 60;
    reiniciarPomodoro();
    document.querySelectorAll('.pomodoro-rest-choice').forEach((botao) => {
        const selecionado = botao.textContent.trim() === `${minutos} min`;
        botao.classList.toggle('selected', selecionado);
        botao.setAttribute('aria-pressed', selecionado);
    });
}

function atualizarPomodoro() {
    const clock = document.getElementById('pomodoro-clock');
    if (clock) clock.textContent = formatarTempoPomodoro();
    if (pomodoroSegundos <= 0) {
        clearInterval(pomodoroIntervalo);
        pomodoroIntervalo = null;
        pomodoroAtivo = false;
        const botao = document.getElementById('pomodoro-toggle');
        if (botao) botao.textContent = 'Start';
        alert(`Pomodoro complete! You worked on ${atividadePomodoro}.`);
    }
}

function alternarPomodoro() {
    if (pomodoroAtivo) {
        clearInterval(pomodoroIntervalo);
        pomodoroIntervalo = null;
        pomodoroAtivo = false;
    } else {
        if (pomodoroSegundos <= 0) pomodoroSegundos = duracaoPomodoro;
        pomodoroAtivo = true;
        pomodoroIntervalo = setInterval(() => {
            pomodoroSegundos -= 1;
            atualizarPomodoro();
        }, 1000);
    }
    const botao = document.getElementById('pomodoro-toggle');
    if (botao) botao.textContent = pomodoroAtivo ? 'Pause' : 'Start';
}

function reiniciarPomodoro() {
    clearInterval(pomodoroIntervalo);
    pomodoroIntervalo = null;
    pomodoroAtivo = false;
    pomodoroSegundos = duracaoPomodoro;
    atualizarPomodoro();
    const botao = document.getElementById('pomodoro-toggle');
    if (botao) botao.textContent = 'Start';
}
