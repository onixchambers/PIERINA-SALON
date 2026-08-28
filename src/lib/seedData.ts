import { Servicio, Colaborador, Cita, BloqueoDisponibilidad, ConfiguracionSalon, Especialidad } from '@/types/salon';

/**
 * Genera la contraseña por defecto para una colaboradora o usuario según su nombre:
 * Primer nombre en minúsculas sin acentos + "123" (ej. "Valentina Ramos" -> "valentina123")
 */
export function generarPasswordPorDefecto(nombre: string): string {
  if (!nombre || !nombre.trim()) return 'pierina123';
  const primerNombre = nombre.trim().split(' ')[0].toLowerCase();
  const limpio = primerNombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  return `${limpio || 'pierina'}123`;
}

export const ESPECIALIDADES_INICIALES: Especialidad[] = [
  { id: 'pestanas', nombre: 'Pestañas & Cejas', icono: 'Eye', color: '#A855F7' },
  { id: 'unas', nombre: 'Uñas & Manicura', icono: 'Gem', color: '#E07A5F' },
  { id: 'cabello', nombre: 'Cabello & Estilismo', icono: 'Scissors', color: '#818CF8' },
  { id: 'faciales', nombre: 'Tratamientos Faciales', icono: 'Smile', color: '#10B981' },
  { id: 'depilacion', nombre: 'Depilación Láser e Hilo', icono: 'Zap', color: '#F59E0B' },
  { id: 'masajes', nombre: 'Masajes Corporales', icono: 'HandMetal', color: '#14B8A6' },
];

export const CONFIG_INICIAL: ConfiguracionSalon = {
  nombreSalon: 'Pierina Salón',
  eslogan: 'Cejas, pestañas y más',
  logoUrl: '/logo-pierina.png',
  telefonoSalon: '+525541238990',
  direccion: 'Av. Paseo de las Palmas 745, Lomas de Chapultepec, CDMX',
  horarioApertura: '08:00',
  horarioCierre: '23:00',
  intervaloMinutos: 30,
  pinAdmin: 'pierina123',
  pinSuperAdmin: 'onix1974',
  administradores: [],
  alertaSonoraActiva: true,
  moneda: '$',
  zonaHoraria: 'America/Panama',
  especialidades: ESPECIALIDADES_INICIALES,
  firebaseConfig: {
    apiKey: 'AIzaSyC2HdTRwA3rXLc6sXzj_GwM43Jpn3EGPbw',
    authDomain: 'pierina-1ee38.firebaseapp.com',
    projectId: 'pierina-1ee38',
    storageBucket: 'pierina-1ee38.firebasestorage.app',
    messagingSenderId: '128506779169',
    appId: '1:128506779169:web:3b467a26a0253bcde87560',
  },
};

export const SERVICIOS_INICIALES: Servicio[] = [
  // 1. Uñas
  {
    id: 'serv-u-1',
    nombre: 'Manicura Rusa + Esmaltado Semi Jelly',
    categoria: 'unas',
    duracionMin: 60,
    precio: 480,
    descripcion: 'Limpieza profunda de cutícula con técnica combinada y acabado brillo espejo de larga duración (hasta 21 días).',
    icono: 'Sparkles',
    activo: true,
  },
  {
    id: 'serv-u-2',
    nombre: 'Esculturales Soft Gel / Polygel con Nail Art',
    categoria: 'unas',
    duracionMin: 90,
    precio: 750,
    descripcion: 'Extensión ligera, resistente y natural con diseño personalizado a mano alzada.',
    icono: 'Gem',
    activo: true,
  },
  {
    id: 'serv-u-3',
    nombre: 'Pedicura Spa Detox & Masaje Podal',
    categoria: 'unas',
    duracionMin: 60,
    precio: 520,
    descripcion: 'Exfoliación con sales minerales del Himalaya, retiro de durezas, mascarilla hidratante y esmaltado.',
    icono: 'Footprints',
    activo: true,
  },

  // 2. Cabello
  {
    id: 'serv-c-1',
    nombre: 'Corte de Autor + Ritual Glow & Peinado',
    categoria: 'cabello',
    duracionMin: 60,
    precio: 550,
    descripcion: 'Diagnóstico capilar personalizado, lavado relajante con masaje craneal, corte y peinado con ondas o lacio sedoso.',
    icono: 'Scissors',
    activo: true,
  },
  {
    id: 'serv-c-2',
    nombre: 'Balayage Francés & Baño de Brillo Gloss',
    categoria: 'cabello',
    duracionMin: 150,
    precio: 1850,
    descripcion: 'Degradado sutil con iluminación orgánica, matiz de alta costura y tratamiento de plex reconstituyente.',
    icono: 'Palette',
    activo: true,
  },
  {
    id: 'serv-c-3',
    nombre: 'Botox Capilar Reconstructor con Ácido Hialurónico',
    categoria: 'cabello',
    duracionMin: 90,
    precio: 980,
    descripcion: 'Elimina el frizz al 100%, sella la cutícula y devuelve brillo y movimiento sin restar volumen.',
    icono: 'Wand2',
    activo: true,
  },

  // 3. Faciales
  {
    id: 'serv-f-1',
    nombre: 'Limpieza Facial Profunda + Hidrodermoabrasión',
    categoria: 'faciales',
    duracionMin: 75,
    precio: 850,
    descripcion: 'Extracción ultrasónica, succión de impurezas con infusión de sérums, alta frecuencia y mascarilla hidroplástica.',
    icono: 'Smile',
    activo: true,
  },
  {
    id: 'serv-f-2',
    nombre: 'Peeling Luminosidad Efecto Porcelana (Glow Peeling)',
    categoria: 'faciales',
    duracionMin: 60,
    precio: 950,
    descripcion: 'Renovación celular no invasiva para manchas, poros abiertos y textura irregular con vitamina C pura.',
    icono: 'Sun',
    activo: true,
  },

  // 4. Depilación
  {
    id: 'serv-d-1',
    nombre: 'Depilación Láser Diodo Trionda (Cuerpo Completo)',
    categoria: 'depilacion',
    duracionMin: 60,
    precio: 1600,
    descripcion: 'Tecnología indolora con cabezal frío de zafiro apta para todo tipo de piel y vello.',
    icono: 'Zap',
    activo: true,
  },
  {
    id: 'serv-d-2',
    nombre: 'Depilación Facial con Hilo Orgánico & Caléndula',
    categoria: 'depilacion',
    duracionMin: 30,
    precio: 250,
    descripcion: 'Técnica milenaria higiénica y precisa que no irrita la piel sensible.',
    icono: 'Feather',
    activo: true,
  },

  // 5. Pestañas y Cejas
  {
    id: 'serv-p-1',
    nombre: 'Lifting de Pestañas Queratina + Tinte Negro Intenso',
    categoria: 'pestanas',
    duracionMin: 60,
    precio: 520,
    descripcion: 'Eleva y arquea tus pestañas naturales desde la raíz con nutrición profunda de botox queratínico.',
    icono: 'Eye',
    activo: true,
  },
  {
    id: 'serv-p-2',
    nombre: 'Laminado de Cejas (Brow Lamination) & Diseño con Henna',
    categoria: 'pestanas',
    duracionMin: 45,
    precio: 480,
    descripcion: 'Cejas peinadas, definidas y con efecto microblading temporal para enmarcar la mirada.',
    icono: 'EyeOff',
    activo: true,
  },

  // 6. Masajes corporales
  {
    id: 'serv-m-1',
    nombre: 'Masaje Relajante con Aromaterapia & Piedras Calientes',
    categoria: 'masajes',
    duracionMin: 60,
    precio: 790,
    descripcion: 'Técnica envolvente con aceites esenciales de lavanda y jazmín para disolver la tensión y el estrés.',
    icono: 'HandMetal',
    activo: true,
  },
  {
    id: 'serv-m-2',
    nombre: 'Masaje Descontracturante Profundo Espalda & Cuello',
    categoria: 'masajes',
    duracionMin: 60,
    precio: 850,
    descripcion: 'Enfocado en nudos musculares causados por mala postura, fatiga o actividad física intensa.',
    icono: 'Activity',
    activo: true,
  },
];

// Colaboradoras sin fotos ficticias (se visualizan con iniciales elegantes y permiten subir su propia foto real)
export const COLABORADORES_INICIALES: Colaborador[] = [
  {
    id: 'colab-1',
    nombre: 'Valentina Ramos',
    foto: null, // Sin foto ficticia -> avatar monograma con opción a subir foto real
    pin: 'valentina123',
    passwordOriginal: 'valentina123',
    especialidades: ['unas', 'pestanas'],
    telefono: '+525512345678',
    color: '#E07A5F',
    activo: true,
    accesoRestringido: false,
    biografia: 'Especialista en Manicura Rusa, Soft Gel y diseño de miradas.',
    serviciosAsignados: [
      { servicioId: 'serv-u-1', precioPersonalizado: 480, activo: true },
      { servicioId: 'serv-u-2', precioPersonalizado: 750, activo: true },
      { servicioId: 'serv-u-3', precioPersonalizado: 520, activo: true },
      { servicioId: 'serv-p-1', precioPersonalizado: 520, activo: true },
      { servicioId: 'serv-p-2', precioPersonalizado: 480, activo: true },
    ],
    horarioBase: {
      dias: [1, 2, 3, 4, 5, 6],
      horaInicio: '09:00',
      horaFin: '18:30',
      descansoInicio: '14:00',
      descansoFin: '15:00',
    },
  },
  {
    id: 'colab-2',
    nombre: 'Sofía Morales',
    foto: null,
    pin: 'sofia123',
    passwordOriginal: 'sofia123',
    especialidades: ['cabello'],
    telefono: '+525523456789',
    color: '#818CF8',
    activo: true,
    accesoRestringido: false,
    biografia: 'Colorista y estilista en balayage francés y diseño de corte.',
    serviciosAsignados: [
      { servicioId: 'serv-c-1', precioPersonalizado: 550, activo: true },
      { servicioId: 'serv-c-2', precioPersonalizado: 1850, activo: true },
      { servicioId: 'serv-c-3', precioPersonalizado: 980, activo: true },
    ],
    horarioBase: {
      dias: [2, 3, 4, 5, 6, 0],
      horaInicio: '10:00',
      horaFin: '19:30',
      descansoInicio: '14:30',
      descansoFin: '15:30',
    },
  },
  {
    id: 'colab-3',
    nombre: 'Camila Silva',
    foto: null,
    pin: 'camila123',
    passwordOriginal: 'camila123',
    especialidades: ['faciales', 'depilacion'],
    telefono: '+525534567890',
    color: '#10B981',
    activo: true,
    accesoRestringido: false,
    biografia: 'Cosmiatra en rejuvenecimiento facial y depilación láser.',
    serviciosAsignados: [
      { servicioId: 'serv-f-1', precioPersonalizado: 850, activo: true },
      { servicioId: 'serv-f-2', precioPersonalizado: 950, activo: true },
      { servicioId: 'serv-d-1', precioPersonalizado: 1600, activo: true },
      { servicioId: 'serv-d-2', precioPersonalizado: 250, activo: true },
    ],
    horarioBase: {
      dias: [1, 2, 3, 4, 5, 6],
      horaInicio: '09:30',
      horaFin: '19:00',
      descansoInicio: '13:30',
      descansoFin: '14:30',
    },
  },
  {
    id: 'colab-4',
    nombre: 'Elena Castillo',
    foto: null,
    pin: 'elena123',
    passwordOriginal: 'elena123',
    especialidades: ['masajes', 'faciales'],
    telefono: '+525545678901',
    color: '#F59E0B',
    activo: true,
    accesoRestringido: false,
    biografia: 'Especialista en masoterapia descontracturante y spa.',
    serviciosAsignados: [
      { servicioId: 'serv-m-1', precioPersonalizado: 790, activo: true },
      { servicioId: 'serv-m-2', precioPersonalizado: 850, activo: true },
      { servicioId: 'serv-f-1', precioPersonalizado: 850, activo: true },
    ],
    horarioBase: {
      dias: [1, 3, 4, 5, 6, 0],
      horaInicio: '11:00',
      horaFin: '20:00',
      descansoInicio: '15:00',
      descansoFin: '16:00',
    },
  },
];

export const TERAPEUTAS_INICIALES = COLABORADORES_INICIALES;

// Generar fechas relativas para citas de demostración
const hoy = new Date();
const formatFecha = (d: Date) => d.toISOString().split('T')[0];

const fechaHoy = formatFecha(hoy);
const fechaManana = formatFecha(new Date(hoy.getTime() + 86400000));
const fechaPasado = formatFecha(new Date(hoy.getTime() + 86400000 * 2));

export const CITAS_INICIALES: Cita[] = [
  {
    id: 'cita-demo-1',
    codigo: 'PIER-4192',
    clienteNombre: 'Mariana Gómez Lozano',
    clienteTelefono: '+525598765432',
    clienteNotas: 'Es mi primera vez. Prefiero tono rosa nude y cutícula sensible.',
    fotoReferencia: null,
    terapeutaId: 'colab-1',
    colaboradorId: 'colab-1',
    servicioIds: ['serv-u-1'],
    fecha: fechaHoy,
    horaInicio: '10:00',
    horaFin: '11:00',
    precioTotal: 480,
    duracionTotalMin: 60,
    estado: 'Confirmada',
    creadoEn: new Date(hoy.getTime() - 3600000 * 24).toISOString(),
    origen: 'web_cliente',
  },
  {
    id: 'cita-demo-2',
    codigo: 'PIER-8821',
    clienteNombre: 'Daniela Alarcón',
    clienteTelefono: '+525576543210',
    clienteNotas: 'Solicito valoración para cambio de tono a cobrizo.',
    fotoReferencia: null,
    terapeutaId: 'colab-2',
    colaboradorId: 'colab-2',
    servicioIds: ['serv-c-2'],
    fecha: fechaHoy,
    horaInicio: '11:30',
    horaFin: '14:00',
    precioTotal: 1850,
    duracionTotalMin: 150,
    estado: 'Pendiente',
    creadoEn: new Date(hoy.getTime() - 600000).toISOString(),
    origen: 'web_cliente',
  },
  {
    id: 'cita-demo-3',
    codigo: 'PIER-3310',
    clienteNombre: 'Patricia Trejo',
    clienteTelefono: '+525565432109',
    clienteNotas: 'Piel con tendencia grasa en zona T.',
    fotoReferencia: null,
    terapeutaId: 'colab-3',
    colaboradorId: 'colab-3',
    servicioIds: ['serv-f-1'],
    fecha: fechaManana,
    horaInicio: '10:30',
    horaFin: '11:45',
    precioTotal: 850,
    duracionTotalMin: 75,
    estado: 'Confirmada',
    creadoEn: new Date(hoy.getTime() - 3600000 * 12).toISOString(),
    origen: 'web_cliente',
  },
  {
    id: 'cita-demo-4',
    codigo: 'PIER-9945',
    clienteNombre: 'Andrea Valenzuela',
    clienteTelefono: '+525554321098',
    clienteNotas: 'Tensión acumulada en trapecios y cervicales.',
    fotoReferencia: null,
    terapeutaId: 'colab-4',
    colaboradorId: 'colab-4',
    servicioIds: ['serv-m-2'],
    fecha: fechaPasado,
    horaInicio: '16:00',
    horaFin: '17:00',
    precioTotal: 850,
    duracionTotalMin: 60,
    estado: 'Pendiente',
    creadoEn: new Date(hoy.getTime() - 3600000 * 2).toISOString(),
    origen: 'web_cliente',
  },
];

export const BLOQUEOS_INICIALES: BloqueoDisponibilidad[] = [
  {
    id: 'bloq-1',
    terapeutaId: 'colab-1',
    colaboradorId: 'colab-1',
    fecha: fechaManana,
    tipo: 'franja_horaria',
    horaInicio: '15:00',
    horaFin: '17:00',
    motivo: 'Capacitación Técnica Rusa Nail Art 2026',
    creadoEn: new Date().toISOString(),
  },
];
