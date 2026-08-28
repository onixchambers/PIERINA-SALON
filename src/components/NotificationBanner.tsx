'use client';

import React from 'react';
import { useSalon } from '@/context/SalonContext';
import { Bell, Check, X, Phone, Calendar, Clock, MessageSquare, Sparkles } from 'lucide-react';
import { getWhatsAppConfirmationLink } from '@/lib/whatsapp';

export default function NotificationBanner() {
  const {
    nuevaSolicitudNotificacion,
    descartarNotificacion,
    actualizarEstadoCita,
    servicios,
    terapeutas,
    configuracion,
  } = useSalon();

  if (!nuevaSolicitudNotificacion) return null;

  const cita = nuevaSolicitudNotificacion;
  const terapeuta = terapeutas.find((t) => t.id === cita.terapeutaId);
  const nombresServicios = cita.servicioIds
    .map((id) => servicios.find((s) => s.id === id)?.nombre || 'Servicio')
    .join(' + ');

  const handleAceptar = async () => {
    await actualizarEstadoCita(cita.id, 'Confirmada');
    descartarNotificacion();
  };

  const handleAceptarYWhatsApp = async () => {
    await actualizarEstadoCita(cita.id, 'Confirmada');
    const link = getWhatsAppConfirmationLink(cita, servicios, terapeuta, configuracion);
    descartarNotificacion();
    window.open(link, '_blank');
  };

  const handleRechazar = async () => {
    await actualizarEstadoCita(cita.id, 'Rechazada');
    descartarNotificacion();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-auto">
      <div className="rounded-2xl border-2 border-[#B85D75] bg-white p-4 shadow-2xl shadow-black/20">
        {/* Encabezado de la alerta */}
        <div className="flex items-start justify-between gap-3 border-b border-[#F2E8DF] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-gold-gradient text-white">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FCEEE9] px-2 py-0.5 text-[11px] font-bold text-[#B85D75]">
                <Sparkles className="h-3 w-3" />
                ¡Nueva Solicitud de Cita!
              </span>
              <h4 className="text-sm font-bold text-[#2D2424] mt-0.5">
                {cita.clienteNombre}
              </h4>
            </div>
          </div>

          <button
            onClick={descartarNotificacion}
            className="rounded-lg p-1 text-[#8C7A70] hover:bg-[#F4EDE4] hover:text-[#2D2424] transition"
            title="Cerrar notificación"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Detalles de la cita */}
        <div className="py-2.5 space-y-1.5 text-xs text-[#5A4D48]">
          <div className="flex items-center gap-1.5 font-medium text-[#2D2424]">
            <Sparkles className="h-3.5 w-3.5 text-[#B85D75]" />
            <span>{nombresServicios}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#6B5E59]">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-[#B85D75]" />
              {cita.fecha}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-[#B85D75]" />
              {cita.horaInicio} - {cita.horaFin} hrs
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-[#8C7A70]">
              Terapeuta: <strong className="text-[#3D322E]">{terapeuta?.nombre || 'General'}</strong>
            </span>
            <span className="font-bold text-[#B85D75]">
              {configuracion.moneda}{cita.precioTotal}
            </span>
          </div>
        </div>

        {/* Botones de acción rápida */}
        <div className="mt-2 grid grid-cols-2 gap-2 pt-2 border-t border-[#F2E8DF]">
          <button
            onClick={handleAceptarYWhatsApp}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Aceptar + WhatsApp
          </button>

          <div className="flex gap-1.5">
            <button
              onClick={handleAceptar}
              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-[#2D2424] px-2 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition"
              title="Aceptar cita directamente"
            >
              <Check className="h-3.5 w-3.5" />
              Aceptar
            </button>
            <button
              onClick={handleRechazar}
              className="flex items-center justify-center rounded-xl bg-[#FCEEE9] px-2.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
              title="Rechazar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
