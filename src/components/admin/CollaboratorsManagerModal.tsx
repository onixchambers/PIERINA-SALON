'use client';

import React, { useState } from 'react';
import { useSalon } from '@/context/SalonContext';
import { Colaborador, ServicioColaborador, AdministradorAdicional } from '@/types/salon';
import { processImageFile } from '@/lib/imageHelper';
import { generarPasswordPorDefecto } from '@/lib/seedData';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Users,
  Clock,
  Phone,
  Check,
  Sparkles,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Briefcase,
  Key,
  RotateCcw,
  ShieldBan,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import PhoneInputWithCountry from '@/components/common/PhoneInputWithCountry';

const DIAS_SEMANA_OPCIONES = [
  { id: 1, label: 'Lun' },
  { id: 2, label: 'Mar' },
  { id: 3, label: 'Mié' },
  { id: 4, label: 'Jue' },
  { id: 5, label: 'Vie' },
  { id: 6, label: 'Sáb' },
  { id: 0, label: 'Dom' },
];

interface CollaboratorsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CollaboratorsManagerModal({ isOpen, onClose }: CollaboratorsManagerModalProps) {
  const {
    colaboradores,
    servicios,
    especialidades,
    configuracion,
    usuarioSesion,
    guardarColaborador,
    eliminarColaborador,
    resetearPasswordColaborador,
    toggleRestriccionColaborador,
    guardarAdministrador,
    eliminarAdministrador,
  } = useSalon();

  const esSuperAdmin = usuarioSesion?.tipo === 'superadmin' || !!usuarioSesion?.esSuperAdmin;

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formNombre, setFormNombre] = useState<string>('');
  const [formFoto, setFormFoto] = useState<string | null>(null);
  const [formTelefono, setFormTelefono] = useState<string>('+52 55 ');
  const [formBiografia, setFormBiografia] = useState<string>('');
  const [formEspecialidades, setFormEspecialidades] = useState<string[]>([]);
  const [formServiciosAsignados, setFormServiciosAsignados] = useState<{ [servicioId: string]: { activo: boolean; precio: number } }>({});
  const [formDias, setFormDias] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [formHoraInicio, setFormHoraInicio] = useState<string>('09:00');
  const [formHoraFin, setFormHoraFin] = useState<string>('19:00');
  const [formDescansoInicio, setFormDescansoInicio] = useState<string>('14:00');
  const [formDescansoFin, setFormDescansoFin] = useState<string>('15:00');
  const [formActivo, setFormActivo] = useState<boolean>(true);
  const [formAccesoRestringido, setFormAccesoRestringido] = useState<boolean>(false);
  const [formMotivoRestriccion, setFormMotivoRestriccion] = useState<string>('Falta de pago de cuota mensual');
  const [cargandoFoto, setCargandoFoto] = useState<boolean>(false);
  const [mensajeReset, setMensajeReset] = useState<string | null>(null);

  // Formulario Superadmin para nuevo Administrador
  const [nuevoAdminNombre, setNuevoAdminNombre] = useState('');
  const [nuevoAdminPin, setNuevoAdminPin] = useState('');

  if (!isOpen) return null;

  const iniciarEdicion = (colaborador: Colaborador) => {
    setEditandoId(colaborador.id);
    setFormNombre(colaborador.nombre);
    setFormFoto(colaborador.foto || null);
    setFormTelefono(colaborador.telefono);
    setFormBiografia(colaborador.biografia || '');
    setFormEspecialidades(colaborador.especialidades || []);
    setFormAccesoRestringido(!!colaborador.accesoRestringido);
    setFormMotivoRestriccion(colaborador.motivoRestriccion || 'Falta de pago de cuota mensual');
    
    // Mapear servicios asignados
    const mapaServicios: { [servicioId: string]: { activo: boolean; precio: number } } = {};
    servicios.forEach((s) => {
      const asignado = colaborador.serviciosAsignados?.find((sa) => sa.servicioId === s.id);
      if (asignado) {
        mapaServicios[s.id] = {
          activo: asignado.activo,
          precio: asignado.precioPersonalizado !== undefined ? asignado.precioPersonalizado : s.precio,
        };
      } else {
        // Por defecto activo si coincide con especialidad
        const pertenece = colaborador.especialidades.includes(s.categoria);
        mapaServicios[s.id] = {
          activo: pertenece,
          precio: s.precio,
        };
      }
    });
    setFormServiciosAsignados(mapaServicios);

    setFormDias(colaborador.horarioBase.dias);
    setFormHoraInicio(colaborador.horarioBase.horaInicio);
    setFormHoraFin(colaborador.horarioBase.horaFin);
    setFormDescansoInicio(colaborador.horarioBase.descansoInicio || '14:00');
    setFormDescansoFin(colaborador.horarioBase.descansoFin || '15:00');
    setFormActivo(colaborador.activo);
  };

  const limpiarFormulario = () => {
    setEditandoId(null);
    setFormNombre('');
    setFormFoto(null);
    setFormTelefono('+52 55 ');
    setFormBiografia('');
    setFormEspecialidades([]);
    setFormAccesoRestringido(false);
    setFormMotivoRestriccion('Falta de pago de cuota mensual');
    
    const mapaServicios: { [servicioId: string]: { activo: boolean; precio: number } } = {};
    servicios.forEach((s) => {
      mapaServicios[s.id] = { activo: true, precio: s.precio };
    });
    setFormServiciosAsignados(mapaServicios);

    setFormDias([1, 2, 3, 4, 5, 6]);
    setFormHoraInicio('08:00');
    setFormHoraFin('23:00');
    setFormDescansoInicio('14:00');
    setFormDescansoFin('15:00');
    setFormActivo(true);
  };

  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCargandoFoto(true);
    try {
      const dataUrl = await processImageFile(file, 400, 0.85);
      setFormFoto(dataUrl);
    } catch (err) {
      console.error('Error procesando imagen:', err);
    } finally {
      setCargandoFoto(false);
    }
  };

  const toggleEspecialidad = (espId: string) => {
    if (formEspecialidades.includes(espId)) {
      setFormEspecialidades(formEspecialidades.filter((e) => e !== espId));
    } else {
      setFormEspecialidades([...formEspecialidades, espId]);
    }
  };

  const toggleDia = (dia: number) => {
    if (formDias.includes(dia)) {
      setFormDias(formDias.filter((d) => d !== dia));
    } else {
      setFormDias([...formDias, dia]);
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) return;

    // Convertir mapa de servicios a array
    const serviciosAsignadosArray: ServicioColaborador[] = Object.keys(formServiciosAsignados).map((sId) => ({
      servicioId: sId,
      precioPersonalizado: formServiciosAsignados[sId].precio,
      activo: formServiciosAsignados[sId].activo,
    }));

    const maxPermitido = configuracion.maxColaboradores || 50;
    if (!editandoId && colaboradores.length >= maxPermitido) {
      alert(`Has alcanzado el límite máximo de ${maxPermitido} colaboradoras configurado para este salón. Para registrar más colaboradoras, el Superusuario puede aumentar la capacidad en Ajustes del Salón (hasta 50).`);
      return;
    }

    // Contraseña automática por defecto ([nombre]123) o mantener la que la colaboradora ya configuró
    const defaultPassword = generarPasswordPorDefecto(formNombre);
    const targetOriginal = colaboradores.find((c) => c.id === editandoId);
    const pinFinal = targetOriginal?.pin || defaultPassword;

    const nueva: Colaborador = {
      id: editandoId || `colab-${Date.now()}`,
      nombre: formNombre.trim(),
      foto: formFoto || null,
      pin: pinFinal,
      passwordOriginal: targetOriginal?.passwordOriginal || defaultPassword,
      telefono: formTelefono.trim(),
      biografia: formBiografia.trim() || 'Especialista en belleza y bienestar.',
      especialidades: formEspecialidades,
      serviciosAsignados: serviciosAsignadosArray,
      color: '#B85D75',
      activo: formActivo,
      accesoRestringido: formAccesoRestringido,
      motivoRestriccion: formAccesoRestringido ? formMotivoRestriccion : '',
      horarioBase: {
        dias: formDias,
        horaInicio: formHoraInicio,
        horaFin: formHoraFin,
        descansoInicio: formDescansoInicio,
        descansoFin: formDescansoFin,
      },
    };

    await guardarColaborador(nueva);
    limpiarFormulario();
  };

  const handleResetPassword = async (colaborador: Colaborador) => {
    await resetearPasswordColaborador(colaborador.id);
    setMensajeReset(`Contraseña de ${colaborador.nombre} restablecida con éxito a su clave inicial por defecto.`);
    setTimeout(() => setMensajeReset(null), 4000);
  };

  const handleToggleRestriccion = async (colaborador: Colaborador) => {
    const nuevoEstado = !colaborador.accesoRestringido;
    await toggleRestriccionColaborador(
      colaborador.id,
      nuevoEstado,
      nuevoEstado ? 'Falta de pago de cuota mensual' : ''
    );
  };

  const handleCrearAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoAdminNombre.trim() || !nuevoAdminPin.trim()) return;

    const nuevoAdmin = {
      id: `admin-${Date.now()}`,
      nombre: nuevoAdminNombre.trim(),
      pin: nuevoAdminPin.trim(),
      password: nuevoAdminPin.trim(),
      activo: true,
      creadoEn: new Date().toISOString(),
    };

    await guardarAdministrador(nuevoAdmin);
    setNuevoAdminNombre('');
    setNuevoAdminPin('');
  };

  const obtenerIniciales = (nombre: string) => {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  const maxColaboradoresPermitidas = configuracion.maxColaboradores || 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-[#E6D7CB] bg-[#FAF6F0] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2D2424] text-white shadow-xs">
              <Users className="h-5 w-5 text-[#E07A5F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#B85D75]">
                  Equipo del Salón
                </span>
                <span className="rounded-full bg-[#FAF0E6] border border-[#E6D7CB] px-2 py-0.5 text-[10px] font-bold text-[#8C5845]">
                  {colaboradores.length} / {maxColaboradoresPermitidas} Colaboradoras
                </span>
              </div>
              <h3 className="text-lg font-serif font-bold text-[#2D2424]">
                Gestión de Colaboradoras
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

        {/* Contenido con Scroll */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-6">
          {/* Formulario */}
          <form
            onSubmit={handleGuardar}
            className="rounded-2xl border-2 border-[#E6D7CB] bg-white p-5 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between border-b border-[#F4EDE4] pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D2424]">
                {editandoId ? 'Editar Perfil de Colaboradora' : '➕ Añadir Nueva Colaboradora'}
              </h4>
              {editandoId && (
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="text-xs text-[#B85D75] hover:underline"
                >
                  Cancelar Edición
                </button>
              )}
            </div>

            {/* FOTO REAL: Subida y eliminación */}
            <div className="rounded-2xl bg-[#FAF6F0] p-4 border border-[#EFE7DE]">
              <label className="block text-xs font-bold text-[#3D322E] uppercase tracking-wider mb-2">
                Foto de Perfil Real:
              </label>
              <div className="flex flex-wrap items-center gap-4">
                {formFoto ? (
                  <div className="relative">
                    <img
                      src={formFoto}
                      alt="Foto Colaboradora"
                      className="h-16 w-16 rounded-2xl object-cover border-2 border-[#B85D75] shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setFormFoto(null)}
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-xs hover:bg-rose-700 transition"
                      title="Eliminar foto"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-gold-gradient text-white font-serif font-bold text-lg shadow-xs">
                    {formNombre ? obtenerIniciales(formNombre) : <ImageIcon className="h-6 w-6" />}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#E6D7CB] px-3.5 py-2 text-xs font-bold text-[#5A4D48] hover:bg-[#F4EDE4] cursor-pointer transition shadow-2xs">
                    <Upload className="h-3.5 w-3.5 text-[#B85D75]" />
                    {formFoto ? 'Cambiar Foto Real' : 'Subir Foto desde Dispositivo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSubirFoto}
                      className="hidden"
                    />
                  </label>

                  {formFoto && (
                    <button
                      type="button"
                      onClick={() => setFormFoto(null)}
                      className="block text-xs text-rose-600 hover:underline"
                    >
                      Eliminar foto (usar iniciales)
                    </button>
                  )}

                  <p className="text-[10px] text-[#8C7A70]">
                    JPG, PNG o WebP. Se optimiza y comprime automáticamente.
                  </p>
                </div>
              </div>
            </div>

            {/* Datos Personales */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Nombre Completo:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Valentina Ramos"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Teléfono / WhatsApp:
                </label>
                <PhoneInputWithCountry
                  required
                  value={formTelefono}
                  onChange={(val) => setFormTelefono(val)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                Biografía / Resumen profesional:
              </label>
              <input
                type="text"
                placeholder="Ej. Especialista en Manicura Rusa combinada y Soft Gel."
                value={formBiografia}
                onChange={(e) => setFormBiografia(e.target.value)}
                className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden"
              />
            </div>

            {/* SECCIÓN DE RESTRICCIÓN DE ACCESO (POR PAGO / ADMINISTRACIÓN) */}
            <div className={`rounded-2xl p-4 border transition ${
              formAccesoRestringido ? 'bg-rose-50 border-rose-300' : 'bg-[#FAF6F0] border-[#EFE7DE]'
            }`}>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-[#2D2424] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAccesoRestringido}
                    onChange={(e) => setFormAccesoRestringido(e.target.checked)}
                    className="rounded border-[#E6D7CB] text-rose-600 focus:ring-rose-500"
                  />
                  <span className="flex items-center gap-1.5 text-rose-800">
                    <ShieldBan className="h-4 w-4 text-rose-600" />
                    Restringir acceso al portal (Suspender por falta de pago mensual)
                  </span>
                </label>
              </div>

              {formAccesoRestringido && (
                <div className="mt-3 animate-in fade-in duration-150">
                  <label className="block text-[11px] font-semibold text-rose-900 mb-1">
                    Motivo de suspensión visible para la colaboradora:
                  </label>
                  <input
                    type="text"
                    value={formMotivoRestriccion}
                    onChange={(e) => setFormMotivoRestriccion(e.target.value)}
                    placeholder="Ej. Falta de pago de cuota mensual..."
                    className="w-full rounded-xl border border-rose-300 bg-white p-2 text-xs text-rose-950 focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* Especialidades Asignadas */}
            <div>
              <label className="block text-xs font-bold text-[#3D322E] uppercase tracking-wider mb-1.5">
                Especialidades que atiende:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {especialidades.map((esp) => {
                  const check = formEspecialidades.includes(esp.id);
                  return (
                    <button
                      key={esp.id}
                      type="button"
                      onClick={() => toggleEspecialidad(esp.id)}
                      className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium text-left border transition ${
                        check
                          ? 'border-[#B85D75] bg-[#FCEEE9] text-[#B85D75]'
                          : 'border-[#EAE0D5] bg-white text-[#5A4D48] hover:bg-[#FAF6F0]'
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          check ? 'border-[#B85D75] bg-[#B85D75] text-white' : 'border-[#D1C3B7]'
                        }`}
                      >
                        {check && <Check className="h-3 w-3" />}
                      </div>
                      <span className="truncate">{esp.nombre}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TRATAMIENTOS Y PRECIOS POR COLABORADORA */}
            <div className="rounded-2xl bg-[#FAF6F0] p-4 border border-[#EFE7DE] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#B85D75]" />
                  <h5 className="text-xs font-bold text-[#2D2424] uppercase tracking-wider">
                    Tratamientos y Precios Personalizados para esta Colaboradora
                  </h5>
                </div>
                <span className="text-[10px] text-[#8C7A70]">
                  Permite ajustar precios individuales
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {servicios.map((s) => {
                  const estadoServ = formServiciosAsignados[s.id] || { activo: false, precio: s.precio };
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 text-xs transition ${
                        estadoServ.activo ? 'border-[#E6D7CB] bg-white' : 'border-stone-200 bg-stone-50/60 opacity-60'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={estadoServ.activo}
                          onChange={(e) => {
                            setFormServiciosAsignados({
                              ...formServiciosAsignados,
                              [s.id]: { ...estadoServ, activo: e.target.checked },
                            });
                          }}
                          className="rounded border-[#E6D7CB] text-[#B85D75]"
                        />
                        <span className="font-semibold text-[#2D2424] truncate">{s.nombre}</span>
                      </label>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-[#8C7A70]">Precio:</span>
                        <div className="relative">
                          <span className="absolute left-2 top-1.5 text-[11px] text-[#8C7A70]">
                            {configuracion.moneda}
                          </span>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            disabled={!estadoServ.activo}
                            placeholder="0"
                            value={estadoServ.precio === 0 ? '' : estadoServ.precio}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                              setFormServiciosAsignados({
                                ...formServiciosAsignados,
                                [s.id]: { ...estadoServ, precio: val },
                              });
                            }}
                            className="w-20 rounded-lg border border-[#E6D7CB] bg-white py-1 pl-5 pr-1 text-xs font-bold text-[#2D2424] focus:border-[#B85D75] disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Días y Horarios Laborales */}
            <div className="rounded-xl bg-[#FAF6F0] p-4 border border-[#EFE7DE] space-y-3">
              <span className="text-xs font-bold text-[#3D322E] uppercase tracking-wider block">
                Horario Base de Trabajo
              </span>

              <div>
                <label className="block text-[11px] font-semibold text-[#6B5E59] mb-1">
                  Días activos:
                </label>
                <div className="flex gap-1.5">
                  {DIAS_SEMANA_OPCIONES.map((d) => {
                    const isSelected = formDias.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDia(d.id)}
                        className={`flex-1 rounded-lg py-1 text-xs font-bold transition border ${
                          isSelected
                            ? 'border-[#B85D75] bg-[#B85D75] text-white shadow-2xs'
                            : 'border-[#E6D7CB] bg-white text-[#5A4D48]'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] text-[#6B5E59] mb-1">Hora Inicio:</label>
                  <input
                    type="time"
                    value={formHoraInicio}
                    onChange={(e) => setFormHoraInicio(e.target.value)}
                    className="w-full rounded-lg border border-[#E6D7CB] bg-white p-1.5 text-xs text-[#2D2424]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#6B5E59] mb-1">Hora Fin:</label>
                  <input
                    type="time"
                    value={formHoraFin}
                    onChange={(e) => setFormHoraFin(e.target.value)}
                    className="w-full rounded-lg border border-[#E6D7CB] bg-white p-1.5 text-xs text-[#2D2424]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#6B5E59] mb-1">Descanso De:</label>
                  <input
                    type="time"
                    value={formDescansoInicio}
                    onChange={(e) => setFormDescansoInicio(e.target.value)}
                    className="w-full rounded-lg border border-[#E6D7CB] bg-white p-1.5 text-xs text-[#2D2424]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#6B5E59] mb-1">Descanso A:</label>
                  <input
                    type="time"
                    value={formDescansoFin}
                    onChange={(e) => setFormDescansoFin(e.target.value)}
                    className="w-full rounded-lg border border-[#E6D7CB] bg-white p-1.5 text-xs text-[#2D2424]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[#5A4D48] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formActivo}
                  onChange={(e) => setFormActivo(e.target.checked)}
                  className="rounded border-[#E6D7CB] text-[#B85D75]"
                />
                <span>Colaboradora activa en agenda</span>
              </label>

              <button
                type="submit"
                className="rounded-xl bg-rose-gold-gradient px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-95 transition"
              >
                {editandoId ? 'Guardar Cambios' : 'Añadir Colaboradora'}
              </button>
            </div>
          </form>

          {/* Notificación de reseteo exitoso */}
          {mensajeReset && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-3.5 flex items-center justify-between gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs text-emerald-900 font-bold">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>{mensajeReset}</span>
              </div>
              <button
                onClick={() => setMensajeReset(null)}
                className="text-xs text-emerald-700 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* SECCIÓN EXCLUSIVA PARA SUPERADMIN: GESTIÓN DE ROLES DE ADMINISTRADOR */}
          {esSuperAdmin && (
            <div className="rounded-2xl border-2 border-purple-200 bg-purple-50/50 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-purple-200 pb-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-purple-700" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                    👑 Panel de Superusuario - Crear Roles de Administrador
                  </h4>
                </div>
                <span className="text-[10px] text-purple-700 font-semibold">
                  Acceso Exclusivo Superusuario
                </span>
              </div>

              <form onSubmit={handleCrearAdmin} className="grid sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nombre del Administrador"
                  value={nuevoAdminNombre}
                  onChange={(e) => setNuevoAdminNombre(e.target.value)}
                  className="rounded-xl border border-purple-200 bg-white p-2 text-xs text-[#2D2424]"
                />
                <input
                  type="password"
                  required
                  placeholder="Contraseña de Administrador"
                  value={nuevoAdminPin}
                  onChange={(e) => setNuevoAdminPin(e.target.value)}
                  className="rounded-xl border border-purple-200 bg-white p-2 text-xs text-[#2D2424]"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 text-xs font-bold transition shadow-2xs"
                >
                  ➕ Crear Administrador
                </button>
              </form>

              {configuracion.administradores && configuracion.administradores.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-purple-200">
                  <span className="text-[11px] font-bold text-purple-900 block">
                    Administradores Creados:
                  </span>
                  {configuracion.administradores.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between rounded-xl bg-white p-2 border border-purple-200 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-purple-700" />
                        <span className="font-bold text-[#2D2424]">{admin.nombre}</span>
                        <span className="text-[10px] text-[#8C7A70] font-mono">••••••••</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarAdministrador(admin.id)}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Eliminar rol
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lista de Colaboradoras Actuales */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C7A70]">
              Colaboradoras Registradas ({colaboradores.length} de 10)
            </h4>

            <div className="space-y-2">
              {colaboradores.map((c) => (
                <div
                  key={c.id}
                  className={`flex flex-wrap sm:flex-nowrap items-center justify-between rounded-2xl border p-3.5 bg-white shadow-2xs gap-3 ${
                    c.accesoRestringido
                      ? 'border-rose-300 bg-rose-50/30'
                      : c.activo
                      ? 'border-[#EAE0D5]'
                      : 'border-stone-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {c.foto ? (
                      <img
                        src={c.foto}
                        alt={c.nombre}
                        className="h-12 w-12 rounded-2xl object-cover border border-[#E8DCCF]"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-gold-gradient text-white font-serif font-bold text-sm shadow-2xs">
                        {obtenerIniciales(c.nombre)}
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-xs text-[#2D2424]">{c.nombre}</span>
                        
                        {/* Estado de Contraseña Privada */}
                        <span className="rounded-md bg-[#FAF6F0] border border-[#E6D7CB] px-1.5 py-0.5 text-[9px] font-mono text-[#8C7A70]">
                          🔒 Clave Privada
                        </span>

                        {c.accesoRestringido && (
                          <span className="rounded-md bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-0.5">
                            <ShieldBan className="h-2.5 w-2.5" />
                            Acceso Restringido (Pago pendiente)
                          </span>
                        )}

                        {!c.activo && (
                          <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[9px] text-stone-500">
                            Inactiva
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-emerald-700 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        <span>{c.telefono}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.especialidades.map((espId) => {
                          const espObj = especialidades.find((e) => e.id === espId);
                          return (
                            <span
                              key={espId}
                              className="rounded-md bg-[#FAF0E6] px-1.5 py-0.5 text-[9px] font-medium text-[#8C5845]"
                            >
                              {espObj?.nombre || espId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {/* Botón Resetear Contraseña */}
                    <button
                      type="button"
                      onClick={() => handleResetPassword(c)}
                      className="flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 text-[11px] font-bold text-amber-900 transition shadow-2xs"
                      title="Restablecer contraseña al formato por defecto (nombre123)"
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-amber-700" />
                      <span>Resetear Clave</span>
                    </button>

                    {/* Botón Restringir / Habilitar Acceso */}
                    <button
                      type="button"
                      onClick={() => handleToggleRestriccion(c)}
                      className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition shadow-2xs border ${
                        c.accesoRestringido
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                          : 'bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100'
                      }`}
                      title={c.accesoRestringido ? 'Habilitar acceso al portal' : 'Restringir acceso al portal (ej. falta de pago)'}
                    >
                      {c.accesoRestringido ? (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                          <span>Habilitar</span>
                        </>
                      ) : (
                        <>
                          <ShieldBan className="h-3.5 w-3.5 text-rose-700" />
                          <span>Restringir</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => iniciarEdicion(c)}
                      className="rounded-lg p-2 text-[#5A4D48] hover:bg-[#F4EDE4] transition"
                      title="Editar colaboradora"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => eliminarColaborador(c.id)}
                      className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 transition"
                      title="Eliminar colaboradora"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
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
