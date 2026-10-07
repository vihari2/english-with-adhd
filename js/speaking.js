function renderizarGoogleMeet(container) {
    container.innerHTML = `
        <div style="max-height: 500px; overflow-y: auto; padding-right: 5px;">
            <h4 style="margin: 0 0 10px 0; color: #555;">Meet Sessions</h4>
            <button class="btn-adicionar-linha" onclick="adicionarLinhaMeet()">+ New Session</button>
            <table class="tabela-meet" style="margin-bottom: 20px;">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Topic</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody id="corpo-tabela-meet">
                </tbody>
            </table>

            <hr style="border: none; border-top: 2px solid #eaeaea; margin: 25px 0 20px 0;">

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; color: #555;">Observation Journal</h4>
                <button class="btn-adicionar-linha" onclick="adicionarNotaMeet()" style="margin: 0;">+ New Note</button>
            </div>
            
            <table class="tabela-meet">
                <thead>
                    <tr>
                        <th style="width: 25%;">Date</th>
                        <th>Observation / Note</th>
                        <th style="width: 10%;"></th>
                    </tr>
                </thead>
                <tbody id="corpo-tabela-notas-meet">
                </tbody>
            </table>
        </div>
    `;

    carregarMeetSalvos();
    carregarNotasMeetSalvas();
}

function carregarMeetSalvos() {
    const corpoTabela = document.getElementById('corpo-tabela-meet');
    if (!corpoTabela) return;
    let sessoes = JSON.parse(appStorage.getItem('meuMeet')) || [];

    corpoTabela.innerHTML = '';
    sessoes.forEach((item, index) => {
        corpoTabela.innerHTML += `
            <tr>
                <td><input type="text" class="input-meet" value="${item.name}" onchange="salvarEdicaoMeet(${index}, 'name', this.value)" placeholder="Session 1"></td>
                <td><input type="date" class="input-meet" value="${item.date}" onchange="salvarEdicaoMeet(${index}, 'date', this.value)"></td>
                <td>
                    <select class="input-meet" onchange="salvarEdicaoMeet(${index}, 'status', this.value)">
                        <option value="Not started" ${item.status === 'Not started' ? 'selected' : ''}>Not started</option>
                        <option value="In progress" ${item.status === 'In progress' ? 'selected' : ''}>In progress</option>
                        <option value="Done" ${item.status === 'Done' ? 'selected' : ''}>Done</option>
                    </select>
                </td>
                <td><input type="text" class="input-meet" value="${item.topic}" onchange="salvarEdicaoMeet(${index}, 'topic', this.value)" placeholder="Topic..."></td>
                <td><button class="btn-remover" onclick="removerMeet(${index})">X</button></td>
            </tr>
        `;
    });
}

function adicionarLinhaMeet() {
    let sessoes = JSON.parse(appStorage.getItem('meuMeet')) || [];
    sessoes.push({ name: '', date: '', status: 'Not started', topic: '' });
    appStorage.setItem('meuMeet', JSON.stringify(sessoes));
    carregarMeetSalvos();
}

function salvarEdicaoMeet(index, campo, novoValor) {
    let sessoes = JSON.parse(appStorage.getItem('meuMeet')) || [];
    sessoes[index][campo] = novoValor;
    appStorage.setItem('meuMeet', JSON.stringify(sessoes));
}

function removerMeet(index) {
    let sessoes = JSON.parse(appStorage.getItem('meuMeet')) || [];
    sessoes.splice(index, 1);
    appStorage.setItem('meuMeet', JSON.stringify(sessoes));
    carregarMeetSalvos();
}

function carregarNotasMeetSalvas() {
    const corpoTabelaNotas = document.getElementById('corpo-tabela-notas-meet');
    if (!corpoTabelaNotas) return;
    let notas = JSON.parse(appStorage.getItem('diarioNotasMeet')) || [];

    corpoTabelaNotas.innerHTML = '';
    notas.forEach((item, index) => {
        corpoTabelaNotas.innerHTML += `
            <tr>
                <td><input type="date" class="input-meet" value="${item.data}" onchange="salvarEdicaoNotaMeet(${index}, 'data', this.value)"></td>
                <td><textarea class="textarea-meet" onchange="salvarEdicaoNotaMeet(${index}, 'texto', this.value)" oninput="autoGrowTextarea(this)" placeholder="Write your observation here...">${item.texto}</textarea></td>
                <td><button class="btn-remover" onclick="removerNotaMeet(${index})">X</button></td>
            </tr>
        `;
    });
    // Trigger auto-grow for loaded textareas
    document.querySelectorAll('.textarea-meet').forEach(ta => autoGrowTextarea(ta));
}

function adicionarNotaMeet() {
    let notas = JSON.parse(appStorage.getItem('diarioNotasMeet')) || [];
    let dataHoje = new Date().toISOString().split('T')[0];
    notas.push({ data: dataHoje, texto: '' });
    appStorage.setItem('diarioNotasMeet', JSON.stringify(notas));
    carregarNotasMeetSalvas();
}

function salvarEdicaoNotaMeet(index, campo, novoValor) {
    let notas = JSON.parse(appStorage.getItem('diarioNotasMeet')) || [];
    notas[index][campo] = novoValor;
    appStorage.setItem('diarioNotasMeet', JSON.stringify(notas));
}

function removerNotaMeet(index) {
    let notas = JSON.parse(appStorage.getItem('diarioNotasMeet')) || [];
    notas.splice(index, 1);
    appStorage.setItem('diarioNotasMeet', JSON.stringify(notas));
    carregarNotasMeetSalvas();
}

function autoGrowTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(textarea.scrollHeight, 40) + 'px';
}
