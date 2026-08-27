'use client';

import React, { useState } from 'react';
import { useSalon } from '@/context/SalonContext';
import { Servicio } from '@/types/salon';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Scissors,
  Sparkles,
  Clock,
  Check,
} from 'lucide-react';

interface ServicesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServicesManagerModal({ isOpen, onClose }: ServicesManagerModalProps) {
  const {
    servicios,
    especialidades,
    configuracion,
    guardarServicio,
    eliminarServicio,
  } = useSalon();

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formNombre, setFormNombre] = useState<string>('');
  const [formCategoria, setFormCategoria] = useState<string>(especialidades[0]?.id || 'unas');
  const [formDuracion, setFormDuracion] = useState<number>(60);
  const [formPrecio, setFormPrecio] = useState<number>(500);
  const [formDescripcion, setFormDescripcion] = useState<string>('');
  const [formActivo, setFormActivo] = useState<boolean>(true);

  if (!isOpen) return null;

  const iniciarEdicion = (servicio: Servicio) => {
    setEditandoId(servicio.id);
    setFormNombre(servicio.nombre);
    setFormCategoria(servicio.categoria);
    setFormDuracion(servicio.duracionMin);
    setFormPrecio(servicio.precio);
    setFormDescripcion(servicio.descripcion);
    setFormActivo(servicio.activo);
  };

  const limpiarFormulario = () => {
    setEditandoId(null);
    setFormNombre('');
    setFormCategoria(especialidades[0]?.id || 'unas');
    setFormDuracion(60);
    setFormPrecio(500);
    setFormDescripcion('');
    setFormActivo(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) return;

    const nuevo: Servicio = {
      id: editandoId || `serv-${Date.now()}`,
      nombre: formNombre.trim(),
      categoria: formCategoria,
      duracionMin: Number(formDuracion),
      precio: Number(formPrecio),
      descripcion: formDescripcion.trim() || 'Tratamiento exclusivo de belleza.',
      activo: formActivo,
    };

    await guardarServicio(nuevo);
    limpiarFormulario();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-[#E6D7CB] bg-[#FAF6F0] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B85D75] text-white shadow-xs">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#B85D75]">
                Catálogo Editable
              </span>
              <h3 className="text-lg font-serif font-bold text-[#2D2424]">
                Gestión de Servicios y Precios Base
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
            className="rounded-2xl border-2 border-[#E6D7CB] bg-white p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#F4EDE4] pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D2424]">
                {editandoId ? 'Editar Servicio' : '➕ Añadir Nuevo Servicio'}
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Nombre del Servicio:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Manicura Rusa con Jelly"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Especialidad / Categoría:
                </label>
                <select
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value)}
                  className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden"
                >
                  {especialidades.map((esp) => (
                    <option key={esp.id} value={esp.id}>
                      {esp.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Duración Base (Minutos):
                </label>
                <input
                  type="number"
                  required
                  min={15}
                  step={15}
                  value={formDuracion}
                  onChange={(e) => setFormDuracion(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                  Precio Base Salón ({configuracion.moneda}):
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={10}
                  value={formPrecio}
                  onChange={(e) => setFormPrecio(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A4D48] mb-1">
                Descripción para el cliente:
              </label>
              <textarea
                rows={2}
                placeholder="Breve descripción del procedimiento..."
                value={formDescripcion}
                onChange={(e) => setFormDescripcion(e.target.value)}
                className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden"
              ></textarea>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[#5A4D48] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formActivo}
                  onChange={(e) => setFormActivo(e.target.checked)}
                  className="rounded border-[#E6D7CB] text-[#B85D75]"
                />
                <span>Servicio activo en catálogo</span>
              </label>

              <button
                type="submit"
                className="rounded-xl bg-rose-gold-gradient px-5 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95 transition"
              >
                {editandoId ? 'Guardar Cambios' : 'Añadir Servicio'}
              </button>
            </div>
          </form>

          {/* Lista de Servicios Actuales */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C7A70]">
              Servicios en Catálogo ({servicios.length})
            </h4>

            <div className="space-y-2">
              {servicios.map((s) => {
                const espObj = especialidades.find((e) => e.id === s.categoria);
                return (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between rounded-2xl border p-3.5 bg-white shadow-2xs gap-3 ${
                      s.activo ? 'border-[#EAE0D5]' : 'border-stone-200 opacity-60'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#2D2424]">{s.nombre}</span>
                        <span className="rounded-md bg-[#FAF0E6] px-2 py-0.5 text-[10px] font-semibold text-[#8C5845]">
                          {espObj?.nombre || s.categoria}
                        </span>
                        {!s.activo && (
                          <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[9px] text-stone-500">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#7A6B65] line-clamp-1 mt-0.5">
                        {s.descripcion}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-[#8C7A70] mt-1">
                        <span>⏱️ {s.duracionMin} min</span>
                        <span className="font-bold text-[#2D2424]">
                          {configuracion.moneda}{s.precio}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => iniciarEdicion(s)}
                        className="rounded-lg p-2 text-[#5A4D48] hover:bg-[#F4EDE4] transition"
                        title="Editar servicio"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => eliminarServicio(s.id)}
                        className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 transition"
                        title="Eliminar servicio"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
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
