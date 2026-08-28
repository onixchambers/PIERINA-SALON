export interface PaisInfo {
  codigo: string;
  nombre: string;
  dial: string;
  bandera: string;
  placeholder: string;
}

export const LISTA_PAISES: PaisInfo[] = [
  // Latinoamérica y el Caribe
  { codigo: 'PA', nombre: 'Panamá', dial: '+507', bandera: '🇵🇦', placeholder: '6123 4567' },
  { codigo: 'MX', nombre: 'México', dial: '+52', bandera: '🇲🇽', placeholder: '55 1234 5678' },
  { codigo: 'CO', nombre: 'Colombia', dial: '+57', bandera: '🇨🇴', placeholder: '300 123 4567' },
  { codigo: 'VE', nombre: 'Venezuela', dial: '+58', bandera: '🇻🇪', placeholder: '412 123 4567' },
  { codigo: 'PE', nombre: 'Perú', dial: '+51', bandera: '🇵🇪', placeholder: '912 345 678' },
  { codigo: 'CL', nombre: 'Chile', dial: '+56', bandera: '🇨🇱', placeholder: '9 1234 5678' },
  { codigo: 'AR', nombre: 'Argentina', dial: '+54', bandera: '🇦🇷', placeholder: '9 11 1234 5678' },
  { codigo: 'DO', nombre: 'Rep. Dominicana', dial: '+1809', bandera: '🇩🇴', placeholder: '809 123 4567' },
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
  { codigo: 'HT', nombre: 'Haití', dial: '+509', bandera: '🇭🇹', placeholder: '34 12 3456' },
  { codigo: 'JM', nombre: 'Jamaica', dial: '+1876', bandera: '🇯🇲', placeholder: '876 123 4567' },
  { codigo: 'TT', nombre: 'Trinidad y Tobago', dial: '+1868', bandera: '🇹🇹', placeholder: '868 123 4567' },
  { codigo: 'BZ', nombre: 'Belice', dial: '+501', bandera: '🇧🇿', placeholder: '612 3456' },
  { codigo: 'GY', nombre: 'Guyana', dial: '+592', bandera: '🇬🇾', placeholder: '612 3456' },
  { codigo: 'SR', nombre: 'Surinam', dial: '+597', bandera: '🇸🇷', placeholder: '812 3456' },

  // Norteamérica
  { codigo: 'US', nombre: 'Estados Unidos', dial: '+1', bandera: '🇺🇸', placeholder: '202 555 0123' },
  { codigo: 'CA', nombre: 'Canadá', dial: '+1', bandera: '🇨🇦', placeholder: '416 555 0123' },

  // Europa
  { codigo: 'ES', nombre: 'España', dial: '+34', bandera: '🇪🇸', placeholder: '612 34 56 78' },
  { codigo: 'IT', nombre: 'Italia', dial: '+39', bandera: '🇮🇹', placeholder: '312 345 6789' },
  { codigo: 'FR', nombre: 'Francia', dial: '+33', bandera: '🇫🇷', placeholder: '6 12 34 56 78' },
  { codigo: 'DE', nombre: 'Alemania', dial: '+49', bandera: '🇩🇪', placeholder: '151 12345678' },
  { codigo: 'GB', nombre: 'Reino Unido', dial: '+44', bandera: '🇬🇧', placeholder: '7123 456789' },
  { codigo: 'PT', nombre: 'Portugal', dial: '+351', bandera: '🇵🇹', placeholder: '912 345 678' },
  { codigo: 'CH', nombre: 'Suiza', dial: '+41', bandera: '🇨🇭', placeholder: '78 123 45 67' },
  { codigo: 'NL', nombre: 'Países Bajos', dial: '+31', bandera: '🇳🇱', placeholder: '6 12345678' },
  { codigo: 'BE', nombre: 'Bélgica', dial: '+32', bandera: '🇧🇪', placeholder: '470 12 34 56' },
  { codigo: 'SE', nombre: 'Suecia', dial: '+46', bandera: '🇸🇪', placeholder: '70 123 45 67' },
  { codigo: 'NO', nombre: 'Noruega', dial: '+47', bandera: '🇳🇴', placeholder: '412 34 567' },
  { codigo: 'DK', nombre: 'Dinamarca', dial: '+45', bandera: '🇩🇰', placeholder: '21 23 45 67' },
  { codigo: 'IE', nombre: 'Irlanda', dial: '+353', bandera: '🇮🇪', placeholder: '85 123 4567' },
  { codigo: 'AT', nombre: 'Austria', dial: '+43', bandera: '🇦🇹', placeholder: '650 1234567' },
  { codigo: 'PL', nombre: 'Polonia', dial: '+48', bandera: '🇵🇱', placeholder: '512 345 678' },
  { codigo: 'GR', nombre: 'Grecia', dial: '+30', bandera: '🇬🇷', placeholder: '691 234 5678' },
  { codigo: 'FI', nombre: 'Finlandia', dial: '+358', bandera: '🇫🇮', placeholder: '41 2345678' },
  { codigo: 'CZ', nombre: 'República Checa', dial: '+420', bandera: '🇨🇿', placeholder: '601 123 456' },
  { codigo: 'RO', nombre: 'Rumania', dial: '+40', bandera: '🇷🇴', placeholder: '712 345 678' },

  // Asia, Oceanía y Medio Oriente
  { codigo: 'JP', nombre: 'Japón', dial: '+81', bandera: '🇯🇵', placeholder: '90 1234 5678' },
  { codigo: 'KR', nombre: 'Corea del Sur', dial: '+82', bandera: '🇰🇷', placeholder: '10 1234 5678' },
  { codigo: 'CN', nombre: 'China', dial: '+86', bandera: '🇨🇳', placeholder: '131 2345 6789' },
  { codigo: 'AU', nombre: 'Australia', dial: '+61', bandera: '🇦🇺', placeholder: '412 345 678' },
  { codigo: 'NZ', nombre: 'Nueva Zelanda', dial: '+64', bandera: '🇳🇿', placeholder: '21 123 4567' },
  { codigo: 'IL', nombre: 'Israel', dial: '+972', bandera: '🇮🇱', placeholder: '50 123 4567' },
  { codigo: 'AE', nombre: 'Emiratos Árabes', dial: '+971', bandera: '🇦🇪', placeholder: '50 123 4567' },
  { codigo: 'SA', nombre: 'Arabia Saudita', dial: '+966', bandera: '🇸🇦', placeholder: '50 123 4567' },
  { codigo: 'IN', nombre: 'India', dial: '+91', bandera: '🇮🇳', placeholder: '98123 45678' },
  { codigo: 'PH', nombre: 'Filipinas', dial: '+63', bandera: '🇵🇭', placeholder: '917 123 4567' },
  { codigo: 'SG', nombre: 'Singapur', dial: '+65', bandera: '🇸🇬', placeholder: '8123 4567' },
  { codigo: 'TR', nombre: 'Turquía', dial: '+90', bandera: '🇹🇷', placeholder: '532 123 4567' },
  { codigo: 'ZA', nombre: 'Sudáfrica', dial: '+27', bandera: '🇿🇦', placeholder: '71 123 4567' },
  { codigo: 'MA', nombre: 'Marruecos', dial: '+212', bandera: '🇲🇦', placeholder: '612 345678' },
  { codigo: 'EG', nombre: 'Egipto', dial: '+20', bandera: '🇪🇬', placeholder: '10 1234 5678' },
];

const TIMEZONE_TO_COUNTRY: { [tz: string]: string } = {
  'America/Panama': 'PA',
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
  'America/Port-au-Prince': 'HT',
  'America/Jamaica': 'JM',
  'America/Port_of_Spain': 'TT',
  'America/Belize': 'BZ',
  'America/Guyana': 'GY',
  'America/Paramaribo': 'SR',
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
  'Europe/Amsterdam': 'NL',
  'Europe/Brussels': 'BE',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Dublin': 'IE',
  'Europe/Vienna': 'AT',
  'Europe/Warsaw': 'PL',
  'Europe/Athens': 'GR',
  'Europe/Helsinki': 'FI',
  'Europe/Prague': 'CZ',
  'Europe/Bucharest': 'RO',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Shanghai': 'CN',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Pacific/Auckland': 'NZ',
  'Asia/Jerusalem': 'IL',
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Asia/Kolkata': 'IN',
  'Asia/Manila': 'PH',
  'Asia/Singapore': 'SG',
  'Europe/Istanbul': 'TR',
  'Africa/Johannesburg': 'ZA',
  'Africa/Casablanca': 'MA',
  'Africa/Cairo': 'EG',
};

export const PAIS_POR_DEFECTO: PaisInfo = LISTA_PAISES[0]; // Panamá (+507)

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

    // 2. Detección por idioma/locale del navegador (ej. es-PA, es-MX, es-CO, es-VE, en-US)
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

