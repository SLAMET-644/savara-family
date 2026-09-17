import './style.css';

const API = (import.meta.env.VITE_CONVEX_HTTP_URL || 'https://combative-retriever-732.convex.site').replace(/\/$/, '');
let db = { admins: [], members: [] };
let type = 'member', editId = null;

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(data.error || 'Terjadi kesalahan');
  return data;
}

const app = document.querySelector('#app');
app.innerHTML = `
<header><div class="logo">SAVARA FAMILY</div><div class="sub">MEMBER MANAGEMENT • ATTENDANCE SYSTEM</div></header>
<nav>
<button class="active" data-page="home">Dashboard</button>
<button data-page="admins">Admin</button>
<button data-page="members">Member</button>
<button data-page="attendance">Absen</button>
</nav>
<main>
<section id="home" class="page active">
<div class="hero"><h1>CONTROL CENTER</h1><p>Kelola admin, member, dan absensi SAVARA FAMILY dalam satu tempat.</p>
<div class="stats"><div class="stat"><b id="sAdmins">0</b><span>ADMIN</span></div><div class="stat"><b id="sMembers">0</b><span>MEMBER</span></div><div class="stat"><b id="sPresent">0</b><span>HADIR HARI INI</span></div></div></div>
<div class="section-title"><h2>Aturan Sistem</h2></div>
<div class="person"><div class="avatar">A</div><div class="info"><div class="name">Absen Admin</div><div class="role">Status hadir reset otomatis setiap hari.</div></div><span class="status">HARIAN</span></div>
<div class="person"><div class="avatar">M</div><div class="info"><div class="name">Absen Member</div><div class="role">Status absen reset otomatis setiap 7 hari.</div></div><span class="status">MINGGUAN</span></div>
</section>
<section id="admins" class="page">
<div class="hero"><h1>🔴 DAFTAR ADMIN</h1><p>Data admin terpisah dari member. Status absen admin mengikuti siklus harian.</p></div>
<div class="toolbar"><input id="aq" placeholder="Cari admin..."><button class="primary" id="addAdmin">+ Tambah</button></div>
<div id="adminList" class="list"></div>
</section>
<section id="members" class="page">
<div class="hero"><h1>⚫ DAFTAR MEMBER</h1><p>Nama member tetap tersimpan. Hanya status absen yang diperbarui setiap minggu.</p></div>
<div class="toolbar"><input id="mq" placeholder="Cari member..."><button class="primary" id="addMember">+ Tambah</button></div>
<div id="memberList" class="list"></div>
</section>
<section id="attendance" class="page">
<div class="hero"><h1>📋 ABSENSI</h1><p>Admin = harian • Member = mingguan. Klik status untuk mencatat kehadiran.</p></div>
<div class="section-title"><h2>Absen Admin</h2><span class="pill">RESET HARIAN</span></div><div id="adminAtt" class="list"></div>
<div class="section-title"><h2>Absen Member</h2><span class="pill">RESET 7 HARI</span></div><div id="memberAtt" class="list"></div>
</section>
<footer>SAVARA FAMILY • Database online Convex.</footer>
</main>
<div id="modal" class="modal"><div class="box"><h2 id="mtitle">Tambah</h2><input id="nname" placeholder="Nama"><div class="row"><button class="danger" id="cancel">Batal</button><button class="primary" id="save">Simpan</button></div></div></div>
<div id="error" class="toast"></div>
`;

function show(id, button) {
  document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('nav button').forEach(x => x.classList.remove('active'));
  button.classList.add('active');
}

document.querySelectorAll('nav button').forEach(b => b.onclick = () => show(b.dataset.page, b));

document.getElementById('aq').oninput = render;
document.getElementById('mq').oninput = render;
document.getElementById('addAdmin').onclick = () => openModal('admin');
document.getElementById('addMember').onclick = () => openModal('member');
document.getElementById('cancel').onclick = closeModal;
document.getElementById('save').onclick = savePerson;

function openModal(t, person = null) {
  type = t; editId = person?.id ?? null;
  document.getElementById('mtitle').textContent = (person ? 'Edit ' : 'Tambah ') + t;
  document.getElementById('nname').value = person?.name || '';
  document.getElementById('modal').classList.add('show');
  document.getElementById('nname').focus();
}
function closeModal() { document.getElementById('modal').classList.remove('show'); }

async function savePerson() {
  const name = document.getElementById('nname').value.trim();
  if (!name) return;
  try {
    if (editId) await api('/api/people/update', { method:'POST', body:JSON.stringify({ id:editId, name }) });
    else await api('/api/people/create', { method:'POST', body:JSON.stringify({ type, name }) });
    closeModal(); await load();
  } catch (e) { toast(e.message); }
}

async function del(t, id) {
  if (!confirm('Hapus data ini?')) return;
  try { await api('/api/people/delete', { method:'POST', body:JSON.stringify({ id }) }); await load(); }
  catch(e) { toast(e.message); }
}

async function toggle(t, id) {
  try { await api('/api/attendance/toggle', { method:'POST', body:JSON.stringify({ id, type:t }) }); await load(); }
  catch(e) { toast(e.message); }
}

function person(p, t, att=false) {
  const initials = p.name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase();
  const status = p.status || 'Belum Absen';
  return `<div class="person"><div class="avatar">${initials}</div><div class="info"><div class="name">${escapeHtml(p.name)}</div><div class="role">${t}</div></div><span class="status ${status==='Hadir'?'hadir':'belum'}">${status}</span>${att ? `<button class="primary" data-toggle="${t.toLowerCase()}" data-id="${p.id}">${status==='Hadir'?'Batal':'Absen'}</button>` : `<div class="actions"><button data-edit="${t.toLowerCase()}" data-id="${p.id}">Edit</button><button class="danger" data-delete="${p.id}">×</button></div>`}</div>`;
}

function bindListEvents() {
  document.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>toggle(b.dataset.toggle,b.dataset.id));
  document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>del('',b.dataset.delete));
  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{
    const p=[...db.admins,...db.members].find(x=>x.id===b.dataset.id); openModal(b.dataset.edit,p);
  });
}

function render() {
  const aq = (document.getElementById('aq')?.value||'').toLowerCase();
  const mq = (document.getElementById('mq')?.value||'').toLowerCase();
  document.getElementById('sAdmins').textContent=db.admins.length;
  document.getElementById('sMembers').textContent=db.members.length;
  document.getElementById('sPresent').textContent=[...db.admins,...db.members].filter(x=>x.status==='Hadir').length;
  document.getElementById('adminList').innerHTML=db.admins.filter(p=>p.name.toLowerCase().includes(aq)).map(p=>person(p,'Admin')).join('')||'<div class="empty">Belum ada admin.</div>';
  document.getElementById('memberList').innerHTML=db.members.filter(p=>p.name.toLowerCase().includes(mq)).map(p=>person(p,'Member')).join('')||'<div class="empty">Belum ada member.</div>';
  document.getElementById('adminAtt').innerHTML=db.admins.map(p=>person(p,'Admin',true)).join('')||'<div class="empty">Belum ada admin.</div>';
  document.getElementById('memberAtt').innerHTML=db.members.map(p=>person(p,'Member',true)).join('')||'<div class="empty">Belum ada member.</div>';
  bindListEvents();
}

async function load() {
  try { db = await api('/api/people/list'); render(); }
  catch(e) { toast('Belum tersambung ke Convex. Pastikan backend Convex sudah di-deploy.'); console.error(e); }
}
function toast(msg){const x=document.getElementById('error');x.textContent=msg;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),3500)}
function escapeHtml(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
load();
