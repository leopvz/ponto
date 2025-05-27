// script.js

const users = {
  Emerson: { password: "papel12", nome: "Emerson Caldeira", setor: "Produção", horarios: { semana: ["07:30", "12:00", "13:00", "17:30"], sexta: ["07:30", "12:00", "13:00", "16:30"] } },
  Flavio: { password: "papel13", nome: "Flávio Furtado", setor: "Produção", horarios: { semana: ["07:30", "12:00", "13:00", "17:30"], sexta: ["07:30", "12:00", "13:00", "16:30"] } },
  Elias: { password: "papel14", nome: "Elias Almo", setor: "Design", horarios: { semana: ["08:00", "12:00", "13:00", "18:00"], sexta: ["08:00", "12:00", "13:00", "17:00"] } },
  Admin: { password: "adm@papel12", isAdmin: true }
};

function getUserData() {
  const data = localStorage.getItem("ponto-registros");
  return data ? JSON.parse(data) : [];
}

function saveUserData(registros) {
  localStorage.setItem("ponto-registros", JSON.stringify(registros));
}

function obterHorarioAtual() {
  const agora = new Date();
  return agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function obterDataAtual() {
  return new Date().toISOString().split("T")[0];
}

function definirTipoBatida(horario, user) {
  const hoje = new Date().getDay();
  const ehSexta = hoje === 5;
  const batidasEsperadas = ehSexta ? user.horarios.sexta : user.horarios.semana;
  for (let i = 0; i < batidasEsperadas.length; i++) {
    const [h, m] = batidasEsperadas[i].split(":").map(Number);
    const tempoRef = new Date();
    tempoRef.setHours(h, m, 0, 0);

    const agora = new Date();
    const dif = Math.abs(agora - tempoRef);
    if (dif <= 30 * 60000) return `${i + 1}ª`;
  }
  return "Extra";
}

function registrarBatida(nome) {
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const distancia = calcularDistancia(
      pos.coords.latitude,
      pos.coords.longitude,
      -23.47794444444444,
      -46.65088888888889
    );

    if (distancia > 50) return alert("Fora da localização permitida.");

    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    video.srcObject = stream;
    video.play();

    setTimeout(() => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      const selfie = canvas.toDataURL("image/png");

      const registros = getUserData();
      const hoje = obterDataAtual();
      let registro = registros.find((r) => r.nome === nome && r.data === hoje);
      if (!registro) {
        registro = { nome, data: hoje, batidas: [], selfies: [], justificativa: "" };
        registros.push(registro);
      }

      const hora = obterHorarioAtual();
      const tipo = definirTipoBatida(hora, users[nome]);
      registro.batidas.push({ tipo, hora });
      registro.selfies.push(selfie);
      saveUserData(registros);

      alert(`Ponto registrado (${tipo}) às ${hora}`);
      stream.getTracks().forEach((t) => t.stop());
    }, 1000);
  });
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}
