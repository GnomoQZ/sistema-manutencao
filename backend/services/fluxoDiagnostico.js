// backend/services/fluxoDiagnostico.js

function iniciarFluxo() {
  return {
    etapa: "tipo_maquina",
    dados: {},
    pergunta: "Qual o tipo da máquina de café?",
    opcoes: ["Automática", "Espresso", "Solúvel", "Comercial/Industrial"]
  };
}

function proximaPergunta(estado, resposta) {
  const { etapa, dados } = estado;

  // REGISTRA RESPOSTA
  dados[etapa] = resposta;

  // --------------------------
  // ETAPA 1 – TIPO
  // --------------------------
  if (etapa === "tipo_maquina") {
    return {
      etapa: "categoria",
      dados,
      pergunta: "Qual a natureza da falha?",
      opcoes: ["Elétrica", "Mecânica", "Hidráulica"]
    };
  }

  // --------------------------
  // ELÉTRICA
  // --------------------------
  if (etapa === "categoria" && resposta === "Elétrica") {
    return {
      etapa: "eletrica_liga",
      dados,
      pergunta: "A máquina liga?",
      opcoes: ["Sim", "Não"]
    };
  }

  if (etapa === "eletrica_liga") {
    return {
      etapa: "eletrica_display",
      dados,
      pergunta: "O display acende?",
      opcoes: ["Sim", "Não"]
    };
  }

  if (etapa === "eletrica_display") {
    return {
      etapa: "eletrica_resistencia",
      dados,
      pergunta: "A resistência aquece?",
      opcoes: ["Sim", "Não"]
    };
  }

  if (etapa === "eletrica_resistencia") {
    return resultadoEletrico(dados);
  }

  // --------------------------
  // MECÂNICA
  // --------------------------
  if (etapa === "categoria" && resposta === "Mecânica") {
    return {
      etapa: "mecanica_barulho",
      dados,
      pergunta: "Há barulho anormal?",
      opcoes: ["Sim", "Não"]
    };
  }

  if (etapa === "mecanica_barulho") {
    return {
      etapa: "mecanica_travamento",
      dados,
      pergunta: "Há travamento do grupo?",
      opcoes: ["Sim", "Não"]
    };
  }

  if (etapa === "mecanica_travamento") {
    return resultadoMecanico(dados);
  }

  // --------------------------
  // HIDRÁULICA
  // --------------------------
  if (etapa === "categoria" && resposta === "Hidráulica") {
    return {
      etapa: "hidraulica_bomba",
      dados,
      pergunta: "A bomba aciona?",
      opcoes: ["Sim", "Não"]
    };
  }

  if (etapa === "hidraulica_bomba") {
    return {
      etapa: "hidraulica_agua",
      dados,
      pergunta: "Sai água pelo grupo?",
      opcoes: ["Sim", "Não"]
    };
  }

  if (etapa === "hidraulica_agua") {
    return resultadoHidraulico(dados);
  }

  return resultadoFinal("Diagnóstico inconclusivo", "Encaminhar para análise técnica");
}

// --------------------------
// RESULTADOS POR SISTEMA
// --------------------------

function resultadoEletrico(dados) {
  if (dados.eletrica_liga === "Não") {
    return resultadoFinal("Falha de alimentação", "Verificar cabo, fusível e placa de potência");
  }

  if (dados.eletrica_resistencia === "Não") {
    return resultadoFinal("Falha de aquecimento", "Verificar resistência e sensores térmicos");
  }

  return resultadoFinal("Possível falha eletrônica", "Verificar placa principal");
}

function resultadoMecanico(dados) {
  if (dados.mecanica_travamento === "Sim") {
    return resultadoFinal("Travamento mecânico", "Verificar grupo extrator e engrenagens");
  }

  if (dados.mecanica_barulho === "Sim") {
    return resultadoFinal("Desgaste mecânico", "Verificar motor e engrenagens");
  }

  return resultadoFinal("Ajuste mecânico necessário", "Inspecionar componentes móveis");
}

function resultadoHidraulico(dados) {
  if (dados.hidraulica_bomba === "Não") {
    return resultadoFinal("Falha na bomba", "Verificar bomba e alimentação hidráulica");
  }

  if (dados.hidraulica_agua === "Não") {
    return resultadoFinal("Obstrução hidráulica", "Verificar mangueiras e válvulas");
  }

  return resultadoFinal("Possível baixa pressão", "Verificar regulagem e vazamentos");
}

function resultadoFinal(classificacao, sugestao) {
  return {
    etapa: "final",
    classificacao,
    sugestao
  };
}

module.exports = {
  iniciarFluxo,
  proximaPergunta
};