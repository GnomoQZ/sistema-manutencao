const chat = document.getElementById("chat");
const input = document.getElementById("input");
const opcoesDiv = document.getElementById("opcoes");

let sessionId = null;

function addMsg(text, type) {
  const div = document.createElement("div");
  div.className = `msg ${type}`;
  div.innerText = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function mostrarOpcoes(opcoes) {
  opcoesDiv.innerHTML = "";

  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexWrap = "wrap";
  container.style.gap = "8px";

  opcoes.forEach(opcao => {
    const btn = document.createElement("button");
    btn.innerText = opcao;
    btn.onclick = () => enviarResposta(opcao);
    container.appendChild(btn);
  });

  opcoesDiv.appendChild(container);
}

function limparOpcoes() {
  opcoesDiv.innerHTML = "";
}

async function enviarResposta(resposta) {
  addMsg(resposta, "user");
  limparOpcoes();

  const res = await fetch("http://localhost:3000/diagnostico", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      defeito: "Falha na máquina",
      resposta
    })
  });

  const data = await res.json();

  if (data.pergunta) {
    addMsg(data.pergunta, "bot");
    if (data.opcoes) {
      mostrarOpcoes(data.opcoes);
    }
  }

  if (data.diagnostico) {
    addMsg("✅ Diagnóstico: " + data.diagnostico, "bot");
    addMsg("🛠️ Sugestão: " + data.sugestao, "bot");
  }
}

async function iniciar() {
  const res = await fetch("http://localhost:3000/diagnostico", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      defeito: "Falha na máquina"
    })
  });

  const data = await res.json();
  sessionId = data.sessionId;

  addMsg(data.pergunta, "bot");
  mostrarOpcoes(data.opcoes);
}

window.onload = iniciar;