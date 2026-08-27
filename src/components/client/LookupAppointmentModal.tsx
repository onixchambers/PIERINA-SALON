'use client';

import React, { useState } from 'react';
import { useSalon } from '@/context/SalonContext';
import { Cita } from '@/types/salon';
import { X, Search, Calendar, Clock, User, CheckCircle2, AlertCircle, Bookmark } from 'lucide-react';
import Link from 'next/link';

interface LookupAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LookupAppointmentModal({ isOpen, onClose }: LookupAppointmentModalProps) {
  const { citas, servicios, terapeutas, configuracion } = useSalon();
  const [criterio, setCriterio] = useState<string>('');
  const [citasEncontradas, setCitasEncontradas] = useState<Cita[] | null>(null);

  if (!isOpen) return null;

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    const q = criterio.trim().toLowerCase();
    if (!q) {
      setCitasEncontradas([]);
      return;
    }

    const cleanPhone = q.replace(/[^0-9]/g, '');

    const resultados = citas.filter((c) => {
      const matchCodigo = c.codigo.toLowerCase().includes(q);
      const matchNombre = c.clienteNombre.toLowerCase().includes(q);
      const matchTelefono = cleanPhone.length >= 4 && c.clienteTelefono.replace(/[^0-9]/g, '').includes(cleanPhone);
      return matchCodigo || matchNombre || matchTelefono;
    });

    setCitasEncontradas(resultados);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-[#E6D7CB] bg-[#FAF6F0] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-4">
          <div className="flex items-center gap-3">
            <img
              src={configuracion.logoUrl || '/logo-pierina.png'}
              alt="Logo Pierina Salón"
              className="h-11 w-11 object-contain drop-shadow-md"
            />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#B85D75]">
                {configuracion.nombreSalon}
              </span>
              <h3 className="text-lg font-serif font-bold text-[#2D2424]">
                Buscar Estado de mi Cita
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

        <form onSubmit={handleBuscar} className="mt-4">
          <label className="block text-xs font-bold text-[#5A4D48] mb-1.5">
            Ingresa tu Código de Cita (ej. PIER-4192) o tu Teléfono:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8C7A70]" />
              <input
                type="text"
                placeholder="Código (PIER-...) o Teléfono"
                value={criterio}
                onChange={(e) => setCriterio(e.target.value)}
                className="w-full rounded-xl border border-[#E6D7CB] bg-white py-2.5 pl-10 pr-3 text-sm text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-[#2D2424] px-4 py-2.5 text-xs font-bold text-white hover:bg-stone-800 transition"
            >
              Buscar
            </button>
          </div>
        </form>

        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-3">
          {citasEncontradas !== null && citasEncontradas.length === 0 && (
            <div className="py-8 text-center text-xs text-[#7A6B65]">
              No encontramos ninguna cita con ese código o número de teléfono.
            </div>
          )}

          {citasEncontradas?.map((cita) => {
            const terapeuta = terapeutas.find((t) => t.id === cita.terapeutaId);
            const nombresServicios = cita.servicioIds
              .map((id) => servicios.find((s) => s.id === id)?.nombre || 'Servicio')
              .join(', ');

            return (
              <div
                key={cita.id}
                className="rounded-2xl border border-[#EAE0D5] bg-white p-4 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#B85D75] bg-[#FAF0E6] px-2 py-0.5 rounded-md">
                    {cita.codigo}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      cita.estado === 'Confirmada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : cita.estado === 'Pendiente'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {cita.estado}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-[#2D2424]">{cita.clienteNombre}</h4>
                <p className="text-xs text-[#7A6B65]">{nombresServicios}</p>

                <div className="flex items-center justify-between text-xs text-[#8C7A70] pt-1">
                  <span>📅 {cita.fecha} • {cita.horaInicio} hrs</span>
                  <span>👩‍⚕️ {terapeuta?.nombre}</span>
                </div>

                <div className="pt-2 border-t border-[#F4EDE4] flex justify-end">
                  <Link
                    href={`/cita/${cita.id}`}
                    onClick={onClose}
                    className="flex items-center gap-1 text-xs font-bold text-[#B85D75] hover:underline"
                  >
                    Ver detalles en vivo →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 border-t border-[#E8DCCF] pt-3 text-right">
          <button
            onClick={onClose}
            className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#5A4D48] border border-[#E6D7CB]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
