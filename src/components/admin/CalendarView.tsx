'use client';

import React, { useMemo } from 'react';
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
} from 'lucide-react';

interface CalendarViewProps {
  fechaActual: string; // YYYY-MM-DD
  vista: VistaCalendario;
  onSelectCita: (cita: Cita) => void;
  onSlotClick: (fecha: string, hora: string, terapeutaId?: string) => void;
  onSelectFecha: (fecha: string) => void;
  onQuickBlock?: (fecha: string, hora: string, terapeutaId?: string) => void;
}

export default function CalendarView({
  fechaActual,
  vista,
  onSelectCita,
  onSlotClick,
  onSelectFecha,
  onQuickBlock,
}: CalendarViewProps) {
  const { citas, colaboradores, servicios, bloqueos, configuracion } = useSalon();

  const colaboradoresActivas = useMemo(() => {
    return colaboradores.filter((c) => c.activo);
  }, [colaboradores]);

  const citasDia = useMemo(() => {
    return citas.filter((c) => c.fecha === fechaActual);
  }, [citas, fechaActual]);

  const bloqueosDia = useMemo(() => {
    return bloqueos.filter((b) => b.fecha === fechaActual);
  }, [bloqueos, fechaActual]);

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
      const citasDelDia = citas.filter((c) => c.fecha === fecha && c.estado !== 'Rechazada');
      const pend = citasDelDia.filter((c) => c.estado === 'Pendiente').length;

      celdas.push({
        fecha,
        numero: d,
        citasCount: citasDelDia.length,
        pendientesCount: pend,
      });
    }

    return celdas;
  }, [fechaActual, citas]);

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
      {vista === 'dia' && (
        <div className="rounded-3xl border border-[#E6D7CB] bg-white p-4 shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[750px]">
              {/* Encabezado de Colaboradoras */}
              <div className="grid grid-cols-[80px_repeat(auto-fit,minmax(180px,1fr))] border-b border-[#E8DCCF] pb-3">
                <div className="text-center text-xs font-bold text-[#8C7A70] self-end pb-1">
                  Hora
                </div>
                {colaboradoresActivas.map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5 px-3 border-l border-[#F4EDE4]">
                    {c.foto ? (
                      <img
                        src={c.foto}
                        alt={c.nombre}
                        className="h-9 w-9 rounded-xl object-cover border border-[#E6D7CB]"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-gold-gradient text-white font-serif font-bold text-xs shadow-2xs">
                        {obtenerIniciales(c.nombre)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[#2D2424] truncate">{c.nombre}</h4>
                      <span className="text-[10px] text-[#8C7A70] block">
                        {c.horarioBase.horaInicio} - {c.horarioBase.horaFin}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filas de Horas */}
              <div className="divide-y divide-[#F4EDE4]">
                {horasArray.map((hora) => (
                  <div
                    key={hora}
                    className="grid grid-cols-[80px_repeat(auto-fit,minmax(180px,1fr))] min-h-[64px]"
                  >
                    {/* Columna de Hora */}
                    <div className="py-2 pr-3 text-right text-xs font-semibold text-[#8C7A70]">
                      {hora}
                    </div>

                    {/* Columnas de Colaboradoras */}
                    {colaboradoresActivas.map((colab) => {
                      const citaEnHora = citasDia.find(
                        (c) => c.terapeutaId === colab.id && c.horaInicio === hora
                      );

                      const bloqueoEnHora = bloqueosDia.find((b) => {
                        if (b.terapeutaId !== 'all' && b.terapeutaId !== colab.id) return false;
                        if (b.tipo === 'dia_completo') return true;
                        if (b.tipo === 'franja_horaria' && b.horaInicio && b.horaFin) {
                          const hm = timeToMinutes(hora);
                          return hm >= timeToMinutes(b.horaInicio) && hm < timeToMinutes(b.horaFin);
                        }
                        return false;
                      });

                      const nombresServicios = citaEnHora?.servicioIds
                        .map((id) => servicios.find((s) => s.id === id)?.nombre || 'Servicio')
                        .join(' + ');

                      return (
                        <div
                          key={colab.id}
                          className="relative border-l border-[#F4EDE4] p-1.5 transition group"
                        >
                          {/* Cita */}
                          {citaEnHora && (
                            <div
                              onClick={() => onSelectCita(citaEnHora)}
                              className={`rounded-xl p-2.5 shadow-xs cursor-pointer border transition hover:scale-[1.02] ${
                                citaEnHora.estado === 'Confirmada'
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                                  : citaEnHora.estado === 'Pendiente'
                                  ? 'bg-amber-50 border-amber-300 text-amber-950 animate-soft-pulse'
                                  : citaEnHora.estado === 'Rechazada'
                                  ? 'bg-rose-50 border-rose-300 text-rose-950 opacity-60'
                                  : 'bg-stone-100 border-stone-300 text-stone-900'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-xs truncate">
                                  {citaEnHora.clienteNombre}
                                </span>
                                <span
                                  className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                                    citaEnHora.estado === 'Confirmada'
                                      ? 'bg-emerald-600 text-white'
                                      : citaEnHora.estado === 'Pendiente'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-rose-600 text-white'
                                  }`}
                                >
                                  {citaEnHora.estado}
                                </span>
                              </div>

                              <p className="mt-1 text-[11px] font-medium opacity-90 line-clamp-1">
                                {nombresServicios}
                              </p>

                              <div className="mt-1 flex items-center justify-between text-[10px] opacity-75">
                                <span>
                                  {citaEnHora.horaInicio} - {citaEnHora.horaFin}
                                </span>
                                <span className="font-bold">
                                  {configuracion.moneda}{citaEnHora.precioTotal}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Bloqueo */}
                          {!citaEnHora && bloqueoEnHora && (
                            <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-2 text-center text-[11px] text-amber-900">
                              <ShieldBan className="mx-auto h-3.5 w-3.5 text-amber-700 mb-0.5" />
                              <span className="font-bold block">{bloqueoEnHora.motivo}</span>
                              <span className="text-[9px] text-amber-700 block">No disponible</span>
                            </div>
                          )}

                          {/* Opciones en Casilla Vacía */}
                          {!citaEnHora && !bloqueoEnHora && (
                            <div className="hidden group-hover:flex items-center justify-center gap-1.5 h-full">
                              <button
                                onClick={() => onSlotClick(fechaActual, hora, colab.id)}
                                className="flex items-center gap-1 rounded-lg bg-[#2D2424] px-2 py-1 text-[10px] font-bold text-white shadow-2xs hover:bg-stone-800"
                                title="Agendar Cita en este horario"
                              >
                                <Plus className="h-3 w-3" />
                                Cita
                              </button>
                              {onQuickBlock && (
                                <button
                                  onClick={() => onQuickBlock(fechaActual, hora, colab.id)}
                                  className="flex items-center gap-1 rounded-lg bg-amber-600 px-2 py-1 text-[10px] font-bold text-white shadow-2xs hover:bg-amber-700"
                                  title="Bloquear este horario"
                                >
                                  <Ban className="h-3 w-3" />
                                  Bloquear
                                </button>
                              )}
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
      )}

      {/* =========================================================================
          VISTA 2: SEMANA (7 Días)
         ========================================================================= */}
      {vista === 'semana' && (
        <div className="rounded-3xl border border-[#E6D7CB] bg-white p-4 shadow-sm">
          <div className="grid grid-cols-7 gap-2">
            {diasSemana.map((d) => {
              const citasSemanaDia = citas.filter((c) => c.fecha === d.fecha && c.estado !== 'Rechazada');
              const esSeleccionado = d.fecha === fechaActual;

              return (
                <div
                  key={d.fecha}
                  onClick={() => onSelectFecha(d.fecha)}
                  className={`rounded-2xl p-3 border transition cursor-pointer flex flex-col min-h-[300px] ${
                    esSeleccionado
                      ? 'border-[#B85D75] bg-[#FFF9F7] shadow-xs'
                      : 'border-[#EAE0D5] bg-white hover:border-[#D6C2B4]'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-[#F4EDE4] pb-2">
                    <div>
                      <span className="text-[11px] font-semibold text-[#8C7A70] block">
                        {d.label}
                      </span>
                      <span className="text-base font-bold text-[#2D2424]">{d.numero}</span>
                    </div>
                    {d.esHoy && (
                      <span className="rounded-full bg-[#B85D75] px-1.5 py-0.5 text-[9px] font-bold text-white">
                        Hoy
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex-1 space-y-1.5 overflow-y-auto">
                    {citasSemanaDia.map((cita) => {
                      const colab = colaboradores.find((c) => c.id === cita.terapeutaId);
                      return (
                        <div
                          key={cita.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCita(cita);
                          }}
                          className={`rounded-lg p-1.5 text-[10px] border shadow-2xs cursor-pointer ${
                            cita.estado === 'Confirmada'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                              : 'bg-amber-50 border-amber-200 text-amber-950'
                          }`}
                        >
                          <div className="font-bold truncate">{cita.clienteNombre}</div>
                          <div className="opacity-80">
                            {cita.horaInicio} • {colab?.nombre.split(' ')[0]}
                          </div>
                        </div>
                      );
                    })}

                    {citasSemanaDia.length === 0 && (
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
    </div>
  );
}
