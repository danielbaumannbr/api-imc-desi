// db.js
// Módulo responsável por criar e exportar o pool de conexões MySQL.
// O pool é exportado para que o app.js possa usá-lo nas rotas e para que
// os testes possam fechá-lo no teardown (afterAll), evitando o aviso
// "Jest did not exit one second after the test run has completed".

const path = require('path');
const mysql = require('mysql2/promise');

// [CORRIGIDO] Carrega o .env relativo ao diretório deste arquivo (__dirname),
// e não ao cwd. Isso garante que o Jest encontre o .env independentemente
// de onde for invocado (backend/, raiz do repo, etc.).
// quiet: true silencia a mensagem "◇ injected env (N) from .env" no console.
require('dotenv').config({
  quiet: true,
  path: path.resolve(__dirname, '.env'),
});

// [CORRIGIDO — CAUSA B] Validação das variáveis de ambiente.
//
// DB_HOST, DB_USER e DB_NAME são obrigatórias e não podem ser vazias:
// sem elas o pool não tem como se conectar.
//
// DB_PASSWORD é tratada separadamente porque é LEGÍTIMO ter senha vazia
// em ambientes locais (XAMPP/WAMP, MySQL sem senha configurada). O que não
// pode acontecer é a CHAVE estar AUSENTE do .env — isso indica configuração
// incompleta e deve falhar cedo com mensagem clara.
const variaveisObrigatorias = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const faltando = variaveisObrigatorias.filter((nome) => !process.env[nome]);

if (faltando.length > 0) {
  throw new Error(
    `Variáveis de ambiente ausentes: ${faltando.join(', ')}. ` +
      'Verifique o arquivo .env na raiz do projeto.'
  );
}

// DB_PASSWORD pode ser string vazia (MySQL sem senha), mas a chave precisa
// existir. Usamos `undefined` como critério de ausência para distinguir de
// string vazia — `!process.env.DB_PASSWORD` rejeitaria "" indevidamente.
if (process.env.DB_PASSWORD === undefined) {
  throw new Error(
    'Variável DB_PASSWORD ausente no .env. ' +
      'Se o MySQL não usa senha, defina DB_PASSWORD= (vazio, mas presente).'
  );
}

// Cria o pool de conexões. O pool reutiliza conexões abertas, o que é
// essencial para performance em uma API REST e para o comportamento
// esperado pelo driver mysql2/promise.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD, // pode ser "" — o driver aceita
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // decimalNumbers: true faz o driver retornar DECIMAL como Number em vez
  // de String. Sem isso, altura/peso/imc chegam como "1.75" (string) e o
  // front-end precisa converter manualmente. Com a opção, o contrato da
  // API fica consistente e evita bugs de comparação.
  decimalNumbers: true,
});

// Teste de conectividade opcional na inicialização. Útil para detectar
// cedo problemas de credencial/banco inexistente. Não derruba o processo
// (o pool tenta reconectar sob demanda), apenas loga o aviso.
pool
  .getConnection()
  .then((conn) => {
    conn.release();
    console.log('[db] Conexão com o MySQL estabelecida com sucesso.');
  })
  .catch((err) => {
    console.error('[db] Falha ao conectar no MySQL:', err.message);
  });

// Exporta o pool diretamente (module.exports = pool). Isso permite dois usos:
//   1. No app.js:  const db = require('./db');  db.query(...)
//   2. No teste:   const db = require('../db'); await db.end();
// O método .end() do pool fecha todas as conexões e libera o event loop,
// resolvendo o aviso "Jest did not exit one second after the test run".
module.exports = pool;