// app.ts
// Compile com: tsc app.ts --target ES6 --outFile app.js
type Arena = {
  id: string;
  name: string;
  type: 'futebol' | 'areia';
};

type Booking = {
  arenaId: string;
  dateISO: string; // yyyy-mm-dd
  time: string; // '08:00'
  name?: string;
  phone?: string;
  createdAt: string;
};

const arenas: Arena[] = [
  { id: 'campo-1', name: 'Campo 1 - Grama', type: 'futebol' },
  { id: 'campo-2', name: 'Campo 2 - Grama', type: 'futebol' },
  { id: 'areia-1', name: 'Arena Areia 1', type: 'areia' },
  { id: 'areia-2', name: 'Arena Areia 2', type: 'areia' },
];

// Horários padrão (poderia vir de API)
const times = [
  '08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'
];

const STORAGE_KEY = 'verdearena_bookings_v1';

// utils
function qs<T extends HTMLElement>(sel: string) { return document.querySelector(sel) as T; }
function getBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveBooking(b: Booking){
  const arr = getBookings();
  arr.push(b);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}
function isBooked(arenaId: string, dateISO: string, time: string){
  return getBookings().some(b => b.arenaId === arenaId && b.dateISO === dateISO && b.time === time);
}

// DOM
const dateInput = qs<HTMLInputElement>('#dateInput');
const typeSelect = qs<HTMLSelectElement>('#typeSelect');
const arenaSelect = qs<HTMLSelectElement>('#arenaSelect');
const slotsGrid = qs<HTMLDivElement>('#slotsGrid');

const modal = qs<HTMLDivElement>('#confirmModal');
const modalTitle = qs<HTMLHeadingElement>('#modalTitle');
const modalInfo = qs<HTMLParagraphElement>('#modalInfo');
const userName = qs<HTMLInputElement>('#userName');
const userPhone = qs<HTMLInputElement>('#userPhone');
const cancelBtn = qs<HTMLButtonElement>('#cancelBtn');
const whatsBtn = qs<HTMLButtonElement>('#whatsappBtn');

let selectedArenaId: string | null = null;
let selectedTime: string | null = null;
let selectedDateISO: string | null = null;

// init
function init(){
  // default date = hoje
  const today = new Date();
  dateInput.value = today.toISOString().slice(0,10);

  populateArenas();
  attachListeners();
  renderSlots();
}

function populateArenas(){
  arenaSelect.innerHTML = '';
  const type = typeSelect.value as 'futebol'|'areia';
  const filtered = arenas.filter(a => a.type === type);
  for(const a of filtered){
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = a.name;
    arenaSelect.appendChild(opt);
  }
}

function attachListeners(){
  dateInput.addEventListener('change', () => renderSlots());
  typeSelect.addEventListener('change', () => { populateArenas(); renderSlots(); });
  arenaSelect.addEventListener('change', () => renderSlots());

  cancelBtn.addEventListener('click', () => closeModal());
  whatsBtn.addEventListener('click', handleWhatsApp);
  // close modal on background click
  modal.addEventListener('click', (e) => {
    if(e.target === modal) closeModal();
  });
}

function renderSlots(){
  slotsGrid.innerHTML = '';
  selectedDateISO = dateInput.value;
  const arenaId = arenaSelect.value;
  if(!arenaId) return;
  selectedArenaId = arenaId;

  // show times
  for(const t of times){
    const slot = document.createElement('div');
    slot.className = 'slot';
    const booked = isBooked(arenaId, selectedDateISO!, t);
    if(booked) slot.classList.add('booked');

    slot.innerHTML = `<div class="time">${t}</div>
                      <div class="meta">${booked ? 'Reservado' : 'Disponível'}</div>`;

    if(!booked){
      slot.addEventListener('click', () => openConfirm(arenaId, selectedDateISO!, t));
    }

    slotsGrid.appendChild(slot);
  }
}

function openConfirm(arenaId: string, dateISO: string, time: string){
  selectedArenaId = arenaId;
  selectedDateISO = dateISO;
  selectedTime = time;
  const arena = arenas.find(a => a.id === arenaId)!;
  modalTitle.textContent = 'Confirmar reserva';
  modalInfo.textContent = `${arena.name} • ${dateISO} • ${time}`;
  userName.value = '';
  userPhone.value = '';
  modal.classList.remove('hidden');
}

function closeModal(){
  modal.classList.add('hidden');
  selectedTime = null;
}

// Monta mensagem e redireciona para WhatsApp
function handleWhatsApp(){
  if(!selectedArenaId || !selectedDateISO || !selectedTime) return;
  const arena = arenas.find(a => a.id === selectedArenaId)!;
  const name = userName.value.trim();
  const phone = userPhone.value.trim();

  // cria booking local (demo)
  const booking: Booking = {
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
  if(name) message += `\n- Nome: ${name}`;
  if(phone) message += `\n- Telefone: ${phone}`;

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

