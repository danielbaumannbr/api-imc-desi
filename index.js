/**O motivo de todas as falhas nos três códigos foi o mesmo: **o uso da variável `error` fora do escopo do bloco `catch**`.

Em JavaScript, a variável `error` só passa a existir quando uma exceção é capturada dentro do bloco `catch (error) { ... }`. Ao tentar usá-la antes disso, o Node.js lança um **`ReferenceError`** (`error is not defined`).

---

### Resumo do impacto em cada rota:

1. **`GET /paciente/:id`**
* **Causa:** Uso de `detalhes: error.message` na checagem `if (rows.length === 0)`.
* **Consequência:** Como essa validação estava dentro do bloco `try`, o `ReferenceError` foi capturado pelo `catch`, fazendo a API responder com status **500** em vez do status **404** esperado.


2. **`POST /paciente`**
* **Causa:** Uso de `detalhes: error.message` na checagem de campos obrigatórios (`if (!nome || ...)`).
* **Consequência:** Essa checagem estava no topo da função, fora do `try/catch`. O `ReferenceError` interrompeu a resposta no meio do envio, fazendo o Jest receber um corpo de resposta vazio (`mensagem` como `undefined`).


3. **`DELETE /paciente/:id`**
* **Causa:** Uso de `detalhes: error.message` na checagem `if (rows.affectedRows === 0)`.
* **Consequência:** Do mesmo modo que no `GET`, a exceção interna disparou o bloco `catch`, transformando o retorno de **404** em **500**.



---

### 

* **Status 400 (Bad Request) e 404 (Not Found)** tratam regras de negócio da aplicação, não exceções de sistema. Nesses casos, envie apenas mensagens explicativas customizadas.
* **Status 500 (Internal Server Error)** é o único lugar onde você deve repassar a mensagem do `error.message` capturado no `catch`. */
const express = require('express');
const db = require('./db');
const calcularIMC = require('./imc')
const app = express()
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
})/*
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
*/
app.get('/paciente/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute('select * from pacientes where id=?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({
        mensagem: "Paciente não encontrado"
      });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    res.status(500).json({
      mensagem: "Erro Interno do Servidor",
      detalhes: error.message
    });
  }
});/*
app.post('/paciente',async(req,res)=>{
  const {nome,idade,altura,peso}=req.body;
  if(!nome||!idade||!altura||!peso){
      return res.status(400).json({
        mensagem: "Verifique se todos os campos estão preenchidos",
        detalhes: error.message
      });
  }
  const {imc,status}=calcularIMC(Number(peso),Number(altura));
  try {
      const [rows] = await db.execute('INSERT INTO `pacientes` (`nome`, `idade`, `altura`, `peso`, `imc`, `status`) VALUES (?,?,?,?,?,?);', [nome,idade,altura,peso,imc,status]);
      res.status(201).json({
        id:rows.insertId,
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
})*/
app.post('/paciente', async (req, res) => {
  const { nome, idade, altura, peso } = req.body;

  if (!nome || !idade || !altura || !peso) {
    return res.status(400).json({
      mensagem: "Verifique se todos os campos estão preenchidos"
    });
  }

  const { imc, status } = calcularIMC(Number(peso), Number(altura));

  try {
    const [rows] = await db.execute(
      'INSERT INTO `pacientes` (`nome`, `idade`, `altura`, `peso`, `imc`, `status`) VALUES (?,?,?,?,?,?);',
      [nome, idade, altura, peso, imc, status]
    );

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
});
app.put('/paciente/:id',async(req,res)=>{
  const { id } = req.params;
  const {nome,idade,altura,peso}=req.body;
  if(!nome||!idade||!altura||!peso||!id){
      return res.status(400).json({
        mensagem: "Verifique se todos os campos estão preenchidos",
        detalhes: error.message
      });
  }
  const {imc,status}=calcularIMC(Number(peso),Number(altura));
  try {
      const [rows] = await db.execute('UPDATE `pacientes` SET `nome` = ?, `idade` = ?, `altura` = ?, `peso` = ?, `imc` = ?, `status` = ? WHERE `pacientes`.`id` = ?;', [nome,idade,altura,peso,imc,status,id]);
      res.status(200).json({mensagem:"Paciente atualizado com sucesso."  
      });
  } catch (error) {
    res.status(500).json({
      mensagem: "Erro Interno do Servidor",
      detalhes: error.message
    });
  }
})
app.delete('/paciente/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.execute('delete from pacientes where id=?', [id]);
    if (rows.affectedRows === 0) {
      return res.status(404).json({
        mensagem: "Paciente não encontrado"
      });
    }
    res.status(200).json({ mensagem: "Paciente apagado com sucesso" });
  } catch (error) {
    res.status(500).json({
      mensagem: "Erro Interno do Servidor",
      detalhes: error.message
    });
  }
});
/*
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
    res.status(200).json({mensagem:"Paciente apagado com sucesso"});
  } catch (error) {
    res.status(500).json({
      mensagem: "Erro Interno do Servidor",
      detalhes: error.message
    });
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})*/
// Exemplo de correção no final do app.js:
module.exports = app;

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });
}