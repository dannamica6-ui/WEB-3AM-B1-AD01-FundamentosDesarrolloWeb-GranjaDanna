'use strict';
/* ===== DATOS ===== */
const K = { S: 'taller_solicitudes', SES: 'taller_sesion' };
const ESTADOS = ['Pendiente', 'En revisión', 'En proceso', 'Finalizado', 'Cancelado'];
const BADGE = { 'Pendiente': 'warning text-dark', 'En revisión': 'info text-dark', 'En proceso': 'primary', 'Finalizado': 'success', 'Cancelado': 'danger' };
const MARCAS = ['Chevrolet', 'Kia', 'Hyundai', 'Toyota', 'Nissan', 'Mazda', 'Ford', 'Otra'];
// Diccionario de servicios
const SERVICIOS = {
  'Cambio de aceite': { icono: '🛢️', precio: 'Desde $35', desc: 'Aceite y filtro según especificación del fabricante.' },
  'Frenos': { icono: '🛑', precio: 'Desde $60', desc: 'Revisión y cambio de pastillas, discos y líquido.' },
  'Alineación y balanceo': { icono: '🛞', precio: 'Desde $30', desc: 'Mejora la estabilidad y alarga la vida de tus llantas.' },
  'Sistema eléctrico y batería': { icono: '🔋', precio: 'Desde $25', desc: 'Prueba de batería, alternador y luces.' },
  'Diagnóstico computarizado': { icono: '💻', precio: 'Desde $20', desc: 'Lectura de códigos y sensores con scanner.' },
  'Mantenimiento preventivo': { icono: '🔧', precio: 'Desde $90', desc: 'Revisión integral cada 10.000 km.' }
};
// Usuarios de prueba (3 activos + 1 deshabilitado) y 2 roles
const USUARIOS = [
  { id: 1, usuario: 'admin', clave: 'Admin123', nombre: 'Carlos Mendoza', email: 'admin@taller.com', telefono: '0991112233', rol: 'Administrador', activo: true },
  { id: 2, usuario: 'maria', clave: 'Cliente123', nombre: 'María Torres', email: 'maria@correo.com', telefono: '0984445566', rol: 'Cliente', activo: true },
  { id: 3, usuario: 'juan', clave: 'Cliente123', nombre: 'Juan Pérez', email: 'juan@correo.com', telefono: '0997778899', rol: 'Cliente', activo: true },
  { id: 4, usuario: 'pedro', clave: 'Cliente123', nombre: 'Pedro Gómez', email: 'pedro@correo.com', telefono: '0961234567', rol: 'Cliente', activo: false }
];
const semilla = [
  { id: 1, usuarioId: 2, cliente: 'María Torres', email: 'maria@correo.com', telefono: '0984445566', placa: 'PBA-1234', marca: 'Kia', modelo: 'Rio', anio: 2019, km: 45000, combustible: 'Gasolina', servicio: 'Cambio de aceite', fecha: '2026-12-01', hora: '09:00', extras: ['Lavado'], comentarios: '', estado: 'Pendiente' },
  { id: 2, usuarioId: 3, cliente: 'Juan Pérez', email: 'juan@correo.com', telefono: '0997778899', placa: 'PCD-5678', marca: 'Toyota', modelo: 'Hilux', anio: 2021, km: 30000, combustible: 'Diésel', servicio: 'Frenos', fecha: '2026-12-02', hora: '10:30', extras: [], comentarios: 'Ruido al frenar', estado: 'En proceso' }
];

/* ===== ESTADO ===== */
let solicitudes = JSON.parse(localStorage.getItem(K.S) || 'null') || semilla;
let sesion = USUARIOS.find(u => u.id === Number(localStorage.getItem(K.SES))) || null;
let editId = null;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const guardar = () => localStorage.setItem(K.S, JSON.stringify(solicitudes));
const esAdmin = () => sesion !== null && sesion.rol === 'Administrador';
const hoy = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const alerta = (icon, title, text) => Swal.fire({ icon, title, text });
const denegar = () => alerta('error', 'Acceso denegado', 'No tienes permisos de Administrador para esta operación.');

/* ===== NAVEGACIÓN ===== */
function mostrar(vista, scroll) {
  if (['solicitud', 'mis', 'perfil', 'admin'].includes(vista) && !sesion) {
    alerta('info', 'Inicia sesión', 'Debes iniciar sesión para acceder a esta sección.');
    vista = 'login';
  }
  if (vista === 'admin' && !esAdmin()) return denegar(); // Prueba 5
  document.querySelectorAll('.view').forEach(v => v.classList.add('d-none'));
  $('v-' + vista).classList.remove('d-none');
  if (vista === 'solicitud') prepararForm();
  if (vista === 'mis') renderMis();
  if (vista === 'admin') renderAdmin();
  if (vista === 'perfil') renderPerfil();
  if (scroll) setTimeout(() => $(scroll).scrollIntoView({ behavior: 'smooth' }), 50);
  else window.scrollTo(0, 0);
  const menu = $('menu');
  if (menu.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(menu).hide();
}

function actualizarNav() {
  document.querySelectorAll('.auth-only').forEach(e => e.classList.toggle('d-none', !sesion));
  document.querySelectorAll('.guest-only').forEach(e => e.classList.toggle('d-none', !!sesion));
  if (sesion) $('navUser').textContent = sesion.usuario;
}

/* ===== LOGIN ===== */
function login(e) {
  e.preventDefault();
  const usuario = $('lUsuario').value.trim(), clave = $('lClave').value;
  if (!usuario || !clave) return alerta('warning', 'Campos vacíos', 'Ingresa usuario y contraseña.');
  const u = USUARIOS.find(x => x.usuario === usuario && x.clave === clave);
  if (!u) return alerta('error', 'Acceso inválido', 'Usuario o contraseña incorrectos.');
  if (!u.activo) return alerta('error', 'Cuenta deshabilitada', 'Tu cuenta está deshabilitada. Contacta al administrador.');
  sesion = u;
  localStorage.setItem(K.SES, u.id);
  $('formLogin').reset();
  actualizarNav();
  Swal.fire({ icon: 'success', title: `Bienvenido, ${u.nombre}`, text: `Rol: ${u.rol}`, timer: 1500, showConfirmButton: false });
  mostrar(u.rol === 'Administrador' ? 'admin' : 'mis');
}

function logout() {
  Swal.fire({ title: '¿Cerrar sesión?', icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, salir', cancelButtonText: 'Cancelar' })
    .then(r => {
      if (!r.isConfirmed) return;
      sesion = null; localStorage.removeItem(K.SES);
      actualizarNav(); mostrar('home');
    });
}

function renderPerfil() {
  const d = { 'Nombre': sesion.nombre, 'Usuario': sesion.usuario, 'Correo': sesion.email, 'Teléfono': sesion.telefono, 'Rol': sesion.rol, 'Estado de cuenta': sesion.activo ? 'Activa' : 'Deshabilitada' };
  $('perfilDatos').innerHTML = '<dl class="row mb-0">' + Object.entries(d).map(([k, v]) => `<dt class="col-sm-3">${k}</dt><dd class="col-sm-9">${esc(v)}</dd>`).join('') + '</dl>';
}

/* ===== FORMULARIO / VALIDACIÓN ===== */
function prepararForm() {
  $('wrapCliente').classList.toggle('d-none', !esAdmin());
  $('wrapEstado').classList.toggle('d-none', !(esAdmin() && editId));
  $('cliente').innerHTML = USUARIOS.filter(u => u.activo).map(u => `<option value="${u.id}">${esc(u.nombre)} (${u.rol})</option>`).join('');
  if (!editId) {
    $('formSolicitud').reset();
    $('cliente').value = sesion.id;
    llenarCliente(sesion.id);
  }
}
function llenarCliente(id) {
  const u = USUARIOS.find(x => x.id === Number(id));
  if (!u) return;
  $('nombre').value = u.nombre; $('email').value = u.email; $('telefono').value = u.telefono;
}

function leerForm() {
  return {
    usuarioId: esAdmin() ? Number($('cliente').value) : sesion.id,
    cliente: $('nombre').value.trim(), email: $('email').value.trim(), telefono: $('telefono').value.trim(),
    placa: $('placa').value.trim().toUpperCase(), marca: $('marca').value, modelo: $('modelo').value.trim(),
    anio: $('anio').value, km: $('km').value,
    combustible: (document.querySelector('input[name="comb"]:checked') || {}).value || '',
    servicio: $('servicio').value, fecha: $('fecha').value, hora: $('hora').value,
    extras: [...document.querySelectorAll('input[name="extra"]:checked')].map(c => c.value),
    comentarios: $('comentarios').value.trim()
  };
}

function validar(d) {
  const err = [], anioMax = new Date().getFullYear() + 1;
  if (d.cliente.length < 3) err.push('El nombre es obligatorio (mínimo 3 caracteres).');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) err.push('Correo electrónico inválido.');
  if (!/^0\d{9}$/.test(d.telefono)) err.push('Teléfono inválido: 10 dígitos que empiecen con 0 (ej. 0991234567).');
  if (!/^[A-Z]{3}-\d{3,4}$/.test(d.placa)) err.push('Placa inválida. Formato: ABC-123 o ABC-1234.');
  if (!d.marca) err.push('Selecciona la marca.');
  if (d.modelo.length < 2) err.push('El modelo es obligatorio.');
  if (!/^\d{4}$/.test(d.anio) || d.anio < 1980 || d.anio > anioMax) err.push(`El año debe estar entre 1980 y ${anioMax}.`);
  if (d.km === '' || !/^\d+$/.test(d.km) || Number(d.km) > 999999) err.push('Kilometraje inválido: entero entre 0 y 999999.');
  if (!d.combustible) err.push('Selecciona el tipo de combustible.');
  if (!(d.servicio in SERVICIOS)) err.push('Selecciona un tipo de servicio válido.');
  if (!d.fecha) err.push('La fecha es obligatoria.');
  else if (d.fecha < hoy()) err.push('La fecha no puede ser anterior a hoy.');
  else if (new Date(d.fecha + 'T00:00').getDay() === 0) err.push('El taller no atiende los domingos.');
  if (!d.hora) err.push('La hora es obligatoria.');
  else if (d.hora < '08:00' || d.hora > '17:00') err.push('El horario de atención es de 08:00 a 17:00.');
  if (!$('acepto').checked) err.push('Debes aceptar los términos y condiciones.');
  return err;
}

function guardarSolicitud(e) {
  e.preventDefault();
  if (!sesion) return mostrar('login');
  if (editId && !esAdmin()) return denegar();
  const d = leerForm();
  if (!esAdmin()) d.usuarioId = sesion.id; // el cliente solo registra para sí mismo
  const errores = validar(d);
  if (errores.length) { // Prueba 3
    return Swal.fire({ icon: 'error', title: 'No se guardó el registro', html: '<ul class="text-start">' + errores.map(x => `<li>${esc(x)}</li>`).join('') + '</ul>' });
  }
  if (editId) {
    const s = solicitudes.find(x => x.id === editId);
    Object.assign(s, d, { estado: $('estado').value });
    Swal.fire({ icon: 'success', title: 'Solicitud actualizada', timer: 1500, showConfirmButton: false });
    editId = null;
    guardar(); mostrar('admin');
  } else { // Prueba 4
    const id = Math.max(0, ...solicitudes.map(x => x.id)) + 1;
    solicitudes.push({ id, ...d, anio: Number(d.anio), km: Number(d.km), estado: 'Pendiente' });
    guardar();
    Swal.fire({ icon: 'success', title: 'Solicitud registrada', text: `Número de solicitud: #${id}`, timer: 1800, showConfirmButton: false });
    $('formSolicitud').reset();
    mostrar('mis');
  }
}

function cancelarEdicion() { editId = null; $('btnGuardar').textContent = 'Registrar solicitud'; $('btnCancelar').classList.add('d-none'); $('tituloForm').textContent = 'Solicitud de mantenimiento'; mostrar('admin'); }

/* ===== LISTADOS ===== */
function fila(s, admin) {
  const estado = admin
    ? `<select class="form-select form-select-sm" data-act="estado" data-id="${s.id}">${ESTADOS.map(e => `<option ${e === s.estado ? 'selected' : ''}>${e}</option>`).join('')}</select>`
    : `<span class="badge bg-${BADGE[s.estado]}">${s.estado}</span>`;
  const acc = admin ? `<td class="text-nowrap"><button class="btn btn-sm btn-outline-primary" data-act="editar" data-id="${s.id}">Editar</button> <button class="btn btn-sm btn-outline-danger" data-act="eliminar" data-id="${s.id}">Eliminar</button></td>` : '';
  return `<tr><td>${s.id}</td>${admin ? `<td>${esc(s.cliente)}</td>` : ''}<td>${esc(s.placa)}</td><td>${esc(s.marca)} ${esc(s.modelo)} (${s.anio})</td><td>${esc(s.servicio)}</td><td>${s.fecha} ${s.hora}</td><td>${estado}</td>${acc}</tr>`;
}

function renderMis() {
  const mias = solicitudes.filter(s => s.usuarioId === sesion.id); // solo las propias
  $('tbMis').innerHTML = mias.length ? mias.map(s => fila(s, false)).join('') : '<tr><td colspan="6" class="text-center text-muted">Aún no tienes mantenimientos registrados.</td></tr>';
}

function renderAdmin() {
  if (!esAdmin()) return denegar();
  const fe = $('filtroEstado').value, q = $('buscar').value.trim().toLowerCase();
  const lista = solicitudes.filter(s => (!fe || s.estado === fe) && (!q || s.cliente.toLowerCase().includes(q) || s.placa.toLowerCase().includes(q)));
  $('tbAdmin').innerHTML = lista.length ? lista.map(s => fila(s, true)).join('') : '<tr><td colspan="8" class="text-center text-muted">Sin resultados.</td></tr>';
  $('contador').textContent = `${lista.length} de ${solicitudes.length} registros`;
}

/* ===== CRUD ADMIN ===== */
function editar(id) {
  if (!esAdmin()) return denegar();
  const s = solicitudes.find(x => x.id === id);
  editId = id;
  mostrar('solicitud');
  $('wrapEstado').classList.remove('d-none');
  $('cliente').value = s.usuarioId;
  for (const c of ['nombre', 'email', 'telefono', 'placa', 'marca', 'modelo', 'anio', 'km', 'servicio', 'fecha', 'hora', 'comentarios', 'estado']) $(c).value = s[c === 'nombre' ? 'cliente' : c];
  document.querySelectorAll('input[name="comb"]').forEach(r => r.checked = r.value === s.combustible);
  document.querySelectorAll('input[name="extra"]').forEach(c => c.checked = s.extras.includes(c.value));
  $('acepto').checked = true;
  $('tituloForm').textContent = `Editar solicitud #${id}`;
  $('btnGuardar').textContent = 'Guardar cambios';
  $('btnCancelar').classList.remove('d-none');
}

function cambiarEstado(id, estado) {
  if (!esAdmin()) return denegar();
  solicitudes.find(x => x.id === id).estado = estado;
  guardar(); renderAdmin();
  Swal.fire({ icon: 'success', title: `Estado cambiado a "${estado}"`, toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
}

function eliminar(id) {
  if (!esAdmin()) return denegar();
  Swal.fire({ title: `¿Eliminar la solicitud #${id}?`, text: 'Esta acción no se puede deshacer.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar' })
    .then(r => {
      if (!r.isConfirmed) return;
      solicitudes = solicitudes.filter(x => x.id !== id);
      guardar(); renderAdmin();
      alerta('success', 'Eliminada', 'La solicitud fue eliminada.');
    });
}

/* ===== INICIO ===== */
function init() {
  $('catalogo').innerHTML = Object.entries(SERVICIOS).map(([n, s]) => `<div class="col-sm-6 col-lg-4"><div class="card card-servicio"><div class="card-body text-center"><div class="icono">${s.icono}</div><h5 class="card-title border-0">${n}</h5><p class="card-text">${s.desc}</p><span class="badge bg-primary">${s.precio}</span></div></div></div>`).join('');
  $('servicio').innerHTML = '<option value="">Seleccione...</option>' + Object.keys(SERVICIOS).map(n => `<option>${n}</option>`).join('');
  $('marca').innerHTML = '<option value="">Seleccione...</option>' + MARCAS.map(m => `<option>${m}</option>`).join('');
  $('estado').innerHTML = ESTADOS.map(e => `<option>${e}</option>`).join('');
  $('filtroEstado').innerHTML = '<option value="">Todos los estados</option>' + ESTADOS.map(e => `<option>${e}</option>`).join('');
  $('fecha').min = hoy();

  $('formLogin').addEventListener('submit', login);
  $('formSolicitud').addEventListener('submit', guardarSolicitud);
  $('btnCancelar').addEventListener('click', cancelarEdicion);
  $('cliente').addEventListener('change', e => llenarCliente(e.target.value));
  $('filtroEstado').addEventListener('change', renderAdmin);
  $('buscar').addEventListener('input', renderAdmin);
  $('placa').addEventListener('input', e => e.target.value = e.target.value.toUpperCase());

  document.addEventListener('click', e => {
    const v = e.target.closest('[data-view]');
    if (v) { e.preventDefault(); return mostrar(v.dataset.view, v.dataset.scroll); }
    const a = e.target.closest('[data-act]');
    if (!a) return;
    e.preventDefault();
    const id = Number(a.dataset.id);
    if (a.dataset.act === 'logout') logout();
    if (a.dataset.act === 'editar') editar(id);
    if (a.dataset.act === 'eliminar') eliminar(id);
  });
  document.addEventListener('change', e => {
    if (e.target.dataset.act === 'estado') cambiarEstado(Number(e.target.dataset.id), e.target.value);
  });

  guardar();
  actualizarNav();
  mostrar('home');
}
document.addEventListener('DOMContentLoaded', init);
