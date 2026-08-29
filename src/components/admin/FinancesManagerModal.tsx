'use client';

import React, { useState } from 'react';
import { useSalon } from '@/context/SalonContext';
import { TransaccionFinanciera, TipoTransaccion, MetodoPago } from '@/types/salon';
import {
  X,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Landmark,
  PiggyBank,
  Plus,
  Search,
  Calendar,
  Filter,
  Download,
  Users,
  CheckCircle2,
  Trash2,
  FileText,
  Percent,
  Receipt,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Building,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronRight,
  Coins,
} from 'lucide-react';
import { soundService } from '@/lib/sound';

interface FinancesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FinancesManagerModal({ isOpen, onClose }: FinancesManagerModalProps) {
  const {
    transacciones,
    citas,
    colaboradores,
    productos,
    configuracion,
    registrarTransaccion,
    eliminarTransaccion,
    liquidarColaborador,
  } = useSalon();

  const moneda = configuracion.moneda || '$';
  const taxRate = configuracion.impuestoPorcentaje !== undefined ? configuracion.impuestoPorcentaje : 7.0;
  const nombreImpuesto = configuracion.nombreImpuesto || 'ITBMS (7%)';
  const comisionServiciosPct = configuracion.comisionServiciosPorcentaje !== undefined ? configuracion.comisionServiciosPorcentaje : 50;
  const comisionProductosPct = configuracion.comisionProductosPorcentaje !== undefined ? configuracion.comisionProductosPorcentaje : 10;
  const salarioBaseGlobal = configuracion.salarioBasePredeterminado || 0;

  const [tabActiva, setTabActiva] = useState<'libro' | 'nomina' | 'reporte'>('libro');
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoy' | 'semana' | 'mes' | 'todo'>('mes');
  const [filtroTipo, setFiltroTipo] = useState<string>('all');
  const [busqueda, setBusqueda] = useState('');

  const [modalNuevoGasto, setModalNuevoGasto] = useState(false);
  const [gastoDescripcion, setGastoDescripcion] = useState('');
  const [gastoMonto, setGastoMonto] = useState<number | ''>('');
  const [gastoTipo, setGastoTipo] = useState<TipoTransaccion>('egreso_mantenimiento');
  const [gastoMetodoPago, setGastoMetodoPago] = useState<MetodoPago>('transferencia');
  const [gastoFecha, setGastoFecha] = useState(new Date().toISOString().split('T')[0]);
  const [errorGasto, setErrorGasto] = useState<string | null>(null);

  if (!isOpen) return null;

  const hoy = new Date();
  const hoyStr = hoy.toISOString().split('T')[0];
  const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];

  const transaccionesFiltradas = transacciones.filter((tx) => {
    let cumpleFecha = true;
    if (filtroPeriodo === 'hoy') cumpleFecha = tx.fecha === hoyStr;
    else if (filtroPeriodo === 'semana') cumpleFecha = tx.fecha >= hace7Dias;
    else if (filtroPeriodo === 'mes') cumpleFecha = tx.fecha >= inicioMes;

    let cumpleTipo = true;
    if (filtroTipo === 'ingresos') cumpleTipo = tx.tipo.startsWith('ingreso');
    else if (filtroTipo === 'egresos') cumpleTipo = tx.tipo.startsWith('egreso');
    else if (filtroTipo !== 'all') cumpleTipo = tx.tipo === filtroTipo;

    const cumpleBusqueda =
      tx.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
      (tx.colaboradorNombre && tx.colaboradorNombre.toLowerCase().includes(busqueda.toLowerCase()));

    return cumpleFecha && cumpleTipo && cumpleBusqueda;
  });

  const totalIngresos = transaccionesFiltradas
    .filter((t) => t.tipo.startsWith('ingreso'))
    .reduce((acc, t) => acc + t.montoTotal, 0);

  const totalEgresos = transaccionesFiltradas
    .filter((t) => t.tipo.startsWith('egreso'))
    .reduce((acc, t) => acc + t.montoTotal, 0);

  const totalImpuestosRecaudados = transaccionesFiltradas
    .filter((t) => t.tipo.startsWith('ingreso'))
    .reduce((acc, t) => acc + t.impuestoMonto, 0);

  const baseImponibleTotal = transaccionesFiltradas
    .filter((t) => t.tipo.startsWith('ingreso'))
    .reduce((acc, t) => acc + t.montoBruto, 0);

  const utilidadNeta = totalIngresos - totalEgresos;

  const handleGuardarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gastoDescripcion.trim()) {
      setErrorGasto('Ingresa una descripción del gasto.');
      return;
    }
    const monto = Number(gastoMonto) || 0;
    if (monto <= 0) {
      setErrorGasto('El monto del gasto debe ser mayor a 0.');
      return;
    }

    const catNombre =
      gastoTipo === 'egreso_mantenimiento'
        ? 'Mantenimiento'
        : gastoTipo === 'egreso_insumos'
        ? 'Insumos'
        : gastoTipo === 'egreso_servicios_publicos'
        ? 'Servicios Públicos'
        : 'Gastos Operativos';

    await registrarTransaccion({
      tipo: gastoTipo,
      descripcion: gastoDescripcion.trim(),
      montoBruto: monto,
      impuestoMonto: 0,
      montoTotal: monto,
      impuestoPorcentaje: 0,
      categoria: catNombre,
      fecha: gastoFecha,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      metodoPago: gastoMetodoPago,
    });

    soundService.playSuccess();
    setModalNuevoGasto(false);
    setGastoDescripcion('');
    setGastoMonto('');
    setErrorGasto(null);
  };

  const resumenColaboradoras = colaboradores.map((colab) => {
    const citasColab = citas.filter((c) => {
      const esSuya = c.terapeutaId === colab.id || c.colaboradorId === colab.id;
      let fechaValida = true;
      if (filtroPeriodo === 'hoy') fechaValida = c.fecha === hoyStr;
      else if (filtroPeriodo === 'semana') fechaValida = c.fecha >= hace7Dias;
      else if (filtroPeriodo === 'mes') fechaValida = c.fecha >= inicioMes;
      return esSuya && c.estado === 'Completada' && fechaValida;
    });

    const montoServicios = citasColab.reduce((acc, c) => acc + (c.precioTotal || 0), 0);
    const comisionServicios = (montoServicios * comisionServiciosPct) / 100;

    const txVentas = transacciones.filter((t) => {
      let fechaValida = true;
      if (filtroPeriodo === 'hoy') fechaValida = t.fecha === hoyStr;
      else if (filtroPeriodo === 'semana') fechaValida = t.fecha >= hace7Dias;
      else if (filtroPeriodo === 'mes') fechaValida = t.fecha >= inicioMes;
      return t.tipo === 'ingreso_producto' && t.colaboradorId === colab.id && fechaValida;
    });

    const montoProductos = txVentas.reduce((acc, t) => acc + t.montoTotal, 0);
    const comisionProductos = (montoProductos * comisionProductosPct) / 100;

    const baseFija = salarioBaseGlobal;
    const totalLiquidacion = comisionServicios + comisionProductos + baseFija;

    const pagosRealizados = transacciones
      .filter((t) => {
        let fechaValida = true;
        if (filtroPeriodo === 'hoy') fechaValida = t.fecha === hoyStr;
        else if (filtroPeriodo === 'semana') fechaValida = t.fecha >= hace7Dias;
        else if (filtroPeriodo === 'mes') fechaValida = t.fecha >= inicioMes;
        return t.tipo === 'egreso_nomina' && t.colaboradorId === colab.id && fechaValida;
      })
      .reduce((acc, t) => acc + t.montoTotal, 0);

    return {
      colab,
      totalCitas: citasColab.length,
      montoServicios,
      comisionServicios,
      totalVentasProds: txVentas.length,
      montoProductos,
      comisionProductos,
      baseFija,
      totalLiquidacion,
      pagosRealizados,
      saldoPendiente: Math.max(0, totalLiquidacion - pagosRealizados),
    };
  });

  const handlePagarLiquidacion = async (item: (typeof resumenColaboradoras)[0]) => {
    if (item.saldoPendiente <= 0) {
      alert('Esta colaboradora ya tiene liquidado el período seleccionado.');
      return;
    }

    if (
      confirm(
        `¿Confirmar pago de liquidación a ${item.colab.nombre} por ${moneda}${item.saldoPendiente.toFixed(
          2
        )}?`
      )
    ) {
      await liquidarColaborador({
        tipo: 'egreso_nomina',
        descripcion: `Pago de liquidación y comisiones a ${item.colab.nombre} (${filtroPeriodo.toUpperCase()})`,
        montoBruto: item.saldoPendiente,
        impuestoMonto: 0,
        montoTotal: item.saldoPendiente,
        impuestoPorcentaje: 0,
        categoria: 'Nómina y Comisiones',
        fecha: hoyStr,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        metodoPago: 'transferencia',
        colaboradorId: item.colab.id,
        colaboradorNombre: item.colab.nombre,
      });

      soundService.playSuccess();
    }
  };

  const handleExportarCSV = () => {
    const headers = [
      'ID Transaccion',
      'Fecha',
      'Hora',
      'Tipo',
      'Descripcion',
      'Categoria',
      'Metodo de Pago',
      'Colaborador',
      'Base Imponible',
      `Impuesto (${nombreImpuesto})`,
      'Total Monto',
    ];

    const rows = transaccionesFiltradas.map((t) => [
      t.id,
      t.fecha,
      t.hora,
      t.tipo,
      `"${t.descripcion.replace(/"/g, '""')}"`,
      t.categoria,
      t.metodoPago,
      t.colaboradorNombre || 'General',
      t.montoBruto.toFixed(2),
      t.impuestoMonto.toFixed(2),
      t.montoTotal.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,﻿' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_Contable_Pierina_${filtroPeriodo}_${hoyStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col rounded-3xl bg-[#FAF6F0] p-4 sm:p-6 shadow-2xl border border-[#E8DCCF] overflow-hidden">
        {/* Cabecera Principal */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8DCCF] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Conciliación & Contabilidad
                </span>
                <span className="rounded-md bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                  {nombreImpuesto}
                </span>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#2D2424]">
                Módulo Financiero y Libro Diario
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportarCSV}
              className="flex items-center gap-1.5 rounded-2xl border border-[#E6D7CB] bg-white px-3.5 py-2 text-xs font-bold text-[#5A4D48] hover:bg-[#FAF0E6] hover:text-[#B85D75] transition shadow-2xs cursor-pointer"
            >
              <Download className="h-4 w-4 text-[#8C7A70]" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setModalNuevoGasto(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-rose-gold-gradient px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#B85D75]/20 hover:opacity-95 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Registrar Gasto / Egreso</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-[#8C7A70] hover:bg-[#EFE7DE] hover:text-[#2D2424] transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 4 Tarjetas KPI Financieras */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
              <span>Ingresos Totales</span>
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-1 text-xl sm:text-2xl font-black text-emerald-800">
              {moneda}{totalIngresos.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-900/70 font-semibold block mt-0.5">
              Servicios + Ventas Mostrador
            </span>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-rose-900">
              <span>Egresos & OPEX</span>
              <ArrowDownRight className="h-4 w-4 text-rose-600" />
            </div>
            <div className="mt-1 text-xl sm:text-2xl font-black text-rose-800">
              {moneda}{totalEgresos.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-rose-900/70 font-semibold block mt-0.5">
              Mantenimiento, Insumos & Nómina
            </span>
          </div>

          <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-purple-900">
              <span>Impuesto ({taxRate}%)</span>
              <Landmark className="h-4 w-4 text-purple-600" />
            </div>
            <div className="mt-1 text-xl sm:text-2xl font-black text-purple-900">
              {moneda}{totalImpuestosRecaudados.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-purple-900/70 font-semibold block mt-0.5">
              Base: {moneda}{baseImponibleTotal.toFixed(2)}
            </span>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900">
              <span>Utilidad Neta</span>
              <PiggyBank className="h-4 w-4 text-blue-600" />
            </div>
            <div className={`mt-1 text-xl sm:text-2xl font-black ${utilidadNeta >= 0 ? 'text-blue-900' : 'text-rose-700'}`}>
              {moneda}{utilidadNeta.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-blue-900/70 font-semibold block mt-0.5">
              {utilidadNeta >= 0 ? 'Margen Operativo Positivo' : 'Déficit en el Período'}
            </span>
          </div>
        </div>

        {/* Pestañas y Filtros de Fecha */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#E8DCCF] pb-3">
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-[#E6D7CB]">
            <button
              type="button"
              onClick={() => setTabActiva('libro')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                tabActiva === 'libro'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-[#5A4D48] hover:bg-[#FAF6F0]'
              }`}
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>Libro Diario</span>
            </button>

            <button
              type="button"
              onClick={() => setTabActiva('nomina')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                tabActiva === 'nomina'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-[#5A4D48] hover:bg-[#FAF6F0]'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Liquidación & Nómina</span>
            </button>

            <button
              type="button"
              onClick={() => setTabActiva('reporte')}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                tabActiva === 'reporte'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-[#5A4D48] hover:bg-[#FAF6F0]'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Estado de Resultados (P&L)</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-[#E6D7CB]">
            {[
              { id: 'hoy', label: 'Hoy' },
              { id: 'semana', label: '7 Días' },
              { id: 'mes', label: 'Este Mes' },
              { id: 'todo', label: 'Todo' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setFiltroPeriodo(p.id as any)}
                className={`rounded-xl px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                  filtroPeriodo === p.id
                    ? 'bg-[#B85D75] text-white shadow-2xs'
                    : 'text-[#8C7A70] hover:bg-[#FAF6F0]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* PESTAÑA 1: LIBRO DIARIO */}
        {tabActiva === 'libro' && (
          <div className="mt-3 flex-1 flex flex-col overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-[#8C7A70]" />
                <input
                  type="text"
                  placeholder="Buscar en transacciones..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full rounded-xl border border-[#E6D7CB] bg-white py-1.5 pl-9 pr-3 text-xs text-[#2D2424]"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="rounded-xl border border-[#E6D7CB] bg-white px-3 py-1.5 text-xs font-semibold text-[#2D2424]"
                >
                  <option value="all">Todos los Movimientos</option>
                  <option value="ingresos">🟢 Solo Ingresos</option>
                  <option value="egresos">🔴 Solo Egresos</option>
                  <option value="ingreso_servicio">💅 Servicios Prestados</option>
                  <option value="ingreso_producto">🛍️ Ventas de Productos</option>
                  <option value="egreso_mantenimiento">🛠️ Mantenimiento</option>
                  <option value="egreso_insumos">📦 Insumos & Compras</option>
                  <option value="egreso_nomina">👥 Pago de Nómina</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {transaccionesFiltradas.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8C7A70]">
                  No hay transacciones registradas en este período.
                </div>
              ) : (
                transaccionesFiltradas.map((t) => {
                  const esIngreso = t.tipo.startsWith('ingreso');

                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-2xl border border-[#EAE0D5] bg-white p-3 shadow-2xs hover:border-[#B85D75] transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
                            esIngreso ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {esIngreso ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#2D2424] truncate">
                              {t.descripcion}
                            </span>
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold shrink-0 ${
                                esIngreso ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                              }`}
                            >
                              {t.categoria}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-[#8C7A70] mt-0.5">
                            <span>📅 {t.fecha} {t.hora}</span>
                            <span>•</span>
                            <span className="capitalize">💳 {t.metodoPago.replace('_', ' / ')}</span>
                            {t.colaboradorNombre && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-[#5A4D48]">👤 {t.colaboradorNombre}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <div className="text-right">
                          <span
                            className={`text-sm font-black block ${
                              esIngreso ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {esIngreso ? '+' : '-'}{moneda}{t.montoTotal.toFixed(2)}
                          </span>
                          {esIngreso && t.impuestoMonto > 0 && (
                            <span className="text-[9px] text-[#8C7A70] block">
                              Base: {moneda}{t.montoBruto.toFixed(2)} | Imp: {moneda}{t.impuestoMonto.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('¿Eliminar este registro del libro diario?')) {
                              eliminarTransaccion(t.id);
                            }
                          }}
                          className="rounded-lg p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Eliminar transacción"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: LIQUIDACIÓN DE NÓMINA */}
        {tabActiva === 'nomina' && (
          <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-3">
            <div className="rounded-2xl bg-amber-50/70 p-3 border border-amber-200 text-xs text-amber-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-amber-800" />
                <span>
                  Esquema Activo: <strong>{comisionServiciosPct}%</strong> Comisión Servicios | <strong>{comisionProductosPct}%</strong> Comisión Productos Mostrador | Salario Base: <strong>{moneda}{salarioBaseGlobal}</strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {resumenColaboradoras.map((item) => (
                <div
                  key={item.colab.id}
                  className="rounded-2xl border border-[#EAE0D5] bg-white p-4 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-full bg-[#FAF0E6] text-[#B85D75] font-black text-sm flex items-center justify-center border border-[#EAE0D5]">
                          {item.colab.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-[#2D2424]">{item.colab.nombre}</h5>
                          <span className="text-[10px] text-[#8C7A70]">{item.colab.telefono}</span>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.saldoPendiente > 0
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.saldoPendiente > 0 ? 'Liquidación Pendiente' : 'Al Día'}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-[#FAF6F0] p-2.5">
                        <span className="text-[10px] text-[#8C7A70] block font-semibold">
                          💅 Servicios ({item.totalCitas} citas)
                        </span>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="font-bold text-[#2D2424]">{moneda}{item.montoServicios.toFixed(2)}</span>
                          <span className="text-[10px] font-bold text-emerald-700">+{moneda}{item.comisionServicios.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="rounded-xl bg-[#FAF6F0] p-2.5">
                        <span className="text-[10px] text-[#8C7A70] block font-semibold">
                          🛍️ Ventas ({item.totalVentasProds} prods)
                        </span>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="font-bold text-[#2D2424]">{moneda}{item.montoProductos.toFixed(2)}</span>
                          <span className="text-[10px] font-bold text-emerald-700">+{moneda}{item.comisionProductos.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-[#F4EDE4] pt-2 text-xs">
                      <span className="font-bold text-[#5A4D48]">Total Devengado:</span>
                      <span className="text-base font-black text-[#2D2424]">
                        {moneda}{item.totalLiquidacion.toFixed(2)}
                      </span>
                    </div>

                    {item.pagosRealizados > 0 && (
                      <div className="flex items-center justify-between text-[11px] text-emerald-800">
                        <span>Pagos ya emitidos:</span>
                        <span>-{moneda}{item.pagosRealizados.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#F4EDE4] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#8C7A70] block">Saldo a Pagar:</span>
                      <span className="text-sm font-black text-amber-700">
                        {moneda}{item.saldoPendiente.toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePagarLiquidacion(item)}
                      disabled={item.saldoPendiente <= 0}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold transition shadow-xs disabled:opacity-40 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Pagar Liquidación</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: ESTADO DE RESULTADOS */}
        {tabActiva === 'reporte' && (
          <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-4">
            <div className="rounded-3xl bg-white p-5 border border-[#EAE0D5] shadow-xs space-y-4">
              <div className="border-b border-[#E8DCCF] pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-serif font-bold text-[#2D2424]">
                    Estado de Resultados (P&L) - Período: {filtroPeriodo.toUpperCase()}
                  </h4>
                  <p className="text-xs text-[#8C7A70]">
                    Desglose contable con base imponible, recaudación de {nombreImpuesto} y margen operativo neto.
                  </p>
                </div>
                <span className="rounded-xl bg-emerald-100 text-emerald-900 px-3 py-1 text-xs font-bold">
                  {configuracion.nombreSalon}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="font-semibold text-[#5A4D48]">
                    (+) Facturación por Servicios de Estética
                  </span>
                  <span className="font-bold text-[#2D2424]">
                    {moneda}{transaccionesFiltradas.filter((t) => t.tipo === 'ingreso_servicio').reduce((a, b) => a + b.montoTotal, 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100">
                  <span className="font-semibold text-[#5A4D48]">
                    (+) Ventas Mostrador de Productos
                  </span>
                  <span className="font-bold text-[#2D2424]">
                    {moneda}{transaccionesFiltradas.filter((t) => t.tipo === 'ingreso_producto').reduce((a, b) => a + b.montoTotal, 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 bg-[#FAF6F0] px-2 rounded-lg font-bold text-[#2D2424]">
                  <span>(=) TOTAL INGRESOS BRUTOS</span>
                  <span className="text-emerald-700">+{moneda}{totalIngresos.toFixed(2)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100 text-purple-900">
                  <span>(-) Impuesto Fiscal a Declarar ({taxRate}% {nombreImpuesto})</span>
                  <span className="font-bold">-{moneda}{totalImpuestosRecaudados.toFixed(2)}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100 text-rose-900">
                  <span>(-) Gastos en Insumos y Mantenimiento del Salón</span>
                  <span className="font-bold">
                    -{moneda}{transaccionesFiltradas.filter((t) => t.tipo === 'egreso_mantenimiento' || t.tipo === 'egreso_insumos').reduce((a, b) => a + b.montoTotal, 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-stone-100 text-rose-900">
                  <span>(-) Pago de Nómina y Comisiones a Colaboradoras</span>
                  <span className="font-bold">
                    -{moneda}{transaccionesFiltradas.filter((t) => t.tipo === 'egreso_nomina').reduce((a, b) => a + b.montoTotal, 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between py-2 bg-emerald-50 px-3 rounded-xl font-black text-sm text-emerald-950 border border-emerald-200">
                  <span>(=) UTILIDAD NETA DEL SALÓN</span>
                  <span className={utilidadNeta >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    {moneda}{utilidadNeta.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: REGISTRAR GASTO */}
      {modalNuevoGasto && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-[#FAF6F0] p-5 shadow-2xl border border-rose-300 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-600 text-white">
                  <ArrowDownRight className="h-4 w-4" />
                </div>
                <h4 className="text-base font-serif font-bold text-[#2D2424]">
                  Registrar Gasto Operativo (OPEX)
                </h4>
              </div>
              <button
                onClick={() => setModalNuevoGasto(false)}
                className="rounded-full p-1.5 text-[#8C7A70] hover:bg-[#EFE7DE] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarGasto} className="mt-3 flex-1 overflow-y-auto pr-1 space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#2D2424] mb-1">
                  Concepto / Descripción del Gasto: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mantenimiento de aire acondicionado / Pago de luz"
                  value={gastoDescripcion}
                  onChange={(e) => setGastoDescripcion(e.target.value)}
                  className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs font-semibold text-[#2D2424] focus:border-rose-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D2424] mb-1">
                    Monto ({moneda}): *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0.01}
                    required
                    placeholder="0.00"
                    value={gastoMonto}
                    onChange={(e) => setGastoMonto(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border border-rose-300 bg-rose-50/50 p-2.5 text-xs font-bold text-rose-900 focus:border-rose-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2424] mb-1">
                    Categoría:
                  </label>
                  <select
                    value={gastoTipo}
                    onChange={(e) => setGastoTipo(e.target.value as any)}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs font-semibold text-[#2D2424]"
                  >
                    <option value="egreso_mantenimiento">🛠️ Mantenimiento</option>
                    <option value="egreso_insumos">📦 Insumos Salón</option>
                    <option value="egreso_servicios_publicos">💡 Servicios Básicos</option>
                    <option value="egreso_otro">📝 Otros Gastos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D2424] mb-1">
                    Método de Pago:
                  </label>
                  <select
                    value={gastoMetodoPago}
                    onChange={(e) => setGastoMetodoPago(e.target.value as any)}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs font-semibold text-[#2D2424]"
                  >
                    <option value="transferencia">Transferencia</option>
                    <option value="efectivo">Efectivo (Caja)</option>
                    <option value="tarjeta">Tarjeta Débito/Crédito</option>
                    <option value="yappy_nequi">Yappy / Nequi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2424] mb-1">
                    Fecha:
                  </label>
                  <input
                    type="date"
                    value={gastoFecha}
                    onChange={(e) => setGastoFecha(e.target.value)}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2 text-xs font-semibold text-[#2D2424]"
                  />
                </div>
              </div>

              {errorGasto && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-semibold">
                  {errorGasto}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8DCCF]">
                <button
                  type="button"
                  onClick={() => setModalNuevoGasto(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#8C7A70] hover:bg-stone-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                >
                  Registrar Egreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
