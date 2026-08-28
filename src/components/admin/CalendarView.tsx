'use client';

import React, { useMemo, useState } from 'react';
import { useSalon } from '@/context/SalonContext';
import { Cita, BloqueoDisponibilidad, Colaborador } from '@/types/salon';
import { VistaCalendario } from './AdminHeader';
import { timeToMinutes } from '@/lib/timeSlots';
import {
  Clock,
  Sparkles,
  ShieldBan,
  Plus,
  Ban,
  Calendar as CalendarIcon,
  Trash2,
  Lock,
  Camera,
} from 'lucide-react';

interface CalendarViewProps {
  fechaActual: string; // YYYY-MM-DD
  vista: VistaCalendario;
  filtroColaborador?: string;
  onSelectCita: (cita: Cita) => void;
  onSlotClick: (fecha: string, hora: string, terapeutaId?: string) => void;
  onSelectFecha: (fecha: string) => void;
  onQuickBlock?: (fecha: string, hora: string, terapeutaId?: string) => void;
  onOpenChangePhoto?: (colaboradorId: string) => void;
}

export default function CalendarView({
  fechaActual,
  vista,
  filtroColaborador = 'all',
  onSelectCita,
  onSlotClick,
  onSelectFecha,
  onQuickBlock,
  onOpenChangePhoto,
}: CalendarViewProps) {
  const {
    citas,
    colaboradores,
    servicios,
    bloqueos,
    configuracion,
    reprogramarCita,
    eliminarBloqueo,
    desbloquearTodoElDia,
    reprogramarBloqueo,
    usuarioSesion,
  } = useSalon();

  const esColaboradora = usuarioSesion?.tipo === 'colaborador';
  const miColaboradorId = usuarioSesion?.colaboradorId;

  // Estados para Drag & Drop y confirmación
  const [arrastrandoCita, setArrastrandoCita] = useState<Cita | null>(null);
  const [arrastrandoBloqueo, setArrastrandoBloqueo] = useState<BloqueoDisponibilidad | null>(null);
  const [slotHoverId, setSlotHoverId] = useState<string | null>(null);
  const [confirmacionModal, setConfirmacionModal] = useState<{
    cita: Cita;
    nuevaFecha: string;
    nuevaHoraInicio: string;
    nuevaHoraFin: string;
    nuevoColaboradorId: string;
  } | null>(null);

  // Paleta de colores según el estado de la cita
  const getEstadoEstilo = (estado: string) => {
    switch (estado) {
      case 'Pendiente':
        return {
          card: 'bg-orange-500/15 border-orange-400/70 text-orange-950 backdrop-blur-md shadow-xs',
          badge: 'bg-orange-500/80 text-white backdrop-blur-xs border border-orange-400/40',
          border: 'border-orange-400/70',
        };
      case 'Confirmada':
        return {
          card: 'bg-emerald-500/15 border-emerald-500/70 text-emerald-950 backdrop-blur-md shadow-xs',
          badge: 'bg-emerald-600/80 text-white backdrop-blur-xs border border-emerald-400/40',
          border: 'border-emerald-500/70',
        };
      case 'Completada':
        return {
          card: 'bg-gray-400/20 border-gray-400/70 text-gray-900 backdrop-blur-md shadow-xs',
          badge: 'bg-gray-600/80 text-white backdrop-blur-xs border border-gray-400/40',
          border: 'border-gray-400/70',
        };
      case 'Rechazada':
        return {
          card: 'bg-red-500/15 border-red-400/70 text-red-950 backdrop-blur-md shadow-xs opacity-80',
          badge: 'bg-red-600/80 text-white backdrop-blur-xs border border-red-400/40',
          border: 'border-red-400/70',
        };
      default:
        return {
          card: 'bg-[#FAF6F0] border-[#E6D7CB] text-[#2D2424]',
          badge: 'bg-gray-600/80 text-white backdrop-blur-xs',
          border: 'border-stone-300',
        };
    }
  };

  // Filtrar colaboradoras activas según el filtro de visualización
  const colaboradoresActivas = useMemo(() => {
    const activas = colaboradores.filter((c) => c.activo);
    if (filtroColaborador && filtroColaborador !== 'all') {
      const match = activas.filter((c) => c.id === filtroColaborador);
      return match.length > 0 ? match : activas;
    }
    return activas;
  }, [colaboradores, filtroColaborador]);

  // Filtrar citas según el filtro de colaboradora
  const citasFiltradas = useMemo(() => {
    if (filtroColaborador && filtroColaborador !== 'all') {
      return citas.filter(
        (c) => c.terapeutaId === filtroColaborador || c.colaboradorId === filtroColaborador
      );
    }
    return citas;
  }, [citas, filtroColaborador]);

  const citasDia = useMemo(() => {
    return citasFiltradas.filter((c) => c.fecha === fechaActual);
  }, [citasFiltradas, fechaActual]);

  const bloqueosDia = useMemo(() => {
    return bloqueos.filter((b) => {
      if (b.fecha !== fechaActual) return false;
      if (filtroColaborador && filtroColaborador !== 'all') {
        return b.terapeutaId === 'all' || b.terapeutaId === filtroColaborador || b.colaboradorId === filtroColaborador;
      }
      return true;
    });
  }, [bloqueos, fechaActual, filtroColaborador]);

  const horasArray = useMemo(() => {
    const startH = parseInt(configuracion.horarioApertura.split(':')[0], 10) || 9;
    const endH = parseInt(configuracion.horarioCierre.split(':')[0], 10) || 20;
    const array: string[] = [];
    for (let h = startH; h <= endH; h++) {
      array.push(`${String(h).padStart(2, '0')}:00`);
      if (h < endH) {
        array.push(`${String(h).padStart(2, '0')}:30`);
      }
    }
    return array;
  }, [configuracion]);

  const diasSemana = useMemo(() => {
    const [y, m, d] = fechaActual.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    const dayOfWeek = curr.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const list: { fecha: string; label: string; numero: number; esHoy: boolean }[] = [];
    const nombres = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const hoyStr = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const target = new Date(curr.getTime() + (mondayOffset + i) * 86400000);
      const yyyy = target.getFullYear();
      const mm = String(target.getMonth() + 1).padStart(2, '0');
      const dd = String(target.getDate()).padStart(2, '0');
      const fecha = `${yyyy}-${mm}-${dd}`;
      list.push({
        fecha,
        label: nombres[i],
        numero: target.getDate(),
        esHoy: fecha === hoyStr,
      });
    }
    return list;
  }, [fechaActual]);

  const diasMes = useMemo(() => {
    const [y, m] = fechaActual.split('-').map(Number);
    const primerDiaMes = new Date(y, m - 1, 1);
    const ultimoDiaMes = new Date(y, m, 0);

    const startOffset = (primerDiaMes.getDay() + 6) % 7;
    const totalDias = ultimoDiaMes.getDate();

    const celdas: { fecha: string | null; numero: number | null; citasCount: number; pendientesCount: number }[] = [];

    for (let i = 0; i < startOffset; i++) {
      celdas.push({ fecha: null, numero: null, citasCount: 0, pendientesCount: 0 });
    }

    for (let d = 1; d <= totalDias; d++) {
      const mm = String(m).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const fecha = `${y}-${mm}-${dd}`;
      const citasDelDia = citasFiltradas.filter((c) => c.fecha === fecha);
      const pend = citasDelDia.filter((c) => c.estado === 'Pendiente').length;

      celdas.push({
        fecha,
        numero: d,
        citasCount: citasDelDia.length,
        pendientesCount: pend,
      });
    }

    return celdas;
  }, [fechaActual, citasFiltradas]);

  // Manejo de Drag and Drop para Citas
  const handleDragStart = (e: React.DragEvent, cita: Cita) => {
    e.dataTransfer.setData('text/plain', `cita:${cita.id}`);
    e.dataTransfer.effectAllowed = 'move';
    setArrastrandoCita(cita);
    setArrastrandoBloqueo(null);
  };

  // Manejo de Drag and Drop para Bloqueos
  const handleDragStartBloqueo = (e: React.DragEvent, bloqueo: BloqueoDisponibilidad) => {
    e.dataTransfer.setData('text/plain', `bloq:${bloqueo.id}`);
    e.dataTransfer.effectAllowed = 'move';
    setArrastrandoBloqueo(bloqueo);
    setArrastrandoCita(null);
  };

  const handleDragEnd = () => {
    setArrastrandoCita(null);
    setArrastrandoBloqueo(null);
    setSlotHoverId(null);
  };

  const handleDragOver = (e: React.DragEvent, slotId: string, targetColabId: string) => {
    e.preventDefault();
    if (esColaboradora && miColaboradorId && targetColabId !== miColaboradorId) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.dataTransfer.dropEffect = 'move';
    if (slotHoverId !== slotId) {
      setSlotHoverId(slotId);
    }
  };

  const handleDesbloquear = async (bloqueoId: string) => {
    const bloq = bloqueos.find((b) => b.id === bloqueoId);
    if (esColaboradora && miColaboradorId && bloq) {
      if (bloq.terapeutaId !== miColaboradorId && bloq.colaboradorId !== miColaboradorId) {
        alert('Como colaboradora, únicamente el administrador puede gestionar o desbloquear la agenda de otras terapeutas.');
        return;
      }
    }
    if (confirm('¿Deseas desbloquear y liberar este horario en la agenda?')) {
      await eliminarBloqueo(bloqueoId);
    }
  };

  const handleDesbloquearTodoElDia = async (fecha: string, colabId?: string) => {
    if (esColaboradora && miColaboradorId && colabId && colabId !== miColaboradorId) {
      alert('Como colaboradora, únicamente el administrador puede gestionar o desbloquear la agenda de otras terapeutas.');
      return;
    }
    if (confirm('¿Deseas desbloquear y liberar todo el día completo en la agenda?')) {
      await desbloquearTodoElDia(fecha, colabId);
    }
  };

  const handleDrop = async (
    e: React.DragEvent,
    targetFecha: string,
    targetHora: string,
    targetColabId: string
  ) => {
    e.preventDefault();
    setSlotHoverId(null);
    const dataRaw = e.dataTransfer.getData('text/plain');

    // Caso 1: Movimiento de Bloqueo de Disponibilidad
    if (arrastrandoBloqueo || dataRaw.startsWith('bloq:')) {
      const bloqId = arrastrandoBloqueo?.id || dataRaw.replace('bloq:', '');
      const bloq = arrastrandoBloqueo || bloqueos.find((b) => b.id === bloqId);
      setArrastrandoBloqueo(null);

      if (!bloq) return;

      if (esColaboradora && miColaboradorId && targetColabId !== miColaboradorId) {
        alert('Como colaboradora, únicamente puedes mover bloqueos dentro de tu propia agenda.');
        return;
      }

      // Calcular nueva hora de fin (1 hora después o según duración previa)
      const [h, m] = targetHora.split(':').map(Number);
      const endMinutes = h * 60 + m + 60;
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      const nuevaHoraFin = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      await reprogramarBloqueo(bloq.id, targetFecha, targetHora, nuevaHoraFin, targetColabId);
      return;
    }

    // Caso 2: Movimiento de Cita
    const citaId = dataRaw.startsWith('cita:') ? dataRaw.replace('cita:', '') : dataRaw;
    const cita = arrastrandoCita || citas.find((c) => c.id === citaId);
    setArrastrandoCita(null);

    if (!cita) return;

    // Validación de seguridad para colaboradoras: solo pueden mover en su propia agenda
    if (esColaboradora && miColaboradorId && targetColabId !== miColaboradorId) {
      alert('Como colaboradora, únicamente puedes reprogramar citas dentro de tu propia agenda.');
      return;
    }

    // Si es el mismo horario y colaboradora, no hacer nada
    if (
      cita.fecha === targetFecha &&
      cita.horaInicio === targetHora &&
      (cita.terapeutaId === targetColabId || cita.colaboradorId === targetColabId)
    ) {
      return;
    }

    // Calcular nueva hora de fin
    const [h, m] = targetHora.split(':').map(Number);
    const duracion = cita.duracionTotalMin || 60;
    const endMinutes = h * 60 + m + duracion;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const nuevaHoraFin = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    // Abrir modal interactivo de confirmación
    setConfirmacionModal({
      cita,
      nuevaFecha: targetFecha,
      nuevaHoraInicio: targetHora,
      nuevaHoraFin,
      nuevoColaboradorId: targetColabId,
    });
  };

  const confirmarReprogramacion = async () => {
    if (!confirmacionModal) return;
    await reprogramarCita(
      confirmacionModal.cita.id,
      confirmacionModal.nuevaFecha,
      confirmacionModal.nuevaHoraInicio,
      confirmacionModal.nuevoColaboradorId
    );
    setConfirmacionModal(null);
  };

  // Soporte Touch Drag para dispositivos táctiles
  const handleTouchEndSlot = async (
    targetFecha: string,
    targetHora: string,
    targetColabId: string
  ) => {
    if (arrastrandoBloqueo) {
      const bloq = arrastrandoBloqueo;
      setArrastrandoBloqueo(null);
      setSlotHoverId(null);

      if (esColaboradora && miColaboradorId && targetColabId !== miColaboradorId) {
        alert('Como colaboradora, únicamente puedes mover bloqueos dentro de tu propia agenda.');
        return;
      }

      const [h, m] = targetHora.split(':').map(Number);
      const endMinutes = h * 60 + m + 60;
      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      const nuevaHoraFin = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      await reprogramarBloqueo(bloq.id, targetFecha, targetHora, nuevaHoraFin, targetColabId);
      return;
    }

    if (!arrastrandoCita) return;
    const cita = arrastrandoCita;
    setArrastrandoCita(null);
    setSlotHoverId(null);

    if (esColaboradora && miColaboradorId && targetColabId !== miColaboradorId) {
      alert('Como colaboradora, únicamente puedes reprogramar citas dentro de tu propia agenda.');
      return;
    }

    if (
      cita.fecha === targetFecha &&
      cita.horaInicio === targetHora &&
      (cita.terapeutaId === targetColabId || cita.colaboradorId === targetColabId)
    ) {
      return;
    }

    const [h, m] = targetHora.split(':').map(Number);
    const duracion = cita.duracionTotalMin || 60;
    const endMinutes = h * 60 + m + duracion;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const nuevaHoraFin = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    setConfirmacionModal({
      cita,
      nuevaFecha: targetFecha,
      nuevaHoraInicio: targetHora,
      nuevaHoraFin,
      nuevoColaboradorId: targetColabId,
    });
  };

  const obtenerIniciales = (nombre: string) => {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  return (
    <div className="flex-1 overflow-auto bg-[#FAF6F0] p-4">
      {/* =========================================================================
          VISTA 1: DÍA (Columnas por Colaboradora)
         ========================================================================= */}
      {vista === 'dia' && (() => {
        const numColabs = Math.max(1, colaboradoresActivas.length);
        const colMinWidth = 190;
        const hourColWidth = 72;
        const totalMinWidth = hourColWidth + numColabs * colMinWidth;
        const gridColsStyle = `${hourColWidth}px repeat(${numColabs}, minmax(${colMinWidth}px, 1fr))`;

        return (
          <div className="rounded-3xl border border-[#E6D7CB] bg-white p-4 shadow-sm">
            <div className="overflow-x-auto">
              <div style={{ minWidth: `${totalMinWidth}px` }}>
                {/* Encabezado de Colaboradoras */}
                <div
                  className="grid border-b border-[#E8DCCF] pb-3"
                  style={{ gridTemplateColumns: gridColsStyle }}
                >
                  <div className="flex items-center justify-center text-xs font-bold text-[#8C7A70] self-end pb-1 pr-2">
                    <span className="bg-[#FAF6F0] px-2.5 py-1 rounded-lg border border-[#E6D7CB]">
                      Hora
                    </span>
                  </div>
                  {colaboradoresActivas.map((c) => {
                    const tieneBloqueoDia = bloqueosDia.some(
                      (b) =>
                        b.terapeutaId === c.id || b.colaboradorId === c.id || b.terapeutaId === 'all'
                    );

                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-2 px-3 border-l border-[#F4EDE4]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Cuadrito de la imagen clickeable en la columna de abajo */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!esColaboradora || c.id === miColaboradorId) {
                                onOpenChangePhoto?.(c.id);
                              }
                            }}
                            className={`group relative flex items-center justify-center rounded-xl transition shrink-0 ${
                              !esColaboradora || c.id === miColaboradorId
                                ? 'cursor-pointer hover:ring-2 hover:ring-[#B85D75] hover:scale-105'
                                : ''
                            }`}
                            title={
                              c.id === miColaboradorId
                                ? 'Haz clic para cambiar tu foto de perfil'
                                : !esColaboradora
                                ? `Haz clic para cambiar la foto de ${c.nombre}`
                                : c.nombre
                            }
                          >
                            {c.foto ? (
                              <img
                                src={c.foto}
                                alt={c.nombre}
                                className="h-9 w-9 rounded-xl object-cover border border-[#E6D7CB] shadow-2xs"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-gold-gradient text-white font-serif font-bold text-xs shadow-2xs">
                                {obtenerIniciales(c.nombre)}
                              </div>
                            )}

                            {(!esColaboradora || c.id === miColaboradorId) && (
                              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2D2424] text-white shadow-2xs group-hover:bg-[#B85D75] transition">
                                <Camera className="h-2.5 w-2.5 text-white" />
                              </span>
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-[#2D2424] truncate">{c.nombre}</h4>
                            <span className="text-[10px] text-[#8C7A70] block">
                              {c.horarioBase.horaInicio} - {c.horarioBase.horaFin}
                            </span>
                          </div>
                        </div>

                        {tieneBloqueoDia &&
                          (!esColaboradora || !miColaboradorId || c.id === miColaboradorId) && (
                            <button
                              type="button"
                              onClick={() => handleDesbloquearTodoElDia(fechaActual, c.id)}
                              className="rounded-lg bg-stone-900 hover:bg-rose-600 text-white px-2 py-1 text-[10px] font-bold shadow-xs transition shrink-0 flex items-center gap-1 cursor-pointer"
                              title="Desbloquear y liberar todo el día para esta colaboradora"
                            >
                              <span>🔓</span>
                              <span>Desbloquear Todo</span>
                            </button>
                          )}
                      </div>
                    );
                  })}
                </div>

                {/* Filas de Horas */}
                <div className="divide-y divide-[#F4EDE4]">
                  {horasArray.map((hora) => (
                    <div
                      key={hora}
                      className="grid min-h-[64px] hover:bg-[#FAF6F0]/20 transition"
                      style={{ gridTemplateColumns: gridColsStyle }}
                    >
                      {/* Columna de Hora Clickeable */}
                      <div className="py-2 pr-2.5 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            onSlotClick(
                              fechaActual,
                              hora,
                              filtroColaborador !== 'all' ? filtroColaborador : undefined
                            )
                          }
                          className="text-xs font-bold text-[#6B5E59] hover:text-[#B85D75] hover:bg-white px-2 py-1 rounded-lg transition border border-transparent hover:border-[#E6D7CB] shadow-2xs hover:shadow-xs cursor-pointer active:scale-95 group/hbtn"
                          title={`Agendar Cita a las ${hora}`}
                        >
                          <span className="group-hover/hbtn:underline">{hora}</span>
                        </button>
                      </div>

                      {/* Columnas de Colaboradoras */}
                      {colaboradoresActivas.map((colab) => {
                        const citasEnHora = citasDia.filter(
                          (c) =>
                            (c.terapeutaId === colab.id || c.colaboradorId === colab.id) &&
                            c.horaInicio === hora
                        );

                        const bloqueoEnHora = bloqueosDia.find((b) => {
                          if (
                            b.terapeutaId !== 'all' &&
                            b.terapeutaId !== colab.id &&
                            b.colaboradorId !== colab.id
                          )
                            return false;
                          if (b.tipo === 'dia_completo') return true;
                          if (b.tipo === 'franja_horaria' && b.horaInicio && b.horaFin) {
                            const hm = timeToMinutes(hora);
                            return (
                              hm >= timeToMinutes(b.horaInicio) &&
                              hm < timeToMinutes(b.horaFin)
                            );
                          }
                          return false;
                        });

                        const slotId = `${fechaActual}_${hora}_${colab.id}`;
                        const isHovered = slotHoverId === slotId;
                        const esDestinoPermitido =
                          !esColaboradora || !miColaboradorId || colab.id === miColaboradorId;

                        return (
                          <div
                            key={colab.id}
                            onDragOver={(e) => handleDragOver(e, slotId, colab.id)}
                            onDragLeave={() => setSlotHoverId(null)}
                            onDrop={(e) => handleDrop(e, fechaActual, hora, colab.id)}
                            onClick={() => {
                              if (arrastrandoCita && esDestinoPermitido) {
                                handleTouchEndSlot(fechaActual, hora, colab.id);
                              } else if (
                                citasEnHora.length === 0 &&
                                !bloqueoEnHora &&
                                esDestinoPermitido
                              ) {
                                onSlotClick(fechaActual, hora, colab.id);
                              }
                            }}
                            className={`relative border-l border-[#F4EDE4] p-1.5 transition group select-none ${
                              isHovered && esDestinoPermitido
                                ? 'bg-[#FFF0EB] ring-2 ring-[#B85D75] ring-inset'
                                : arrastrandoCita && !esDestinoPermitido
                                ? 'opacity-40 bg-stone-100/50 cursor-not-allowed'
                                : citasEnHora.length === 0 && !bloqueoEnHora && esDestinoPermitido
                                ? 'cursor-pointer hover:bg-[#FAF0E6]/50 active:bg-[#FAF0E6]'
                                : ''
                            }`}
                          >
                            {/* Citas Arrastrables */}
                            {citasEnHora.length > 0 && (
                              <div
                                className={
                                  citasEnHora.length > 1
                                    ? 'grid grid-cols-1 md:grid-cols-2 gap-1.5 w-full'
                                    : 'space-y-1.5 w-full'
                                }
                              >
                                {citasEnHora.map((citaEnHora) => {
                                  const estilo = getEstadoEstilo(citaEnHora.estado);
                                  const nombresServicios = citaEnHora.servicioIds
                                    .map(
                                      (id) =>
                                        servicios.find((s) => s.id === id)?.nombre || 'Servicio'
                                    )
                                    .join(' + ');

                                  return (
                                    <div
                                      key={citaEnHora.id}
                                      draggable={true}
                                      onDragStart={(e) => handleDragStart(e, citaEnHora)}
                                      onDragEnd={handleDragEnd}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!arrastrandoCita) onSelectCita(citaEnHora);
                                      }}
                                      className={`rounded-xl p-2.5 shadow-xs cursor-grab active:cursor-grabbing border transition hover:scale-[1.01] select-none ${
                                        arrastrandoCita?.id === citaEnHora.id
                                          ? 'opacity-40 border-dashed border-[#B85D75]'
                                          : estilo.card
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <div className="flex items-center gap-1 min-w-0">
                                          <span className="text-[10px] text-[#8C7A70] cursor-grab">⋮⋮</span>
                                          <span className="font-bold text-xs truncate">
                                            {citaEnHora.clienteNombre}
                                          </span>
                                        </div>
                                        <span
                                          className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold shrink-0 ${estilo.badge}`}
                                        >
                                          {citaEnHora.estado}
                                        </span>
                                      </div>

                                      <p className="mt-1 text-[11px] font-medium opacity-90 line-clamp-1">
                                        {nombresServicios}
                                      </p>

                                      <div className="mt-1 flex items-center justify-between text-[10px] opacity-80">
                                        <span>
                                          {citaEnHora.horaInicio} - {citaEnHora.horaFin}
                                        </span>
                                        <span className="font-bold">
                                          {configuracion.moneda}{citaEnHora.precioTotal}
                                        </span>
                                      </div>

                                      {/* Botón táctil para mover en móviles */}
                                      <div className="mt-1.5 pt-1 border-t border-black/5 flex items-center justify-between sm:hidden">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setArrastrandoCita(citaEnHora);
                                          }}
                                          className="text-[9px] font-bold text-[#B85D75] bg-white rounded px-1.5 py-0.5 border border-[#E6D7CB]"
                                        >
                                          {arrastrandoCita?.id === citaEnHora.id
                                            ? 'Seleccionada: Toca destino'
                                            : '⇄ Mover / Reprogramar'}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Bloqueo */}
                            {citasEnHora.length === 0 && bloqueoEnHora && (
                              <div
                                draggable={esDestinoPermitido}
                                onDragStart={(e) => handleDragStartBloqueo(e, bloqueoEnHora)}
                                onDragEnd={handleDragEnd}
                                className={`rounded-xl bg-stone-950/85 backdrop-blur-xs border border-stone-700/90 p-2 text-white shadow-md flex items-center justify-between transition ${
                                  esDestinoPermitido
                                    ? 'cursor-grab active:cursor-grabbing hover:bg-stone-900'
                                    : 'cursor-default'
                                } select-none ${
                                  arrastrandoBloqueo?.id === bloqueoEnHora.id
                                    ? 'opacity-40 border-dashed border-white'
                                    : ''
                                }`}
                                title={
                                  esDestinoPermitido
                                    ? 'Horario Bloqueado - Arrastra para mover o presiona el botón para desbloquear'
                                    : 'Horario Bloqueado de otra colaboradora'
                                }
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <ShieldBan className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                                  <div className="truncate">
                                    <span className="font-bold text-xs text-white block truncate">
                                      {bloqueoEnHora.motivo}
                                    </span>
                                    <span className="text-[9px] text-stone-300 block">
                                      ⛔{' '}
                                      {bloqueoEnHora.tipo === 'dia_completo'
                                        ? 'Día Completo'
                                        : `${bloqueoEnHora.horaInicio || hora} - ${
                                            bloqueoEnHora.horaFin || ''
                                          }`}
                                    </span>
                                  </div>
                                </div>

                                {esDestinoPermitido && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDesbloquear(bloqueoEnHora.id);
                                    }}
                                    className="rounded-lg bg-stone-800/90 hover:bg-rose-600 text-stone-300 hover:text-white p-1 text-[10px] transition border border-stone-600 ml-1 shrink-0 cursor-pointer"
                                    title="Desbloquear este horario"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Opciones en Casilla Vacía o Destino de Drag */}
                            {citasEnHora.length === 0 && !bloqueoEnHora && (
                              <div className="flex items-center justify-center gap-1.5 h-full min-h-[44px]">
                                {(arrastrandoCita || arrastrandoBloqueo) && esDestinoPermitido ? (
                                  <div className="text-center">
                                    <span className="rounded-lg bg-[#FAF0E6] text-[#B85D75] border border-[#E6D7CB] px-2 py-1 text-[10px] font-bold block animate-pulse">
                                      Soltar aquí ({hora})
                                    </span>
                                  </div>
                                ) : esDestinoPermitido ? (
                                  <div className="flex items-center justify-center gap-1.5 transition">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onSlotClick(fechaActual, hora, colab.id);
                                      }}
                                      className="flex items-center gap-1 rounded-lg bg-white border border-[#E6D7CB] px-2.5 py-1 text-[11px] font-bold text-[#5A4D48] shadow-2xs hover:bg-[#B85D75] hover:text-white hover:border-[#B85D75] transition cursor-pointer active:scale-95 group/btn"
                                      title={`Agendar Cita con ${colab.nombre} a las ${hora}`}
                                    >
                                      <Plus className="h-3 w-3 text-[#B85D75] group-hover/btn:text-white transition" />
                                      <span>+ Cita</span>
                                    </button>

                                    {onQuickBlock && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onQuickBlock(fechaActual, hora, colab.id);
                                        }}
                                        className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-stone-100 border border-stone-300 px-2 py-1 text-[10px] font-bold text-stone-600 shadow-2xs hover:bg-stone-800 hover:text-white hover:border-stone-800 transition cursor-pointer active:scale-95"
                                        title="Bloquear este horario"
                                      >
                                        <Ban className="h-2.5 w-2.5" />
                                      </button>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          VISTA 2: SEMANA (7 Días)
         ========================================================================= */}
      {vista === 'semana' && (
        <div className="rounded-2xl sm:rounded-3xl border border-[#E6D7CB] bg-white p-1.5 sm:p-4 shadow-sm">
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {diasSemana.map((d) => {
              const citasSemanaDia = citasFiltradas.filter((c) => c.fecha === d.fecha);
              const esSeleccionado = d.fecha === fechaActual;

              return (
                <div
                  key={d.fecha}
                  onClick={() => onSelectFecha(d.fecha)}
                  className={`rounded-xl sm:rounded-2xl p-1 sm:p-3 border transition cursor-pointer flex flex-col min-h-[160px] sm:min-h-[300px] ${
                    esSeleccionado
                      ? 'border-[#B85D75] bg-[#FFF9F7] shadow-xs'
                      : 'border-[#EAE0D5] bg-white hover:border-[#D6C2B4]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between border-b border-[#F4EDE4] pb-1 sm:pb-2">
                    <div className="text-center sm:text-left">
                      <span className="text-[9px] sm:text-[11px] font-semibold text-[#8C7A70] block leading-none">
                        {d.label}
                      </span>
                      <span className="text-xs sm:text-base font-bold text-[#2D2424]">{d.numero}</span>
                    </div>
                    {d.esHoy && (
                      <span className="rounded-full bg-[#B85D75] px-1 sm:px-1.5 py-0.5 text-[7px] sm:text-[9px] font-bold text-white mt-0.5 sm:mt-0">
                        Hoy
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex-1 space-y-1.5 overflow-y-auto">
                    {/* Bloqueos del Día */}
                    {bloqueos
                      .filter(
                        (b) =>
                          b.fecha === d.fecha &&
                          (filtroColaborador === 'all' ||
                            b.terapeutaId === filtroColaborador ||
                            b.colaboradorId === filtroColaborador ||
                            b.terapeutaId === 'all')
                      )
                      .map((b) => (
                        <div
                          key={b.id}
                          className="rounded-lg bg-stone-950/85 backdrop-blur-xs p-1.5 text-[9px] border border-stone-700 text-white shadow-2xs flex items-center justify-between"
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <ShieldBan className="h-3 w-3 text-rose-400 shrink-0" />
                            <span className="font-bold truncate">{b.motivo}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDesbloquearTodoElDia(d.fecha);
                            }}
                            className="bg-stone-800 hover:bg-rose-600 text-stone-200 hover:text-white px-1 py-0.5 rounded text-[8px] border border-stone-600 transition shrink-0 ml-1 cursor-pointer"
                            title="Desbloquear este día"
                          >
                            Desbloquear
                          </button>
                        </div>
                      ))}

                    {/* Citas de la Semana */}
                    {citasSemanaDia.map((cita) => {
                      const colab = colaboradores.find(
                        (c) => c.id === cita.terapeutaId || c.id === cita.colaboradorId
                      );
                      const estilo = getEstadoEstilo(cita.estado);
                      const inicial = (cita.clienteNombre || 'C').trim().charAt(0).toUpperCase();

                      // Color vibrante del circulito según estado de la cita
                      const colorCirculo =
                        cita.estado === 'Confirmada'
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/40 shadow-xs'
                          : cita.estado === 'Pendiente'
                          ? 'bg-amber-500 text-white ring-2 ring-amber-400/40 shadow-xs'
                          : cita.estado === 'Completada'
                          ? 'bg-stone-500 text-white ring-2 ring-stone-400/40 shadow-xs'
                          : cita.estado === 'Rechazada'
                          ? 'bg-rose-600 text-white ring-2 ring-rose-400/40 shadow-xs'
                          : 'bg-[#B85D75] text-white';

                      return (
                        <React.Fragment key={cita.id}>
                          {/* 📱 VISTA EN CELULARES: Circulito pequeño con inicial y color de estado */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCita(cita);
                            }}
                            className="sm:hidden flex flex-col items-center justify-center my-1 cursor-pointer active:scale-90 transition group"
                            title={`${cita.clienteNombre} (${cita.estado}) • ${cita.horaInicio}`}
                          >
                            <div
                              className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${colorCirculo}`}
                            >
                              {inicial}
                            </div>
                            <span className="text-[8px] font-bold text-[#5A4D48] mt-0.5 leading-none">
                              {cita.horaInicio}
                            </span>
                          </div>

                          {/* 💻 VISTA EN PC / LAPTOP: Tarjeta completa con circulito, nombre y horario */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCita(cita);
                            }}
                            className={`hidden sm:block rounded-xl p-2 text-[10px] border shadow-2xs cursor-pointer transition hover:scale-[1.02] hover:shadow-xs ${estilo.card}`}
                            title={`${cita.clienteNombre} (${cita.estado}) - ${cita.horaInicio} con ${colab?.nombre || 'Colaboradora'}`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div
                                className={`h-5 w-5 min-w-[20px] rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${colorCirculo}`}
                              >
                                {inicial}
                              </div>
                              <div className="font-bold text-[11px] truncate flex-1 leading-tight text-[#2D2424]">
                                {cita.clienteNombre}
                              </div>
                            </div>

                            <div className="mt-1 flex items-center justify-between text-[10px] opacity-85 pl-6.5">
                              <span className="font-medium text-[#4A3E39]">{cita.horaInicio}</span>
                              <span className="truncate text-[9px] font-semibold text-[#8C7A70]">
                                {colab?.nombre.split(' ')[0]}
                              </span>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}

                    {citasSemanaDia.length === 0 &&
                      bloqueos.filter((b) => b.fecha === d.fecha).length === 0 && (
                        <div className="pt-8 text-center text-[10px] text-[#A89A92]">
                          Sin citas
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VISTA 3: MES (Matriz)
         ========================================================================= */}
      {vista === 'mes' && (
        <div className="rounded-3xl border border-[#E6D7CB] bg-white p-5 shadow-sm space-y-3">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[#8C7A70] border-b border-[#F4EDE4] pb-2">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {diasMes.map((celda, idx) => {
              if (!celda.fecha) {
                return <div key={idx} className="min-h-[70px] rounded-xl bg-stone-50/50"></div>;
              }

              const esSeleccionado = celda.fecha === fechaActual;
              const hoyStr = new Date().toISOString().split('T')[0];
              const esHoy = celda.fecha === hoyStr;

              return (
                <div
                  key={celda.fecha}
                  onClick={() => onSelectFecha(celda.fecha!)}
                  className={`min-h-[76px] rounded-2xl p-2 border transition cursor-pointer flex flex-col justify-between ${
                    esSeleccionado
                      ? 'border-[#B85D75] bg-[#FFF9F7] shadow-xs'
                      : esHoy
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : 'border-[#EAE0D5] bg-white hover:border-[#D6C2B4]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        esHoy ? 'text-emerald-700' : 'text-[#2D2424]'
                      }`}
                    >
                      {celda.numero}
                    </span>
                    {celda.pendientesCount > 0 && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                        {celda.pendientesCount}
                      </span>
                    )}
                  </div>

                  <div className="mt-1">
                    {celda.citasCount > 0 && (
                      <span className="inline-block rounded-md bg-[#FAF0E6] px-1.5 py-0.5 text-[10px] font-semibold text-[#8C5845]">
                        {celda.citasCount} {celda.citasCount === 1 ? 'cita' : 'citas'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE CONFIRMACIÓN DE REPROGRAMACIÓN (DRAG & DROP)
         ========================================================================= */}
      {confirmacionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-3xl border-2 border-[#E6D7CB] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-[#E8DCCF] pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#B85D75]">
                  Confirmación de Movimiento
                </span>
                <h3 className="text-base font-serif font-bold text-[#2D2424]">
                  ¿Deseas reprogramar esta cita?
                </h3>
              </div>
            </div>

            <div className="rounded-2xl bg-[#FAF6F0] p-4 border border-[#EFE7DE] space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A70] block">
                  Clienta:
                </span>
                <span className="font-bold text-[#2D2424] text-sm">
                  {confirmacionModal.cita.clienteNombre}
                </span>
                <span className="text-[11px] text-[#5A4D48] ml-2">
                  ({confirmacionModal.cita.clienteTelefono})
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C7A70] block">
                  Servicio(s):
                </span>
                <span className="font-medium text-[#2D2424]">
                  {confirmacionModal.cita.servicioIds
                    .map((id) => servicios.find((s) => s.id === id)?.nombre || 'Servicio')
                    .join(' + ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#E8DCCF]">
                <div className="rounded-xl bg-white p-2.5 border border-[#EAE0D5]">
                  <span className="text-[10px] font-bold text-rose-700 block uppercase">
                    Horario Actual:
                  </span>
                  <div className="font-bold text-[#2D2424] mt-0.5">
                    {confirmacionModal.cita.horaInicio} - {confirmacionModal.cita.horaFin}
                  </div>
                  <div className="text-[11px] text-[#8C7A70]">
                    {confirmacionModal.cita.fecha}
                  </div>
                  <div className="text-[10px] text-[#5A4D48] mt-1 font-semibold truncate">
                    Colab: {colaboradores.find((c) => c.id === confirmacionModal.cita.terapeutaId)?.nombre || 'Asignada'}
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-50 p-2.5 border border-emerald-300">
                  <span className="text-[10px] font-bold text-emerald-800 block uppercase">
                    Nuevo Horario:
                  </span>
                  <div className="font-bold text-emerald-950 mt-0.5">
                    {confirmacionModal.nuevaHoraInicio} - {confirmacionModal.nuevaHoraFin}
                  </div>
                  <div className="text-[11px] text-emerald-800 font-medium">
                    {confirmacionModal.nuevaFecha}
                  </div>
                  <div className="text-[10px] text-emerald-900 mt-1 font-bold truncate">
                    Colab: {colaboradores.find((c) => c.id === confirmacionModal.nuevoColaboradorId)?.nombre || 'Asignada'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmacionModal(null)}
                className="rounded-xl border border-[#E6D7CB] bg-white px-4 py-2 text-xs font-semibold text-[#5A4D48] hover:bg-[#FAF6F0]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarReprogramacion}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-xs transition"
              >
                Confirmar Reprogramación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
