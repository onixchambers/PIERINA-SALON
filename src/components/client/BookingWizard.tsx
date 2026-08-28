'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSalon } from '@/context/SalonContext';
import {
  Servicio,
  Colaborador,
  Cita,
} from '@/types/salon';
import {
  getAvailableSlotsForTherapist,
  getAllAvailableSlots,
  SlotDisponible,
} from '@/lib/timeSlots';
import { getWhatsAppClientToSalonLink } from '@/lib/whatsapp';
import { processImageFile } from '@/lib/imageHelper';
import {
  Sparkles,
  Scissors,
  Smile,
  Zap,
  Eye,
  HandMetal,
  Gem,
  Clock,
  User,
  Phone,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  MessageCircle,
  AlertCircle,
  Bookmark,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';

export default function BookingWizard() {
  const {
    servicios,
    colaboradores,
    especialidades,
    citas,
    bloqueos,
    configuracion,
    crearCita,
  } = useSalon();

  // Estados del asistente
  const [paso, setPaso] = useState<number>(1);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [busquedaServicio, setBusquedaServicio] = useState<string>('');

  // Selección del usuario
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<Servicio[]>([]);
  const [colaboradoraSeleccionadaId, setColaboradoraSeleccionadaId] = useState<string>('cualquiera');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('');
  const [slotSeleccionado, setSlotSeleccionado] = useState<SlotDisponible | null>(null);

  // Formulario de datos express
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [clienteTelefono, setClienteTelefono] = useState<string>('');
  const [clienteNotas, setClienteNotas] = useState<string>('');
  const [enviando, setEnviando] = useState<boolean>(false);
  const [errorFormulario, setErrorFormulario] = useState<string>('');

  // Cita creada
  const [citaCreada, setCitaCreada] = useState<Cita | null>(null);

  // Fechas próximas disponibles (30 días)
  const fechasDisponibles = useMemo(() => {
    const lista: { fechaStr: string; diaNombre: string; diaNumero: number; mesNombre: string }[] = [];
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const hoy = new Date();

    for (let i = 0; i < 30; i++) {
      const d = new Date(hoy.getTime() + i * 86400000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const fechaStr = `${yyyy}-${mm}-${dd}`;

      lista.push({
        fechaStr,
        diaNombre: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : diasSemana[d.getDay()],
        diaNumero: d.getDate(),
        mesNombre: meses[d.getMonth()],
      });
    }
    return lista;
  }, []);

  useEffect(() => {
    if (!fechaSeleccionada && fechasDisponibles.length > 0) {
      setFechaSeleccionada(fechasDisponibles[0].fechaStr);
    }
  }, [fechasDisponibles, fechaSeleccionada]);

  // Colaboradora elegida (si aplica)
  const colaboradoraElegida = useMemo(() => {
    if (colaboradoraSeleccionadaId === 'cualquiera') return null;
    return colaboradores.find((c) => c.id === colaboradoraSeleccionadaId) || null;
  }, [colaboradoraSeleccionadaId, colaboradores]);

  // Cálculo de totales con precios personalizados por colaboradora
  const totalMinutos = useMemo(() => {
    return serviciosSeleccionados.reduce((acc, s) => acc + s.duracionMin, 0);
  }, [serviciosSeleccionados]);

  const totalPrecio = useMemo(() => {
    return serviciosSeleccionados.reduce((acc, s) => {
      if (colaboradoraElegida?.serviciosAsignados) {
        const personalizado = colaboradoraElegida.serviciosAsignados.find((sa) => sa.servicioId === s.id);
        if (personalizado && personalizado.precioPersonalizado !== undefined) {
          return acc + personalizado.precioPersonalizado;
        }
      }
      return acc + s.precio;
    }, 0);
  }, [serviciosSeleccionados, colaboradoraElegida]);

  // Filtrar servicios
  const serviciosFiltrados = useMemo(() => {
    return servicios.filter((s) => {
      if (!s.activo) return false;
      const matchCat = categoriaFiltro === 'todas' || s.categoria === categoriaFiltro;
      const matchSearch =
        busquedaServicio.trim() === '' ||
        s.nombre.toLowerCase().includes(busquedaServicio.toLowerCase()) ||
        s.descripcion.toLowerCase().includes(busquedaServicio.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [servicios, categoriaFiltro, busquedaServicio]);

  // Colaboradoras aptas según los servicios seleccionados
  const colaboradorasAptas = useMemo(() => {
    if (serviciosSeleccionados.length === 0) return colaboradores.filter((c) => c.activo);
    const categoriasRequeridas = new Set(serviciosSeleccionados.map((s) => s.categoria));
    return colaboradores.filter((c) => {
      if (!c.activo) return false;
      // Comprobar si atiende la especialidad o tiene los servicios asignados
      const tieneEspecialidad = Array.from(categoriasRequeridas).some((cat) => c.especialidades.includes(cat));
      const tieneServicioAsignado = serviciosSeleccionados.some((s) =>
        c.serviciosAsignados?.some((sa) => sa.servicioId === s.id && sa.activo)
      );
      return tieneEspecialidad || tieneServicioAsignado;
    });
  }, [colaboradores, serviciosSeleccionados]);

  // Cálculo de slots libres
  const slotsCalculados = useMemo(() => {
    if (!fechaSeleccionada || totalMinutos === 0) return [];

    if (colaboradoraSeleccionadaId !== 'cualquiera') {
      const colab = colaboradores.find((c) => c.id === colaboradoraSeleccionadaId);
      if (!colab) return [];
      return getAvailableSlotsForTherapist(
        fechaSeleccionada,
        totalMinutos,
        colab,
        citas,
        bloqueos,
        configuracion
      );
    } else {
      const slotsAgrupados = getAllAvailableSlots(
        fechaSeleccionada,
        totalMinutos,
        colaboradorasAptas,
        citas,
        bloqueos,
        configuracion
      );

      return slotsAgrupados.map((s) => ({
        horaInicio: s.horaInicio,
        horaFin: s.horaFin,
        terapeutaId: s.terapeutasDisponibles[0].id,
        terapeutaNombre: s.terapeutasDisponibles.map((t) => t.nombre.split(' ')[0]).join(', '),
      }));
    }
  }, [
    fechaSeleccionada,
    totalMinutos,
    colaboradoraSeleccionadaId,
    colaboradores,
    colaboradorasAptas,
    citas,
    bloqueos,
    configuracion,
  ]);

  const slotsManana = useMemo(() => {
    return slotsCalculados.filter((s) => {
      const hora = parseInt(s.horaInicio.split(':')[0], 10);
      return hora < 14;
    });
  }, [slotsCalculados]);

  const slotsTarde = useMemo(() => {
    return slotsCalculados.filter((s) => {
      const hora = parseInt(s.horaInicio.split(':')[0], 10);
      return hora >= 14;
    });
  }, [slotsCalculados]);

  const toggleServicio = (servicio: Servicio) => {
    const yaSeleccionado = serviciosSeleccionados.some((s) => s.id === servicio.id);
    if (yaSeleccionado) {
      setServiciosSeleccionados(serviciosSeleccionados.filter((s) => s.id !== servicio.id));
    } else {
      setServiciosSeleccionados([...serviciosSeleccionados, servicio]);
    }
    setSlotSeleccionado(null);
  };

  const handleConfirmarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFormulario('');

    if (!clienteNombre.trim()) {
      setErrorFormulario('Por favor ingresa tu nombre completo');
      return;
    }

    const cleanPhone = clienteTelefono.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 8) {
      setErrorFormulario('Por favor ingresa un número de WhatsApp válido');
      return;
    }

    if (!slotSeleccionado || serviciosSeleccionados.length === 0) {
      setErrorFormulario('Por favor selecciona los tratamientos y un horario válido');
      return;
    }

    setEnviando(true);
    try {
      let targetColabId = colaboradoraSeleccionadaId;
      if (targetColabId === 'cualquiera') {
        targetColabId = slotSeleccionado.terapeutaId;
      }

      const nuevaCita = await crearCita({
        clienteNombre,
        clienteTelefono,
        clienteNotas,
        fotoReferencia: null,
        terapeutaId: targetColabId,
        colaboradorId: targetColabId,
        servicioIds: serviciosSeleccionados.map((s) => s.id),
        fecha: fechaSeleccionada,
        horaInicio: slotSeleccionado.horaInicio,
        horaFin: slotSeleccionado.horaFin,
        precioTotal: totalPrecio,
        duracionTotalMin: totalMinutos,
        origen: 'web_cliente',
      });

      setCitaCreada(nuevaCita);
      setPaso(5);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#E07A5F', '#D46A85', '#B85D75', '#F59E0B', '#10B981'],
        });
      } catch {
        // ignore
      }
    } catch (err) {
      console.error(err);
      setErrorFormulario('Ocurrió un error al agendar la cita. Por favor intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const citaActualizada = useMemo(() => {
    if (!citaCreada) return null;
    return citas.find((c) => c.id === citaCreada.id) || citaCreada;
  }, [citaCreada, citas]);

  const obtenerIniciales = (nombre: string) => {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      {/* Indicador de Pasos Superior */}
      {paso < 5 && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, title: '1. Tratamientos' },
              { num: 2, title: '2. Colaboradora' },
              { num: 3, title: '3. Fecha & Hora' },
              { num: 4, title: '4. Tus Datos' },
            ].map((item) => {
              const activo = paso === item.num;
              const completado = paso > item.num;
              return (
                <div
                  key={item.num}
                  onClick={() => {
                    if (completado) setPaso(item.num);
                  }}
                  className={`flex items-center gap-2 cursor-pointer transition ${
                    activo
                      ? 'text-[#B85D75] font-bold'
                      : completado
                      ? 'text-emerald-700 font-medium'
                      : 'text-[#9A8B84]'
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                      activo
                        ? 'bg-[#B85D75] text-white shadow-md shadow-[#B85D75]/20 scale-110'
                        : completado
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-[#EFE7DE] text-[#6B5E59]'
                    }`}
                  >
                    {completado ? <CheckCircle2 className="h-4 w-4" /> : item.num}
                  </div>
                  <span className="hidden sm:inline text-xs">{item.title}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 h-1.5 w-full rounded-full bg-[#EFE7DE] overflow-hidden">
            <div
              className="h-full bg-rose-gold-gradient transition-all duration-300 rounded-full"
              style={{ width: `${((paso - 1) / 3) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PASO 1: SELECCIÓN DE SERVICIOS
         ========================================================================= */}
      {paso === 1 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-serif font-bold text-[#2D2424] sm:text-3xl">
              Elige tus tratamientos
            </h2>
            <p className="mt-1 text-sm text-[#7A6B65]">
              Selecciona los servicios que deseas realizarte. Te mostraremos la disponibilidad en tiempo real.
            </p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8C7A70]" />
              <input
                type="text"
                placeholder="Buscar tratamiento (ej. Manicura Rusa, Balayage, Limpieza...)"
                value={busquedaServicio}
                onChange={(e) => setBusquedaServicio(e.target.value)}
                className="w-full rounded-2xl border border-[#E6D7CB] bg-white py-2.5 pl-10 pr-4 text-sm text-[#2D2424] placeholder-[#9A8B84] shadow-xs focus:border-[#B85D75] focus:outline-hidden"
              />
            </div>

            {/* Pestañas de Especialidades Dinámicas */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setCategoriaFiltro('todas')}
                className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  categoriaFiltro === 'todas'
                    ? 'bg-[#2D2424] text-white shadow-xs'
                    : 'bg-white text-[#5A4D48] border border-[#E6D7CB] hover:bg-[#F4EDE4]'
                }`}
              >
                Todos ({servicios.filter((s) => s.activo).length})
              </button>

              {especialidades.map((esp) => {
                const count = servicios.filter((s) => s.activo && s.categoria === esp.id).length;
                const isSelected = categoriaFiltro === esp.id;
                return (
                  <button
                    key={esp.id}
                    onClick={() => setCategoriaFiltro(esp.id)}
                    className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-[#B85D75] text-white shadow-xs'
                        : 'bg-white text-[#5A4D48] border border-[#E6D7CB] hover:bg-[#F4EDE4]'
                    }`}
                  >
                    <span>{esp.nombre}</span>
                    <span className="opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid de Servicios */}
          <div className="grid gap-3 sm:grid-cols-2">
            {serviciosFiltrados.map((servicio) => {
              const seleccionado = serviciosSeleccionados.some((s) => s.id === servicio.id);
              return (
                <div
                  key={servicio.id}
                  onClick={() => toggleServicio(servicio)}
                  className={`group relative flex flex-col justify-between rounded-2xl p-4 transition cursor-pointer border-2 ${
                    seleccionado
                      ? 'border-[#B85D75] bg-[#FFF9F7] shadow-md shadow-[#B85D75]/10'
                      : 'border-[#EAE0D5] bg-white hover:border-[#D6C2B4] hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-[#2D2424] group-hover:text-[#B85D75] transition">
                        {servicio.nombre}
                      </h3>
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${
                          seleccionado
                            ? 'border-[#B85D75] bg-[#B85D75] text-white'
                            : 'border-[#D1C3B7] bg-stone-50'
                        }`}
                      >
                        {seleccionado && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </div>
                    </div>

                    <p className="mt-1.5 text-xs text-[#7A6B65] line-clamp-2 leading-relaxed">
                      {servicio.descripcion}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[#F4EDE4] pt-2.5 text-xs">
                    <span className="flex items-center gap-1 text-[#8C7A70]">
                      <Clock className="h-3.5 w-3.5 text-[#B85D75]" />
                      {servicio.duracionMin} min
                    </span>
                    <span className="text-sm font-bold text-[#2D2424]">
                      {configuracion.moneda}{servicio.precio}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {serviciosFiltrados.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#D6C2B4] bg-white/60 p-8 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-[#B85D75]/60" />
              <h4 className="mt-2 text-sm font-bold text-[#2D2424]">No se encontraron servicios</h4>
              <p className="text-xs text-[#7A6B65]">Prueba con otra palabra clave o categoría.</p>
            </div>
          )}

          {/* Barra Flotante */}
          <div className="sticky bottom-4 z-30 rounded-2xl border border-[#E6D7CB] bg-white/95 p-4 shadow-xl backdrop-blur-md flex items-center justify-between gap-4">
            <div>
              <span className="text-xs text-[#8C7A70]">
                {serviciosSeleccionados.length}{' '}
                {serviciosSeleccionados.length === 1 ? 'servicio seleccionado' : 'servicios seleccionados'}
              </span>
              <div className="text-base font-bold text-[#2D2424]">
                Total: {configuracion.moneda}{totalPrecio}{' '}
                <span className="text-xs font-normal text-[#8C7A70]">({totalMinutos} min)</span>
              </div>
            </div>

            <button
              disabled={serviciosSeleccionados.length === 0}
              onClick={() => setPaso(2)}
              className="flex items-center gap-2 rounded-xl bg-rose-gold-gradient px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#B85D75]/25 transition hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuar
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          PASO 2: SELECCIÓN DE COLABORADORA
         ========================================================================= */}
      {paso === 2 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-serif font-bold text-[#2D2424] sm:text-3xl">
              ¿Quién te gustaría que te atienda?
            </h2>
            <p className="mt-1 text-sm text-[#7A6B65]">
              Elige a tu colaboradora favorita o la opción automática para ver mayor disponibilidad.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Opción Automática */}
            <div
              onClick={() => setColaboradoraSeleccionadaId('cualquiera')}
              className={`group flex items-start gap-4 rounded-2xl p-4 transition cursor-pointer border-2 ${
                colaboradoraSeleccionadaId === 'cualquiera'
                  ? 'border-[#B85D75] bg-[#FFF9F7] shadow-md shadow-[#B85D75]/10'
                  : 'border-[#EAE0D5] bg-white hover:border-[#D6C2B4]'
              }`}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-gold-gradient text-white shadow-xs font-bold text-xl">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#2D2424]">Cualquier Colaboradora</h3>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-lg border ${
                      colaboradoraSeleccionadaId === 'cualquiera'
                        ? 'border-[#B85D75] bg-[#B85D75] text-white'
                        : 'border-[#D1C3B7]'
                    }`}
                  >
                    {colaboradoraSeleccionadaId === 'cualquiera' && <CheckCircle2 className="h-3.5 w-3.5" />}
                  </div>
                </div>
                <p className="mt-1 text-xs text-[#7A6B65]">
                  Recomendado para encontrar la mayor cantidad de horarios libres hoy o mañana.
                </p>
                <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  ⚡ Mayor disponibilidad
                </span>
              </div>
            </div>

            {/* Lista de Colaboradoras Aptas */}
            {colaboradorasAptas.map((colab) => {
              const seleccionado = colaboradoraSeleccionadaId === colab.id;
              return (
                <div
                  key={colab.id}
                  onClick={() => setColaboradoraSeleccionadaId(colab.id)}
                  className={`group flex items-start gap-4 rounded-2xl p-4 transition cursor-pointer border-2 ${
                    seleccionado
                      ? 'border-[#B85D75] bg-[#FFF9F7] shadow-md shadow-[#B85D75]/10'
                      : 'border-[#EAE0D5] bg-white hover:border-[#D6C2B4]'
                  }`}
                >
                  {colab.foto ? (
                    <img
                      src={colab.foto}
                      alt={colab.nombre}
                      className="h-14 w-14 shrink-0 rounded-2xl object-cover border border-[#E8DCCF] shadow-xs"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-gold-gradient text-white font-serif font-bold text-base shadow-xs">
                      {obtenerIniciales(colab.nombre)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#2D2424] truncate">
                        {colab.nombre}
                      </h3>
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border ${
                          seleccionado
                            ? 'border-[#B85D75] bg-[#B85D75] text-white'
                            : 'border-[#D1C3B7]'
                        }`}
                      >
                        {seleccionado && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-[#7A6B65] line-clamp-2 leading-relaxed">
                      {colab.biografia || 'Especialista en belleza y bienestar.'}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {colab.especialidades.map((espId) => {
                        const espObj = especialidades.find((e) => e.id === espId);
                        return (
                          <span
                            key={espId}
                            className="rounded-md bg-[#F4EDE4] px-1.5 py-0.5 text-[10px] font-medium text-[#5A4D48]"
                          >
                            {espObj?.nombre || espId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#EAE0D5]">
            <button
              onClick={() => setPaso(1)}
              className="flex items-center gap-1.5 rounded-xl border border-[#E6D7CB] bg-white px-4 py-2.5 text-xs font-semibold text-[#5A4D48] hover:bg-[#F4EDE4] transition"
            >
              <ChevronLeft className="h-4 w-4" />
              Atrás
            </button>

            <button
              onClick={() => setPaso(3)}
              className="flex items-center gap-2 rounded-xl bg-rose-gold-gradient px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#B85D75]/25 transition hover:opacity-95"
            >
              Continuar a Fecha y Hora
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          PASO 3: SELECCIÓN DE FECHA Y HORA
         ========================================================================= */}
      {paso === 3 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-serif font-bold text-[#2D2424] sm:text-3xl">
              Selecciona fecha y hora
            </h2>
            <p className="mt-1 text-sm text-[#7A6B65]">
              Duración total: <strong className="text-[#2D2424]">{totalMinutos} minutos</strong>.
              {colaboradoraElegida && ` Atendido por ${colaboradoraElegida.nombre}.`}
            </p>
          </div>

          {/* Carrusel de Fechas */}
          <div>
            <label className="text-xs font-bold text-[#5A4D48] uppercase tracking-wider block mb-2">
              Día de tu cita
            </label>
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
              {fechasDisponibles.map((f) => {
                const isSelected = fechaSeleccionada === f.fechaStr;
                return (
                  <button
                    key={f.fechaStr}
                    onClick={() => {
                      setFechaSeleccionada(f.fechaStr);
                      setSlotSeleccionado(null);
                    }}
                    className={`shrink-0 flex flex-col items-center justify-center rounded-2xl p-3 min-w-[76px] transition border-2 ${
                      isSelected
                        ? 'border-[#B85D75] bg-[#B85D75] text-white shadow-md shadow-[#B85D75]/25 scale-105'
                        : 'border-[#EAE0D5] bg-white text-[#5A4D48] hover:border-[#D6C2B4] hover:bg-[#FBF8F5]'
                    }`}
                  >
                    <span className={`text-[11px] font-semibold ${isSelected ? 'text-white/90' : 'text-[#8C7A70]'}`}>
                      {f.diaNombre}
                    </span>
                    <span className="text-lg font-bold my-0.5">{f.diaNumero}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[#9A8B84]'}`}>
                      {f.mesNombre}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Horarios Libres */}
          <div className="space-y-4 rounded-3xl border border-[#E6D7CB] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#F4EDE4] pb-3">
              <span className="text-xs font-bold text-[#2D2424] flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#B85D75]" />
                Horarios disponibles para el {fechaSeleccionada}
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                {slotsCalculados.length} huecos libres
              </span>
            </div>

            {slotsCalculados.length === 0 ? (
              <div className="py-8 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-amber-600/70" />
                <h4 className="mt-2 text-sm font-bold text-[#2D2424]">
                  No hay horarios disponibles para esta fecha
                </h4>
                <p className="text-xs text-[#7A6B65] mt-1 max-w-sm mx-auto">
                  La agenda de esta colaboradora está completa o es día no laborable. Por favor selecciona otro día en el selector superior.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {slotsManana.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#8C7A70] uppercase tracking-wider mb-2">
                      ☀️ Mañana (08:00 a 14:00)
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {slotsManana.map((slot) => {
                        const isSelected = slotSeleccionado?.horaInicio === slot.horaInicio;
                        return (
                          <button
                            key={slot.horaInicio}
                            onClick={() => setSlotSeleccionado(slot)}
                            className={`rounded-xl py-2.5 px-2 text-center text-xs font-bold transition border-2 ${
                              isSelected
                                ? 'border-[#B85D75] bg-[#B85D75] text-white shadow-sm'
                                : 'border-[#EAE0D5] bg-[#FAF6F0] text-[#3D322E] hover:border-[#B85D75] hover:bg-white'
                            }`}
                          >
                            {slot.horaInicio}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {slotsTarde.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-[#8C7A70] uppercase tracking-wider mb-2">
                      🌙 Tarde & Noche (14:00 a 23:00)
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {slotsTarde.map((slot) => {
                        const isSelected = slotSeleccionado?.horaInicio === slot.horaInicio;
                        return (
                          <button
                            key={slot.horaInicio}
                            onClick={() => setSlotSeleccionado(slot)}
                            className={`rounded-xl py-2.5 px-2 text-center text-xs font-bold transition border-2 ${
                              isSelected
                                ? 'border-[#B85D75] bg-[#B85D75] text-white shadow-sm'
                                : 'border-[#EAE0D5] bg-[#FAF6F0] text-[#3D322E] hover:border-[#B85D75] hover:bg-white'
                            }`}
                          >
                            {slot.horaInicio}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#EAE0D5]">
            <button
              onClick={() => setPaso(2)}
              className="flex items-center gap-1.5 rounded-xl border border-[#E6D7CB] bg-white px-4 py-2.5 text-xs font-semibold text-[#5A4D48] hover:bg-[#F4EDE4] transition"
            >
              <ChevronLeft className="h-4 w-4" />
              Atrás
            </button>

            <button
              disabled={!slotSeleccionado}
              onClick={() => setPaso(4)}
              className="flex items-center gap-2 rounded-xl bg-rose-gold-gradient px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#B85D75]/25 transition hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuar a Datos
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          PASO 4: FORMULARIO EXPRESS CON SUBIDA DE FOTO DE REFERENCIA
         ========================================================================= */}
      {paso === 4 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-serif font-bold text-[#2D2424] sm:text-3xl">
              Tus datos para confirmar la cita
            </h2>
            <p className="mt-1 text-sm text-[#7A6B65]">
              Ingresa tu nombre y número de WhatsApp. Puedes adjuntar opcionalmente una foto de referencia de lo que te gustaría.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-5">
            {/* Formulario Express */}
            <form onSubmit={handleConfirmarReserva} className="md:col-span-3 space-y-4">
              <div className="rounded-3xl border border-[#E6D7CB] bg-white p-5 shadow-xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#3D322E] uppercase tracking-wider mb-1.5">
                    Nombre Completo <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-[#8C7A70]" />
                    <input
                      type="text"
                      required
                      placeholder="Ej. Sofía Hernández Álvarez"
                      value={clienteNombre}
                      onChange={(e) => setClienteNombre(e.target.value)}
                      className="w-full rounded-xl border border-[#E6D7CB] bg-[#FAF6F0]/50 py-2.5 pl-10 pr-4 text-sm text-[#2D2424] placeholder-[#9A8B84] focus:border-[#B85D75] focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3D322E] uppercase tracking-wider mb-1.5">
                    Teléfono / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 h-4 w-4 text-[#8C7A70]" />
                    <input
                      type="tel"
                      required
                      placeholder="Ej. 55 1234 5678"
                      value={clienteTelefono}
                      onChange={(e) => setClienteTelefono(e.target.value)}
                      className="w-full rounded-xl border border-[#E6D7CB] bg-[#FAF6F0]/50 py-2.5 pl-10 pr-4 text-sm text-[#2D2424] placeholder-[#9A8B84] focus:border-[#B85D75] focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3D322E] uppercase tracking-wider mb-1.5">
                    Comentarios o especificaciones (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Retiro de acrílico previo, preferencia de diseño..."
                    value={clienteNotas}
                    onChange={(e) => setClienteNotas(e.target.value)}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-[#FAF6F0]/50 p-3 text-sm text-[#2D2424] placeholder-[#9A8B84] focus:border-[#B85D75] focus:bg-white focus:outline-hidden"
                  ></textarea>
                </div>

                {errorFormulario && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorFormulario}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setPaso(3)}
                  className="flex items-center gap-1.5 rounded-xl border border-[#E6D7CB] bg-white px-4 py-2.5 text-xs font-semibold text-[#5A4D48] hover:bg-[#F4EDE4] transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Atrás
                </button>

                <button
                  type="submit"
                  disabled={enviando}
                  className="flex items-center gap-2 rounded-xl bg-rose-gold-gradient px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#B85D75]/30 transition hover:opacity-95 disabled:opacity-50"
                >
                  {enviando ? 'Confirmando...' : 'Solicitar Cita Ahora ✨'}
                </button>
              </div>
            </form>

            {/* Resumen Lateral */}
            <div className="md:col-span-2">
              <div className="rounded-3xl border border-[#E6D7CB] bg-[#FFF9F7] p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-serif font-bold text-[#2D2424] border-b border-[#F4EDE4] pb-2">
                  Resumen de tu cita
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-[#5A4D48]">
                    <CalendarIcon className="h-4 w-4 text-[#B85D75]" />
                    <span>
                      <strong>Fecha:</strong> {fechaSeleccionada}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[#5A4D48]">
                    <Clock className="h-4 w-4 text-[#B85D75]" />
                    <span>
                      <strong>Horario:</strong> {slotSeleccionado?.horaInicio} - {slotSeleccionado?.horaFin} hrs ({totalMinutos} min)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[#5A4D48]">
                    <User className="h-4 w-4 text-[#B85D75]" />
                    <span>
                      <strong>Colaboradora:</strong>{' '}
                      {colaboradoraSeleccionadaId === 'cualquiera'
                        ? `${slotSeleccionado?.terapeutaNombre} (Asignada automáticamente)`
                        : colaboradoraElegida?.nombre}
                    </span>
                  </div>
                </div>

                <div className="border-t border-[#F4EDE4] pt-3 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C7A70]">
                    Tratamientos incluidos:
                  </span>
                  {serviciosSeleccionados.map((s) => {
                    let precioServ = s.precio;
                    if (colaboradoraElegida?.serviciosAsignados) {
                      const personalizado = colaboradoraElegida.serviciosAsignados.find((sa) => sa.servicioId === s.id);
                      if (personalizado && personalizado.precioPersonalizado !== undefined) {
                        precioServ = personalizado.precioPersonalizado;
                      }
                    }
                    return (
                      <div key={s.id} className="flex items-center justify-between text-xs">
                        <span className="text-[#3D322E] truncate pr-2">{s.nombre}</span>
                        <span className="font-semibold text-[#2D2424] shrink-0">
                          {configuracion.moneda}{precioServ}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-[#F4EDE4] pt-3 flex items-center justify-between text-sm font-bold text-[#2D2424]">
                  <span>Total estimado:</span>
                  <span className="text-base text-[#B85D75]">
                    {configuracion.moneda}{totalPrecio}
                  </span>
                </div>

                <div className="rounded-xl bg-white p-3 text-[11px] text-[#7A6B65] border border-[#F2E8DF] flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Sin pago por adelantado. Pagas directo en el salón el día de tu cita.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PASO 5: CONFIRMACIÓN Y SEGUIMIENTO
         ========================================================================= */}
      {paso === 5 && citaActualizada && (
        <div className="mx-auto max-w-xl text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="rounded-3xl border-2 border-[#E6D7CB] bg-white p-6 sm:p-8 shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FCEEE9] text-[#B85D75] shadow-inner mb-4">
              <Sparkles className="h-8 w-8 animate-soft-pulse" />
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF0E6] px-3 py-1 text-xs font-bold text-[#8C5845] border border-[#ECD9CE]">
              Código de Cita: <strong>{citaActualizada.codigo}</strong>
            </span>

            <h2 className="mt-3 text-2xl font-serif font-bold text-[#2D2424]">
              ¡Solicitud Recibida con Éxito!
            </h2>
            <p className="mt-1 text-sm text-[#7A6B65]">
              Gracias <strong>{citaActualizada.clienteNombre}</strong>. Tu cita ha sido registrada en el sistema.
            </p>

            <div className="mt-6 rounded-2xl p-4 transition-all duration-300 border">
              {citaActualizada.estado === 'Pendiente' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-xs flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4 animate-spin text-amber-600" />
                  <span>
                    <strong>Estado: En espera de confirmación</strong> por parte de la colaboradora.
                  </span>
                </div>
              )}

              {citaActualizada.estado === 'Confirmada' && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-emerald-900 text-xs flex items-center justify-center gap-2 animate-in zoom-in duration-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>
                    🎉 <strong>¡CITA CONFIRMADA CON ÉXITO!</strong> Tu espacio está 100% reservado.
                  </span>
                </div>
              )}

              {citaActualizada.estado === 'Rechazada' && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs flex items-center justify-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <span>
                    Estado: No disponible en este horario. Por favor contáctanos por WhatsApp para reprogramar.
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-2xl bg-[#FAF6F0] p-4 text-left text-xs space-y-2 border border-[#EFE7DE]">
              <div className="flex justify-between">
                <span className="text-[#8C7A70]">Fecha:</span>
                <span className="font-bold text-[#2D2424]">{citaActualizada.fecha}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7A70]">Horario:</span>
                <span className="font-bold text-[#2D2424]">
                  {citaActualizada.horaInicio} - {citaActualizada.horaFin} hrs
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C7A70]">Colaboradora:</span>
                <span className="font-bold text-[#2D2424]">
                  {colaboradores.find((c) => c.id === (citaActualizada.colaboradorId || citaActualizada.terapeutaId))?.nombre || 'Asignada'}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#E8DCCF] pt-2">
                <span className="text-[#8C7A70]">Total estimado:</span>
                <span className="font-bold text-[#B85D75] text-sm">
                  {configuracion.moneda}{citaActualizada.precioTotal}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <a
                href={getWhatsAppClientToSalonLink(citaActualizada, servicios, configuracion)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition"
              >
                <MessageCircle className="h-4 w-4" />
                Notificar al Salón por WhatsApp
              </a>

              <Link
                href={`/cita/${citaActualizada.id}`}
                className="flex items-center justify-center gap-2 rounded-2xl border border-[#E6D7CB] bg-white px-6 py-2.5 text-xs font-semibold text-[#5A4D48] hover:bg-[#F4EDE4] transition"
              >
                <Bookmark className="h-4 w-4 text-[#B85D75]" />
                Guardar enlace para consultar estado en vivo
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
