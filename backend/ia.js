import fs from "fs";

const defeitos = JSON.parse(
  fs.readFileSync("./dados/defeitos.json", "utf8")
);

export function diagnosticar(sintoma) {
  const defeito = defeitos.find(d =>
    sintoma.toLowerCase().includes(d.nome.toLowerCase())
  );

  if (!defeito) {
    return {
      resposta: "Defeito não reconhecido. Descreva melhor o sintoma."
    };
  }

  return {
    defeito: defeito.nome,
    etapas: defeito.etapas,
    perguntas: defeito.perguntas
  };
}
