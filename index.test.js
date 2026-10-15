const request = require('supertest');
const app = require('./index');
const db = require('./db');

// Mock da conexão com o banco de dados
jest.mock('./db', () => ({
    execute: jest.fn()
}));

describe('Testes das rotas de /paciente', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /', () => {
        test('Deve retornar Hello World!', async () => {
            const response = await request(app).get('/');
            expect(response.statusCode).toBe(200);
            expect(response.text).toBe('Hello World!');
        });
    });

    describe('GET /paciente', () => {
        test('Deve retornar lista de pacientes', async () => {
            const pacientesFicticios = [
                { id: 1, nome: 'Ana', idade: 30, altura: 1.65, peso: 60, imc: 22.03, status: 'Normal' }
            ];

            // Simula o retorno do MySQL [rows, fields]
            db.execute.mockResolvedValueOnce([pacientesFicticios]);

            const response = await request(app).get('/paciente');

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(pacientesFicticios);
            expect(db.execute).toHaveBeenCalledWith('select * from pacientes');
        });

        test('Deve retornar erro 500 se o banco falhar', async () => {
            db.execute.mockRejectedValueOnce(new Error('Erro no MySQL'));

            const response = await request(app).get('/paciente');

            expect(response.statusCode).toBe(500);
            expect(response.body.mensagem).toBe('Erro Interno do Servidor');
        });
    });

    describe('GET /paciente/:id', () => {
        test('Deve retornar um paciente específico pelo ID', async () => {
            const paciente = [{ id: 1, nome: 'Carlos', idade: 25, altura: 1.80, peso: 80, imc: 24.69, status: 'Normal' }];
            db.execute.mockResolvedValueOnce([paciente]);

            const response = await request(app).get('/paciente/1');

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(paciente[0]);
        });

        test('Deve retornar 404 caso o paciente não seja encontrado', async () => {
            db.execute.mockResolvedValueOnce([[]]); // Nenhum resultado retornado

            const response = await request(app).get('/paciente/999');

            expect(response.statusCode).toBe(404);
            expect(response.body.mensagem).toBe('Paciente não encontrado');
        });
    });

    describe('POST /paciente', () => {
        test('Deve cadastrar um novo paciente com sucesso', async () => {
            const novoPaciente = {
                nome: 'Maria',
                idade: 28,
                altura: 1.60,
                peso: 70
            };

            // Simula resposta do INSERT retornando insertId
            db.execute.mockResolvedValueOnce([{ insertId: 5 }]);

            const response = await request(app)
                .post('/paciente')
                .send(novoPaciente);

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('id', 5);
            expect(response.body).toHaveProperty('imc');
            expect(response.body).toHaveProperty('status');
        });

        test('Deve retornar erro 400 se faltarem campos obrigatórios', async () => {
            const response = await request(app)
                .post('/paciente')
                .send({ nome: 'Maria' }); // Faltam idade, altura e peso

            expect(response.statusCode).toBe(400);
            expect(response.body.mensagem).toBe('Verifique se todos os campos estão preenchidos');
        });
    });

    describe('PUT /paciente/:id', () => {
        test('Deve atualizar os dados do paciente com sucesso', async () => {
            const dadosAtualizados = {
                nome: 'Maria Silva',
                idade: 29,
                altura: 1.60,
                peso: 68
            };

            db.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const response = await request(app)
                .put('/paciente/5')
                .send(dadosAtualizados);

            expect(response.statusCode).toBe(200);
            expect(response.body.mensagem).toBe('Paciente atualizado com sucesso.');
        });
    });

    describe('DELETE /paciente/:id', () => {
        test('Deve deletar um paciente com sucesso', async () => {
            db.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

            const response = await request(app).delete('/paciente/1');

            expect(response.statusCode).toBe(200);
            expect(response.body.mensagem).toBe('Paciente apagado com sucesso');
        });

        test('Deve retornar 404 ao tentar deletar id inexistente', async () => {
            db.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

            const response = await request(app).delete('/paciente/999');

            expect(response.statusCode).toBe(404);
            expect(response.body.mensagem).toBe('Paciente não encontrado');
        });
    });
});