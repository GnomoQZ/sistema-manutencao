import { Router } from "express";
const router = Router();

router.get("/", (req, res) => res.json({ ok: true }));

export default router;
// ================= FLUXOS INTELIGENTES =================

const fluxos = {
  Eletrica: [
    { pergunta: "A máquina liga?", sim: 1, nao: "Falha na alimentação elétrica" },
    { pergunta: "Algum LED acende?", sim: "Possível falha na placa eletrônica", nao: "Verificar fusível ou cabo de força" }
  ],
  Mecanica: [
    { pergunta: "O motor faz barulho?", sim: 1, nao: "Motor travado ou queimado" },
    { pergunta: "As engrenagens giram?", sim: "Desgaste no grupo extrator", nao: "Engrenagens quebradas ou presas" }
  ],
  Hidraulica: [
    { pergunta: "A bomba faz barulho?", sim: 1, nao: "Bomba sem alimentação ou queimada" },
    { pergunta: "Sai água pelo bico?", sim: "Possível entupimento parcial", nao: "Mangueira ou válvula obstruída" }
  ]
};

// ================= SESSÕES =================

const sessoes = {};

// ================= ROTAS =================

router.get("/", (req, res) => {
  res.send("🤖 IA Técnica de Máquina de Café rodando");
});

router.post("/diagnostico", (req, res) => {
  let { defeito, resposta, sessionId, categoria, modelo, serie } = req.body;

  if (!sessionId) {
    sessionId = Date.now().toString();
    sessoes[sessionId] = {
      defeito,
      categoria: null,
      indice: 0,
      respostas: [],
      modelo,
      serie
    };

    return res.json({
      sessionId,
      pergunta: "Qual a categoria do problema?",
      opcoes: ["Eletrica", "Mecanica", "Hidraulica"]
    });
  }

  const sessao = sessoes[sessionId];

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

  sessao.respostas.push(resposta);

  if (resposta.toLowerCase() === "sim") {
    if (typeof etapa.sim === "number") {
      sessao.indice = etapa.sim;
      return res.json({
        sessionId,
        pergunta: fluxo[sessao.indice].pergunta,
        opcoes: ["Sim", "Não"]
      });
    } else {
      return finalizar(sessao, etapa.sim, res);
    }
  }

  if (resposta.toLowerCase() === "não" || resposta.toLowerCase() === "nao") {
    if (typeof etapa.nao === "number") {
      sessao.indice = etapa.nao;
      return res.json({
        sessionId,
        pergunta: fluxo[sessao.indice].pergunta,
        opcoes: ["Sim", "Não"]
      });
    } else {
      return finalizar(sessao, etapa.nao, res);
    }
  }

  res.json({ erro: "Resposta inválida" });
});

// ================= FINALIZAÇÃO =================

function finalizar(sessao, diagnostico, res) {
  const sugestao =
    "Realizar inspeção técnica conforme manual do fabricante e normas de segurança";

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

  return res.json({ diagnostico, sugestao });
}

// ================= PDF =================

router.get("/relatorio-pdf", (req, res) => {
  db.all("SELECT * FROM atendimentos", (err, rows) => {
    if (err || rows.length === 0) {
      return res.status(400).send("Nenhum atendimento registrado");
    }

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=relatorio_maquina.pdf");
    doc.pipe(res);

    doc.fontSize(18).text("Relatório Técnico - Máquina de Café", { align: "center" });
    doc.moveDown();

    rows.forEach((item, i) => {
      doc.fontSize(12).text(`Atendimento ${i + 1}`);
      doc.text(`Data: ${new Date(item.data).toLocaleString()}`);
      doc.text(`Modelo: ${item.modelo || "-"}`);
      doc.text(`Série: ${item.serie || "-"}`);
      doc.text(`Defeito: ${item.defeito}`);
      doc.text(`Diagnóstico: ${item.diagnostico}`);
      doc.text(`Sugestão: ${item.sugestao}`);
      doc.moveDown();
    });

    doc.end();
  });
});

// ================= HISTÓRICO =================

router.get("/historico", (req, res) => {
  db.all("SELECT * FROM atendimentos ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ erro: "Erro ao buscar histórico" });
    res.json(rows);
  });
});

export default router;
