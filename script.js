const users = {
  Emerson: { password: 'papel12', isAdmin: false },
  Flavio: { password: 'papel13', isAdmin: false },
  Elias: { password: 'papel14', isAdmin: false },
  Admin: { password: 'adm@papel12', isAdmin: true }
};

const companyLocation = { latitude: -23.477944, longitude: -46.650889 };
let currentUser = null;

window.onload = () => {
  const loginPage = document.getElementById('login-page');
  const employeePage = document.getElementById('employee-page');
  const adminPage = document.getElementById('admin-page');

  const loginForm = document.getElementById('login-form');
  const punchBtn = document.getElementById('punch-btn');
  const captureBtn = document.getElementById('capture-btn');
  const canvas = document.getElementById('canvas');
  const video = document.getElementById('video');
  const logoutBtn = document.getElementById('logout-btn');
  const adminLogoutBtn = document.getElementById('admin-logout-btn');

  loginForm?.addEventListener('submit', e => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if (users[user] && users[user].password === pass) {
      currentUser = { name: user, ...users[user] };
      showPage(currentUser.isAdmin ? 'admin' : 'employee');
    } else {
      alert('Usuário ou senha incorretos.');
    }
  });

  punchBtn?.addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(pos => {
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;
      const isValid = distance(userLat, userLng, companyLocation.latitude, companyLocation.longitude) <= 50;

      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }).then(stream => {
        video.srcObject = stream;
        video.play();
        document.getElementById('camera-section').classList.remove('hidden');
        captureBtn.onclick = () => {
          const ctx = canvas.getContext('2d');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const image = canvas.toDataURL('image/png');
          stream.getTracks().forEach(track => track.stop());

          const now = new Date();
          const record = {
            nome: currentUser.name,
            data: now.toLocaleDateString(),
            hora: now.toLocaleTimeString(),
            foto: image,
            localizacao: isValid ? 'Válida' : 'Inválida'
          };

          saveRecord(record);
          showTicket(record);
        };
      });
    }, () => alert('Permita o uso da localização para registrar o ponto.'));
  });

  logoutBtn?.addEventListener('click', () => location.reload());
  adminLogoutBtn?.addEventListener('click', () => location.reload());

  renderAdminTable();
};

function showPage(page) {
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('employee-page').classList.toggle('hidden', page !== 'employee');
  document.getElementById('admin-page').classList.toggle('hidden', page !== 'admin');
  if (page === 'employee') document.getElementById('welcome-message').textContent = `Bem-vindo, ${currentUser.name}`;
}

function distance(lat1, lng1, lat2, lng2) {
  const R = 6371e3;
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function saveRecord(rec) {
  const registros = JSON.parse(localStorage.getItem('pontoRegistros') || '[]');
  registros.push(rec);
  localStorage.setItem('pontoRegistros', JSON.stringify(registros));
}

function showTicket(rec) {
  document.getElementById('camera-section').classList.add('hidden');
  document.getElementById('ticket-section').classList.remove('hidden');
  document.getElementById('ticket-name').textContent = `Nome: ${rec.nome}`;
  document.getElementById('ticket-date').textContent = `Data: ${rec.data}`;
  document.getElementById('ticket-time').textContent = `Hora: ${rec.hora}`;
  document.getElementById('ticket-photo').src = rec.foto;
  document.getElementById('location-status').innerHTML = `<span class="${rec.localizacao === 'Válida' ? 'text-green-600' : 'text-red-600'}">${rec.localizacao}</span>`;
}

function renderAdminTable() {
  const tabela = document.getElementById('punch-records');
  if (!tabela) return;
  const dados = JSON.parse(localStorage.getItem('pontoRegistros') || '[]');
  dados.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.nome}</td>
      <td>${r.data}</td>
      <td>${r.hora}</td>
      <td><img src="${r.foto}" width="50" height="50"/></td>
      <td>${r.localizacao}</td>
      <td>-</td>
    `;
    tabela.appendChild(tr);
  });
}
