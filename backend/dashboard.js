fetch("http://localhost:3000/historico")
  .then(res => res.json())
  .then(dados => {
    document.getElementById("total").innerText = dados.length;

    const defeitos = {};
    const maquinas = {};

    dados.forEach(item => {
      defeitos[item.defeito] = (defeitos[item.defeito] || 0) + 1;

      const chaveMaquina = `${item.modelo} - ${item.serie}`;
      maquinas[chaveMaquina] = (maquinas[chaveMaquina] || 0) + 1;
    });

    const listaDefeitos = document.getElementById("defeitos");
    Object.entries(defeitos)
      .sort((a, b) => b[1] - a[1])
      .forEach(([defeito, qtd]) => {
        listaDefeitos.innerHTML += `<li>${defeito} (${qtd})</li>`;
      });

    const listaMaquinas = document.getElementById("maquinas");
    Object.entries(maquinas)
      .sort((a, b) => b[1] - a[1])
      .forEach(([maq, qtd]) => {
        listaMaquinas.innerHTML += `<li>${maq} (${qtd})</li>`;
      });
  });