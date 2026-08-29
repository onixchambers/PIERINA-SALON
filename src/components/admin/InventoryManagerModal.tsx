'use client';

import React, { useState } from 'react';
import { useSalon } from '@/context/SalonContext';
import { Producto, MetodoPago } from '@/types/salon';
import { processImageFile } from '@/lib/imageHelper';
import {
  X,
  Package,
  Plus,
  Search,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Barcode,
  Sparkles,
  Check,
} from 'lucide-react';
import { soundService } from '@/lib/sound';

interface InventoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InventoryManagerModal({ isOpen, onClose }: InventoryManagerModalProps) {
  const {
    productos,
    colaboradores,
    configuracion,
    guardarProducto,
    eliminarProducto,
    venderProducto,
  } = useSalon();

  const moneda = configuracion.moneda || '$';
  const taxRate = configuracion.impuestoPorcentaje !== undefined ? configuracion.impuestoPorcentaje : 7.0;
  const nombreImpuesto = configuracion.nombreImpuesto || 'ITBMS (7%)';

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('all');
  const [filtroStock, setFiltroStock] = useState<'all' | 'bajo' | 'agotado'>('all');

  const [modalFormProducto, setModalFormProducto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategoria, setFormCategoria] = useState('unas');
  const [formPrecioCosto, setFormPrecioCosto] = useState<number | ''>('');
  const [formPrecioVenta, setFormPrecioVenta] = useState<number | ''>('');
  const [formStock, setFormStock] = useState<number | ''>(10);
  const [formStockMinimo, setFormStockMinimo] = useState<number | ''>(3);
  const [formImagenUrl, setFormImagenUrl] = useState<string | null>(null);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const [modalPOS, setModalPOS] = useState(false);
  const [posProductoId, setPosProductoId] = useState<string>('');
  const [posCantidad, setPosCantidad] = useState<number>(1);
  const [posColaboradorId, setPosColaboradorId] = useState<string>('');
  const [posMetodoPago, setPosMetodoPago] = useState<MetodoPago>('efectivo');
  const [posNotas, setPosNotas] = useState('');
  const [posExito, setPosExito] = useState(false);
  const [posError, setPosError] = useState<string | null>(null);

  if (!isOpen) return null;

  const categorias = [
    { id: 'unas', label: '💅 Uñas & Manicura' },
    { id: 'pestanas', label: '✨ Pestañas & Cejas' },
    { id: 'cabello', label: '💇‍♀️ Cuidado Capilar' },
    { id: 'faciales', label: '🌸 Skincare & Faciales' },
    { id: 'herramientas', label: '🛠️ Herramientas & Insumos' },
    { id: 'otros', label: '📦 Otros Productos' },
  ];

  const totalItems = productos.length;
  const valorTotalInventario = productos.reduce((acc, p) => acc + p.precioVenta * p.stock, 0);
  const costoTotalInventario = productos.reduce((acc, p) => acc + p.precioCosto * p.stock, 0);
  const productosStockBajo = productos.filter((p) => p.stock > 0 && p.stock <= p.stockMinimo);
  const productosAgotados = productos.filter((p) => p.stock === 0);

  const productosFiltrados = productos.filter((p) => {
    const cumpleBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.sku.toLowerCase().includes(busqueda.toLowerCase());
    const cumpleCategoria = filtroCategoria === 'all' || p.categoria === filtroCategoria;
    const cumpleStock =
      filtroStock === 'all' ||
      (filtroStock === 'bajo' && p.stock > 0 && p.stock <= p.stockMinimo) ||
      (filtroStock === 'agotado' && p.stock === 0);

    return cumpleBusqueda && cumpleCategoria && cumpleStock;
  });

  const handleNuevoProducto = () => {
    setProductoEditando(null);
    setFormNombre('');
    setFormSku(`BEA-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormCategoria(categorias[0].id);
    setFormPrecioCosto('');
    setFormPrecioVenta('');
    setFormStock(10);
    setFormStockMinimo(3);
    setFormImagenUrl(null);
    setErrorForm(null);
    setModalFormProducto(true);
  };

  const handleEditarProducto = (p: Producto) => {
    setProductoEditando(p);
    setFormNombre(p.nombre);
    setFormSku(p.sku);
    setFormCategoria(p.categoria || 'unas');
    setFormPrecioCosto(p.precioCosto);
    setFormPrecioVenta(p.precioVenta);
    setFormStock(p.stock);
    setFormStockMinimo(p.stockMinimo);
    setFormImagenUrl(p.imagenUrl || null);
    setErrorForm(null);
    setModalFormProducto(true);
  };

  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file, 400, 0.85);
      setFormImagenUrl(dataUrl);
    } catch (err) {
      console.error('Error procesando imagen del producto:', err);
    }
  };

  const handleSubmitProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      setErrorForm('Por favor ingresa el nombre del producto.');
      return;
    }
    const precioV = Number(formPrecioVenta) || 0;
    const precioC = Number(formPrecioCosto) || 0;

    if (precioV <= 0) {
      setErrorForm('El precio de venta debe ser mayor a 0.');
      return;
    }

    const nuevo: Producto = {
      id: productoEditando ? productoEditando.id : `prod-${Date.now()}`,
      sku: formSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      nombre: formNombre.trim(),
      categoria: formCategoria,
      imagenUrl: formImagenUrl || null,
      precioCosto: precioC,
      precioVenta: precioV,
      stock: Number(formStock) || 0,
      stockMinimo: Number(formStockMinimo) || 1,
      activo: true,
      creadoEn: productoEditando ? productoEditando.creadoEn : new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    };

    await guardarProducto(nuevo);
    soundService.playSuccess();
    setModalFormProducto(false);
  };

  const handleAbrirPOS = (productoPreseleccionado?: Producto) => {
    const prod = productoPreseleccionado || productos[0];
    setPosProductoId(prod ? prod.id : '');
    setPosCantidad(1);
    setPosColaboradorId(colaboradores[0]?.id || '');
    setPosMetodoPago('efectivo');
    setPosNotas('');
    setPosExito(false);
    setPosError(null);
    setModalPOS(true);
  };

  const handleEjecutarVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosError(null);
    const prod = productos.find((p) => p.id === posProductoId);
    if (!prod) {
      setPosError('Selecciona un producto para vender.');
      return;
    }
    if (posCantidad <= 0 || posCantidad > prod.stock) {
      setPosError(`Cantidad inválida. Stock disponible: ${prod.stock} unidades.`);
      return;
    }

    try {
      await venderProducto({
        productoId: prod.id,
        cantidad: posCantidad,
        colaboradorId: posColaboradorId || undefined,
        metodoPago: posMetodoPago,
        notas: posNotas.trim() || undefined,
      });

      soundService.playSuccess();
      setPosExito(true);
      setTimeout(() => {
        setPosExito(false);
        setModalPOS(false);
      }, 1400);
    } catch (err: any) {
      setPosError(err.message || 'Error al procesar la venta.');
    }
  };

  const prodSeleccionadoPOS = productos.find((p) => p.id === posProductoId);
  const totalCobrarPOS = prodSeleccionadoPOS ? prodSeleccionadoPOS.precioVenta * posCantidad : 0;
  const baseImponiblePOS = parseFloat((totalCobrarPOS / (1 + taxRate / 100)).toFixed(2));
  const impuestoPOS = parseFloat((totalCobrarPOS - baseImponiblePOS).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-3xl bg-[#FAF6F0] p-4 sm:p-6 shadow-2xl border border-[#E8DCCF] overflow-hidden">
        {/* Cabecera Principal */}
        <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-900 text-white shadow-sm">
              <Package className="h-6 w-6 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#B85D75]">
                  Control de Stock & Mostrador
                </span>
                <span className="rounded-md bg-purple-100 border border-purple-300 px-2 py-0.5 text-[10px] font-bold text-purple-900">
                  Módulo POS
                </span>
              </div>
              <h3 className="text-xl font-serif font-bold text-[#2D2424]">
                Inventario de Productos del Salón
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAbrirPOS()}
              disabled={productos.length === 0}
              className="hidden sm:flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Venta Mostrador (POS)</span>
            </button>

            <button
              onClick={handleNuevoProducto}
              className="flex items-center gap-2 rounded-2xl bg-rose-gold-gradient px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#B85D75]/20 hover:opacity-95 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Producto</span>
              <span className="sm:hidden">Crear</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-[#8C7A70] hover:bg-[#EFE7DE] hover:text-[#2D2424] transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tarjetas KPI de Inventario */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-2xl border border-[#EAE0D5] bg-white p-3 shadow-2xs">
            <span className="text-[11px] font-semibold text-[#8C7A70] block">Catálogo Activo</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg sm:text-xl font-bold text-[#2D2424]">{totalItems} prods.</span>
              <Package className="h-4 w-4 text-purple-600" />
            </div>
          </div>

          <div className="rounded-2xl border border-[#EAE0D5] bg-white p-3 shadow-2xs">
            <span className="text-[11px] font-semibold text-[#8C7A70] block">Valor en Venta ($)</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg sm:text-xl font-bold text-emerald-700">
                {moneda}{valorTotalInventario.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </div>

          <div className="rounded-2xl border border-[#EAE0D5] bg-white p-3 shadow-2xs">
            <span className="text-[11px] font-semibold text-[#8C7A70] block">Inversión Costo</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg sm:text-xl font-bold text-[#5A4D48]">
                {moneda}{costoTotalInventario.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <DollarSign className="h-4 w-4 text-[#8C7A70]" />
            </div>
          </div>

          <div className="rounded-2xl border border-[#EAE0D5] bg-white p-3 shadow-2xs">
            <span className="text-[11px] font-semibold text-[#8C7A70] block">Stock Bajo / Agotado</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className={`text-lg sm:text-xl font-bold ${productosStockBajo.length + productosAgotados.length > 0 ? 'text-amber-600' : 'text-stone-400'}`}>
                {productosStockBajo.length + productosAgotados.length} alertas
              </span>
              <AlertTriangle className={`h-4 w-4 ${productosStockBajo.length + productosAgotados.length > 0 ? 'text-amber-500' : 'text-stone-300'}`} />
            </div>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8C7A70]" />
            <input
              type="text"
              placeholder="Buscar por nombre o código SKU..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-2xl border border-[#E6D7CB] bg-white py-2 pl-9 pr-4 text-xs font-semibold text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="rounded-xl border border-[#E6D7CB] bg-white px-3 py-2 text-xs font-semibold text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden shadow-2xs"
            >
              <option value="all">Todas las Categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={filtroStock}
              onChange={(e) => setFiltroStock(e.target.value as any)}
              className="rounded-xl border border-[#E6D7CB] bg-white px-3 py-2 text-xs font-semibold text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden shadow-2xs"
            >
              <option value="all">Todos los Stocks</option>
              <option value="bajo">⚠️ Stock Bajo</option>
              <option value="agotado">🔴 Agotados</option>
            </select>

            <button
              onClick={() => handleAbrirPOS()}
              disabled={productos.length === 0}
              className="sm:hidden flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Vender</span>
            </button>
          </div>
        </div>

        {/* Listado de Productos (Cuadrícula Responsiva) */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {productosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FAF0E6] text-[#B85D75] mb-3">
                <Package className="h-8 w-8" />
              </div>
              <h4 className="text-base font-bold text-[#2D2424]">No se encontraron productos</h4>
              <p className="text-xs text-[#8C7A70] mt-1 max-w-sm">
                No hay productos que coincidan con los filtros seleccionados o el catálogo está vacío.
              </p>
              <button
                onClick={handleNuevoProducto}
                className="mt-4 flex items-center gap-2 rounded-2xl bg-rose-gold-gradient px-4 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar Primer Producto</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {productosFiltrados.map((p) => {
                const margen = p.precioVenta - p.precioCosto;
                const margenPct = p.precioCosto > 0 ? ((margen / p.precioCosto) * 100).toFixed(0) : '100';
                const esStockBajo = p.stock > 0 && p.stock <= p.stockMinimo;
                const esAgotado = p.stock === 0;

                return (
                  <div
                    key={p.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-[#EAE0D5] bg-white p-3.5 shadow-2xs hover:border-[#B85D75] hover:shadow-md transition"
                  >
                    <div>
                      {/* Imagen y Badges */}
                      <div className="flex items-start gap-3">
                        <div className="relative h-16 w-16 rounded-2xl border border-[#EFE7DE] bg-[#FAF6F0] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          {p.imagenUrl ? (
                            <img
                              src={p.imagenUrl}
                              alt={p.nombre}
                              className="h-full w-full object-cover rounded-xl"
                            />
                          ) : (
                            <Package className="h-7 w-7 text-[#B85D75]/60" />
                          )}

                          {esAgotado && (
                            <div className="absolute inset-0 bg-rose-900/80 flex items-center justify-center">
                              <span className="text-[9px] font-black text-white uppercase tracking-wider">
                                Agotado
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF0E6] px-1.5 py-0.5 text-[9px] font-bold text-[#8C5845]">
                              <Barcode className="h-2.5 w-2.5" />
                              {p.sku}
                            </span>

                            {/* Badge de Stock */}
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                                esAgotado
                                  ? 'bg-rose-100 text-rose-800'
                                  : esStockBajo
                                  ? 'bg-amber-100 text-amber-900 animate-pulse'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {esAgotado
                                ? '0 unidades'
                                : esStockBajo
                                ? `⚠️ ${p.stock} (Bajo)`
                                : `🟢 ${p.stock} disp.`}
                            </span>
                          </div>

                          <h5 className="mt-1 font-bold text-xs text-[#2D2424] leading-snug line-clamp-2" title={p.nombre}>
                            {p.nombre}
                          </h5>

                          <span className="text-[10px] text-[#8C7A70] capitalize">
                            {categorias.find((c) => c.id === p.categoria)?.label || p.categoria}
                          </span>
                        </div>
                      </div>

                      {/* Desglose de Precios */}
                      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-[#FAF6F0] p-2 text-center">
                        <div>
                          <span className="text-[9px] font-semibold text-[#8C7A70] block">P. Costo</span>
                          <span className="text-xs font-bold text-[#5A4D48]">
                            {moneda}{p.precioCosto.toFixed(2)}
                          </span>
                        </div>
                        <div className="border-l border-[#EAE0D5]">
                          <span className="text-[9px] font-semibold text-emerald-800 block">P. Venta</span>
                          <span className="text-xs font-bold text-emerald-700">
                            {moneda}{p.precioVenta.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="mt-3 flex items-center justify-between border-t border-[#F4EDE4] pt-2">
                      <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                        <Sparkles className="h-3 w-3" />
                        <span>+{moneda}{margen.toFixed(2)} ({margenPct}%)</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAbrirPOS(p)}
                          disabled={p.stock <= 0}
                          className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-xs font-bold transition shadow-2xs disabled:opacity-40 cursor-pointer"
                          title="Venta rápida en mostrador"
                        >
                          <ShoppingCart className="h-3 w-3" />
                          <span>Vender</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditarProducto(p)}
                          className="rounded-xl border border-[#EAE0D5] bg-white p-1.5 text-[#5A4D48] hover:bg-[#FAF0E6] hover:text-[#B85D75] transition cursor-pointer"
                          title="Editar producto"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Eliminar el producto "${p.nombre}" del catálogo?`)) {
                              eliminarProducto(p.id);
                            }
                          }}
                          className="rounded-xl border border-[#EAE0D5] bg-white p-1.5 text-[#8C7A70] hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                          title="Eliminar producto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREAR / EDITAR PRODUCTO */}
      {modalFormProducto && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-[#FAF6F0] p-5 shadow-2xl border border-[#E8DCCF] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-[#B85D75]" />
                <h4 className="text-base font-serif font-bold text-[#2D2424]">
                  {productoEditando ? 'Editar Producto de Salón' : 'Nuevo Producto en Inventario'}
                </h4>
              </div>
              <button
                onClick={() => setModalFormProducto(false)}
                className="rounded-full p-1.5 text-[#8C7A70] hover:bg-[#EFE7DE] transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitProducto} className="mt-3 flex-1 overflow-y-auto pr-1 space-y-3">
              <div className="flex items-center gap-4 rounded-2xl bg-white p-3 border border-[#EAE0D5]">
                {formImagenUrl ? (
                  <div className="relative">
                    <img
                      src={formImagenUrl}
                      alt="Preview"
                      className="h-16 w-16 rounded-xl object-cover border border-[#B85D75]"
                    />
                    <button
                      type="button"
                      onClick={() => setFormImagenUrl(null)}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs shadow-xs cursor-pointer"
                      title="Quitar foto"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-[#FAF0E6] border border-[#EAE0D5] flex items-center justify-center text-[#B85D75]">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}

                <div className="flex-1 space-y-1">
                  <label className="inline-flex items-center gap-1.5 rounded-xl bg-[#FAF0E6] border border-[#EAE0D5] px-3 py-1.5 text-xs font-bold text-[#8C5845] cursor-pointer hover:bg-white transition">
                    <Upload className="h-3 w-3" />
                    <span>{formImagenUrl ? 'Cambiar Foto' : 'Subir Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSubirFoto}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-[#8C7A70]">Foto optimizada para catálogo y mostrador</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2424] mb-1">
                  Nombre del Producto: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Serum Facial Ácido Hialurónico (50ml)"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs font-semibold text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D2424] mb-1">
                    Código SKU / Barras:
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs font-bold text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2424] mb-1">
                    Categoría:
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs font-semibold text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden"
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D2424] mb-1">
                    Precio Costo ({moneda}):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                    value={formPrecioCosto}
                    onChange={(e) => setFormPrecioCosto(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs font-bold text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1">
                    Precio Venta Mostrador ({moneda}): *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0.01}
                    required
                    placeholder="0.00"
                    value={formPrecioVenta}
                    onChange={(e) => setFormPrecioVenta(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border border-emerald-300 bg-emerald-50/50 p-2.5 text-xs font-bold text-emerald-900 focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D2424] mb-1">
                    Cantidad en Stock: *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs font-bold text-[#2D2424] focus:border-[#B85D75] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    Alerta Stock Mínimo:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formStockMinimo}
                    onChange={(e) => setFormStockMinimo(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border border-amber-300 bg-amber-50/50 p-2.5 text-xs font-bold text-amber-900 focus:border-amber-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {errorForm && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-semibold">
                  {errorForm}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8DCCF]">
                <button
                  type="button"
                  onClick={() => setModalFormProducto(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-[#8C7A70] hover:bg-stone-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-gold-gradient px-5 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95 transition cursor-pointer"
                >
                  {productoEditando ? 'Actualizar Producto' : 'Guardar en Inventario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PUNTO DE VENTA (POS MOSTRADOR) */}
      {modalPOS && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-[#FAF6F0] p-5 shadow-2xl border border-emerald-300 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E8DCCF] pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <h4 className="text-base font-serif font-bold text-[#2D2424]">
                  Punto de Venta Mostrador (POS)
                </h4>
              </div>
              <button
                onClick={() => setModalPOS(false)}
                className="rounded-full p-1.5 text-[#8C7A70] hover:bg-[#EFE7DE] transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {posExito ? (
              <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in-95">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h4 className="text-lg font-bold text-emerald-900">¡Venta Registrada Exitosamente!</h4>
                <p className="text-xs text-[#5A4D48] mt-1">
                  El stock se actualizó y el ingreso fue añadido automáticamente al Libro Diario.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEjecutarVenta} className="mt-3 flex-1 overflow-y-auto pr-1 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D2424] mb-1">
                    Producto a Vender: *
                  </label>
                  <select
                    value={posProductoId}
                    onChange={(e) => setPosProductoId(e.target.value)}
                    className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs font-bold text-[#2D2424] focus:border-emerald-600 focus:outline-hidden"
                  >
                    {productos.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                        {p.nombre} ({p.stock > 0 ? `${p.stock} en stock` : 'Agotado'}) - {moneda}{p.precioVenta.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#2D2424] mb-1">
                      Cantidad:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={prodSeleccionadoPOS?.stock || 1}
                      value={posCantidad}
                      onChange={(e) => setPosCantidad(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-center text-xs font-bold text-[#2D2424]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D2424] mb-1">
                      Colaboradora / Vendedora:
                    </label>
                    <select
                      value={posColaboradorId}
                      onChange={(e) => setPosColaboradorId(e.target.value)}
                      className="w-full rounded-xl border border-[#E6D7CB] bg-white p-2.5 text-xs font-semibold text-[#2D2424]"
                    >
                      <option value="">Recepción / General</option>
                      {colaboradores.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2424] mb-1">
                    Método de Pago:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { val: 'efectivo', label: '💵 Efectivo' },
                      { val: 'tarjeta', label: '💳 Tarjeta POS' },
                      { val: 'transferencia', label: '🏦 Transferencia' },
                      { val: 'yappy_nequi', label: '📱 Yappy / Nequi' },
                    ].map((m) => (
                      <button
                        key={m.val}
                        type="button"
                        onClick={() => setPosMetodoPago(m.val as any)}
                        className={`rounded-xl py-2 px-2 text-[11px] font-bold border transition cursor-pointer ${
                          posMetodoPago === m.val
                            ? 'border-emerald-600 bg-emerald-100 text-emerald-900 shadow-2xs'
                            : 'border-[#EAE0D5] bg-white text-[#5A4D48]'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-3.5 border border-emerald-200 space-y-1.5 shadow-2xs">
                  <div className="flex justify-between text-xs text-[#8C7A70]">
                    <span>Base Imponible (Subtotal):</span>
                    <span>{moneda}{baseImponiblePOS.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#8C7A70]">
                    <span>{nombreImpuesto} ({taxRate}%):</span>
                    <span>+{moneda}{impuestoPOS.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-[#F4EDE4] pt-2 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-[#2D2424]">Total a Cobrar:</span>
                    <span className="text-lg font-black text-emerald-700">
                      {moneda}{totalCobrarPOS.toFixed(2)}
                    </span>
                  </div>
                </div>

                {posError && (
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-semibold">
                    {posError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8DCCF]">
                  <button
                    type="button"
                    onClick={() => setModalPOS(false)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-[#8C7A70] hover:bg-stone-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    <span>Cobrar {moneda}{totalCobrarPOS.toFixed(2)}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
