// backend/routes/assistente.js
const express = require("express");
const router = express.Router();

const {
  iniciarFluxo,
  proximaPergunta
} = require("../services/fluxoDiagnostico");

// Armazena estado simples (por sessão futuramente)
let estadoAtual = null;

// Inicia o assistente
router.get("/iniciar", (req, res) => {
  estadoAtual = iniciarFluxo();
  res.json(estadoAtual);
});

// Envia resposta e recebe próxima pergunta
router.post("/responder", (req, res) => {
  const { resposta } = req.body;

  if (!estadoAtual) {
    return res.status(400).json({ erro: "Fluxo não iniciado" });
  }

  estadoAtual = proximaPergunta(estadoAtual, resposta);
  res.json(estadoAtual);
});

module.exports = router;