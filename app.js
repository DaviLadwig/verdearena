const arenas = [
    { id: 'campo-1', name: 'Campo 1 - Grama', type: 'futebol' },
    { id: 'campo-2', name: 'Campo 2 - Grama', type: 'futebol' },
    { id: 'areia-1', name: 'Arena Areia 1', type: 'areia' },
    { id: 'areia-2', name: 'Arena Areia 2', type: 'areia' },
];
// Horários padrão (poderia vir de API)
const times = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];
const STORAGE_KEY = 'verdearena_bookings_v1';
// utils
function qs(sel) { return document.querySelector(sel); }
function getBookings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    }
    catch (_a) {
        return [];
    }
}
function saveBooking(b) {
    const arr = getBookings();
    arr.push(b);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}
function isBooked(arenaId, dateISO, time) {
    return getBookings().some(b => b.arenaId === arenaId && b.dateISO === dateISO && b.time === time);
}
// DOM
const dateInput = qs('#dateInput');
const typeSelect = qs('#typeSelect');
const arenaSelect = qs('#arenaSelect');
const slotsGrid = qs('#slotsGrid');
const modal = qs('#confirmModal');
const modalTitle = qs('#modalTitle');
const modalInfo = qs('#modalInfo');
const userName = qs('#userName');
const userPhone = qs('#userPhone');
const cancelBtn = qs('#cancelBtn');
const whatsBtn = qs('#whatsappBtn');
let selectedArenaId = null;
let selectedTime = null;
let selectedDateISO = null;
// init
function init() {
    // default date = hoje
    const today = new Date();
    dateInput.value = today.toISOString().slice(0, 10);
    populateArenas();
    attachListeners();
    renderSlots();
}
function populateArenas() {
    arenaSelect.innerHTML = '';
    const type = typeSelect.value;
    const filtered = arenas.filter(a => a.type === type);
    for (const a of filtered) {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = a.name;
        arenaSelect.appendChild(opt);
    }
}
function attachListeners() {
    dateInput.addEventListener('change', () => renderSlots());
    typeSelect.addEventListener('change', () => { populateArenas(); renderSlots(); });
    arenaSelect.addEventListener('change', () => renderSlots());
    cancelBtn.addEventListener('click', () => closeModal());
    whatsBtn.addEventListener('click', handleWhatsApp);
    // close modal on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal)
            closeModal();
    });
}
function renderSlots() {
    slotsGrid.innerHTML = '';
    selectedDateISO = dateInput.value;
    const arenaId = arenaSelect.value;
    if (!arenaId)
        return;
    selectedArenaId = arenaId;
    // show times
    for (const t of times) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        const booked = isBooked(arenaId, selectedDateISO, t);
        if (booked)
            slot.classList.add('booked');
        slot.innerHTML = `<div class="time">${t}</div>
                      <div class="meta">${booked ? 'Reservado' : 'Disponível'}</div>`;
        if (!booked) {
            slot.addEventListener('click', () => openConfirm(arenaId, selectedDateISO, t));
        }
        slotsGrid.appendChild(slot);
    }
}
function openConfirm(arenaId, dateISO, time) {
    selectedArenaId = arenaId;
    selectedDateISO = dateISO;
    selectedTime = time;
    const arena = arenas.find(a => a.id === arenaId);
    modalTitle.textContent = 'Confirmar reserva';
    modalInfo.textContent = `${arena.name} • ${dateISO} • ${time}`;
    userName.value = '';
    userPhone.value = '';
    modal.classList.remove('hidden');
}
function closeModal() {
    modal.classList.add('hidden');
    selectedTime = null;
}
// Monta mensagem e redireciona para WhatsApp
function handleWhatsApp() {
    if (!selectedArenaId || !selectedDateISO || !selectedTime)
        return;
    const arena = arenas.find(a => a.id === selectedArenaId);
    const name = userName.value.trim();
    const phone = userPhone.value.trim();
    // cria booking local (demo)
    const booking = {
        arenaId: selectedArenaId,
        dateISO: selectedDateISO,
        time: selectedTime,
        name: name || undefined,
        phone: phone || undefined,
        createdAt: new Date().toISOString()
    };
    saveBooking(booking);
    // mensagem WhatsApp (URL-encoded)
    const targetPhone = 'SEU_NUMERO_COMODDD'; // <--- substitua pelo número da arena: ex: 5511999999999
    let message = `Olá! Gostaria de reservar:\n- Arena: ${arena.name}\n- Data: ${selectedDateISO}\n- Horário: ${selectedTime}`;
    if (name)
        message += `\n- Nome: ${name}`;
    if (phone)
        message += `\n- Telefone: ${phone}`;
    const encoded = encodeURIComponent(message);
    // abre wa.me link (abre WhatsApp Web ou App)
    const url = `https://wa.me/${targetPhone}?text=${encoded}`;
    // atualizar UI antes do redirect
    renderSlots();
    // redireciona
    window.open(url, '_blank');
    closeModal();
}
// start
document.addEventListener('DOMContentLoaded', init);
