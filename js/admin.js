// js/admin.js - Logika Dashboard Admin
// ============================================

// State global
let allParts = [];
let allCabang = [];
let allTestimoni = [];

// ============================================
// INISIALISASI
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Cek session login
  if (sessionStorage.getItem('mmg_admin_logged_in') === 'true') {
    showDashboard();
    loadAllData();
  }
  
  // Setup event listeners
  setupLoginForm();
  setupNavigation();
  setupForms();
  setupModals();
  populateKategoriSelect();
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getImageUrl(img) {
  if (!img) return '';
  if (img.startsWith('http://') || img.startsWith('https://')) {
    return img;
  }
  return '../images/' + img;
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ============================================
// LOGIN
// ============================================

function setupLoginForm() {
  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('loginPassword').value;
    
    if (password === CONFIG.ADMIN_PASSWORD) {
      sessionStorage.setItem('mmg_admin_logged_in', 'true');
      document.getElementById('loginError').textContent = '';
      document.getElementById('loginPassword').value = '';
      showDashboard();
      loadAllData();
      showToast('Login berhasil!', 'success');
    } else {
      document.getElementById('loginError').textContent = 'Password salah!';
    }
  });
}

function logout() {
  sessionStorage.removeItem('mmg_admin_logged_in');
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  showToast('Logout berhasil!', 'success');
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';
}

// ============================================
// NAVIGASI
// ============================================

function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      switchPage(btn.dataset.page);
    });
  });
  
  document.getElementById('logoutBtn').addEventListener('click', logout);
}

function switchPage(pageName) {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageName);
  });
  
  document.querySelectorAll('.page').forEach(page => {
    page.classList.toggle('active', page.id === `page-${pageName}`);
  });
  
  if (pageName === 'parts') renderParts();
  if (pageName === 'cabang') renderCabang();
  if (pageName === 'testimoni') renderTestimoni();
}

// ============================================
// API CALLS
// ============================================

async function apiGet(action) {
  try {
    const url = `${CONFIG.API_URL}?action=${action}&key=${CONFIG.API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (err) {
    console.error(`Error fetching ${action}:`, err);
    showToast(`Error: ${err.message}`, 'error');
    return [];
  }
}

async function apiPost(action, payload = {}) {
  try {
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: CONFIG.API_KEY,
        action: action,
        ...payload
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (err) {
    console.error(`Error posting ${action}:`, err);
    showToast(`Error: ${err.message}`, 'error');
    return null;
  }
}

async function loadAllData() {
  showToast('Memuat data...', 'success');
  
  try {
    const [parts, cabang, testimoni] = await Promise.all([
      apiGet('getParts'),
      apiGet('getCabang'),
      apiGet('getTestimoni')
    ]);
    
    allParts = parts || [];
    allCabang = cabang || [];
    allTestimoni = testimoni || [];
    
    updateStats();
    renderParts();
    renderCabang();
    renderTestimoni();
    
    showToast('Data berhasil dimuat!', 'success');
  } catch (err) {
    console.error('Error loading data:', err);
    showToast('Gagal memuat data!', 'error');
  }
}

async function refreshAll() {
  await loadAllData();
}

// ============================================
// STATS
// ============================================

function updateStats() {
  document.getElementById('statParts').textContent = allParts.length;
  document.getElementById('statCabang').textContent = allCabang.length;
  document.getElementById('statTestimoni').textContent = allTestimoni.length;
}

// ============================================
// POPULATE KATEGORI
// ============================================

function populateKategoriSelect() {
  const filterSelect = document.getElementById('filterKategori');
  const modalSelect = document.getElementById('partKategori');
  
  if (filterSelect) {
    CONFIG.KATEGORI.forEach(kat => {
      filterSelect.innerHTML += `<option value="${kat.key}">${kat.label}</option>`;
    });
  }
  
  if (modalSelect) {
    CONFIG.KATEGORI.forEach(kat => {
      modalSelect.innerHTML += `<option value="${kat.key}">${kat.label}</option>`;
    });
  }
}

// ============================================
// RENDER PARTS
// ============================================

function filterParts() {
  renderParts();
}

function renderParts() {
  const searchTerm = document.getElementById('searchPart')?.value?.toLowerCase() || '';
  const filterKategori = document.getElementById('filterKategori')?.value || 'all';
  
  const filtered = allParts.filter(part => {
    const matchSearch = !searchTerm || 
      (part.nama && part.nama.toLowerCase().includes(searchTerm)) ||
      (part.kode && part.kode.toLowerCase().includes(searchTerm)) ||
      (part.kompatibel && part.kompatibel.toLowerCase().includes(searchTerm));
    
    const matchKategori = filterKategori === 'all' || part.kategori === filterKategori;
    
    return matchSearch && matchKategori;
  });
  
  const tbody = document.getElementById('partsTableBody');
  
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#AEAEB4;">Tidak ada part ditemukan</td></tr>';
    return;
  }
  
  tbody.innerHTML = filtered.map(part => `
    <tr>
      <td>${part.id}</td>
      <td>
        <div class="thumb">
          <img src="${getImageUrl(part.img)}" alt="${part.nama || ''}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23f2f2f5%22/%3E%3Ctext x=%2250%22 y=%2255%22 text-anchor=%22middle%22 font-size=%2212%22 fill=%22%23aeaeb4%22%3ENo img%3C/text%3E%3C/svg%3E'">
        </div>
      </td>
      <td><strong>${part.nama}</strong></td>
      <td><code>${part.kode}</code></td>
      <td><span class="badge badge-active">${part.kategori}</span></td>
      <td>
        <button class="action-btn edit-btn" onclick="editPart(${part.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deletePart(${part.id})">Hapus</button>
      </td>
    </tr>
  `).join('');
}

// ============================================
// CRUD PARTS
// ============================================

function openPartModal(partId = null) {
  const modal = document.getElementById('partModal');
  const form = document.getElementById('partForm');
  const title = document.getElementById('partModalTitle');
  
  form.reset();
  
  if (partId) {
    const part = allParts.find(p => p.id == partId);
    if (part) {
      title.textContent = 'Edit Part';
      document.getElementById('partId').value = part.id;
      document.getElementById('partNama').value = part.nama || '';
      document.getElementById('partKode').value = part.kode || '';
      document.getElementById('partKategori').value = part.kategori || '';
      document.getElementById('partKompatibel').value = part.kompatibel || '';
      document.getElementById('partImg').value = part.img || '';
      document.getElementById('partDeskripsi').value = part.deskripsi || '';
    }
  } else {
    title.textContent = 'Tambah Part';
    document.getElementById('partId').value = '';
  }
  
  modal.classList.add('show');
}

function editPart(id) {
  openPartModal(id);
}

async function deletePart(id) {
  if (!confirm('Yakin ingin menghapus part ini?')) return;
  
  const result = await apiPost('deletePart', { id: id });
  
  if (result?.success) {
    showToast('Part berhasil dihapus!', 'success');
    await loadAllData();
  } else {
    showToast('Gagal menghapus part!', 'error');
  }
}

// ============================================
// RENDER CABANG
// ============================================

function renderCabang() {
  const tbody = document.getElementById('cabangTableBody');
  
  if (!allCabang.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#AEAEB4;">Tidak ada cabang</td></tr>';
    return;
  }
  
  tbody.innerHTML = allCabang.map(cabang => `
    <tr>
      <td>${cabang.id}</td>
      <td>
        <div class="thumb">
          <img src="${getImageUrl(cabang.img)}" alt="${cabang.nama || ''}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23f2f2f5%22/%3E%3Ctext x=%2250%22 y=%2255%22 text-anchor=%22middle%22 font-size=%2212%22 fill=%22%23aeaeb4%22%3ENo img%3C/text%3E%3C/svg%3E'">
        </div>
      </td>
      <td><strong>${cabang.nama}</strong></td>
      <td>${cabang.area}</td>
      <td>+${cabang.wa}</td>
      <td>${cabang.jam}</td>
      <td>
        <button class="action-btn edit-btn" onclick="editCabang(${cabang.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteCabang(${cabang.id})">Hapus</button>
      </td>
    </tr>
  `).join('');
}

// ============================================
// CRUD CABANG
// ============================================

function openCabangModal(cabangId = null) {
  const modal = document.getElementById('cabangModal');
  const form = document.getElementById('cabangForm');
  const title = document.getElementById('cabangModalTitle');
  
  form.reset();
  
  if (cabangId) {
    const cabang = allCabang.find(c => c.id == cabangId);
    if (cabang) {
      title.textContent = 'Edit Cabang';
      document.getElementById('cabangId').value = cabang.id;
      document.getElementById('cabangNama').value = cabang.nama || '';
      document.getElementById('cabangArea').value = cabang.area || '';
      document.getElementById('cabangJam').value = cabang.jam || '';
      document.getElementById('cabangBuka').value = cabang.buka || '';
      document.getElementById('cabangTutup').value = cabang.tutup || '';
      document.getElementById('cabangWa').value = cabang.wa || '';
      document.getElementById('cabangMaps').value = cabang.maps || '';
      document.getElementById('cabangImg').value = cabang.img || '';
    }
  } else {
    title.textContent = 'Tambah Cabang';
    document.getElementById('cabangId').value = '';
  }
  
  modal.classList.add('show');
}

function editCabang(id) {
  openCabangModal(id);
}

async function deleteCabang(id) {
  if (!confirm('Yakin ingin menghapus cabang ini?')) return;
  
  const result = await apiPost('deleteCabang', { id: id });
  
  if (result?.success) {
    showToast('Cabang berhasil dihapus!', 'success');
    await loadAllData();
  } else {
    showToast('Gagal menghapus cabang!', 'error');
  }
}

// ============================================
// RENDER TESTIMONI
// ============================================

function renderTestimoni() {
  const tbody = document.getElementById('testimoniTableBody');
  
  if (!allTestimoni.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#AEAEB4;">Tidak ada testimoni</td></tr>';
    return;
  }
  
  tbody.innerHTML = allTestimoni.map(testi => `
    <tr>
      <td>${testi.id}</td>
      <td><strong>${testi.nama}</strong></td>
      <td>${testi.meta}</td>
      <td>${'⭐'.repeat(Number(testi.rating) || 0)}</td>
      <td style="max-width:300px;">${testi.text}</td>
      <td>
        <span class="badge ${testi.aktif === 'YA' ? 'badge-active' : 'badge-inactive'}">
          ${testi.aktif === 'YA' ? 'Aktif' : 'Nonaktif'}
        </span>
      </td>
      <td>
        <button class="action-btn edit-btn" onclick="editTestimoni(${testi.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteTestimoni(${testi.id})">Hapus</button>
      </td>
    </tr>
  `).join('');
}

// ============================================
// CRUD TESTIMONI
// ============================================

function openTestimoniModal(testimoniId = null) {
  const modal = document.getElementById('testimoniModal');
  const form = document.getElementById('testimoniForm');
  const title = document.getElementById('testimoniModalTitle');
  
  form.reset();
  
  if (testimoniId) {
    const testi = allTestimoni.find(t => t.id == testimoniId);
    if (testi) {
      title.textContent = 'Edit Testimoni';
      document.getElementById('testimoniId').value = testi.id;
      document.getElementById('testimoniNama').value = testi.nama || '';
      document.getElementById('testimoniMeta').value = testi.meta || '';
      document.getElementById('testimoniRating').value = testi.rating || '5';
      document.getElementById('testimoniText').value = testi.text || '';
      document.getElementById('testimoniAktif').value = testi.aktif || 'YA';
    }
  } else {
    title.textContent = 'Tambah Testimoni';
    document.getElementById('testimoniId').value = '';
  }
  
  modal.classList.add('show');
}

function editTestimoni(id) {
  openTestimoniModal(id);
}

async function deleteTestimoni(id) {
  if (!confirm('Yakin ingin menghapus testimoni ini?')) return;
  
  const result = await apiPost('deleteTestimoni', { id: id });
  
  if (result?.success) {
    showToast('Testimoni berhasil dihapus!', 'success');
    await loadAllData();
  } else {
    showToast('Gagal menghapus testimoni!', 'error');
  }
}

// ============================================
// FORM HANDLERS
// ============================================

function setupForms() {
  // Part Form
  document.getElementById('partForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const partData = {
      kategori: document.getElementById('partKategori').value,
      nama: document.getElementById('partNama').value,
      kode: document.getElementById('partKode').value,
      kompatibel: document.getElementById('partKompatibel').value,
      img: document.getElementById('partImg').value,
      deskripsi: document.getElementById('partDeskripsi').value
    };
    
    const partId = document.getElementById('partId').value;
    let result;
    
    if (partId) {
      result = await apiPost('updatePart', { id: Number(partId), data: partData });
    } else {
      result = await apiPost('addPart', { data: partData });
    }
    
    if (result?.success) {
      closeModal('partModal');
      showToast('Part berhasil disimpan!', 'success');
      await loadAllData();
    } else {
      showToast('Gagal menyimpan part!', 'error');
    }
  });
  
  // Cabang Form
  document.getElementById('cabangForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const cabangData = {
      nama: document.getElementById('cabangNama').value,
      area: document.getElementById('cabangArea').value,
      jam: document.getElementById('cabangJam').value,
      buka: document.getElementById('cabangBuka').value,
      tutup: document.getElementById('cabangTutup').value,
      wa: document.getElementById('cabangWa').value,
      maps: document.getElementById('cabangMaps').value,
      img: document.getElementById('cabangImg').value
    };
    
    const cabangId = document.getElementById('cabangId').value;
    let result;
    
    if (cabangId) {
      result = await apiPost('updateCabang', { id: Number(cabangId), data: cabangData });
    } else {
      result = await apiPost('addCabang', { data: cabangData });
    }
    
    if (result?.success) {
      closeModal('cabangModal');
      showToast('Cabang berhasil disimpan!', 'success');
      await loadAllData();
    } else {
      showToast('Gagal menyimpan cabang!', 'error');
    }
  });
  
  // Testimoni Form
  document.getElementById('testimoniForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const testiData = {
      nama: document.getElementById('testimoniNama').value,
      meta: document.getElementById('testimoniMeta').value,
      rating: document.getElementById('testimoniRating').value,
      text: document.getElementById('testimoniText').value,
      aktif: document.getElementById('testimoniAktif').value
    };
    
    const testiId = document.getElementById('testimoniId').value;
    let result;
    
    if (testiId) {
      result = await apiPost('updateTestimoni', { id: Number(testiId), data: testiData });
    } else {
      result = await apiPost('addTestimoni', { data: testiData });
    }
    
    if (result?.success) {
      closeModal('testimoniModal');
      showToast('Testimoni berhasil disimpan!', 'success');
      await loadAllData();
    } else {
      showToast('Gagal menyimpan testimoni!', 'error');
    }
  });
}

// ============================================
// MODALS
// ============================================

function setupModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.show').forEach(modal => {
        modal.classList.remove('show');
      });
    }
  });
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}