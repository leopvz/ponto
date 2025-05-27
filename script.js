// CONFIGURAÇÕES INICIAIS
const funcionarios = {
  "emerson": {
    nome: "Emerson Caldeira",
    setor: "Produção",
    horarios: {
      segqui: { entrada: "07:30", saida: "17:30" },
      sex: { entrada: "07:30", saida: "16:30" }
    }
  },
  "flavio": {
    nome: "Flávio Furtado",
    setor: "Produção",
    horarios: {
      segqui: { entrada: "07:30", saida: "17:30" },
      sex: { entrada: "07:30", saida: "16:30" }
    }
  },
  "elias": {
    nome: "Elias Almo",
    setor: "Design",
    horarios: {
      segqui: { entrada: "08:00", saida: "18:00" },
      sex: { entrada: "08:00", saida: "17:00" }
    }
  }
};

const localizacaoValida = {
  lat: -23.477944, // 23°28'40.6"S
  lng: -46.651000, // 46°39'03.2"W
  raioMetros: 50
};

// FUNÇÕES GERAIS
function horaAtual() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function diaSemana() {
  return new Date().getDay(); // 0 = Domingo
}

function salvarRegistro(registro) {
  const registros = JSON.parse(localStorage.getItem("registros") || "[]");
  registros.push(registro);
  localStorage.setItem("registros", JSON.stringify(registros));
}

function obterRegistrosUsuario(usuario) {
  const registros = JSON.parse(localStorage.getItem("registros") || "[]");
  return registros.filter(r => r.usuario === usuario);
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metros
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

function validarLocalizacaoAtual(callback) {
  if (!navigator.geolocation) {
    alert("Geolocalização não suportada!");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const distancia = calcularDistancia(
        position.coords.latitude,
        position.coords.longitude,
        localizacaoValida.lat,
        localizacaoValida.lng
      );
      callback(distancia <= localizacaoValida.raioMetros);
    },
    () => alert("Não foi possível obter a localização.")
  );
}

function capturarSelfie(callback) {
  const video = document.createElement("video");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
      video.play();

      setTimeout(() => {
        canvas.width = 320;
        canvas.height = 240;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imagemBase64 = canvas.toDataURL("image/png");

        stream.getTracks().forEach(track => track.stop());
        callback(imagemBase64);
      }, 1500);
    })
    .catch(() => alert("Erro ao capturar selfie."));
}

// LOGIN
function login() {
  const usuario = document.getElementById("usuario").value.trim().toLowerCase();
  const senha = document.getElementById("senha").value;

  if (!funcionarios[usuario] || senha !== "123456") {
    alert("Usuário ou senha incorretos.");
    return;
  }

  sessionStorage.setItem("usuario", usuario);
  exibirInterfaceFuncionario();
}

// INTERFACE
function exibirInterfaceFuncionario() {
  const usuario = sessionStorage.getItem("usuario");
  if (!usuario) return;

  document.getElementById("loginArea").style.display = "none";
  document.getElementById("pontoArea").style.display = "block";
  document.getElementById("saudacao").innerText = `Olá, ${funcionarios[usuario].nome}`;

  atualizarRelogio();
  mostrarResumoDoDia();
}

function atualizarRelogio() {
  setInterval(() => {
    const agora = new Date();
    document.getElementById("relogio").innerText = agora.toLocaleTimeString("pt-BR");
  }, 1000);
}

// TIPO DE BATIDA
function determinarTipoBatida(hora) {
  const [h, m] = hora.split(":").map(Number);
  const minutos = h * 60 + m;

  if (minutos < 540) return "Entrada";
  if (minutos < 780) return "Saída para almoço";
  if (minutos < 1020) return "Retorno do almoço";
  if (minutos < 1320) return "Saída do dia";
  return "Ponto Extra";
}

// BATER PONTO
function baterPonto() {
  const usuario = sessionStorage.getItem("usuario");
  if (!usuario) return;

  validarLocalizacaoAtual((autorizado) => {
    if (!autorizado) {
      alert("Você está fora da localização permitida.");
      return;
    }

    capturarSelfie((imagem) => {
      const hora = horaAtual();
      const tipo = determinarTipoBatida(hora);

      const registro = {
        usuario,
        nome: funcionarios[usuario].nome,
        hora,
        tipo,
        data: new Date().toLocaleDateString("pt-BR"),
        selfie: imagem
      };

      salvarRegistro(registro);
      mostrarResumoDoDia();
      alert("Ponto registrado com sucesso!");
    });
  });
}

function mostrarResumoDoDia() {
  const usuario = sessionStorage.getItem("usuario");
  const container = document.getElementById("resumo");
  const hoje = new Date().toLocaleDateString("pt-BR");

  const registros = obterRegistrosUsuario(usuario).filter(r => r.data === hoje);

  container.innerHTML = registros.map(r => `
    <div class="resumo-item">
      <strong>${r.tipo}</strong> às ${r.hora}
      <br>
      <img src="${r.selfie}" alt="Selfie" width="100">
    </div>
  `).join("");
}

function sair() {
  sessionStorage.clear();
  location.reload();
}

// EVENTOS
document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("usuario")) {
    exibirInterfaceFuncionario();
  }

  document.getElementById("btnEntrar").addEventListener("click", login);
  document.getElementById("btnBaterPonto").addEventListener("click", baterPonto);
  document.getElementById("btnSair").addEventListener("click", sair);
});
