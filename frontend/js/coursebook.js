/** Coursebook progress helpers. */

// -- My Coursebook --
function renderizarCoursebook(container) {
    container.innerHTML = `
        <div style="max-height: 450px; overflow-y: auto; padding-right: 5px;">
            <button class="btn-adicionar-linha" onclick="adicionarLivroCoursebook()">+ Add Book</button>
            <table class="tabela-meet" style="margin-top: 15px;">
                <thead>
                    <tr>
                        <th style="width: 40%;">Book Name</th>
                        <th style="width: 25%;">Page/Chapter</th>
                        <th style="width: 25%;">Date</th>
                        <th style="width: 10%;"></th>
                    </tr>
                </thead>
                <tbody id="corpo-tabela-coursebook">
                </tbody>
            </table>
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

function adicionarLivroCoursebook() {
    let livros = JSON.parse(appStorage.getItem('meuCoursebook')) || [];
    let dataHoje = new Date().toISOString().split('T')[0];
    livros.push({ nome: '', parada: '', data: dataHoje });
    appStorage.setItem('meuCoursebook', JSON.stringify(livros));
    carregarCoursebookSalvo();
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

