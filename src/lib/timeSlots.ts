import { Terapeuta, Cita, BloqueoDisponibilidad, ConfiguracionSalon } from '@/types/salon';

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function addMinutesToTime(timeStr: string, minutes: number): string {
  const mins = timeToMinutes(timeStr) + minutes;
  return minutesToTime(mins);
}

export interface SlotDisponible {
  horaInicio: string; // "09:30"
  horaFin: string; // "10:30"
  terapeutaId: string;
  terapeutaNombre: string;
}

/**
 * Calcula los huecos de tiempo disponibles para una terapeuta en una fecha específica
 */
export function getAvailableSlotsForTherapist(
  fecha: string, // YYYY-MM-DD
  duracionMin: number,
  terapeuta: Terapeuta,
  citas: Cita[],
  bloqueos: BloqueoDisponibilidad[],
  config: ConfiguracionSalon
): SlotDisponible[] {
  if (!terapeuta.activo) return [];

  // 1. Obtener día de la semana (0=Domingo, 1=Lunes, etc.)
  const [year, month, day] = fecha.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const diaSemana = dateObj.getDay();

  // 2. Verificar si la terapeuta labora este día
  if (!terapeuta.horarioBase.dias.includes(diaSemana)) {
    return [];
  }

  // 3. Verificar si hay bloqueo de día completo
  const bloqueoDiaCompleto = bloqueos.some(b => 
    b.fecha === fecha && 
    (b.terapeutaId === 'all' || b.terapeutaId === terapeuta.id) && 
    b.tipo === 'dia_completo'
  );
  if (bloqueoDiaCompleto) {
    return [];
  }

  // 4. Determinar rangos de atención
  const startLimit = Math.max(
    timeToMinutes(config.horarioApertura),
    timeToMinutes(terapeuta.horarioBase.horaInicio)
  );
  const endLimit = Math.min(
    timeToMinutes(config.horarioCierre),
    timeToMinutes(terapeuta.horarioBase.horaFin)
  );

  const descansoStart = terapeuta.horarioBase.descansoInicio ? timeToMinutes(terapeuta.horarioBase.descansoInicio) : null;
  const descansoEnd = terapeuta.horarioBase.descansoFin ? timeToMinutes(terapeuta.horarioBase.descansoFin) : null;

  // 5. Citas ocupadas de esta terapeuta en esta fecha (que no estén rechazadas)
  const citasDia = citas.filter(c => 
    c.fecha === fecha && 
    c.terapeutaId === terapeuta.id && 
    c.estado !== 'Rechazada'
  );

  // 6. Bloqueos de franja horaria en esta fecha
  const bloqueosFranja = bloqueos.filter(b => 
    b.fecha === fecha && 
    (b.terapeutaId === 'all' || b.terapeutaId === terapeuta.id) && 
    b.tipo === 'franja_horaria' &&
    b.horaInicio && b.horaFin
  );

  // 7. Intervalo de paso (ej. 30 minutos o según config)
  const step = config.intervaloMinutos || 30;
  const slots: SlotDisponible[] = [];

  // Si la fecha es hoy, filtrar horarios pasados + 15 min de gracia
  const hoyStr = new Date().toISOString().split('T')[0];
  const isHoy = fecha === hoyStr;
  const ahoraMins = new Date().getHours() * 60 + new Date().getMinutes() + 15;

  for (let t = startLimit; t + duracionMin <= endLimit; t += step) {
    const slotStart = t;
    const slotEnd = t + duracionMin;

    // Si es hoy y ya pasó la hora, omitir
    if (isHoy && slotStart < ahoraMins) {
      continue;
    }

    // Verificar si colisiona con el descanso
    if (descansoStart !== null && descansoEnd !== null) {
      if (slotStart < descansoEnd && slotEnd > descansoStart) {
        continue;
      }
    }

    // Verificar si colisiona con citas existentes
    const colisionaCita = citasDia.some(c => {
      const cStart = timeToMinutes(c.horaInicio);
      const cEnd = timeToMinutes(c.horaFin);
      return slotStart < cEnd && slotEnd > cStart;
    });
    if (colisionaCita) {
      continue;
    }

    // Verificar si colisiona con bloqueos de franja
    const colisionaBloqueo = bloqueosFranja.some(b => {
      const bStart = timeToMinutes(b.horaInicio!);
      const bEnd = timeToMinutes(b.horaFin!);
      return slotStart < bEnd && slotEnd > bStart;
    });
    if (colisionaBloqueo) {
      continue;
    }

    slots.push({
      horaInicio: minutesToTime(slotStart),
      horaFin: minutesToTime(slotEnd),
      terapeutaId: terapeuta.id,
      terapeutaNombre: terapeuta.nombre,
    });
  }

  return slots;
}

/**
 * Calcula slots disponibles combinados cuando el cliente selecciona "Cualquier Especialista"
 */
export function getAllAvailableSlots(
  fecha: string,
  duracionMin: number,
  terapeutas: Terapeuta[],
  citas: Cita[],
  bloqueos: BloqueoDisponibilidad[],
  config: ConfiguracionSalon
): { horaInicio: string; horaFin: string; terapeutasDisponibles: Terapeuta[] }[] {
  const mapaHoras: { [horaInicio: string]: { horaFin: string; terapeutas: Terapeuta[] } } = {};

  terapeutas.forEach(ter => {
    const slotsTer = getAvailableSlotsForTherapist(fecha, duracionMin, ter, citas, bloqueos, config);
    slotsTer.forEach(slot => {
      if (!mapaHoras[slot.horaInicio]) {
        mapaHoras[slot.horaInicio] = {
          horaFin: slot.horaFin,
          terapeutas: [ter],
        };
      } else {
        if (!mapaHoras[slot.horaInicio].terapeutas.some(t => t.id === ter.id)) {
          mapaHoras[slot.horaInicio].terapeutas.push(ter);
        }
      }
    });
  });

  // Ordenar cronológicamente
  const horasOrdenadas = Object.keys(mapaHoras).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));

  return horasOrdenadas.map(horaInicio => ({
    horaInicio,
    horaFin: mapaHoras[horaInicio].horaFin,
    terapeutasDisponibles: mapaHoras[horaInicio].terapeutas,
  }));
}
