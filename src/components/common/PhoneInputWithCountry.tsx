'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  LISTA_PAISES,
  PaisInfo,
  detectarPaisUsuario,
  separarTelefonoYPais,
} from '@/lib/countryDetection';
import { Search, ChevronDown, Check, Globe } from 'lucide-react';

interface PhoneInputWithCountryProps {
  value: string;
  onChange: (fullPhoneNumber: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

function FlagIcon({
  codigo,
  bandera,
  className = 'h-3.5 w-5 rounded-xs object-cover shadow-2xs inline-block shrink-0',
}: {
  codigo: string;
  bandera: string;
  className?: string;
}) {
  const [error, setError] = useState(false);

  if (error || !codigo) {
    return <span className="text-base leading-none select-none shrink-0">{bandera || '🌐'}</span>;
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${codigo.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/w80/${codigo.toLowerCase()}.png 2x`}
      alt={codigo}
      width={20}
      height={14}
      onError={() => setError(true)}
      className={className}
    />
  );
}

export default function PhoneInputWithCountry({
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  id,
}: PhoneInputWithCountryProps) {
  const [paisSeleccionado, setPaisSeleccionado] = useState<PaisInfo>(() => {
    if (value && value.startsWith('+')) {
      return separarTelefonoYPais(value).pais;
    }
    return detectarPaisUsuario();
  });

  const [numeroLocal, setNumeroLocal] = useState<string>(() => {
    if (value && value.startsWith('+')) {
      return separarTelefonoYPais(value).numeroLocal;
    }
    return value || '';
  });

  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userManuallySelectedCountryRef = useRef(false);

  // Sincronizar si cambia el valor externo
  useEffect(() => {
    if (value && value.startsWith('+')) {
      const { pais, numeroLocal: local } = separarTelefonoYPais(value);
      setPaisSeleccionado(pais);
      setNumeroLocal(local);
    } else if (value === '' || value === undefined) {
      setNumeroLocal('');
      if (!userManuallySelectedCountryRef.current) {
        setPaisSeleccionado(detectarPaisUsuario());
      }
    } else if (!value.startsWith('+')) {
      setNumeroLocal(value);
    }
  }, [value]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    };

    if (abierto) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [abierto]);

  const handleSeleccionarPais = (pais: PaisInfo) => {
    userManuallySelectedCountryRef.current = true;
    setPaisSeleccionado(pais);
    setAbierto(false);
    setBusqueda('');

    const formatted = numeroLocal.trim()
      ? `${pais.dial} ${numeroLocal.trim()}`
      : `${pais.dial} `;
    onChange(formatted);
  };

  const handleCambiarNumero = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setNumeroLocal(raw);

    const full = raw.trim() ? `${paisSeleccionado.dial} ${raw.trim()}` : `${paisSeleccionado.dial} `;
    onChange(full);
  };

  const paisesFiltrados = LISTA_PAISES.filter((p) => {
    const q = busqueda.toLowerCase().trim();
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.dial.includes(q) ||
      p.codigo.toLowerCase().includes(q)
    );
  });

  return (
    <div className={`relative flex items-center ${className}`} ref={dropdownRef}>
      {/* Botón Selector de Bandera y Código de Área */}
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setAbierto(!abierto);
        }}
        className="flex items-center gap-2 rounded-l-xl border border-r-0 border-[#E6D7CB] bg-[#FAF0E6]/80 hover:bg-[#FAF0E6] px-2.5 py-2.5 text-xs font-bold text-[#3D322E] transition shrink-0 cursor-pointer focus:outline-hidden disabled:opacity-50"
        title={`Cambiar país (Actual: ${paisSeleccionado.nombre} ${paisSeleccionado.dial})`}
      >
        <FlagIcon codigo={paisSeleccionado.codigo} bandera={paisSeleccionado.bandera} />
        <span className="text-xs font-bold text-[#2D2424]">{paisSeleccionado.dial}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-[#8C7A70] transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {/* Input de Número Local */}
      <div className="relative flex-1">
        <input
          id={id}
          type="tel"
          required={required}
          disabled={disabled}
          placeholder={placeholder || `Ej. ${paisSeleccionado.placeholder}`}
          value={numeroLocal}
          onChange={handleCambiarNumero}
          className="w-full rounded-r-xl border border-[#E6D7CB] bg-[#FAF6F0]/50 py-2.5 pl-3 pr-3 text-sm font-medium text-[#2D2424] placeholder-[#9A8B84] focus:border-[#B85D75] focus:bg-white focus:outline-hidden transition disabled:opacity-50"
        />
      </div>

      {/* Menú Desplegable con Banderitas y Búsqueda */}
      {abierto && (
        <div className="absolute top-full left-0 z-[100] mt-1.5 w-72 max-w-[90vw] rounded-2xl border border-[#E6D7CB] bg-white p-2.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          {/* Buscador */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#8C7A70]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar país o código (+507, +1, Panamá...)"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-xl border border-[#EAE0D5] bg-[#FAF6F0] py-2 pl-8 pr-3 text-xs text-[#2D2424] placeholder-[#8C7A70] focus:border-[#B85D75] focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Lista de Países con Banderas Gráficas */}
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {paisesFiltrados.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#8C7A70]">
                No se encontraron países
              </div>
            ) : (
              paisesFiltrados.map((p) => {
                const esSeleccionado = p.codigo === paisSeleccionado.codigo;
                return (
                  <button
                    key={p.codigo}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSeleccionarPais(p);
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSeleccionarPais(p);
                    }}
                    className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition cursor-pointer ${
                      esSeleccionado
                        ? 'bg-[#FAF0E6] text-[#B85D75] font-bold border border-[#E6D7CB]'
                        : 'text-[#3D322E] hover:bg-[#FAF6F0]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FlagIcon codigo={p.codigo} bandera={p.bandera} />
                      <span className="truncate">{p.nombre}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2 font-mono text-[11px] text-[#8C7A70]">
                      <span>{p.dial}</span>
                      {esSeleccionado && <Check className="h-3.5 w-3.5 text-[#B85D75]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
