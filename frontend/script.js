//Endereço da API
const API_URL = "http://localhost:3000";

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

function exibirMensagem(texto, tipo = "sucesso") {
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
    mensagem.hidden = false;

    clearTimeout(exibirMensagem._timer);
    exibirMensagem._timer = setTimeout(() => {
        mensagem.hidden = true;
    }, 5000);
}
/**
 * Limpa o formulário e volta ao modo "cadastro novo".
 */
function limparFormulario() {
    form.reset();
    inputId.value = "";
    formTitle.textContent = "Novo paciente";
    btnSalvar.textContent = "Salvar";
    btnCancelar.hidden = true;
}

/**
 * Mapeia o status retornado pela API para a classe CSS do badge.
 */
function classeStatus(status) {
    const mapa = {
        "Abaixo do peso": "abaixo",
        "Peso normal": "normal",
        "Sobrepeso": "sobre",
        "Obesidade": "obesidade",
    };
    return mapa[status] || "normal";
}
async function carregarPacientes() {
    loading.hidden = false;
    tabela.innerHTML = "";
    semRegistros.hidden = true;
    try {
        const resposta = await fetch(`${API_URL}/paciente`);
        const pacientes = await resposta.json();

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
          <button class="editar" data-acao="editar"  data-id="${p.id}">Editar</button>
          <button class="perigo" data-acao="excluir" data-id="${p.id}">Excluir</button>
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