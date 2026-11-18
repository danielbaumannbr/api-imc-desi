// Ajuste aqui se a API estiver em outro endereço
const API_URL = "http://localhost:3000";

// Atalhos para os elementos que a gente usa o tempo todo
const form         = document.getElementById("paciente-form");
const inputId      = document.getElementById("paciente-id");
const inputNome    = document.getElementById("nome");
const inputIdade   = document.getElementById("idade");
const inputAltura  = document.getElementById("altura");
const inputPeso    = document.getElementById("peso");
const formTitle    = document.getElementById("form-title");
const btnSalvar    = document.getElementById("btn-salvar");
const btnCancelar  = document.getElementById("btn-cancelar");
const btnAtualizar = document.getElementById("btn-atualizar");
const mensagem     = document.getElementById("mensagem");
const tabela       = document.querySelector("#tabela-pacientes tbody");
const semRegistros = document.getElementById("sem-registros");
const loading      = document.getElementById("loading");


// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function exibirMensagem(texto, tipo = "sucesso") {
  mensagem.textContent = texto;
  mensagem.className = `mensagem ${tipo}`;
  mensagem.hidden = false;

  // some sozinha depois de um tempo
  clearTimeout(exibirMensagem._timer);
  exibirMensagem._timer = setTimeout(() => {
    mensagem.hidden = true;
  }, 4000);
}

function limparFormulario() {
  form.reset();
  inputId.value = "";
  formTitle.textContent = "Novo paciente";
  btnSalvar.textContent = "Salvar";
  btnCancelar.hidden = true;
}

// mapeia o status que vem da API para a classe do badge
function classeStatus(status) {
  const mapa = {
    "Abaixo do peso": "abaixo",
    "Peso normal":    "normal",
    "Sobrepeso":      "sobre",
    "Obesidade":      "obesidade",
  };
  return mapa[status] || "normal";
}


// ---------------------------------------------------------------
// Listagem
// ---------------------------------------------------------------

async function carregarPacientes() {
  loading.hidden = false;
  tabela.innerHTML = "";
  semRegistros.hidden = true;

  try {
    const resposta = await fetch(`${API_URL}/paciente`);
    if (!resposta.ok) throw new Error("Não foi possível carregar os pacientes.");

    const pacientes = await resposta.json();

    if (!Array.isArray(pacientes) || pacientes.length === 0) {
      semRegistros.hidden = false;
      return;
    }

    for (const p of pacientes) {
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
          <button class="editar"  data-acao="editar"  data-id="${p.id}">Editar</button>
          <button class="perigo"  data-acao="excluir" data-id="${p.id}">Excluir</button>
        </td>
      `;
      tabela.appendChild(tr);
    }
  } catch (erro) {
    exibirMensagem(erro.message, "erro");
  } finally {
    loading.hidden = true;
  }
}


// ---------------------------------------------------------------
// Carregar um paciente no formulário (modo edição)
// ---------------------------------------------------------------

async function carregarPacienteParaEdicao(id) {
  try {
    const resposta = await fetch(`${API_URL}/paciente/${id}`);
    if (!resposta.ok) throw new Error("Paciente não encontrado.");

    const p = await resposta.json();

    inputId.value     = p.id;
    inputNome.value   = p.nome;
    inputIdade.value  = p.idade;
    inputAltura.value = p.altura;
    inputPeso.value   = p.peso;

    formTitle.textContent = `Editando paciente #${p.id}`;
    btnSalvar.textContent = "Atualizar";
    btnCancelar.hidden    = false;

    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (erro) {
    exibirMensagem(erro.message, "erro");
  }
}


// ---------------------------------------------------------------
// Salvar (cria ou atualiza)
// ---------------------------------------------------------------

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const dados = {
    nome:   inputNome.value.trim(),
    idade:  Number(inputIdade.value),
    altura: Number(inputAltura.value),
    peso:   Number(inputPeso.value),
  };

  const editando = Boolean(inputId.value);
  const url      = editando ? `${API_URL}/paciente/${inputId.value}` : `${API_URL}/paciente`;
  const metodo   = editando ? "PUT" : "POST";

  try {
    const resposta = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    const corpo = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(corpo.mensagem || "Não foi possível salvar o paciente.");
    }

    exibirMensagem(
      editando
        ? "Paciente atualizado."
        : `Cadastro feito! IMC ${corpo.imc} — ${corpo.status}`,
      "sucesso"
    );

    limparFormulario();
    carregarPacientes();
  } catch (erro) {
    exibirMensagem(erro.message, "erro");
  }
});


// ---------------------------------------------------------------
// Excluir
// ---------------------------------------------------------------

async function excluirPaciente(id) {
  if (!confirm(`Excluir o paciente #${id}? Essa ação não pode ser desfeita.`)) return;

  try {
    const resposta = await fetch(`${API_URL}/paciente/${id}`, { method: "DELETE" });
    const corpo    = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(corpo.mensagem || "Não foi possível excluir.");
    }

    exibirMensagem(corpo.mensagem || "Paciente removido.", "sucesso");
    carregarPacientes();
  } catch (erro) {
    exibirMensagem(erro.message, "erro");
  }
}


// ---------------------------------------------------------------
// Cliques nos botões da tabela (delegação)
// ---------------------------------------------------------------

tabela.addEventListener("click", (evento) => {
  const botao = evento.target.closest("button[data-acao]");
  if (!botao) return;

  const { acao, id } = botao.dataset;

  if (acao === "editar")  carregarPacienteParaEdicao(id);
  if (acao === "excluir") excluirPaciente(id);
});


// ---------------------------------------------------------------
// Botões auxiliares e inicialização
// ---------------------------------------------------------------

btnCancelar.addEventListener("click", limparFormulario);
btnAtualizar.addEventListener("click", carregarPacientes);

document.addEventListener("DOMContentLoaded", carregarPacientes);