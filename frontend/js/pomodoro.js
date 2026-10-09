/** Pomodoro timer and controls. */

let pomodoroIntervalo = null;
let pomodoroSegundos = 25 * 60;
let pomodoroAtivo = false;
let atividadePomodoro = 'Coursebook';
let duracaoPomodoro = 25 * 60;
let descansoMinutos = 5;
let pomodoroAudioContext = null;

function prepararAudioPomodoro() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    try {
        pomodoroAudioContext ||= new AudioContextClass();
        if (pomodoroAudioContext.state === 'suspended') {
            pomodoroAudioContext.resume().catch(() => {});
        }
        return pomodoroAudioContext;
    } catch (error) {
        console.warn('Could not prepare the Pomodoro sound:', error);
        return null;
    }
}

function tocarAlertaPomodoro() {
    const audioContext = prepararAudioPomodoro();
    if (!audioContext || audioContext.state !== 'running') return;

    const agora = audioContext.currentTime;
    [660, 880, 660].forEach((frequencia, indice) => {
        const inicio = agora + indice * 0.24;
        const oscilador = audioContext.createOscillator();
        const volume = audioContext.createGain();
        oscilador.type = 'sine';
        oscilador.frequency.setValueAtTime(frequencia, inicio);
        volume.gain.setValueAtTime(0.0001, inicio);
        volume.gain.exponentialRampToValueAtTime(0.16, inicio + 0.025);
        volume.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.19);
        oscilador.connect(volume);
        volume.connect(audioContext.destination);
        oscilador.start(inicio);
        oscilador.stop(inicio + 0.2);
    });
}

function renderizarPomodoro(container) {
    const atividades = ['Coursebook', 'Flashcards', 'Speak', 'Journal', 'Spaced Review'];
    container.innerHTML = `
        <section class="pomodoro-panel" aria-label="Pomodoro timer">
            <p class="pomodoro-caption">Choose what you want to work on</p>
            <div class="pomodoro-option-grid">
                <div class="pomodoro-activities">
                    ${atividades.map((atividade) => `<button type="button" class="pomodoro-activity${atividade === atividadePomodoro ? ' selected' : ''}" aria-pressed="${atividade === atividadePomodoro}" onclick="selecionarAtividadePomodoro('${atividade}')">${atividade}</button>`).join('')}
                </div>
                <div class="pomodoro-rest-selector">
                    <button type="button" class="pomodoro-activity${atividadePomodoro === 'Rest' ? ' selected' : ''}" aria-pressed="${atividadePomodoro === 'Rest'}" onclick="selecionarAtividadePomodoro('Rest')">Rest</button>
                    <div class="pomodoro-rest-options${atividadePomodoro === 'Rest' ? ' visible' : ''}" id="pomodoro-rest-options" aria-label="Rest duration">
                        <span>Rest length:</span>
                        <button type="button" class="pomodoro-rest-choice${descansoMinutos === 5 ? ' selected' : ''}" aria-pressed="${descansoMinutos === 5}" onclick="definirDescansoPomodoro(5)">5 min</button>
                    </div>
                </div>
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
        tocarAlertaPomodoro();
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
        prepararAudioPomodoro();
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
