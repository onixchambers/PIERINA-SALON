'use client';

import React, { useState } from 'react';
import { useSalon } from '@/context/SalonContext';
import { TipoBloqueo } from '@/types/salon';
import {
  X,
  ShieldBan,
  Trash2,
  Calendar,
  Clock,
  Plus,
  AlertCircle,
  Coffee,
  Sun,
  Moon,
  Check,
} from 'lucide-react';

interface AvailabilityBlockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fechaPrevia?: string;
  horaPrevia?: string;
  terapeutaIdPrevia?: string;
}

export default function AvailabilityBlockerModal({
  isOpen,
  onClose,
  fechaPrevia,
  horaPrevia,
  terapeutaIdPrevia,
}: AvailabilityBlockerModalProps) {
  const { bloqueos, colaboradores, agregarBloqueo, eliminarBloqueo } = useSalon();

  const [colaboradorId, setColaboradorId] = useState<string>(terapeutaIdPrevia || 'all');
  const [fecha, setFecha] = useState<string>(fechaPrevia || new Date().toISOString().split('T')[0]);
  const [tipo, setTipo] = useState<TipoBloqueo>('franja_horaria');
  const [horaInicio, setHoraInicio] = useState<string>(horaPrevia || '14:00');
  const [horaFin, setHoraFin] = useState<string>('15:00');
  const [motivo, setMotivo] = useState<string>('Pausa / Descanso');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  // Botones de Atajos Rápidos
  const aplicarAtajo = (m: string, t: TipoBloqueo, hIni?: string, hFin?: string) => {
    setMotivo(m);
    setTipo(t);
    if (hIni) setHoraInicio(hIni);
    if (hFin) setHoraFin(hFin);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fecha) {
      setError('Por favor selecciona una fecha');
      return;
    }

    if (tipo === 'franja_horaria' && (!horaInicio || !horaFin)) {
      setError('Por favor define la hora de inicio y fin');
      return;
    }

    await agregarBloqueo({
      terapeutaId: colaboradorId,
      colaboradorId,
      fecha,
      tipo,
      horaInicio: tipo === 'franja_horaria' ? horaInicio : undefined,
      horaFin: tipo === 'franja_horaria' ? horaFin : undefined,
      motivo: motivo.trim() || 'Bloqueo de horario no disponible',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-3xl border border-[#E6D7CB] bg-[#FAF6F0] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 shadow-xs">
              <ShieldBan className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#B85D75]">
                Control de Disponibilidad
              </span>
              <h3 className="text-lg font-serif font-bold text-[#2D2424]">
                ⛔ Bloquear Horarios No Disponibles
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
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-5">
          {/* Atajos Rápidos */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8C7A70]">
              ⚡ Atajos Rápidos:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => aplicarAtajo('Pausa de Almuerzo', 'franja_horaria', '14:00', '15:00')}
                className="flex items-center justify-center gap-1 rounded-xl bg-white border border-[#E6D7CB] p-2 text-[#5A4D48] hover:bg-[#FAF0E6] hover:border-[#B85D75] transition"
              >
                <Coffee className="h-3.5 w-3.5 text-[#B85D75]" />
                <span>Almuerzo (1h)</span>
              </button>

              <button
                type="button"
                onClick={() => aplicarAtajo('Permiso Personal', 'franja_horaria', '11:00', '13:00')}
                className="flex items-center justify-center gap-1 rounded-xl bg-white border border-[#E6D7CB] p-2 text-[#5A4D48] hover:bg-[#FAF0E6] hover:border-[#B85D75] transition"
              >
                <Sun className="h-3.5 w-3.5 text-amber-600" />
                <span>Permiso (2h)</span>
              </button>

              <button
                type="button"
                onClick={() => aplicarAtajo('Tarde Libre', 'franja_horaria', '15:00', '20:00')}
                className="flex items-center justify-center gap-1 rounded-xl bg-white border border-[#E6D7CB] p-2 text-[#5A4D48] hover:bg-[#FAF0E6] hover:border-[#B85D75] transition"
              >
                <Moon className="h-3.5 w-3.5 text-indigo-600" />
                <span>Tarde Libre</span>
              </button>

              <button
                type="button"
                onClick={() => aplicarAtajo('Día Completo Libre / Vacaciones', 'dia_completo')}
                className="flex items-center justify-center gap-1 rounded-xl bg-white border border-[#E6D7CB] p-2 text-[#5A4D48] hover:bg-[#FAF0E6] hover:border-[#B85D75] transition"
              >
                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                <span>Día Completo</span>
              </button>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="rounded-2xl border border-[#EAE0D5] bg-white p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D2424]">
              Detalles del Bloqueo
            </h4>

            <div>
              <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                Colaboradora a bloquear:
              </label>
              <select
                value={colaboradorId}
                onChange={(e) => setColaboradorId(e.target.value)}
                className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden"
              >
                <option value="all">Todo el Salón (Todas las colaboradoras)</option>
                {colaboradores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Fecha:
                </label>
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2 text-xs text-[#2D2424]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Tipo:
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as TipoBloqueo)}
                  className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2 text-xs text-[#2D2424]"
                >
                  <option value="franja_horaria">Franja Horaria</option>
                  <option value="dia_completo">Día Completo</option>
                </select>
              </div>
            </div>

            {tipo === 'franja_horaria' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                    Hora Inicio:
                  </label>
                  <input
                    type="time"
                    required
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2 text-xs text-[#2D2424]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                    Hora Fin:
                  </label>
                  <input
                    type="time"
                    required
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2 text-xs text-[#2D2424]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                Motivo / Razón visible:
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Pausa de almuerzo, Capacitación, Permiso personal..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2 text-xs text-[#2D2424]"
              />
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="text-right pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-xs"
              >
                <ShieldBan className="h-4 w-4" />
                Guardar Bloqueo de Horario
              </button>
            </div>
          </form>

          {/* Lista de Bloqueos Activos */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C7A70]">
              Bloqueos de Agenda Activos ({bloqueos.length})
            </h4>

            <div className="space-y-2">
              {bloqueos.map((b) => {
                const colab = colaboradores.find((c) => c.id === b.terapeutaId);
                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-xl border border-[#EAE0D5] bg-white p-3 text-xs shadow-2xs"
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
                      onClick={() => eliminarBloqueo(b.id)}
                      className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition"
                      title="Desbloquear este horario"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}

              {bloqueos.length === 0 && (
                <div className="py-6 text-center text-xs text-[#8C7A70]">
                  No hay bloqueos activos registrados.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 border-t border-[#E8DCCF] pt-3 text-right">
          <button
            onClick={onClose}
            className="rounded-xl bg-white px-5 py-2 text-xs font-semibold text-[#5A4D48] border border-[#E6D7CB]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
