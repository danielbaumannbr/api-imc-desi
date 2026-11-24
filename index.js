const express = require('express');
const db = require('./db');
const app = express()
const calcularIMC = require('./imc')
const port = 3000
app.use(express.json())


app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.get('/paciente', async (req, res) => {
  try {
    const [rows] = await db.execute('select * from pacientes');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({
      mensagem: "Erro Interno do Servidor",
      detalhes: error.message
    });
  }
})
app.get('/paciente/obesidade', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM pacientes WHERE status = "Obesidade";');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({
      mensagem: "Erro Interno do Servidor",
      detalhes: error.message
    });
  }
})
app.get('/paciente/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute('select * from pacientes where id=?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({
        mensagem: "Paciente não encontrado",
        detalhes: error.message
      });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({
      mensagem: "Erro Interno do Servidor",
      detalhes: error.message
    });
  }
})

app.post('/paciente', async (req, res) => {
  const { nome, idade, altura, peso } = req.body;
  if (!nome || !idade || !altura || !peso) {
    return res.status(400).json({
      mensagem: "Verifique se todos os campos estão preenchidos",
      detalhes: error.message
    });
  }
  const { imc, status } = calcularIMC(Number(peso), Number(altura));
  try {
    const [rows] = await db.execute('INSERT INTO `pacientes` (`nome`, `idade`, `altura`, `peso`, `imc`, `status`) VALUES (?,?,?,?,?,?);', [nome, idade, altura, peso, imc, status]);
    res.status(201).json({
      id: rows.insertId,
      nome,
      idade,
      altura,
      peso,
      imc,
      status
    });
  } catch (error) {
    res.status(500).json({
      mensagem: "Erro Interno do Servidor",
      detalhes: error.message
    });
  }
})
app.put('/paciente/:id', (req, res) => {
  const { id } = req.params;
  const { nome, idade, altura, peso } = req.body;

  // BUG-03: validação sanitária também no PUT
  if (!nome || idade === undefined || altura === undefined || peso === undefined) {
    return res.status(400).json({ erro: 'Verifique se todos os campos estão preenchidos' });
  }
  if (Number(altura) <= 0 || Number(peso) <= 0) {
    return res.status(400).json({ erro: 'Altura e peso devem ser maiores que zero' });
  }
  if (Number(idade) < 0 || Number(idade) > 120) {
    return res.status(400).json({ erro: 'Idade deve estar entre 0 e 120 anos' });
  }

  const { valor: imc, status } = calcularIMC(peso, altura);
  const sql = 'UPDATE pacientes SET nome=?, idade=?, altura=?, peso=?, imc=?, status=? WHERE id=?';

  db.query(sql, [nome, idade, altura, peso, imc, status, id], (err, result) => {
    if (err) return res.status(500).json({ erro: 'Erro no servidor' });

    // BUG-02: se nenhuma linha foi afetada, o ID não existe → 404
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Paciente não encontrado' });
    }
    return res.status(200).json({ mensagem: 'Paciente atualizado com sucesso.' });
  });
});

app.delete('/paciente/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute('delete from pacientes where id=?', [id]);
    if (rows.affectedRows === 0) {
      return res.status(404).json({
        mensagem: "Paciente não encontrado",
        detalhes: error.message
      });
    }
    res.status(200).json({ mensagem: "Paciente apagado com sucesso" });
  } catch (error) {
    res.status(500).json({
      mensagem: "Erro Interno do Servidor",
      detalhes: error.message
    });
  }
})
if (require.main === module) {
  app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
}
module.exports = app;