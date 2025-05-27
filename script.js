// script.js (unificado para index.html e admin.html)

const usuarios = [
  { nome: "Emerson", senha: "papel12" },
  { nome: "Flavio", senha: "papel13" },
  { nome: "Elias", senha: "papel14" },
  { nome: "Admin", senha: "adm@papel12", admin: true }
];

const horarios = {
  Emerson: {
    segqui: { entrada: "07:30", almoco: "12:00", retorno: "13:00", saida: "17:30" },
    sex: { entrada: "07:30", almoco: "12:00", retorno: "13:00", saida: "16:30" }
  },
  Flavio: {
    segqui: { entrada: "07:30", almoco: "12:00", retorno: "13:00", saida: "17:30" },
    sex: { entrada: "07:30", almoco: "12:00", retorno: "13:00", saida: "16:30" }
  },
  Elias: {
    segqui: { entrada: "08:00", almoco: "12:30", retorno: "13:30", saida: "18:00" },
    sex: { entrada: "08:00", almoco: "12:30", retorno: "13:30", saida: "17:00" }
  }
};

let usuarioAtual = null;

function fazerLogin() {
  const nome = document.getElementById("usuario").value;
  const senha = document.getElementById("senha").value;
  const usuario = usuarios.find(u => u.nome === nome && u.senha === senha);

  if (usuario) {
    usuarioAtual = usuario;
    localStorage.setItem("usuarioLogado", nome);
    if (usuario.admin) {
      window.location.href = "admin.html";
    } else {
      document.getElementById("login-section").classList.add("oculto");
      document.getElementById("painel-funcionario").classList.remove("oculto");
      document.getElementById("nome-funcionario").textContent = nome;
      iniciarRelogio();
      carregarResumoDiario();
    }
  } else {
    document.getElementById("login-erro").classList.remove("oculto");
  }
}

function iniciarRelogio() {
  setInterval(() => {
    const agora = new Date();
    document.getElementById("relogio").textContent = agora.toLocaleTimeString("pt-BR");
  }, 1000);
}

function registrarPonto() {
  if (!navigator.geolocation) return alert("Geolocalização não suportada");

  navigator.geolocation.getCurrentPosition(pos => {
    const dentro = validarLocalizacao(pos.coords.latitude, pos.coords.longitude);
    if (!dentro) return alert("Fora da área permitida para bater ponto.");
    capturarSelfie();
  }, () => alert("Erro ao obter localização."));
}

function validarLocalizacao(lat, lon) {
  const baseLat = -23.477944, baseLon = -46.650889;
  const R = 6371e3;
  const rad = deg => deg * Math.PI / 180;
  const dLat = rad(lat - baseLat);
  const dLon = rad(lon - baseLon);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(baseLat)) * Math.cos(rad(lat)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;
  return distancia <= 50;
}

function capturarSelfie() {
  const video = document.getElementById("camera");
  const canvas = document.getElementById("canvas");
  video.classList.remove("oculto");

  navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
    video.srcObject = stream;

    setTimeout(() => {
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imagem = canvas.toDataURL("image/png");
      stream.getTracks().forEach(track => track.stop());
      video.classList.add("oculto");
      salvarPonto(imagem);
    }, 2000);
  });
}

function salvarPonto(imagem) {
  const nome = usuarioAtual.nome;
  const agora = new Date();
  const data = agora.toISOString().split("T")[0];
  const hora = agora.toTimeString().slice(0, 5);

  const registros = JSON.parse(localStorage.getItem("registrosPonto") || "[]");
  const doDia = registros.find(r => r.nome === nome && r.data === data) || { nome, data, batidas: [], selfies: [], justificativa: "" };

  const tipo = definirTipoBatida(nome, agora, doDia.batidas.length);
  doDia.batidas.push({ hora, tipo });
  doDia.selfies.push(imagem);

  if (!registros.includes(doDia)) registros.push(doDia);
  localStorage.setItem("registrosPonto", JSON.stringify(registros));
  document.getElementById("status-ponto").textContent = `Ponto registrado: ${tipo} ✔️`;
  carregarResumoDiario();
}

function definirTipoBatida(nome, data, ordem) {
  const dia = data.getDay();
  const semana = dia === 5 ? "sex" : "segqui";
  const horariosBase = horarios[nome][semana];
  const horaAtual = data.getHours() + data.getMinutes() / 60;

  const refs = Object.entries(horariosBase);
  for (let i = 0; i < refs.length; i++) {
    const [tipo, hora] = refs[i];
    const [h, m] = hora.split(":");
    const refHora = parseInt(h) + parseInt(m) / 60;
    if (Math.abs(horaAtual - refHora) <= 0.5 && ordem === i) return tipo;
  }
  return "extra";
}

function carregarResumoDiario() {
  const nome = localStorage.getItem("usuarioLogado");
  const hoje = new Date().toISOString().split("T")[0];
  const registros = JSON.parse(localStorage.getItem("registrosPonto") || "[]");
  const dados = registros.find(r => r.nome === nome && r.data === hoje);

  const lista = document.getElementById("lista-pontos");
  lista.innerHTML = "";
  if (!dados) return;
  dados.batidas.forEach((b, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}ª batida: ${b.hora} (${b.tipo})`;
    lista.appendChild(li);
  });
  document.getElementById("resumo-dia").classList.remove("oculto");
}

function voltarPainel() {
  document.getElementById("resumo-dia").classList.add("oculto");
}

// ============ ADMIN =============
function aplicarFiltro() {
  const nome = document.getElementById("filtro-funcionario").value;
  const inicio = document.getElementById("filtro-inicio").value;
  const fim = document.getElementById("filtro-fim").value;

  const registros = JSON.parse(localStorage.getItem("registrosPonto") || "[]");
  const filtrados = registros.filter(r => {
    const condNome = nome === "Todos" || r.nome === nome;
    const condData = (!inicio || r.data >= inicio) && (!fim || r.data <= fim);
    return condNome && condData;
  });

  const tabela = document.getElementById("tabela-registros");
  tabela.innerHTML = "";

  filtrados.forEach(reg => {
    const tr = document.createElement("tr");

    const tdNome = document.createElement("td");
    tdNome.textContent = reg.nome;

    const tdData = document.createElement("td");
    tdData.textContent = reg.data;

    const tdBatidas = document.createElement("td");
    tdBatidas.innerHTML = reg.batidas.map((b, i) => `${i + 1}ª: ${b.hora} (${b.tipo})`).join("<br>");

    const tdSelfie = document.createElement("td");
    tdSelfie.innerHTML = reg.selfies.map(img => `<img src="${img}" width="40" />`).join(" ");

    const tdJust = document.createElement("td");
    const input = document.createElement("input");
    input.value = reg.justificativa || "";
    input.onchange = () => salvarJustificativa(reg, input.value);
    tdJust.appendChild(input);

    const tdAcoes = document.createElement("td");
    const btnDel = document.createElement("button");
    btnDel.textContent = "Excluir";
    btnDel.style.color = "red";
    btnDel.onclick = () => excluirRegistro(reg);
    tdAcoes.appendChild(btnDel);

    tr.append(tdNome, tdData, tdBatidas, tdSelfie, tdJust, tdAcoes);
    tabela.appendChild(tr);
  });
}

function salvarJustificativa(reg, texto) {
  const registros = JSON.parse(localStorage.getItem("registrosPonto") || "[]");
  const atualizados = registros.map(r => r.nome === reg.nome && r.data === reg.data ? { ...r, justificativa: texto } : r);
  localStorage.setItem("registrosPonto", JSON.stringify(atualizados));
}

function excluirRegistro(reg) {
  if (!confirm("Excluir esse registro?")) return;
  const registros = JSON.parse(localStorage.getItem("registrosPonto") || "[]");
  const atualizados = registros.filter(r => !(r.nome === reg.nome && r.data === reg.data));
  localStorage.setItem("registrosPonto", JSON.stringify(atualizados));
  aplicarFiltro();
}

function exportarExcel() {
  const tabela = document.getElementById("tabela-registros");
  const linhas = [...tabela.querySelectorAll("tr")];
  let csv = "Nome,Data,Batidas,Justificativa\n";

  linhas.forEach(linha => {
    const colunas = [...linha.querySelectorAll("td")];
    const linhaCSV = colunas.map(td => '"' + td.textContent.replace(/"/g, '""') + '"').join(",");
    csv += linhaCSV + "\n";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `ponto_${Date.now()}.csv`;
  link.click();
}

// Redirecionamento automático se estiver logado
window.addEventListener("load", () => {
  const usuario = localStorage.getItem("usuarioLogado");
  if (usuario && window.location.pathname.includes("admin") && usuario === "Admin") aplicarFiltro();
});
