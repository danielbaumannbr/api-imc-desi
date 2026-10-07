const express = require('express');
const db = require('./db');
const app = express()
const port = 3000
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.get('/relatorio', async (req, res) => {
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
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})