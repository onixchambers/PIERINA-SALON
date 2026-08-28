'use client';

import React, { useState, useEffect } from 'react';
import { useSalon } from '@/context/SalonContext';
import { TipoBloqueo } from '@/types/salon';
import {
  X,
  ShieldBan,
  Trash2,
  Calendar,
  Clock,
  Coffee,
  Sun,
  Moon,
  AlertCircle,
} from 'lucide-react';

interface AvailabilityBlockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fechaPrevia?: string;
  horaPrevia?: string;
  terapeutaIdPrevia?: string;
}

type OpcionBloqueo = 'Almuerzo' | 'Permiso' | 'Tarde Libre' | 'Día Completo';

function calcularHoraFin(inicio: string, horas: number): string {
  const [h, m] = inicio.split(':').map(Number);
  const totalMin = h * 60 + (m || 0) + Math.round(horas * 60);
  const endH = Math.min(23, Math.floor(totalMin / 60));
  const endM = totalMin % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export default function AvailabilityBlockerModal({
  isOpen,
  onClose,
  fechaPrevia,
  horaPrevia,
  terapeutaIdPrevia,
}: AvailabilityBlockerModalProps) {
  const { bloqueos, colaboradores, usuarioSesion, agregarBloqueo, eliminarBloqueo } = useSalon();

  const esColaboradora = usuarioSesion?.tipo === 'colaborador';
  const miColaboradorId = usuarioSesion?.colaboradorId;

  const [colaboradorId, setColaboradorId] = useState<string>(
    esColaboradora && miColaboradorId ? miColaboradorId : terapeutaIdPrevia || 'all'
  );
  const [fecha, setFecha] = useState<string>(fechaPrevia || new Date().toISOString().split('T')[0]);
  const [opcion, setOpcion] = useState<OpcionBloqueo>('Almuerzo');
  const [horaInicio, setHoraInicio] = useState<string>(horaPrevia || '14:00');
  const [duracionHoras, setDuracionHoras] = useState<number>(1);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (fechaPrevia) setFecha(fechaPrevia);
      if (horaPrevia) setHoraInicio(horaPrevia);
      if (terapeutaIdPrevia) {
        setColaboradorId(esColaboradora && miColaboradorId ? miColaboradorId : terapeutaIdPrevia);
      }
      setError('');
    }
  }, [isOpen, fechaPrevia, horaPrevia, terapeutaIdPrevia, esColaboradora, miColaboradorId]);

  if (!isOpen) return null;

  // Filtrar lista de bloqueos según rol
  const bloqueosVisibles = bloqueos.filter((b) => {
    if (esColaboradora && miColaboradorId) {
      return b.terapeutaId === miColaboradorId || b.colaboradorId === miColaboradorId;
    }
    return true;
  });

  const handleSeleccionarOpcion = (opc: OpcionBloqueo) => {
    setOpcion(opc);
    if (opc === 'Almuerzo') setDuracionHoras(1);
    else if (opc === 'Permiso') setDuracionHoras(2);
    else if (opc === 'Tarde Libre') setDuracionHoras(4);
  };

  const horaFinCalculada = calcularHoraFin(horaInicio, duracionHoras);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fecha) {
      setError('Por favor selecciona una fecha');
      return;
    }

    const esDiaCompleto = opcion === 'Día Completo';
    const targetColaborador = esColaboradora && miColaboradorId ? miColaboradorId : colaboradorId;

    await agregarBloqueo({
      terapeutaId: targetColaborador,
      colaboradorId: targetColaborador,
      fecha,
      tipo: esDiaCompleto ? 'dia_completo' : 'franja_horaria',
      horaInicio: esDiaCompleto ? undefined : horaInicio,
      horaFin: esDiaCompleto ? undefined : horaFinCalculada,
      motivo: opcion,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-[#E6D7CB] bg-[#FAF6F0] p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 shadow-xs">
              <ShieldBan className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#B85D75]">
                Control de Disponibilidad
              </span>
              <h3 className="text-lg font-serif font-bold text-[#2D2424]">
                Bloquear Agenda
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#8C7A70] hover:bg-[#EFE7DE] hover:text-[#2D2424] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Opciones de Motivo */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2D2424]">
                ⚡ Motivo del Bloqueo:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleSeleccionarOpcion('Almuerzo')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 font-bold transition shadow-2xs cursor-pointer ${
                    opcion === 'Almuerzo'
                      ? 'bg-[#2D2424] text-white border-[#2D2424]'
                      : 'bg-white border-[#E6D7CB] text-[#5A4D48] hover:bg-[#FAF0E6]'
                  }`}
                >
                  <Coffee className="h-3.5 w-3.5 text-[#B85D75]" />
                  <span>Almuerzo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSeleccionarOpcion('Permiso')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 font-bold transition shadow-2xs cursor-pointer ${
                    opcion === 'Permiso'
                      ? 'bg-[#2D2424] text-white border-[#2D2424]'
                      : 'bg-white border-[#E6D7CB] text-[#5A4D48] hover:bg-[#FAF0E6]'
                  }`}
                >
                  <Sun className="h-3.5 w-3.5 text-amber-600" />
                  <span>Permiso</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSeleccionarOpcion('Tarde Libre')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 font-bold transition shadow-2xs cursor-pointer ${
                    opcion === 'Tarde Libre'
                      ? 'bg-[#2D2424] text-white border-[#2D2424]'
                      : 'bg-white border-[#E6D7CB] text-[#5A4D48] hover:bg-[#FAF0E6]'
                  }`}
                >
                  <Moon className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Tarde Libre</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSeleccionarOpcion('Día Completo')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 font-bold transition shadow-2xs cursor-pointer ${
                    opcion === 'Día Completo'
                      ? 'bg-[#2D2424] text-white border-[#2D2424]'
                      : 'bg-white border-[#E6D7CB] text-[#5A4D48] hover:bg-[#FAF0E6]'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Día Completo</span>
                </button>
              </div>
            </div>

            {/* Colaboradora y Fecha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl bg-white p-3.5 border border-[#EAE0D5]">
              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Colaboradora:
                </label>
                {esColaboradora ? (
                  <div className="rounded-xl border border-[#E6D7CB] bg-[#FAF6F0] p-2 text-xs font-bold text-[#2D2424]">
                    👤 {usuarioSesion?.nombre} (Tu propia agenda)
                  </div>
                ) : (
                  <select
                    value={colaboradorId}
                    onChange={(e) => setColaboradorId(e.target.value)}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-[#FAF6F0]/50 p-2 text-xs text-[#2D2424] focus:border-[#B85D75] focus:bg-white focus:outline-hidden font-medium"
                  >
                    <option value="all">Todo el Salón (Todas las colaboradoras)</option>
                    {colaboradores.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Fecha:
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full rounded-xl border border-[#E6D7CB] bg-[#FAF6F0]/50 p-2 text-xs text-[#2D2424] focus:border-[#B85D75] focus:bg-white focus:outline-hidden font-medium"
                />
              </div>
            </div>

            {/* Selector de Horas y Duración (Cuando NO es Día Completo) */}
            {opcion !== 'Día Completo' ? (
              <div className="rounded-2xl bg-white p-3.5 border border-[#EAE0D5] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                      Hora de Inicio:
                    </label>
                    <input
                      type="time"
                      required
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="w-full rounded-xl border border-[#E6D7CB] bg-[#FAF6F0]/50 p-2 text-xs text-[#2D2424] focus:border-[#B85D75] focus:bg-white focus:outline-hidden font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                      ¿Por cuántas horas?:
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                      {[1, 2, 3, 4, 5, 6].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setDuracionHoras(h)}
                          className={`rounded-xl py-1.5 text-xs font-bold transition border cursor-pointer text-center ${
                            duracionHoras === h
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                              : 'bg-[#FAF6F0] border-[#E6D7CB] text-[#5A4D48] hover:bg-[#F4EDE4]'
                          }`}
                        >
                          {h} {h === 1 ? 'hr' : 'hrs'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-amber-50 p-2.5 border border-amber-200 text-xs text-amber-900">
                  <span className="font-semibold">Horario a bloquear:</span>
                  <span className="font-bold text-amber-950">
                    ⏰ {horaInicio} a {horaFinCalculada} ({duracionHoras} {duracionHoras === 1 ? 'hora' : 'horas'})
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-stone-950/85 backdrop-blur-xs p-3.5 border border-stone-700 text-white space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <ShieldBan className="h-4 w-4 text-rose-400" />
                  <span>Bloqueo de Día Completo</span>
                </div>
                <p className="text-[11px] text-stone-300">
                  Se bloquearán automáticamente todos los espacios vacíos y disponibles de la jornada completa en la fecha seleccionada.
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#2D2424] p-3 text-xs font-bold text-white hover:bg-stone-800 transition shadow-sm cursor-pointer"
            >
              <ShieldBan className="h-4 w-4 text-[#E07A5F]" />
              <span>{opcion === 'Día Completo' ? 'Bloquear Todo el Día' : `Bloquear Horario (${opcion})`}</span>
            </button>
          </form>

          {/* Lista de Bloqueos Activos */}
          <div className="space-y-2 pt-2 border-t border-[#E8DCCF]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C7A70]">
              {esColaboradora ? 'Mis Bloqueos Registrados' : 'Bloqueos Activos'} ({bloqueosVisibles.length})
            </h4>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {bloqueosVisibles.map((b) => {
                const colab = colaboradores.find((c) => c.id === b.terapeutaId);
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-xl border border-[#EAE0D5] bg-white p-2.5 text-xs shadow-2xs"
                  >
                    <div>
                      <div className="font-bold text-[#2D2424] flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                        {b.motivo}
                      </div>
                      <div className="text-[#8C7A70] text-[11px] mt-0.5">
                        👤 {b.terapeutaId === 'all' ? 'Todo el salón' : colab?.nombre} • 📅 {b.fecha}
                        {b.tipo === 'franja_horaria' && ` • ⏰ ${b.horaInicio} a ${b.horaFin} hrs`}
                        {b.tipo === 'dia_completo' && ' • (Día completo)'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => eliminarBloqueo(b.id)}
                      className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                        b.tipo === 'dia_completo'
                          ? 'bg-stone-900 text-white hover:bg-rose-600 shadow-2xs'
                          : 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                      }`}
                      title={b.tipo === 'dia_completo' ? 'Desbloquear todo el día' : 'Desbloquear horario'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{b.tipo === 'dia_completo' ? 'Desbloquear Todo' : 'Desbloquear'}</span>
                    </button>
                  </div>
                );
              })}

              {bloqueosVisibles.length === 0 && (
                <div className="py-4 text-center text-xs text-[#8C7A70]">
                  No hay bloqueos activos registrados.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
