// Define o endereço base do servidor (back-end) onde a API está rodando
const API_URL = "http://localhost:3000";

// Captura o elemento <form> do HTML para controlar o envio dos dados
const form = document.getElementById("paciente-form");
// Captura o campo oculto (hidden) que guarda o ID do paciente durante uma edição
const inputId = document.getElementById("paciente-id");
// Captura o campo de entrada de texto para o nome do paciente
const inputNome = document.getElementById("nome");
// Captura o campo numérico para a idade do paciente
const inputIdade = document.getElementById("idade");
// Captura o campo numérico para a altura do paciente
const inputAltura = document.getElementById("altura");
// Captura o campo numérico para o peso do paciente
const inputPeso = document.getElementById("peso");
// Captura o título do formulário (usado para alternar entre "Novo paciente" e "Editando...")
const formTitle = document.getElementById("form-title");
// Captura o botão principal de envio ("Salvar" ou "Atualizar")
const btnSalvar = document.getElementById("btn-salvar");
// Captura o botão usado para cancelar uma edição em andamento
const btnCancelar = document.getElementById("btn-cancelar");
// Captura o botão usado para recarregar manualmente a lista da tabela
const btnAtualizar = document.getElementById("btn-atualizar");
// Captura a caixa de alerta onde avisos de sucesso ou erro são exibidos
const mensagem = document.getElementById("mensagem");
// Captura o corpo (<tbody>) da tabela onde as linhas dos pacientes serão inseridas
const tabela = document.querySelector("#tabela-pacientes tbody");
// Captura o aviso exibido quando não há nenhum paciente cadastrado
const semRegistros = document.getElementById("sem-registros");
// Captura o indicador visual de carregamento enquanto a API responde
const loading = document.getElementById("loading");


// ---------------------------------------------------------------
// Helpers (Funções auxiliares)
// ---------------------------------------------------------------

// Declara a função que exibe mensagens na tela; se nenhum tipo for informado, usa "sucesso" como padrão
function exibirMensagem(texto, tipo = "sucesso") {
  // Insere o texto recebido dentro do elemento HTML de mensagem
  mensagem.textContent = texto;
  // Aplica as classes CSS para estilizar a cor do alerta (ex: sucesso ou erro)
  mensagem.className = `mensagem ${tipo}`;
  // Torna o elemento de mensagem visível na página
  mensagem.hidden = false;

  // Cancela qualquer cronômetro anterior para evitar que uma mensagem nova suma antes da hora
  clearTimeout(exibirMensagem._timer);
  // Inicia uma contagem regressiva de 4 segundos (4000 milissegundos)
  exibirMensagem._timer = setTimeout(() => {
    // Esconde a mensagem automaticamente quando o tempo acaba
    mensagem.hidden = true;
  }, 4000);
}

// Declara a função que restaura o formulário ao estado inicial de cadastro
function limparFormulario() {
  // Apaga o conteúdo digitado em todos os campos visíveis do formulário
  form.reset();
  // Limpa o campo oculto de ID, garantindo que o próximo envio seja um cadastro novo
  inputId.value = "";
  // Restaura o título original do formulário
  formTitle.textContent = "Novo paciente";
  // Restaura o texto original do botão de envio
  btnSalvar.textContent = "Salvar";
  // Esconde novamente o botão de cancelar edição
  btnCancelar.hidden = true;
}

// Converte o texto de status do IMC vindo da API em um nome de classe CSS
function classeStatus(status) {
  // [BUG-01 — CORRIGIDO]
  // Antes: as chaves do mapa eram "Abaixo do peso" e "Sobrepeso", mas o backend
  // (imc.js) grava "Abaixo do peso normal" e "Excesso de Peso". Resultado: a
  // função não encontrava correspondência e caía no fallback "normal", pintando
  // pacientes desnutridos/obesos com a cor de "Peso normal".
  //
  // Correção: o mapa agora aceita AS DUAS nomenclaturas (as antigas strings já
  // gravadas no banco e as strings corrigidas do imc.js), garantindo
  // compatibilidade com registros legados e com o novo contrato da API.
  const mapa = {
    // Nomenclatura corrigida (novo contrato do back-end)
    "Abaixo do peso": "abaixo",
    "Peso normal": "normal",
    "Sobrepeso": "sobre",
    "Obesidade": "obesidade",
    // Nomenclatura legada (registros antigos gravados como "Abaixo do peso normal"
    // e "Excesso de Peso") — mantidas para não quebrar dados existentes.
    "Abaixo do peso normal": "abaixo",
    "Excesso de Peso": "sobre",
  };
  // Retorna a classe encontrada no mapa ou "normal" como valor padrão
  // [BUG-01 — CORRIGIDO] Uso de ?? em vez de || para o fallback ser aplicado
  // apenas quando a chave realmente não existir (evita que string vazia caia no padrão).
  return mapa[status] ?? "normal";
}

// [BUG-03 — CORRIGIDO — validação de entrada no front-end]
// Nova função auxiliar que valida os dados do formulário ANTES de enviar à API.
// Motivo: o relatório aponta que o POST/PUT aceitava altura 0 ou negativa,
// gerando divisão por zero (Infinity) no imc.js e erro HTTP 500 no MySQL.
// A validação no front é uma primeira barreira (a validação definitiva também
// deve existir no back-end, conforme o plano 5W2H).
function validarDados(dados) {
  // Verifica se todos os campos obrigatórios foram preenchidos
  if (!dados.nome || dados.idade === undefined || dados.altura === undefined || dados.peso === undefined) {
    return "Verifique se todos os campos estão preenchidos.";
  }
  // Verifica se os valores são números finitos (rejeita NaN, Infinity, etc.)
  if (!Number.isFinite(dados.idade) || !Number.isFinite(dados.altura) || !Number.isFinite(dados.peso)) {
    return "Idade, altura e peso devem ser números válidos.";
  }
  // Altura e peso devem ser maiores que zero (evita divisão por zero no imc.js)
  if (dados.altura <= 0 || dados.peso <= 0) {
    return "Altura e peso devem ser maiores que zero.";
  }
  // Idade deve estar em uma faixa aceitável (0 a 120 anos)
  if (dados.idade < 0 || dados.idade > 120) {
    return "Idade deve estar entre 0 e 120 anos.";
  }
  // Retorna null quando não há erro (validação passou)
  return null;
}


// ---------------------------------------------------------------
// Listagem
// ---------------------------------------------------------------

// Declara uma função assíncrona (capaz de aguardar respostas da rede) para listar os pacientes
async function carregarPacientes() {
  // Exibe o indicador de carregamento na tela
  loading.hidden = false;
  // Limpa todas as linhas atuais da tabela para evitar duplicação
  tabela.innerHTML = "";
  // Esconde a mensagem de "nenhum registro" antes de fazer a nova consulta
  semRegistros.hidden = true;

  // Inicia um bloco de tentativa para capturar possíveis falhas de rede ou da API
  try {
    // Faz uma requisição HTTP GET para /paciente e aguarda a resposta do servidor
    const resposta = await fetch(`${API_URL}/paciente`);
    // Se a resposta indicar erro (ex: status 404 ou 500), interrompe e lança uma exceção
    if (!resposta.ok) throw new Error("Não foi possível carregar os pacientes.");

    // Converte o corpo da resposta de texto JSON para um array de objetos JavaScript
    const pacientes = await resposta.json();

    // Verifica se o retorno não é uma lista válida ou se a lista está vazia
    if (!Array.isArray(pacientes) || pacientes.length === 0) {
      // Exibe o aviso de que não há pacientes cadastrados
      semRegistros.hidden = false;
      // Encerra a função antecipadamente, pois não há linhas para desenhar
      return;
    }

    // Percorre cada objeto de paciente (p) dentro da lista recebida
    for (const p of pacientes) {
      // Cria um novo elemento de linha de tabela (<tr>) na memória
      const tr = document.createElement("tr");
      // Monta o HTML interno da linha com as colunas, números formatados e botões de ação
      // [SEGURANÇA — CORRIGIDO] Uso de escapeHTML nos campos de texto (nome/status)
      // para evitar XSS caso o nome contenha caracteres como < > & ".
      tr.innerHTML = `
        <td data-label="ID">${p.id}</td>
        <td data-label="Nome">${escapeHTML(p.nome)}</td>
        <td data-label="Idade">${p.idade}</td>
        <td data-label="Altura">${Number(p.altura).toFixed(2)} m</td>
        <td data-label="Peso">${Number(p.peso).toFixed(2)} kg</td>
        <td data-label="IMC">${Number(p.imc).toFixed(2)}</td>
        <td data-label="Status">
          <span class="badge ${classeStatus(p.status)}">${escapeHTML(p.status)}</span>
        </td>
        <td data-label="Ações">
          <button class="editar"  data-acao="editar"  data-id="${p.id}">Editar</button>
          <button class="perigo"  data-acao="excluir" data-id="${p.id}">Excluir</button>
        </td>
      `;
      // Insere a linha recém-criada dentro do <tbody> visível na página
      tabela.appendChild(tr);
    }
  // Captura qualquer erro ocorrido dentro do bloco try
  } catch (erro) {
    // Exibe a mensagem do erro na tela usando o estilo visual de erro
    exibirMensagem(erro.message, "erro");
  // Bloco executado obrigatoriamente ao final, com sucesso ou erro
  } finally {
    // Esconde o indicador de carregamento
    loading.hidden = true;
  }
}

// [SEGURANÇA — CORRIGIDO] Função auxiliar de escape de HTML.
// Evita que dados vindos do usuário (ex: nome do paciente) sejam interpretados
// como HTML/script ao serem injetados via innerHTML.
function escapeHTML(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


// ---------------------------------------------------------------
// Carregar um paciente no formulário (modo edição)
// ---------------------------------------------------------------

// Busca os dados de um paciente específico pelo ID e preenche o formulário para edição
async function carregarPacienteParaEdicao(id) {
  // Inicia o bloco de tratamento de erros
  try {
    // Faz uma requisição GET para buscar apenas o paciente com o ID informado
    const resposta = await fetch(`${API_URL}/paciente/${id}`);
    // Lança um erro caso o servidor não encontre o paciente
    if (!resposta.ok) throw new Error("Paciente não encontrado.");

    // Converte os dados JSON do paciente recebido para um objeto JavaScript
    const p = await resposta.json();

    // Preenche o campo oculto com o ID do paciente (ativa o modo de edição)
    inputId.value = p.id;
    // Preenche o campo nome com o valor vindo da API
    inputNome.value = p.nome;
    // Preenche o campo idade com o valor vindo da API
    inputIdade.value = p.idade;
    // Preenche o campo altura com o valor vindo da API
    inputAltura.value = p.altura;
    // Preenche o campo peso com o valor vindo da API
    inputPeso.value = p.peso;

    // Atualiza o título do formulário indicando qual registro está sendo editado
    formTitle.textContent = `Editando paciente #${p.id}`;
    // Muda o texto do botão principal para refletir a atualização
    btnSalvar.textContent = "Atualizar";
    // Torna visível o botão de cancelar edição
    btnCancelar.hidden = false;

    // Rola a tela suavemente até o topo para o usuário visualizar o formulário preenchido
    window.scrollTo({ top: 0, behavior: "smooth" });
  // Captura falhas na busca do paciente
  } catch (erro) {
    // Exibe o erro na tela
    exibirMensagem(erro.message, "erro");
  }
}


// ---------------------------------------------------------------
// Salvar (cria ou atualiza)
// ---------------------------------------------------------------

// Escuta o evento de envio (submit) do formulário
form.addEventListener("submit", async (evento) => {
  // Impede o comportamento padrão do navegador de recarregar a página ao enviar o form
  evento.preventDefault();

  // Monta o objeto com os dados digitados, limpando espaços extras e convertendo números
  const dados = {
    nome: inputNome.value.trim(),
    idade: Number(inputIdade.value),
    altura: Number(inputAltura.value),
    peso: Number(inputPeso.value),
  };

  // [BUG-03 — CORRIGIDO] Validação de entrada antes do envio.
  // Se a validação retornar uma mensagem, exibe o erro e aborta o envio.
  // Isso evita que altura 0 ou negativa chegue ao back-end e gere divisão por
  // zero (Infinity) no imc.js e erro HTTP 500 no MySQL.
  const erroValidacao = validarDados(dados);
  if (erroValidacao) {
    exibirMensagem(erroValidacao, "erro");
    return;
  }

  // Lê o valor armazenado no campo oculto de ID
  const idAtual = inputId.value;
  // Verifica se existe um ID preenchido: true = edição, false = novo cadastro
  const editando = idAtual !== "";

  // Declara as variáveis que vão armazenar o endereço e o método HTTP da requisição
  let url;
  let metodo;

  // Se estiver editando um paciente existente:
  if (editando) {
    // Define a URL específica do paciente pelo ID
    url = `${API_URL}/paciente/${idAtual}`;
    // Define o método HTTP PUT (usado para atualizar registros)
    metodo = "PUT";
  // Caso contrário (cadastro novo):
  } else {
    // Define a URL geral da coleção de pacientes
    url = `${API_URL}/paciente`;
    // Define o método HTTP POST (usado para criar registros)
    metodo = "POST";
  }

  // Inicia a tentativa de envio dos dados para a API
  try {
    // Envia a requisição com o método escolhido, cabeçalho JSON e os dados convertidos em texto
    const resposta = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    // Tenta ler a resposta JSON da API; se vier vazia ou inválida, retorna objeto vazio sem quebrar
    const corpo = await resposta.json().catch(() => ({}));

    // [BUG-02 — CORRIGIDO — tratamento do 404 no PUT]
    // Antes: o back-end retornava 200 OK mesmo quando o PUT não alterava nenhuma
    // linha (affectedRows === 0). Com a correção do back-end, esse cenário agora
    // retorna 404. O front precisa tratar esse caso como erro de "não encontrado"
    // em vez de cair na mensagem genérica "Não foi possível salvar o paciente.".
    if (resposta.status === 404) {
      throw new Error(corpo.erro || corpo.mensagem || "Paciente não encontrado.");
    }

    // Se a API recusar a operação, lança um erro usando a mensagem do servidor ou uma padrão
    // [BUG-03 — CORRIGIDO] O back-end agora usa a chave "erro" (não "mensagem") nas
    // respostas de validação 400. Por isso o front lê corpo.erro primeiro, com
    // fallback para corpo.mensagem para manter compatibilidade com o contrato antigo.
    if (!resposta.ok) {
      throw new Error(corpo.erro || corpo.mensagem || "Não foi possível salvar o paciente.");
    }

    // Declara a variável para a mensagem de sucesso
    let texto;

    // Define o texto de feedback de acordo com a ação realizada
    if (editando) {
      texto = "Paciente atualizado.";
    } else {
      // No cadastro novo, exibe também o IMC e o status calculados pelo back-end
      texto = `Cadastro feito! IMC ${corpo.imc} — ${corpo.status}`;
    }

    // Exibe a mensagem de sucesso na tela
    exibirMensagem(texto, "sucesso");

    // Limpa os campos do formulário e volta ao estado inicial
    limparFormulario();
    // Recarrega a lista da tabela para mostrar o registro criado ou atualizado
    carregarPacientes();
  // Captura falhas de rede ou erros lançados acima
  } catch (erro) {
    // Exibe a mensagem de erro na tela
    exibirMensagem(erro.message, "erro");
  }
});


// ---------------------------------------------------------------
// Excluir
// ---------------------------------------------------------------

// Declara a função assíncrona responsável por apagar um paciente pelo ID
async function excluirPaciente(id) {
  // Abre uma janela de confirmação nativa; se o usuário clicar em "Cancelar", encerra a função
  if (!confirm(`Excluir o paciente #${id}? Essa ação não pode ser desfeita.`)) return;

  // Inicia a tentativa de exclusão na API
  try {
    // Envia uma requisição HTTP DELETE para o endereço do paciente específico
    const resposta = await fetch(`${API_URL}/paciente/${id}`, { method: "DELETE" });
    // Lê o JSON retornado pela API de forma segura (sem quebrar se vier vazio)
    const corpo = await resposta.json().catch(() => ({}));

    // Se o servidor retornar erro, interrompe e lança exceção
    // [COMPATIBILIDADE — CORRIGIDO] Lê corpo.erro (novo contrato) e corpo.mensagem
    // (contrato antigo) para manter compatibilidade com o back-end corrigido.
    if (!resposta.ok) {
      throw new Error(corpo.erro || corpo.mensagem || "Não foi possível excluir.");
    }

    // Exibe confirmação de exclusão na tela
    exibirMensagem(corpo.mensagem || "Paciente removido.", "sucesso");
    // Atualiza a tabela para remover a linha do paciente apagado
    carregarPacientes();
  // Captura erros ocorridos na exclusão
  } catch (erro) {
    // Mostra a mensagem de erro na tela
    exibirMensagem(erro.message, "erro");
  }
}


// ---------------------------------------------------------------
// Cliques nos botões da tabela (delegação de eventos)
// ---------------------------------------------------------------

// Adiciona um único ouvinte de cliques na tabela inteira, em vez de um para cada botão
tabela.addEventListener("click", (evento) => {
  // Verifica se o clique ocorreu dentro de um botão que tenha o atributo "data-acao"
  const botao = evento.target.closest("button[data-acao]");
  // Se o usuário clicou fora dos botões (ex: no texto da célula), ignora e sai
  if (!botao) return;

  // Extrai os valores dos atributos "data-acao" e "data-id" do botão clicado
  const { acao, id } = botao.dataset;

  // Se a ação for "editar", chama a função que preenche o formulário com esse ID
  if (acao === "editar") carregarPacienteParaEdicao(id);
  // Se a ação for "excluir", chama a função que remove o paciente com esse ID
  if (acao === "excluir") excluirPaciente(id);
});


// ---------------------------------------------------------------
// Botões auxiliares e inicialização
// ---------------------------------------------------------------

// Faz o botão "Cancelar" limpar o formulário quando for clicado
btnCancelar.addEventListener("click", limparFormulario);
// Faz o botão "Atualizar" recarregar a lista de pacientes quando for clicado
btnAtualizar.addEventListener("click", carregarPacientes);

// Executa o carregamento inicial da tabela assim que todo o HTML da página terminar de carregar
document.addEventListener("DOMContentLoaded", carregarPacientes);