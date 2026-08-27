'use client';

import React, { useState } from 'react';
import { useSalon } from '@/context/SalonContext';
import { CategoriaServicio, Servicio } from '@/types/salon';
import {
  X,
  Sparkles,
  Clock,
  Gem,
  Scissors,
  Smile,
  Zap,
  Eye,
  HandMetal,
  Search,
} from 'lucide-react';

const CATEGORIAS_MODAL: { id: CategoriaServicio; label: string; icon: any }[] = [
  { id: 'unas', label: 'Uñas', icon: Gem },
  { id: 'cabello', label: 'Cabello', icon: Scissors },
  { id: 'faciales', label: 'Faciales', icon: Smile },
  { id: 'depilacion', label: 'Depilación', icon: Zap },
  { id: 'pestanas', label: 'Pestañas & Cejas', icon: Eye },
  { id: 'masajes', label: 'Masajes', icon: HandMetal },
];

interface ServiceCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectService?: (servicio: Servicio) => void;
}

export default function ServiceCatalogModal({ isOpen, onClose, onSelectService }: ServiceCatalogModalProps) {
  const { servicios, configuracion } = useSalon();
  const [categoria, setCategoria] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState<string>('');

  if (!isOpen) return null;

  const serviciosFiltrados = servicios.filter((s) => {
    if (!s.activo) return false;
    const matchCat = categoria === 'todas' || s.categoria === categoria;
    const matchSearch =
      busqueda.trim() === '' ||
      s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-[#E6D7CB] bg-[#FAF6F0] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-4">
          <div className="flex items-center gap-3">
            <img
              src={configuracion.logoUrl || '/logo-pierina.png'}
              alt="Logo Pierina Salón"
              className="h-12 w-12 object-contain drop-shadow-md"
            />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#B85D75]">
                {configuracion.nombreSalon}
              </span>
              <h3 className="text-xl font-serif font-bold text-[#2D2424]">
                Catálogo de Servicios y Precios
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

        {/* Barra de Búsqueda y Filtros */}
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8C7A70]" />
            <input
              type="text"
              placeholder="Buscar servicio en el catálogo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-2xl border border-[#E6D7CB] bg-white py-2.5 pl-10 pr-4 text-sm text-[#2D2424] placeholder-[#9A8B84] focus:border-[#B85D75] focus:outline-hidden"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setCategoria('todas')}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold shrink-0 transition ${
                categoria === 'todas'
                  ? 'bg-[#2D2424] text-white'
                  : 'bg-white text-[#5A4D48] border border-[#E6D7CB]'
              }`}
            >
              Todas
            </button>
            {CATEGORIAS_MODAL.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoria(cat.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold shrink-0 transition ${
                  categoria === cat.id
                    ? 'bg-[#B85D75] text-white'
                    : 'bg-white text-[#5A4D48] border border-[#E6D7CB]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Servicios */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-3">
          {serviciosFiltrados.map((s) => (
            <div
              key={s.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-[#EAE0D5] bg-white p-4 gap-3 shadow-xs hover:border-[#D6C2B4] transition"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[#2D2424]">{s.nombre}</h4>
                  <span className="rounded-md bg-[#FAF0E6] px-2 py-0.5 text-[10px] font-semibold text-[#8C5845]">
                    {s.categoria}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#7A6B65] leading-relaxed">{s.descripcion}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-[#8C7A70]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-[#B85D75]" />
                    {s.duracionMin} minutos
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t border-[#F4EDE4] sm:border-0 pt-2 sm:pt-0">
                <span className="text-base font-bold text-[#2D2424]">
                  {configuracion.moneda}{s.precio}
                </span>

                <button
                  onClick={() => {
                    onClose();
                    if (onSelectService) onSelectService(s);
                  }}
                  className="rounded-xl bg-rose-gold-gradient px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:opacity-95 transition"
                >
                  Reservar
                </button>
              </div>
            </div>
          ))}

          {serviciosFiltrados.length === 0 && (
            <div className="py-12 text-center text-xs text-[#8C7A70]">
              No se encontraron servicios en esta categoría.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 border-t border-[#E8DCCF] pt-3 text-right">
          <button
            onClick={onClose}
            className="rounded-xl bg-white px-5 py-2 text-xs font-semibold text-[#5A4D48] border border-[#E6D7CB] hover:bg-[#EFE7DE] transition"
          >
            Cerrar Catálogo
          </button>
        </div>
      </div>
    </div>
  );
}
