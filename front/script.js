// ⚠️ Altere para a URL onde sua API está rodando
// Constante global que guarda o endereço base da API.
// Todas as chamadas fetch vão concatenar esse valor com o endpoint (/paciente, /paciente/1, etc.).
const API_URL = "http://localhost:3000";

// Elementos do DOM
// Aqui começamos a "mapear" os elementos HTML que o JavaScript vai manipular.
// Cada getElementById busca um elemento pelo atributo id no HTML.
// Se o id estiver errado, a variável recebe null e o código quebra depois.

// Formulário de cadastro/edição (o <form id="paciente-form">).
const form = document.getElementById("paciente-form");

// Campo escondido que guarda o id do paciente quando estamos EDITANDO.
// Quando está vazio, significa que o formulário está em modo CADASTRO.
const inputId = document.getElementById("paciente-id");

// Campo de texto para o nome do paciente.
const inputNome = document.getElementById("nome");

// Campo numérico para a idade.
const inputIdade = document.getElementById("idade");

// Campo numérico para a altura (em metros, ex: 1.75).
const inputAltura = document.getElementById("altura");

// Campo numérico para o peso (em kg, ex: 82.5).
const inputPeso = document.getElementById("peso");

// Título do formulário (<h2 id="form-title">).
// Muda entre "Cadastrar Paciente" e "Editando Paciente #X".
const formTitle = document.getElementById("form-title");

// Botão de salvar (submit do formulário).
// O texto muda entre "Salvar" e "Atualizar".
const btnSalvar = document.getElementById("btn-salvar");

// Botão de cancelar edição.
// Fica escondido no modo cadastro e visível no modo edição.
const btnCancelar = document.getElementById("btn-cancelar");

// Botão de recarregar a lista de pacientes (o "🔄 Atualizar").
const btnAtualizar = document.getElementById("btn-atualizar");

// Parágrafo onde mostramos mensagens de sucesso ou erro.
const mensagem = document.getElementById("mensagem");

// Corpo da tabela (<tbody>) onde as linhas de pacientes serão inseridas.
// Usamos querySelector com seletor CSS porque o tbody não tem id próprio.
const tabela = document.querySelector("#tabela-pacientes tbody");

// Parágrafo que aparece quando não há pacientes cadastrados.
const semRegistros = document.getElementById("sem-registros");

// Elemento de "Carregando..." que aparece enquanto o fetch está em andamento.
const loading = document.getElementById("loading");

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

// Função que exibe uma mensagem na tela por 4 segundos.
// Recebe o texto e o tipo ("sucesso" ou "erro"; padrão = "sucesso").
function exibirMensagem(texto, tipo = "sucesso") {
  // Coloca o texto dentro do parágrafo de mensagem.
  mensagem.textContent = texto;

  // Troca a classe CSS para aplicar a cor certa (verde ou vermelho).
  mensagem.className = `mensagem ${tipo}`;

  // Torna o parágrafo visível.
  mensagem.hidden = false;

  // Agenda para esconder a mensagem depois de 4 segundos (4000 ms).
  setTimeout(() => { mensagem.hidden = true; }, 4000);
}

// Função que reseta o formulário para o modo CADASTRO.
function limparFormulario() {
  // Limpa todos os campos do formulário de uma vez.
  form.reset();

  // Limpa o campo escondido de id (importante para voltar ao modo cadastro).
  inputId.value = "";

  // Volta o título do formulário para "Cadastrar Paciente".
  formTitle.textContent = "Cadastrar Paciente";

  // Volta o texto do botão para "Salvar".
  btnSalvar.textContent = "Salvar";

  // Esconde o botão "Cancelar" (não faz sentido no modo cadastro).
  btnCancelar.hidden = true;
}

// Função que traduz o status textual (vindo da API) em uma classe CSS
// usada para colorir o "badge" na tabela.
function classeStatus(status) {
  // Mapa de status → classe CSS.
  const mapa = {
    "Abaixo do peso": "abaixo",
    "Peso normal": "normal",
    "Sobrepeso": "sobre",
    "Obesidade": "obesidade"
  };

  // Retorna a classe correspondente; se o status for desconhecido,
  // usa "normal" como fallback (evita quebrar a tela).
  return mapa[status] || "normal";
}

// ---------------------------------------------------------------------------
// READ ALL - GET /paciente
// ---------------------------------------------------------------------------

// Busca todos os pacientes na API e renderiza na tabela.
// É async porque usa await no fetch e no json().
async function carregarPacientes() {
  // Mostra o indicador de carregamento enquanto a requisição acontece.
  loading.hidden = false;

  // Limpa a tabela antes de renderizar de novo (evita duplicar linhas).
  tabela.innerHTML = "";

  // Esconde o aviso "nenhum paciente" até sabermos se a lista está vazia.
  semRegistros.hidden = true;

  try {
    // Faz a requisição GET para /paciente (método GET é o padrão do fetch).
    const resposta = await fetch(`${API_URL}/paciente`);

    // resposta.ok é true para status 200-299.
    // Se a API retornar erro (4xx/5xx), lançamos exceção manualmente.
    if (!resposta.ok) throw new Error("Falha ao carregar pacientes.");

    // Converte o corpo da resposta (JSON) em array de objetos JS.
    const pacientes = await resposta.json();

    // Se não for array (resposta inesperada) ou estiver vazio,
    // mostra o aviso e encerra a função.
    if (!Array.isArray(pacientes) || pacientes.length === 0) {
      semRegistros.hidden = false;
      return;
    }

    // Para cada paciente recebido, cria uma linha na tabela.
    pacientes.forEach((p) => {
      // Cria o elemento <tr>.
      const tr = document.createElement("tr");

      // Monta o HTML interno da linha com template string.
      // Cada <td> leva um data-label para o CSS responsivo mostrar o rótulo.
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

      // Adiciona a linha ao corpo da tabela.
      tabela.appendChild(tr);
    });
  } catch (erro) {
    // Se algo deu errado (rede, HTTP, parse), mostra mensagem de erro.
    exibirMensagem(erro.message, "erro");
  } finally {
    // O finally roda sempre — com ou sem erro — escondendo o "Carregando...".
    loading.hidden = true;
  }
}

// ---------------------------------------------------------------------------
// READ ONE - GET /paciente/:id (para preencher o formulário na edição)
// ---------------------------------------------------------------------------

// Busca um paciente específico pelo id e preenche o formulário de edição.
async function carregarPacienteParaEdicao(id) {
  try {
    // GET /paciente/:id — o id é interpolado direto na URL.
    const resposta = await fetch(`${API_URL}/paciente/${id}`);

    // Se o paciente não existir (404), lança erro.
    if (!resposta.ok) throw new Error("Paciente não encontrado.");

    // Converte a resposta JSON em objeto JS.
    const p = await resposta.json();

    // Preenche o campo escondido com o id (ativa o modo EDIÇÃO).
    inputId.value = p.id;

    // Preenche os demais campos com os valores atuais do paciente.
    inputNome.value = p.nome;
    inputIdade.value = p.idade;
    inputAltura.value = p.altura;
    inputPeso.value = p.peso;

    // Atualiza o título do formulário para indicar que é edição.
    formTitle.textContent = `Editando Paciente #${p.id}`;

    // Muda o texto do botão para "Atualizar".
    btnSalvar.textContent = "Atualizar";

    // Mostra o botão "Cancelar".
    btnCancelar.hidden = false;

    // Rola a página para o topo, onde está o formulário, com animação.
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (erro) {
    // Mostra mensagem caso o paciente não seja encontrado ou a requisição falhe.
    exibirMensagem(erro.message, "erro");
  }
}

// ---------------------------------------------------------------------------
// CREATE / UPDATE
// ---------------------------------------------------------------------------

// Escuta o evento de submit do formulário.
// A mesma função serve para CADASTRAR (POST) e ATUALIZAR (PUT).
form.addEventListener("submit", async (evento) => {
  // Impede o comportamento padrão do form (recarregar a página).
  evento.preventDefault();

  // Monta o objeto com os dados do formulário.
  // trim() remove espaços nas pontas do nome.
  // Number() converte strings dos inputs em números.
  const dados = {
    nome: inputNome.value.trim(),
    idade: Number(inputIdade.value),
    altura: Number(inputAltura.value),
    peso: Number(inputPeso.value)
  };

  // Se inputId tem valor, estamos editando; senão, cadastrando.
  const editando = Boolean(inputId.value);

  // Define a URL: com id (PUT) ou sem id (POST).
  const url = editando
    ? `${API_URL}/paciente/${inputId.value}`
    : `${API_URL}/paciente`;

  // Define o método HTTP correspondente.
  const metodo = editando ? "PUT" : "POST";

  try {
    // Envia a requisição para a API.
    const resposta = await fetch(url, {
      // Método POST ou PUT.
      method: metodo,
      // Avisa a API que o corpo é JSON.
      headers: { "Content-Type": "application/json" },
      // Converte o objeto JS em string JSON para enviar no corpo.
      body: JSON.stringify(dados)
    });

    // Tenta ler a resposta como JSON. Se falhar (ex: corpo vazio), usa {}.
    const corpo = await resposta.json().catch(() => ({}));

    // Se a resposta não for OK (4xx/5xx), lança erro com a mensagem da API.
    if (!resposta.ok) {
      throw new Error(corpo.mensagem || "Erro ao salvar paciente.");
    }

    // Mostra mensagem de sucesso — diferente para edição e cadastro.
    // No cadastro, incluímos o IMC e o status calculados pelo backend.
    exibirMensagem(
      editando
        ? "Paciente atualizado com sucesso!"
        : `Paciente cadastrado! IMC: ${corpo.imc} (${corpo.status})`,
      "sucesso"
    );

    // Limpa o formulário (volta ao modo cadastro).
    limparFormulario();

    // Recarrega a tabela para mostrar o registro novo/atualizado.
    carregarPacientes();
  } catch (erro) {
    // Mostra mensagem de erro se algo falhar.
    exibirMensagem(erro.message, "erro");
  }
});

// ---------------------------------------------------------------------------
// DELETE - DELETE /paciente/:id
// ---------------------------------------------------------------------------

// Remove um paciente após confirmação do usuário.
async function excluirPaciente(id) {
  // confirm() abre uma caixa nativa do navegador. Se o usuário cancelar, sai.
  if (!confirm(`Deseja realmente excluir o paciente #${id}?`)) return;

  try {
    // DELETE /paciente/:id
    const resposta = await fetch(`${API_URL}/paciente/${id}`, {
      method: "DELETE"
    });

    // Lê a resposta JSON (ou {} se não houver corpo).
    const corpo = await resposta.json().catch(() => ({}));

    // Se a resposta não for OK, lança erro com a mensagem da API.
    if (!resposta.ok) {
      throw new Error(corpo.mensagem || "Erro ao excluir paciente.");
    }

    // Mostra mensagem de sucesso.
    exibirMensagem(corpo.mensagem || "Paciente excluído com sucesso!", "sucesso");

    // Recarrega a tabela para refletir a exclusão.
    carregarPacientes();
  } catch (erro) {
    // Mostra mensagem de erro se algo falhar.
    exibirMensagem(erro.message, "erro");
  }
}

// ---------------------------------------------------------------------------
// Delegação de eventos na tabela (editar / excluir)
// ---------------------------------------------------------------------------

// Em vez de adicionar um listener em cada botão (que nem existe ainda),
// adicionamos UM listener na tabela e verificamos qual botão foi clicado.
// Isso se chama delegação de eventos.
tabela.addEventListener("click", (evento) => {
  // closest sobe no DOM até achar um <button> com atributo data-acao.
  // Se o clique não foi em um botão de ação, ignora.
  const botao = evento.target.closest("button[data-acao]");
  if (!botao) return;

  // Lê o id guardado no atributo data-id do botão clicado.
  const id = botao.dataset.id;

  // Verifica qual ação foi solicitada.
  if (botao.dataset.acao === "editar") {
    // Chama a função que preenche o formulário para edição.
    carregarPacienteParaEdicao(id);
  } else if (botao.dataset.acao === "excluir") {
    // Chama a função que exclui o paciente (com confirmação).
    excluirPaciente(id);
  }
});

// ---------------------------------------------------------------------------
// Botões auxiliares
// ---------------------------------------------------------------------------

// Botão "Cancelar" cancela a edição e volta o formulário ao modo cadastro.
btnCancelar.addEventListener("click", limparFormulario);

// Botão "🔄 Atualizar" recarrega a lista de pacientes da API.
btnAtualizar.addEventListener("click", carregarPacientes);

// ---------------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------------

// Quando o HTML terminar de carregar, chama carregarPacientes() automaticamente.
// Assim, a tabela já aparece preenchida quando a página abre.
document.addEventListener("DOMContentLoaded", carregarPacientes);