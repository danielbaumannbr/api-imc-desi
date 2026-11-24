const request = require('supertest');
const app = require('./app');
const db = require('./db');

describe('Regressão BUG-02', () => {
  // [CORRIGIDO] Fecha o pool no final para o Jest encerrar sem aviso
  afterAll(async () => {
    await db.end();
  });

  // [CORRIGIDO] Timeout maior porque a primeira query pode inicializar o pool
  it('PUT /paciente/999 deve retornar 404', async () => {
    const res = await request(app)
      .put('/paciente/999')
      .send({ nome: 'X', idade: 30, altura: 1.75, peso: 70 });
    expect(res.status).toBe(404);
    expect(res.body.erro).toBe('Paciente não encontrado');
  }, 15000); // 15s de timeout

  // [CORRIGIDO] Timeout padrão maior para o describe inteiro
}, 15000);