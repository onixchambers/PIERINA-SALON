'use client';

import React, { useState } from 'react';
import { useSalon } from '@/context/SalonContext';
import { Cita, EstadoCita } from '@/types/salon';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  MessageSquare,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import {
  getWhatsAppConfirmationLink,
  getWhatsAppRejectionLink,
  getWhatsAppCompletedLink,
  getWhatsAppPendingLink,
  formatWhatsAppNumber,
} from '@/lib/whatsapp';

interface AppointmentDetailModalProps {
  cita: Cita | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AppointmentDetailModal({
  cita,
  isOpen,
  onClose,
}: AppointmentDetailModalProps) {
  const {
    servicios,
    colaboradores,
    configuracion,
    actualizarEstadoCita,
    eliminarCita,
  } = useSalon();

  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [fotoModal, setFotoModal] = useState<string | null>(null);

  if (!isOpen || !cita) return null;

  const colab = colaboradores.find((c) => c.id === (cita.colaboradorId || cita.terapeutaId));
  const serviciosCita = cita.servicioIds
    .map((id) => servicios.find((s) => s.id === id))
    .filter(Boolean);

  const handleCambiarEstado = async (nuevo: EstadoCita) => {
    await actualizarEstadoCita(cita.id, nuevo);
  };

  const handleEliminar = async () => {
    await eliminarCita(cita.id);
    setConfirmandoEliminar(false);
    onClose();
  };

  const handleEnviarWhatsApp = () => {
    let link = '';
    if (cita.estado === 'Confirmada') {
      link = getWhatsAppConfirmationLink(cita, servicios, colab, configuracion);
    } else if (cita.estado === 'Rechazada') {
      link = getWhatsAppRejectionLink(cita, servicios, colab, configuracion);
    } else if (cita.estado === 'Completada') {
      link = getWhatsAppCompletedLink(cita, servicios, colab, configuracion);
    } else {
      link = getWhatsAppPendingLink(cita, servicios, colab, configuracion);
    }
    window.open(link, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-[#E6D7CB] bg-[#FAF6F0] p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#B85D75]">
              Detalle de Cita
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-serif font-bold text-[#2D2424]">
                {cita.codigo}
              </h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                  cita.estado === 'Confirmada'
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-950'
                    : cita.estado === 'Pendiente'
                    ? 'bg-amber-400/20 border-amber-400/60 text-amber-950 animate-soft-pulse'
                    : cita.estado === 'Rechazada'
                    ? 'bg-rose-500/20 border-rose-400/60 text-rose-950'
                    : 'bg-stone-400/25 border-stone-400/60 text-stone-900'
                }`}
              >
                {cita.estado}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#8C7A70] hover:bg-[#EFE7DE] hover:text-[#2D2424] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Ficha Principal */}
        <div className="rounded-2xl border border-[#EAE0D5] bg-white p-4 space-y-3 text-xs text-[#5A4D48]">
          <div className="flex items-center justify-between border-b border-[#F4EDE4] pb-2">
            <div>
              <span className="text-[#8C7A70] text-[11px] block">Cliente:</span>
              <h4 className="text-sm font-bold text-[#2D2424]">{cita.clienteNombre}</h4>
            </div>
            <a
              href={`https://wa.me/${formatWhatsAppNumber(cita.clienteTelefono)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
            >
              <Phone className="h-3.5 w-3.5" />
              {cita.clienteTelefono}
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[#8C7A70] text-[11px] block">Fecha:</span>
              <span className="font-bold text-[#2D2424]">📅 {cita.fecha}</span>
            </div>
            <div>
              <span className="text-[#8C7A70] text-[11px] block">Horario:</span>
              <span className="font-bold text-[#2D2424]">
                ⏰ {cita.horaInicio} - {cita.horaFin} ({cita.duracionTotalMin} min)
              </span>
            </div>
          </div>

          <div>
            <span className="text-[#8C7A70] text-[11px] block">Colaboradora Asignada:</span>
            <span className="font-bold text-[#2D2424]">
              👩‍⚕️ {colab?.nombre || 'Sin asignar'}
            </span>
          </div>

          <div className="border-t border-[#F4EDE4] pt-2">
            <span className="text-[#8C7A70] text-[11px] block mb-1">Tratamientos:</span>
            <ul className="space-y-1">
              {serviciosCita.map((s: any) => (
                <li key={s.id} className="flex justify-between font-medium text-[#2D2424]">
                  <span>• {s.nombre}</span>
                  <span>{configuracion.moneda}{s.precio}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-[#F4EDE4] pt-2 flex justify-between font-bold text-sm text-[#2D2424]">
            <span>Total a cobrar:</span>
            <span className="text-[#B85D75]">{configuracion.moneda}{cita.precioTotal}</span>
          </div>

          {/* Foto de Referencia */}
          {cita.fotoReferencia && (
            <div className="flex items-center gap-3 rounded-xl bg-[#FAF6F0] p-2.5 border border-[#EFE7DE]">
              <img
                src={cita.fotoReferencia}
                alt="Referencia de diseño"
                onClick={() => setFotoModal(cita.fotoReferencia || null)}
                className="h-12 w-12 rounded-lg object-cover border border-[#E6D7CB] cursor-pointer hover:scale-105 transition"
              />
              <div className="text-xs">
                <span className="font-bold text-[#2D2424] block flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5 text-[#B85D75]" />
                  Foto adjunta de diseño/estilo
                </span>
                <button
                  type="button"
                  onClick={() => setFotoModal(cita.fotoReferencia || null)}
                  className="text-[11px] text-[#B85D75] hover:underline"
                >
                  Ver imagen ampliada
                </button>
              </div>
            </div>
          )}

          {cita.clienteNotas && (
            <div className="rounded-xl bg-[#FAF6F0] p-2.5 text-[11px] text-[#6B5E59]">
              <strong>Notas:</strong> {cita.clienteNotas}
            </div>
          )}
        </div>

        {/* Cambiar Estado */}
        <div className="rounded-2xl bg-[#FAF6F0] p-3 border border-[#EFE7DE] space-y-2">
          <label className="block text-xs font-bold text-[#3D322E]">
            Actualizar Estado de la Cita:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {(['Pendiente', 'Confirmada', 'Completada', 'Rechazada'] as EstadoCita[]).map((st) => {
              const esActivo = cita.estado === st;
              const estiloBoton = esActivo
                ? st === 'Confirmada'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : st === 'Pendiente'
                  ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                  : st === 'Rechazada'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-stone-600 text-white border-stone-600 shadow-xs'
                : 'border-[#E6D7CB] bg-white text-[#5A4D48] hover:bg-[#F4EDE4]';

              return (
                <button
                  key={st}
                  onClick={() => handleCambiarEstado(st)}
                  className={`rounded-xl py-2 text-xs font-bold transition border ${estiloBoton}`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E8DCCF]">
          {!confirmandoEliminar ? (
            <button
              onClick={() => setConfirmandoEliminar(true)}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-600 font-bold">¿Confirmar?</span>
              <button
                onClick={handleEliminar}
                className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white"
              >
                Sí, borrar
              </button>
              <button
                onClick={() => setConfirmandoEliminar(false)}
                className="text-xs text-stone-500 hover:underline"
              >
                No
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleEnviarWhatsApp}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Enviar WhatsApp
            </button>

            <button
              onClick={onClose}
              className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-[#5A4D48] border border-[#E6D7CB]"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal para ver foto completa */}
      {fotoModal && (
        <div
          onClick={() => setFotoModal(null)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
        >
          <div className="relative max-w-lg rounded-2xl bg-white p-2 shadow-2xl">
            <img src={fotoModal} alt="Foto completa" className="max-h-[75vh] w-auto rounded-xl object-contain" />
            <button
              onClick={() => setFotoModal(null)}
              className="absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white hover:bg-black"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
