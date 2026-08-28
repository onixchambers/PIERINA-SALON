export interface PaisInfo {
  codigo: string;
  nombre: string;
  dial: string;
  bandera: string;
  placeholder: string;
}

export const LISTA_PAISES: PaisInfo[] = [
  { codigo: 'MX', nombre: 'México', dial: '+52', bandera: '🇲🇽', placeholder: '55 1234 5678' },
  { codigo: 'PA', nombre: 'Panamá', dial: '+507', bandera: '🇵🇦', placeholder: '6123 4567' },
  { codigo: 'CO', nombre: 'Colombia', dial: '+57', bandera: '🇨🇴', placeholder: '300 123 4567' },
  { codigo: 'VE', nombre: 'Venezuela', dial: '+58', bandera: '🇻🇪', placeholder: '412 123 4567' },
  { codigo: 'PE', nombre: 'Perú', dial: '+51', bandera: '🇵🇪', placeholder: '912 345 678' },
  { codigo: 'CL', nombre: 'Chile', dial: '+56', bandera: '🇨🇱', placeholder: '9 1234 5678' },
  { codigo: 'AR', nombre: 'Argentina', dial: '+54', bandera: '🇦🇷', placeholder: '9 11 1234 5678' },
  { codigo: 'DO', nombre: 'Rep. Dominicana', dial: '+1809', bandera: '🇩🇴', placeholder: '809 123 4567' },
  { codigo: 'US', nombre: 'Estados Unidos', dial: '+1', bandera: '🇺🇸', placeholder: '202 555 0123' },
  { codigo: 'CA', nombre: 'Canadá', dial: '+1', bandera: '🇨🇦', placeholder: '416 555 0123' },
  { codigo: 'ES', nombre: 'España', dial: '+34', bandera: '🇪🇸', placeholder: '612 34 56 78' },
  { codigo: 'CR', nombre: 'Costa Rica', dial: '+506', bandera: '🇨🇷', placeholder: '8123 4567' },
  { codigo: 'GT', nombre: 'Guatemala', dial: '+502', bandera: '🇬🇹', placeholder: '5123 4567' },
  { codigo: 'SV', nombre: 'El Salvador', dial: '+503', bandera: '🇸🇻', placeholder: '7123 4567' },
  { codigo: 'HN', nombre: 'Honduras', dial: '+504', bandera: '🇭🇳', placeholder: '9123 4567' },
  { codigo: 'NI', nombre: 'Nicaragua', dial: '+505', bandera: '🇳🇮', placeholder: '8123 4567' },
  { codigo: 'EC', nombre: 'Ecuador', dial: '+593', bandera: '🇪🇨', placeholder: '99 123 4567' },
  { codigo: 'BO', nombre: 'Bolivia', dial: '+591', bandera: '🇧🇴', placeholder: '7123 4567' },
  { codigo: 'PY', nombre: 'Paraguay', dial: '+595', bandera: '🇵🇾', placeholder: '981 123456' },
  { codigo: 'UY', nombre: 'Uruguay', dial: '+598', bandera: '🇺🇾', placeholder: '99 123 456' },
  { codigo: 'PR', nombre: 'Puerto Rico', dial: '+1787', bandera: '🇵🇷', placeholder: '787 123 4567' },
  { codigo: 'CU', nombre: 'Cuba', dial: '+53', bandera: '🇨🇺', placeholder: '5 123 4567' },
  { codigo: 'BR', nombre: 'Brasil', dial: '+55', bandera: '🇧🇷', placeholder: '11 91234 5678' },
  { codigo: 'IT', nombre: 'Italia', dial: '+39', bandera: '🇮🇹', placeholder: '312 345 6789' },
  { codigo: 'FR', nombre: 'Francia', dial: '+33', bandera: '🇫🇷', placeholder: '6 12 34 56 78' },
  { codigo: 'DE', nombre: 'Alemania', dial: '+49', bandera: '🇩🇪', placeholder: '151 12345678' },
  { codigo: 'GB', nombre: 'Reino Unido', dial: '+44', bandera: '🇬🇧', placeholder: '7123 456789' },
  { codigo: 'PT', nombre: 'Portugal', dial: '+351', bandera: '🇵🇹', placeholder: '912 345 678' },
  { codigo: 'CH', nombre: 'Suiza', dial: '+41', bandera: '🇨🇭', placeholder: '78 123 45 67' },
];

const TIMEZONE_TO_COUNTRY: { [tz: string]: string } = {
  'America/Mexico_City': 'MX',
  'America/Cancun': 'MX',
  'America/Merida': 'MX',
  'America/Monterrey': 'MX',
  'America/Matamoros': 'MX',
  'America/Mazatlan': 'MX',
  'America/Chihuahua': 'MX',
  'America/Ojinaga': 'MX',
  'America/Hermosillo': 'MX',
  'America/Tijuana': 'MX',
  'America/Bahia_Banderas': 'MX',
  'America/Panama': 'PA',
  'America/Bogota': 'CO',
  'America/Caracas': 'VE',
  'America/Lima': 'PE',
  'America/Santiago': 'CL',
  'America/Punta_Arenas': 'CL',
  'Pacific/Easter': 'CL',
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Argentina/Cordoba': 'AR',
  'America/Argentina/Mendoza': 'AR',
  'America/Santo_Domingo': 'DO',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Montreal': 'CA',
  'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA',
  'America/Halifax': 'CA',
  'America/Costa_Rica': 'CR',
  'America/Guatemala': 'GT',
  'America/El_Salvador': 'SV',
  'America/Tegucigalpa': 'HN',
  'America/Managua': 'NI',
  'America/Guayaquil': 'EC',
  'America/La_Paz': 'BO',
  'America/Asuncion': 'PY',
  'America/Montevideo': 'UY',
  'America/Puerto_Rico': 'PR',
  'America/Havana': 'CU',
  'America/Sao_Paulo': 'BR',
  'America/Rio_Branco': 'BR',
  'America/Manaus': 'BR',
  'America/Fortaleza': 'BR',
  'Europe/Madrid': 'ES',
  'Atlantic/Canary': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/London': 'GB',
  'Europe/Lisbon': 'PT',
  'Atlantic/Madeira': 'PT',
  'Atlantic/Azores': 'PT',
  'Europe/Zurich': 'CH',
};

export const PAIS_POR_DEFECTO: PaisInfo = LISTA_PAISES[0]; // México (+52)

export function obtenerPaisPorCodigo(codigo: string): PaisInfo {
  return (
    LISTA_PAISES.find((p) => p.codigo.toUpperCase() === codigo.toUpperCase()) ||
    PAIS_POR_DEFECTO
  );
}

export function obtenerPaisPorDial(dial: string): PaisInfo {
  const dialLimpio = dial.startsWith('+') ? dial : `+${dial}`;
  return (
    LISTA_PAISES.find((p) => p.dial === dialLimpio) ||
    LISTA_PAISES.find((p) => dialLimpio.startsWith(p.dial)) ||
    PAIS_POR_DEFECTO
  );
}

export function detectarPaisUsuario(): PaisInfo {
  if (typeof window === 'undefined') return PAIS_POR_DEFECTO;

  try {
    // 1. Detección instantánea y precisa por Zona Horaria del sistema
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone && TIMEZONE_TO_COUNTRY[timeZone]) {
      const code = TIMEZONE_TO_COUNTRY[timeZone];
      const match = LISTA_PAISES.find((p) => p.codigo === code);
      if (match) return match;
    }

    // 2. Detección por idioma/locale del navegador (ej. es-MX, es-PA, es-CO, es-VE)
    const languages = navigator.languages || [navigator.language];
    for (const lang of languages) {
      if (lang && lang.includes('-')) {
        const parts = lang.split('-');
        const countryCode = parts[parts.length - 1].toUpperCase();
        const match = LISTA_PAISES.find((p) => p.codigo === countryCode);
        if (match) return match;
      }
    }
  } catch (err) {
    console.warn('Error detectando país automáticamente:', err);
  }

  return PAIS_POR_DEFECTO;
}

export function separarTelefonoYPais(numeroCompleto: string): { pais: PaisInfo; numeroLocal: string } {
  if (!numeroCompleto) return { pais: PAIS_POR_DEFECTO, numeroLocal: '' };

  const limpio = numeroCompleto.trim();
  if (limpio.startsWith('+')) {
    // Buscar el país con el código dial más largo que coincida
    const paisesOrdenadosPorLongitud = [...LISTA_PAISES].sort((a, b) => b.dial.length - a.dial.length);
    for (const p of paisesOrdenadosPorLongitud) {
      if (limpio.startsWith(p.dial)) {
        const local = limpio.slice(p.dial.length).trim();
        return { pais: p, numeroLocal: local };
      }
    }
  }

  return { pais: PAIS_POR_DEFECTO, numeroLocal: limpio };
}
