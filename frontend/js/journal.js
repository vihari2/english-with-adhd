// -- Writing Journal --
function renderizarWritingJournal(container) {
    container.innerHTML = `
        <div style="max-height: 450px; overflow-y: auto; padding-right: 5px;">
            <button class="btn-adicionar-linha" onclick="adicionarRegistroJournal()">+ Add Day</button>
            <table class="tabela-meet" style="margin-top: 15px;">
                <thead>
                    <tr>
                        <th style="width: 40%;">Date</th>
                        <th>Wrote in the journal?</th>
                        <th style="width: 10%;"></th>
                    </tr>
                </thead>
                <tbody id="corpo-tabela-journal">
                </tbody>
            </table>
        </div>
    `;
    carregarJournalSalvo();
}

function carregarJournalSalvo() {
    const corpoTabela = document.getElementById('corpo-tabela-journal');
    if (!corpoTabela) return;
    let registros = JSON.parse(appStorage.getItem('meuWritingJournal')) || [];

    corpoTabela.innerHTML = '';
    registros.forEach((item, index) => {
        corpoTabela.innerHTML += `
            <tr>
                <td><input type="date" class="input-meet" value="${item.data}" onchange="salvarEdicaoJournal(${index}, 'data', this.value)"></td>
                <td>
                    <select class="input-meet" onchange="salvarEdicaoJournal(${index}, 'feito', this.value)">
                        <option value="Sim" ${item.feito === 'Sim' ? 'selected' : ''}>✅ Yes, I wrote</option>
                        <option value="Não" ${item.feito === 'Não' ? 'selected' : ''}>❌ No, I did not write</option>
                    </select>
                </td>
                <td><button class="btn-remover" onclick="removerJournal(${index})">X</button></td>
            </tr>
        `;
    });
}

function adicionarRegistroJournal() {
    let registros = JSON.parse(appStorage.getItem('meuWritingJournal')) || [];
    let dataHoje = new Date().toISOString().split('T')[0];
    registros.push({ data: dataHoje, feito: 'Sim' });
    appStorage.setItem('meuWritingJournal', JSON.stringify(registros));
    carregarJournalSalvo();
}

function salvarEdicaoJournal(index, campo, novoValor) {
    let registros = JSON.parse(appStorage.getItem('meuWritingJournal')) || [];
    registros[index][campo] = novoValor;
    appStorage.setItem('meuWritingJournal', JSON.stringify(registros));
}

function removerJournal(index) {
    let registros = JSON.parse(appStorage.getItem('meuWritingJournal')) || [];
    registros.splice(index, 1);
    appStorage.setItem('meuWritingJournal', JSON.stringify(registros));
    carregarJournalSalvo();
}
