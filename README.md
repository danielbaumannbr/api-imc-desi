# Guia de Revisão: Arquitetura de API Backend e Gestão de Banco de Dados Nutricional (`Nutri_DB`)

Este material de revisão foi estruturado para consolidar os conceitos práticos e teóricos sobre o desenvolvimento de APIs RESTful utilizando **Node.js**, **Express** e **MySQL**, com base na arquitetura do projeto de gestão nutricional (`Nutri_DB`).

---

## 📌 1. Visão Geral da Arquitetura

A aplicação é composta por uma API Backend em Node.js integrada a um banco de dados relacional MySQL. 

### Princípios Fundamentais:
* **Validação e Regras no Backend:** Cálculos críticos (como o IMC) e regras de negócio devem ser processados exclusivamente no lado do servidor. O front-end atua apenas no envio e recepção de dados, evitando vulnerabilidades de segurança e corrupção de dados no banco por inserções arbitrárias ou incorretas.
* **Isolamento e Segurança de Dados:** Credenciais sensíveis do banco de dados ficam armazenadas em variáveis de ambiente (`.env`) e nunca são expostas publicamente em repositórios de código.
* **Resiliência:** Tratamento rigoroso de exceções utilizando blocos `try/catch` para garantir que erros individuais de consulta não derrubem o servidor ativo.

---

## 🗄️ 2. Modelagem do Banco de Dados (`Nutri_DB`)

O banco de dados relacional `Nutri_DB` possui a tabela `pacientes` configurada com a seguinte estrutura de atributos:

| Campo | Tipo de Dado | Restrições / Detalhes | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `PRIMARY KEY`, `AUTO_INCREMENT` | Identificador único do paciente |
| `nome` | `VARCHAR(255)` | `NOT NULL` | Nome completo |
| `idade` | `INT` | `NOT NULL` | Idade em anos |
| `altura` | `DECIMAL(4,2)` | `NOT NULL` | Altura em metros (ex: 1.65) |
| `peso` | `DECIMAL(4,2)` | `NOT NULL` | Peso em quilogramas (ex: 58.50) |
| `imc` | `DECIMAL(4,2)` | `NOT NULL` | Índice de Massa Corporal calculado |
| `status` | `VARCHAR(100)` | `NOT NULL` | Classificação (ex: "Abaixo do peso", "Peso normal", "Obesidade") |
| `time_stamp` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Registro automático da data/hora da inserção |

---

## 🛠️ 3. Configuração do Ambiente e Dependências

### Passos de Inicialização do Projeto:
1. **Inicialização do Node.js:**
   ```bash
   npm init -y
   ```
2. **Instalação das Dependências:**
   * **Express:** Framework para gerenciamento de rotas e servidores HTTP.
   * **MySQL2:** Driver para conexão assíncrona e segura com o banco de dados.
   * **Dotenv:** Gerenciamento de variáveis de ambiente.
   * **Nodemon:** Ferramenta de desenvolvimento para recomputar e reiniciar o servidor automaticamente a cada alteração de código.

   ```bash
   npm install express mysql2 dotenv
   npm install -D nodemon
   ```

3. **Configuração de Scripts no `package.json`:**
   ```json
   "scripts": {
     "dev": "nodemon index.js"
   }
   ```

4. **Proteção com `.gitignore`:**
   Certifique-se de incluir no arquivo `.gitignore`:
   ```text
   node_modules/
   .env
   ```

---

## 🔒 4. Conexão Segura com o Banco de Dados (`db.js` e `.env`)

### Arquivo `.env` (Variáveis de Ambiente):
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=Nutri_DB
```

### Arquivo de Conexão com Pool (`db.js`):
O uso de **Pool de Conexões** (`mysql2/promise`) permite gerenciar múltiplas requisições simultâneas de forma eficiente sem gargalos no banco.

---

## 🚀 5. Mapeamento de Rotas e Endpoints da API (`index.js`)

Abaixo estão os endpoints desenvolvidos, utilizando métodos assíncronos (`async/await`), parâmetros de rota e consultas parametrizadas (`?`) para prevenção de ataques como **SQL Injection**.

```javascript
const express = require('express');
const db = require('./db');
const app = express();
const port = 3000;

// Middleware para interpretar requisições JSON
app.use(express.json());

// 1. Rota de Teste
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// 2. Listar Todos os Pacientes
app.get('/paciente', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM pacientes');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ mensagem: "Erro Interno do Servidor", detalhes: error.message });
  }
});

// 3. Listar Pacientes por Filtro (Ex: Obesidade)
app.get('/paciente/obesidade', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM pacientes WHERE status = "Obesidade"');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ mensagem: "Erro Interno do Servidor", detalhes: error.message });
  }
});

// 4. Buscar Paciente Específico por ID
app.get('/paciente/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute('SELECT * FROM pacientes WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ mensagem: "Paciente não encontrado" });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({ mensagem: "Erro Interno do Servidor", detalhes: error.message });
  }
});

// 5. Deletar Paciente por ID
app.delete('/paciente/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute('DELETE FROM pacientes WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Paciente não encontrado" });
    }
    res.status(200).json({ mensagem: "Paciente apagado com sucesso" });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro Interno do Servidor", detalhes: error.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
```

---

## 📊 6. Tabela de Resumo dos Códigos de Status HTTP

| Código | Categoria | Significado no Projeto |
| :--- | :--- | :--- |
| **200 OK** | Sucesso | Requisição processada e dados retornados com sucesso. |
| **404 Not Found** | Erro do Cliente | ID do paciente ou recurso solicitado não foi encontrado no banco. |
| **500 Internal Error** | Erro do Servidor | Falha na comunicação com o banco de dados ou erro de execução capturado pelo `catch`. |

---

## 📝 Dicas de Estudo para a Prova/Revisão
* **Por que usamos `async/await` com `db.execute`?** Para não travar a execução do Node.js enquanto o banco de dados processa a consulta.
* **Qual o papel do `req.params`?** Capturar parâmetros dinâmicos passados na URL (ex: `:id`).
* **Por que passar valores como `[id]` no `db.execute` em vez de concatenar strings?** Para prevenir vulnerabilidades de SQL Injection e garantir a higienização dos dados.
