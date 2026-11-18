
// ⚠️ Altere para a URL onde sua API está rodando
const API_URL = "http://localhost:3000";

// Elementos do DOM
const form = document.getElementById("paciente-form");
const inputId = document.getElementById("paciente-id");
const inputNome = document.getElementById("nome");
const inputIdade = document.getElementById("idade");
const inputAltura = document.getElementById("altura");
const inputPeso = document.getElementById("peso");
const formTitle = document.getElementById("form-title");
const btnSalvar = document.getElementById("btn-salvar");
const btnCancelar = document.getElementById("btn-cancelar");
const btnAtualizar = document.getElementById("btn-atualizar");
const mensagem = document.getElementById("mensagem");
const tabela = document.querySelector("#tabela-pacientes tbody");
const semRegistros = document.getElementById("sem-registros");
const loading = document.getElementById("loading");

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------
function exibirMensagem(texto, tipo = "sucesso") {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
  mensagem.hidden = false;
  setTimeout(() => { mensagem.hidden = true; }, 4000);
}

function limparFormulario() {
  form.reset();
  inputId.value = "";
  formTitle.textContent = "Cadastrar Paciente";
  btnSalvar.textContent = "Salvar";
  btnCancelar.hidden = true;
}

function classeStatus(status) {
  const mapa = {
    "Abaixo do peso": "abaixo",
    "Peso normal": "normal",
    "Sobrepeso": "sobre",
    "Obesidade": "obesidade"
  };
  return mapa[status] || "normal";
}

// ---------------------------------------------------------------------------
// READ ALL - GET /paciente
// ---------------------------------------------------------------------------
async function carregarPacientes() {
  loading.hidden = false;
  tabela.innerHTML = "";
  semRegistros.hidden = true;

  try {
    const resposta = await fetch(`${API_URL}/paciente`);
    if (!resposta.ok) throw new Error("Falha ao carregar pacientes.");

    const pacientes = await resposta.json();

    if (!Array.isArray(pacientes) || pacientes.length === 0) {
      semRegistros.hidden = false;
      return;
    }

    pacientes.forEach((p) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td data-label="ID">${p.id}</td>
        <td data-label="Nome">${p.nome}</td>
        <td data-label="Idade">${p.idade}</td>
        <td data-label="Altura">${Number(p.altura).toFixed(2)} m</td>
        <td data-label="Peso">${Number(p.peso).toFixed(2)} kg</td>
        <td data-label="IMC">${Number(p.imc).toFixed(2)}</td>
        <td data-label="Status">
          <span class="badge ${classeStatus(p.status)}">${p.status}</span>
        </td>
        <td data-label="Ações">
          <button class="editar" data-acao="editar" data-id="${p.id}">Editar</button>
          <button class="perigo" data-acao="excluir" data-id="${p.id}">Excluir</button>
        </td>
      `;
      tabela.appendChild(tr);
    });
  } catch (erro) {
    exibirMensagem(erro.message, "erro");
  } finally {
    loading.hidden = true;
  }
}

// ---------------------------------------------------------------------------
// READ ONE - GET /paciente/:id (para preencher o formulário na edição)
// ---------------------------------------------------------------------------
async function carregarPacienteParaEdicao(id) {
  try {
    const resposta = await fetch(`${API_URL}/paciente/${id}`);
    if (!resposta.ok) throw new Error("Paciente não encontrado.");

    const p = await resposta.json();

    inputId.value = p.id;
    inputNome.value = p.nome;
    inputIdade.value = p.idade;
    inputAltura.value = p.altura;
    inputPeso.value = p.peso;

    formTitle.textContent = `Editando Paciente #${p.id}`;
    btnSalvar.textContent = "Atualizar";
    btnCancelar.hidden = false;

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (erro) {
    exibirMensagem(erro.message, "erro");
  }
}

// ---------------------------------------------------------------------------
// CREATE / UPDATE
// ---------------------------------------------------------------------------
form.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const dados = {
    nome: inputNome.value.trim(),
    idade: Number(inputIdade.value),
    altura: Number(inputAltura.value),
    peso: Number(inputPeso.value)
  };

  const editando = Boolean(inputId.value);
  const url = editando
    ? `${API_URL}/paciente/${inputId.value}`
    : `${API_URL}/paciente`;

  const metodo = editando ? "PUT" : "POST";

  try {
    const resposta = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });

    const corpo = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(corpo.mensagem || "Erro ao salvar paciente.");
    }

    exibirMensagem(
      editando
        ? "Paciente atualizado com sucesso!"
        : `Paciente cadastrado! IMC: ${corpo.imc} (${corpo.status})`,
      "sucesso"
    );

    limparFormulario();
    carregarPacientes();
  } catch (erro) {
    exibirMensagem(erro.message, "erro");
  }
});

// ---------------------------------------------------------------------------
// DELETE - DELETE /paciente/:id
// ---------------------------------------------------------------------------
async function excluirPaciente(id) {
  if (!confirm(`Deseja realmente excluir o paciente #${id}?`)) return;

  try {
    const resposta = await fetch(`${API_URL}/paciente/${id}`, {
      method: "DELETE"
    });

    const corpo = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(corpo.mensagem || "Erro ao excluir paciente.");
    }

    exibirMensagem(corpo.mensagem || "Paciente excluído com sucesso!", "sucesso");
    carregarPacientes();
  } catch (erro) {
    exibirMensagem(erro.message, "erro");
  }
}

// ---------------------------------------------------------------------------
// Delegação de eventos na tabela (editar / excluir)
// ---------------------------------------------------------------------------
tabela.addEventListener("click", (evento) => {
  const botao = evento.target.closest("button[data-acao]");
  if (!botao) return;

  const id = botao.dataset.id;

  if (botao.dataset.acao === "editar") {
    carregarPacienteParaEdicao(id);
  } else if (botao.dataset.acao === "excluir") {
    excluirPaciente(id);
  }
});

// ---------------------------------------------------------------------------
// Botões auxiliares
// ---------------------------------------------------------------------------
btnCancelar.addEventListener("click", limparFormulario);
btnAtualizar.addEventListener("click", carregarPacientes);

// ---------------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", carregarPacientes);