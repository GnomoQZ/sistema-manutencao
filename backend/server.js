import PDFDocument from "pdfkit";
import fs from "fs";
import express from "express";
import cors from "cors";
import db from "./database.js";


function analisarHistorico(defeito) {
  const historico = JSON.parse(fs.readFileSync("historico.json"));

  const ocorrencias = historico.filter(
    h => h.defeito.toLowerCase() === defeito.toLowerCase()
  );

  if (ocorrencias.length === 0) {
    return null;
  }

  const contador = {};

  ocorrencias.forEach(h => {
    contador[h.diagnostico] = (contador[h.diagnostico] || 0) + 1;
  });

  const diagnosticoMaisComum = Object.keys(contador)
    .reduce((a, b) => contador[a] > contador[b] ? a : b);

  return {
    total: ocorrencias.length,
    diagnosticoMaisComum
  };
}

const app = express();

app.use(cors());
app.use(express.json());

// rota de teste
app.get("/", (req, res) => {
  res.send("IA de Manutenção de Máquina de Café rodando");
});

// rota principal da IA
const sessoes = {};

app.post("/diagnostico", (req, res) => {
  let { defeito, resposta, sessionId } = req.body;

  // cria sessão
  if (!sessionId) {
    sessionId = Date.now().toString();
    sessoes[sessionId] = {
      defeito,
      etapa: 0,
      respostas: [],
      modelo: req.body.modelo,
      serie: req.body.serie,

    };
  }

  const sessao = sessoes[sessionId];

  if (resposta) {
    sessao.respostas.push(resposta.toLowerCase());
    sessao.etapa++;
  }

  // normaliza 
  
  const defeitoNormalizado = sessao.defeito
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const aprendizado = analisarHistorico(
  defeitoNormalizado.includes("nao liga")
    ? "Não liga"
    : defeitoNormalizado.includes("nao extrai")
      ? "Não extrai café"
      : ""
);


  // FLUXO: NÃO 
  if (aprendizado && aprendizado.total >= 3) {
  return res.json({
    sessionId,
    aprendizado: true,
    mensagem: `Com base em ${aprendizado.total} atendimentos anteriores, o problema mais comum é:`,
    diagnostico: aprendizado.diagnosticoMaisComum
  });
}

  if (defeitoNormalizado.includes("nao liga")) {
    
    const perguntas = [
      "A tomada tem energia?",
      "O cabo de força está em boas condições?",
      "Algum LED acende?"
    ];

    if (sessao.etapa < perguntas.length) {
      return res.json({
        sessionId,
        pergunta: perguntas[sessao.etapa]
      });
    }

    const registro = {
  data: new Date().toISOString(),
  modelo: sessao.modelo,
  serie: sessao.serie,
  defeito: "Não liga",
  pecas: sessao.pecas,
  respostas: sessao.respostas,
  diagnostico: "Falha elétrica",
  sugestao: "Verificar fusível, botão liga/desliga e placa eletrônica"
};

db.run(
  `
  INSERT INTO atendimentos 
  (data, modelo, serie, defeito, diagnostico, sugestao, pecas)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  [
    new Date().toISOString(),
    sessao.modelo,
    sessao.serie,
    defeito,
    respostaFinal,
    sugestaoFinal,
    sessao.pecas
  ],
  function (err) {
    if (err) {
      console.error("Erro ao salvar no banco:", err);
      return res.status(500).json({ erro: "Erro ao salvar atendimento" });
    }

    res.json({
      mensagem: respostaFinal,
      sugestao: sugestaoFinal
    });
  }
);
 return res.json({
  sessionId,
  diagnostico: registro.diagnostico,
  sugestao: registro.sugestao
});

    
  }

  // FLUXO: NÃO EXTRAI
  if (aprendizado && aprendizado.total >= 3) {
  return res.json({
    sessionId,
    aprendizado: true,
    mensagem: `Com base em ${aprendizado.total} atendimentos anteriores, o problema mais comum é:`,
    diagnostico: aprendizado.diagnosticoMaisComum
  });
}

  if (defeitoNormalizado.includes("nao extrai")) {
    const perguntas = [
      "A bomba faz barulho?",
      "Sai água sem cápsula?",
      "A cápsula é perfurada?"
    ];

    if (sessao.etapa < perguntas.length) {
      return res.json({
        sessionId,
        pergunta: perguntas[sessao.etapa]
      });
    }

    const registro = {
  data: new Date().toISOString(),
  modelo: sessao.modelo,
  serie: sessao.serie,
  defeito: "Não extrai café",
  respostas: sessao.respostas,
  diagnostico: "Falha no sistema de extração",
  sugestao: "Verificar bomba, mangueiras, válvula e sensores"
  
};

const historico = JSON.parse(fs.readFileSync("historico.json"));
historico.push(registro);
fs.writeFileSync("historico.json", JSON.stringify(historico, null, 2));

return res.json({
  sessionId,
  diagnostico: registro.diagnostico,
  sugestao: registro.sugestao
});

  }

  return res.json({
    mensagem: "Defeito não reconhecido"
  });
});
app.get("/relatorio-pdf", (req, res) => {
  const historico = JSON.parse(fs.readFileSync("historico.json"));

  if (historico.length === 0) {
    return res.status(400).send("Nenhum atendimento registrado");
  }

  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=relatorio_maquina.pdf");

  doc.pipe(res);

  doc.fontSize(18).text("Relatório Técnico da Máquina", { align: "center" });
  doc.moveDown();

  historico.forEach((item, index) => {
    doc.fontSize(12).text(`Atendimento ${index + 1}`);
    doc.text(`Data: ${new Date(item.data).toLocaleString()}`);
    doc.text(`Defeito: ${item.defeito}`);
    doc.text(`Respostas: ${item.respostas.join(", ")}`);
    doc.text(`Diagnóstico: ${item.diagnostico}`);
    doc.text(`Sugestão: ${item.sugestao}`);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();
  });

  doc.end();
});

app.get("/historico", (req, res) => {
  db.all(
    "SELECT * FROM atendimentos ORDER BY id DESC",
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          erro: "Erro ao buscar histórico"
        });
      }

      res.json(rows);
    }
  );
});

// servidor
app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});

