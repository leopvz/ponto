// script.js

const users = {
  Emerson: { senha: "papel12", nome: "Emerson" },
  Flavio: { senha: "papel13", nome: "Flavio" },
  Elias: { senha: "papel14", nome: "Elias" }
};

const horarios = {
  Emerson: {
    entrada: ["06:45", "08:15"],
    saidaAlmoco: ["11:30", "13:00"],
    retornoAlmoco: ["12:00", "14:00"],
    saidaFinal: ["16:00", "18:00"]
  },
  Flavio: {
    entrada: ["06:45", "08:15"],
    saidaAlmoco: ["11:30", "13:00"],
    retornoAlmoco: ["12:00", "14:00"],
    saidaFinal: ["16:00", "18:00"]
  },
  Elias: {
    entrada: ["07:30", "09:00"],
    saidaAlmoco: ["12:00", "13:30"],
    retornoAlmoco: ["13:00", "14:30"],
    saidaFinal: ["16:30", "18:00"]
  }
};

const loginDiv = document.getElementById("form-login");
const painel = document.getElementById("painel-ponto");
const boasVindas = document.getElementById("boas-vindas");
const video = document.getElementById("video");
const status = document.getElementById("status");
const relogio = document.getElementById("relogio");
const resumoDiario = document.getElementById("resumo-diario");
const resumoDetalhes = document.getElementById("resumo-detalhes");
const voltarBtn = document.getElementById("voltar");

let usuarioAtual = null;
let stream = null;

function atualizarRelogio() {
  const agora = new Date();
  relogio.textContent = agora.toLocaleTimeString("pt-BR");
}
setInterval(atualizarRelogio, 1000);

function dentroIntervalo(horaAtual, intervalo) {
  const [h1, m1] = intervalo[0].split(":").map(Number);
  const [h2, m2] = intervalo[1].split(":").map(Number);
  const inicio = h1 * 60 + m1;
  const fim = h2 * 60 + m2;
  const [hA, mA] = horaAtual.split(":").map(Number);
  const atual = hA * 60 + mA;
  return atual >= inicio && atual <= fim;
}

function classificarBatida(nome, hora) {
  const ref = horarios[nome];
  if (dentroIntervalo(hora, ref.entrada)) return "Entrada";
  if (dentroIntervalo(hora, ref.saidaAlmoco)) return "Saída Almoço";
  if (dentroIntervalo(hora, ref.retornoAlmoco)) return "Retorno Almoço";
  if (dentroIntervalo(hora, ref.saidaFinal)) return "Saída Final";
  return "Extra";
}

function iniciarCamera() {
  navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
    stream = s;
    video.srcObject = stream;
  }).catch(() => {
    status.textContent = "Erro ao acessar a câmera.";
  });
}

function tirarFoto(callback) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);
  const dataUrl = canvas.toDataURL("image/png");
  callback(dataUrl);
}

function salvarPonto(nome, hora, tipo, foto) {
  const hoje = new Date().toISOString().split("T")[0];
  const chave = `ponto-${nome}-${hoje}`;
  const batidas = JSON.parse(localStorage.getItem(chave) || "[]");
  batidas.push({ hora, tipo, foto });
  localStorage.setItem(chave, JSON.stringify(batidas));
}

function verificarLocalizacao(callback) {
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const long = pos.coords.longitude;
    const dentro = validarRaio(lat, long);
    callback(dentro);
  }, () => callback(false));
}

function validarRaio(lat, long) {
  const refLat = -23.477944;
  const refLong = -46.650889;
  const R = 6371;
  const dLat = (lat - refLat) * Math.PI / 180;
  const dLon = (long - refLong) * Math.PI / 180;
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(refLat*Math.PI/180)*Math.cos(lat*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distancia = R * c * 1000;
  return distancia <= 50;
}

document.getElementById("entrar").onclick = () => {
  const u = document.getElementById("usuario").value;
  const s = document.getElementById("senha").value;
  if (users[u] && users[u].senha === s) {
    usuarioAtual = u;
    loginDiv.classList.add("hidden");
    painel.classList.remove("hidden");
    boasVindas.textContent = `Olá, ${u}!`;
    iniciarCamera();
  } else {
    alert("Usuário ou senha incorretos");
  }
};

document.getElementById("bater-ponto").onclick = () => {
  verificarLocalizacao(valido => {
    if (!valido) return alert("Fora da área permitida para registrar ponto.");
    const agora = new Date();
    const hora = agora.toTimeString().split(":").slice(0, 2).join(":");
    const tipo = classificarBatida(usuarioAtual, hora);
    tirarFoto(foto => {
      salvarPonto(usuarioAtual, hora, tipo, foto);
      status.textContent = `Ponto ${tipo} registrado às ${hora}`;
      mostrarResumo(usuarioAtual);
    });
  });
};

function mostrarResumo(nome) {
  const hoje = new Date().toISOString().split("T")[0];
  const chave = `ponto-${nome}-${hoje}`;
  const batidas = JSON.parse(localStorage.getItem(chave) || "[]");
  let html = `<strong>Data:</strong> ${hoje}<br/><br/>`;
  batidas.forEach((b, i) => {
    html += `${i+1}ª - <strong>${b.tipo}</strong>: ${b.hora}<br/>`;
  });
  html += `<br/><strong>Selfies registradas:</strong> ${batidas.length}`;

  painel.classList.add("hidden");
  resumoDiario.classList.remove("hidden");
  resumoDetalhes.innerHTML = html;
}

voltarBtn.onclick = () => {
  resumoDiario.classList.add("hidden");
  painel.classList.remove("hidden");
};
