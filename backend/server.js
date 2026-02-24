import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";

// ================= APP =================
const app = express();
app.use(cors());
app.use(express.json());

// ================= DATABASE =================
const db = new sqlite3.Database("./database.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS atendimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT,
      modelo TEXT,
      serie TEXT,
      defeito TEXT,
      diagnostico TEXT,
      sugestao TEXT
    )
  `);
});

// ================= FLUXOS =================
const fluxos = {
  Eletrica: [
    {
      pergunta: "A máquina liga?",
      sim: 1,
      nao: "Falha na alimentação elétrica"
    },
    {
      pergunta: "Algum LED acende?",
      sim: "Possível falha na placa eletrônica",
      nao: "Verificar fusível ou cabo de força"
    }
  ],

  Mecanica: [
    {
      pergunta: "O motor faz barulho?",
      sim: 1,
      nao: "Motor travado ou queimado"
    },
    {
      pergunta: "As engrenagens giram?",
      sim: "Desgaste no grupo extrator",
      nao: "Engrenagens quebradas ou presas"
    }
  ],

  Hidraulica: [
    {
      pergunta: "A bomba faz barulho?",
      sim: 1,
      nao: "Bomba sem alimentação ou queimada"
    },
    {
      pergunta: "Sai água pelo bico?",
      sim: "Possível entupimento parcial",
      nao: "Mangueira ou válvula obstruída"
    }
  ]
};

// ================= SESSÕES =================
const sessoes = {};

// ================= ROTAS =================
app.get("/", (req, res) => {
  res.send("✅ Backend IA Manutenção rodando no Render");
});

app.post("/diagnostico", (req, res) => {
  let { sessionId, resposta, defeito, modelo, serie } = req.body;

  // cria sessão
  if (!sessionId) {
    sessionId = Date.now().toString();
    sessoes[sessionId] = {
      defeito,
      modelo,
      serie,
      categoria: null,
      indice: 0
    };

    return res.json({
      sessionId,
      pergunta: "Qual a categoria do problema?",
      opcoes: ["Eletrica", "Mecanica", "Hidraulica"]
    });
  }

  const sessao = sessoes[sessionId];

  // define categoria
  if (!sessao.categoria) {
    sessao.categoria = resposta;
    return res.json({
      sessionId,
      pergunta: fluxos[sessao.categoria][0].pergunta,
      opcoes: ["Sim", "Não"]
    });
  }

  const fluxo = fluxos[sessao.categoria];
  const etapa = fluxo[sessao.indice];

  if (resposta.toLowerCase() === "sim") {
    if (typeof etapa.sim === "number") {
      sessao.indice = etapa.sim;
      return res.json({
        sessionId,
        pergunta: fluxo[sessao.indice].pergunta,
        opcoes: ["Sim", "Não"]
      });
    }
    return finalizar(sessao, etapa.sim, res);
  }

  if (resposta.toLowerCase() === "não" || resposta.toLowerCase() === "nao") {
    if (typeof etapa.nao === "number") {
      sessao.indice = etapa.nao;
      return res.json({
        sessionId,
        pergunta: fluxo[sessao.indice].pergunta,
        opcoes: ["Sim", "Não"]
      });
    }
    return finalizar(sessao, etapa.nao, res);
  }

  res.status(400).json({ erro: "Resposta inválida" });
});

// ================= FINALIZAÇÃO =================
function finalizar(sessao, diagnostico, res) {
  const sugestao =
    "Realizar inspeção técnica conforme manual do fabricante";

  db.run(
    `
    INSERT INTO atendimentos 
    (data, modelo, serie, defeito, diagnostico, sugestao)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      new Date().toISOString(),
      sessao.modelo,
      sessao.serie,
      sessao.defeito,
      diagnostico,
      sugestao
    ]
  );

  return res.json({
    diagnostico,
    sugestao
  });
}

// ================= HISTÓRICO =================
app.get("/historico", (req, res) => {
  db.all("SELECT * FROM atendimentos ORDER BY id DESC", (err, rows) => {
    if (err) {
      return res.status(500).json({ erro: "Erro ao buscar histórico" });
    }
    res.json(rows);
  });
});

// ================= SERVIDOR =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Servidor rodando na porta", PORT);
});
