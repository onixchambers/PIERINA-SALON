'use client';

import React, { useState, useEffect } from 'react';
import { useSalon } from '@/context/SalonContext';
import {
  Bell,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Users,
  Scissors,
  ShieldBan,
  Volume2,
  VolumeX,
  Sparkles,
  Inbox,
  Ban,
} from 'lucide-react';
import { soundService } from '@/lib/sound';

export type VistaCalendario = 'dia' | 'semana' | 'mes';

interface AdminHeaderProps {
  fechaActual: string;
  setFechaActual: (f: string) => void;
  vista: VistaCalendario;
  setVista: (v: VistaCalendario) => void;
  filtroColaborador: string;
  setFiltroColaborador: (f: string) => void;
  onOpenPending: () => void;
  onOpenBlocker: () => void;
  onOpenServices: () => void;
  onOpenTherapists: () => void;
  onOpenSettings: () => void;
  onOpenNewAppointment: () => void;
}

export default function AdminHeader({
  fechaActual,
  setFechaActual,
  vista,
  setVista,
  filtroColaborador,
  setFiltroColaborador,
  onOpenPending,
  onOpenBlocker,
  onOpenServices,
  onOpenTherapists,
  onOpenSettings,
  onOpenNewAppointment,
}: AdminHeaderProps) {
  const { citas, colaboradores, configuracion, usuarioSesion, actualizarConfiguracion } = useSalon();

  const esColaboradora = usuarioSesion?.tipo === 'colaborador';
  const miColaboradorId = usuarioSesion?.colaboradorId;

  // Filtrar pendientes según el rol
  const pendientes = citas.filter((c) => {
    if (c.estado !== 'Pendiente') return false;
    if (esColaboradora && miColaboradorId) {
      return c.terapeutaId === miColaboradorId || c.colaboradorId === miColaboradorId;
    }
    return true;
  });

  const cambiarFecha = (dias: number) => {
    const [y, m, d] = fechaActual.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + dias);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setFechaActual(`${yyyy}-${mm}-${dd}`);
  };

  const irAHoy = () => {
    const hoy = new Date().toISOString().split('T')[0];
    setFechaActual(hoy);
  };

  const toggleSonido = () => {
    const nuevo = !configuracion.alertaSonoraActiva;
    actualizarConfiguracion({ alertaSonoraActiva: nuevo });
    if (nuevo) soundService.playChime();
  };

  return (
    <div className="space-y-4 border-b border-[#E8DCCF] bg-white p-4 shadow-xs">
      {/* Fila Superior: Título y Acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {configuracion.logoUrl ? (
            <img
              src={configuracion.logoUrl}
              alt="Logo Pierina Salón"
              className="h-12 w-12 sm:h-14 sm:w-14 object-contain drop-shadow-md"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2D2424] text-white shadow-xs">
              <Sparkles className="h-6 w-6 text-[#E07A5F]" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-serif font-bold text-[#2D2424] sm:text-xl">
              Agenda & Panel de Control
            </h1>
            <p className="text-xs text-[#8C7A70]">
              {esColaboradora
                ? `Espacio de trabajo de ${usuarioSesion?.nombre}`
                : 'Gestión general de colaboradoras, servicios y citas'}
            </p>
          </div>
        </div>

        {/* Botones de Gestión */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Bandeja de Solicitudes Pendientes (propias si es colaboradora) */}
          <button
            onClick={onOpenPending}
            className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-xs ${
              pendientes.length > 0
                ? 'bg-rose-gold-gradient text-white shadow-md shadow-[#B85D75]/25 animate-soft-pulse'
                : 'bg-[#FAF6F0] text-[#5A4D48] border border-[#E6D7CB] hover:bg-[#F4EDE4]'
            }`}
          >
            <Inbox className="h-4 w-4" />
            <span>Solicitudes</span>
            {pendientes.length > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#B85D75]">
                {pendientes.length}
              </span>
            )}
          </button>

          {/* BOTÓN DE BLOQUEO DE HORARIOS */}
          <button
            onClick={onOpenBlocker}
            className="flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-300 px-3.5 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-xs"
            title="Bloquear horas no disponibles, descansos o permisos"
          >
            <ShieldBan className="h-4 w-4 text-amber-700" />
            <span>⛔ Bloquear Horas</span>
          </button>

          {/* Gestión de Servicios (Visible para colaboradoras y admin para ver catálogo y precios) */}
          <button
            onClick={onOpenServices}
            className="flex items-center gap-1.5 rounded-xl border border-[#E6D7CB] bg-white px-3 py-2 text-xs font-semibold text-[#5A4D48] hover:bg-[#F4EDE4] transition shadow-2xs"
            title="Configurar servicios y tarifas"
          >
            <Scissors className="h-3.5 w-3.5 text-[#B85D75]" />
            <span className="hidden sm:inline">Servicios</span>
          </button>

          {/* Gestión de Colaboradoras (SÓLO VISIBLE PARA ADMINISTRADORES) */}
          {!esColaboradora && (
            <button
              onClick={onOpenTherapists}
              className="flex items-center gap-1.5 rounded-xl border border-[#E6D7CB] bg-white px-3 py-2 text-xs font-semibold text-[#5A4D48] hover:bg-[#F4EDE4] transition shadow-2xs"
              title="Gestionar colaboradoras, fotos reales, precios y horarios"
            >
              <Users className="h-3.5 w-3.5 text-[#B85D75]" />
              <span className="hidden sm:inline">Colaboradoras</span>
            </button>
          )}

          {/* Ajustes del Salón (SÓLO VISIBLE PARA ADMINISTRADORES) */}
          {!esColaboradora && (
            <button
              onClick={onOpenSettings}
              className="rounded-xl border border-[#E6D7CB] bg-white p-2 text-[#5A4D48] hover:bg-[#F4EDE4] transition shadow-2xs"
              title="Ajustes generales, logo, especialidades y Firebase"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}

          {/* Alerta Sonora Toggle */}
          <button
            onClick={toggleSonido}
            className="rounded-xl border border-[#E6D7CB] bg-white p-2 text-[#5A4D48] hover:bg-[#F4EDE4] transition shadow-2xs"
            title={configuracion.alertaSonoraActiva ? 'Sonido activado' : 'Sonido silenciado'}
          >
            {configuracion.alertaSonoraActiva ? (
              <Volume2 className="h-4 w-4 text-[#B85D75]" />
            ) : (
              <VolumeX className="h-4 w-4 text-stone-400" />
            )}
          </button>

          {/* Nueva Cita Manual */}
          <button
            onClick={onOpenNewAppointment}
            className="flex items-center gap-1.5 rounded-xl bg-[#2D2424] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-stone-800 transition"
          >
            <Plus className="h-4 w-4 text-[#E07A5F]" />
            <span>Agendar Cita</span>
          </button>
        </div>
      </div>

      {/* Fila Inferior: Controles de Fecha, Filtro de Colaboradora y Vista */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#F4EDE4] pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => cambiarFecha(vista === 'mes' ? -30 : vista === 'semana' ? -7 : -1)}
            className="rounded-xl border border-[#E6D7CB] bg-white p-1.5 text-[#5A4D48] hover:bg-[#FAF6F0] transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={irAHoy}
            className="rounded-xl border border-[#E6D7CB] bg-white px-3 py-1.5 text-xs font-bold text-[#2D2424] hover:bg-[#FAF6F0] transition"
          >
            Hoy
          </button>

          <button
            onClick={() => cambiarFecha(vista === 'mes' ? 30 : vista === 'semana' ? 7 : 1)}
            className="rounded-xl border border-[#E6D7CB] bg-white p-1.5 text-[#5A4D48] hover:bg-[#FAF6F0] transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <span className="ml-2 text-sm font-bold text-[#2D2424]">
            📅 {fechaActual}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Filtro de Colaboradora */}
          {esColaboradora && miColaboradorId ? (
            <div className="flex rounded-xl bg-[#FAF6F0] p-1 border border-[#E6D7CB] shadow-2xs">
              <button
                type="button"
                onClick={() => setFiltroColaborador(miColaboradorId)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  filtroColaborador === miColaboradorId
                    ? 'bg-white text-[#B85D75] shadow-xs border border-[#E8DCCF]'
                    : 'text-[#8C7A70] hover:text-[#2D2424]'
                }`}
                title="Mostrar únicamente mi columna y mis citas asignadas"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-[#B85D75]"></span>
                <span>Solo Mi Agenda ({usuarioSesion?.nombre.split(' ')[0]})</span>
              </button>
              <button
                type="button"
                onClick={() => setFiltroColaborador('all')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  filtroColaborador === 'all'
                    ? 'bg-white text-[#B85D75] shadow-xs border border-[#E8DCCF]'
                    : 'text-[#8C7A70] hover:text-[#2D2424]'
                }`}
                title="Mostrar el calendario general con todas las colaboradoras del salón"
              >
                <Users className="h-3.5 w-3.5 text-[#8C7A70]" />
                <span>Todas las Colaboradoras</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#8C7A70] hidden sm:inline">Ver:</span>
              <select
                value={filtroColaborador}
                onChange={(e) => setFiltroColaborador(e.target.value)}
                className="rounded-xl border border-[#E6D7CB] bg-white px-3 py-1.5 text-xs font-bold text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden"
              >
                <option value="all">👥 Todas las Colaboradoras</option>
                {colaboradores.map((c) => (
                  <option key={c.id} value={c.id}>
                    👤 {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Conmutador de Vista (Día / Semana / Mes) */}
          <div className="flex rounded-xl bg-[#FAF6F0] p-1 border border-[#E6D7CB]">
            {(['dia', 'semana', 'mes'] as VistaCalendario[]).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={`rounded-lg px-3 py-1 text-xs font-bold capitalize transition ${
                  vista === v
                    ? 'bg-white text-[#B85D75] shadow-xs'
                    : 'text-[#8C7A70] hover:text-[#2D2424]'
                }`}
              >
                {v === 'dia' ? 'Día' : v === 'semana' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
