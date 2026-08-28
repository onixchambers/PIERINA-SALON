'use client';

import React, { useState, useEffect } from 'react';
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
    citas,
    servicios,
    colaboradores,
    configuracion,
    actualizarEstadoCita,
    eliminarCita,
  } = useSalon();

  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [fotoModal, setFotoModal] = useState<string | null>(null);
  const [estadoOptimista, setEstadoOptimista] = useState<EstadoCita | null>(null);

  useEffect(() => {
    setEstadoOptimista(null);
  }, [cita?.id]);

  if (!isOpen || !cita) return null;

  const citaActual = citas.find((c) => c.id === cita.id) || cita;
  const estadoMostrado = estadoOptimista || citaActual.estado;

  const colab = colaboradores.find((c) => c.id === (citaActual.colaboradorId || citaActual.terapeutaId));
  const serviciosCita = citaActual.servicioIds
    .map((id) => servicios.find((s) => s.id === id))
    .filter(Boolean);

  const handleCambiarEstado = async (nuevo: EstadoCita) => {
    setEstadoOptimista(nuevo);
    await actualizarEstadoCita(citaActual.id, nuevo);
  };

  const handleEliminar = async () => {
    await eliminarCita(citaActual.id);
    setConfirmandoEliminar(false);
    onClose();
  };

  const handleEnviarWhatsApp = () => {
    let link = '';
    if (estadoMostrado === 'Confirmada') {
      link = getWhatsAppConfirmationLink(citaActual, servicios, colab, configuracion);
    } else if (estadoMostrado === 'Rechazada') {
      link = getWhatsAppRejectionLink(citaActual, servicios, colab, configuracion);
    } else if (estadoMostrado === 'Completada') {
      link = getWhatsAppCompletedLink(citaActual, servicios, colab, configuracion);
    } else {
      link = getWhatsAppPendingLink(citaActual, servicios, colab, configuracion);
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
                {citaActual.codigo}
              </h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-all duration-150 ${
                  estadoMostrado === 'Confirmada'
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-950 backdrop-blur-xs'
                    : estadoMostrado === 'Pendiente'
                    ? 'bg-orange-500/20 border-orange-400/60 text-orange-950 backdrop-blur-xs animate-soft-pulse'
                    : estadoMostrado === 'Rechazada'
                    ? 'bg-red-500/20 border-red-400/60 text-red-950 backdrop-blur-xs'
                    : 'bg-gray-400/25 border-gray-400/60 text-gray-900 backdrop-blur-xs'
                }`}
              >
                {estadoMostrado}
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
              const esActivo = estadoMostrado === st;
              let estiloBoton = '';

              if (esActivo) {
                switch (st) {
                  case 'Pendiente':
                    estiloBoton = 'bg-orange-500/25 text-orange-950 border-orange-500/80 shadow-sm ring-2 ring-orange-400/40 backdrop-blur-xs font-bold';
                    break;
                  case 'Confirmada':
                    estiloBoton = 'bg-emerald-500/25 text-emerald-950 border-emerald-600/80 shadow-sm ring-2 ring-emerald-400/40 backdrop-blur-xs font-bold';
                    break;
                  case 'Completada':
                    estiloBoton = 'bg-gray-400/30 text-gray-950 border-gray-500/80 shadow-sm ring-2 ring-gray-400/40 backdrop-blur-xs font-bold';
                    break;
                  case 'Rechazada':
                    estiloBoton = 'bg-red-500/25 text-red-950 border-red-500/80 shadow-sm ring-2 ring-red-400/40 backdrop-blur-xs font-bold';
                    break;
                }
              } else {
                switch (st) {
                  case 'Pendiente':
                    estiloBoton = 'border-orange-300/60 bg-white/80 text-orange-800 hover:bg-orange-50 hover:border-orange-400';
                    break;
                  case 'Confirmada':
                    estiloBoton = 'border-emerald-300/60 bg-white/80 text-emerald-800 hover:bg-emerald-50 hover:border-emerald-400';
                    break;
                  case 'Completada':
                    estiloBoton = 'border-gray-300/60 bg-white/80 text-gray-700 hover:bg-gray-100 hover:border-gray-400';
                    break;
                  case 'Rechazada':
                    estiloBoton = 'border-red-300/60 bg-white/80 text-red-800 hover:bg-red-50 hover:border-red-400';
                    break;
                }
              }

              return (
                <button
                  key={st}
                  onClick={() => handleCambiarEstado(st)}
                  className={`rounded-xl py-2.5 px-2 text-xs font-bold transition-all border cursor-pointer ${estiloBoton}`}
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
