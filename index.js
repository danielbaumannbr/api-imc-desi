const express = require('express');
const db = require('./db');
const app = express()
const port = 3000
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.get('/relatorio',async (req, res) => {
  try {
    const [rows]=await db.execute('select * from pacientes');
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({
        mensagem:"Erro Interno do Servidor",
        detalhes:error.message
    });
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})