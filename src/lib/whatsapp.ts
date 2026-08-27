import { Cita, Servicio, Terapeuta, ConfiguracionSalon } from '@/types/salon';

/**
 * Limpia y normaliza números de teléfono para la API de WhatsApp
 */
export function formatWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  // Elimina espacios, guiones, paréntesis y signos +
  let clean = phone.replace(/[^0-9]/g, '');
  // Si es número mexicano de 10 dígitos sin código de país, agregar 52
  if (clean.length === 10) {
    clean = '52' + clean;
  }
  return clean;
}

/**
 * Genera el enlace directo para que el cliente contacte al salón tras solicitar cita
 */
export function getWhatsAppClientToSalonLink(
  cita: Cita,
  servicios: Servicio[],
  salonConfig: ConfiguracionSalon
): string {
  const salonPhone = formatWhatsAppNumber(salonConfig.telefonoSalon);
  const nombresServicios = cita.servicioIds
    .map(id => servicios.find(s => s.id === id)?.nombre || 'Servicio')
    .join(' + ');

  const mensaje = `✨ *Solicitud de Cita - ${salonConfig.nombreSalon}*
Hola, acabo de solicitar una cita desde la app web:

📋 *Código:* ${cita.codigo}
👤 *Nombre:* ${cita.clienteNombre}
💆‍♀️ *Servicio(s):* ${nombresServicios}
📅 *Fecha:* ${cita.fecha}
⏰ *Hora:* ${cita.horaInicio} hrs
${cita.clienteNotas ? `📝 *Nota:* ${cita.clienteNotas}\n` : ''}
¡Quedo a la espera de su confirmación! 💖`;

  return `https://wa.me/${salonPhone}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Genera el enlace para que la terapeuta/admin envíe confirmación directa al cliente
 */
export function getWhatsAppConfirmationLink(
  cita: Cita,
  servicios: Servicio[],
  terapeuta: Terapeuta | undefined,
  salonConfig: ConfiguracionSalon
): string {
  const clientPhone = formatWhatsAppNumber(cita.clienteTelefono);
  const nombresServicios = cita.servicioIds
    .map(id => servicios.find(s => s.id === id)?.nombre || 'Servicio')
    .join(' + ');

  const mensaje = `🌸 *¡CITA CONFIRMADA! - ${salonConfig.nombreSalon}* 🌸

Hola *${cita.clienteNombre}*, te confirmamos con mucho gusto tu cita:

✨ *Código:* ${cita.codigo}
💆‍♀️ *Tratamiento:* ${nombresServicios}
👩‍⚕️ *Especialista:* ${terapeuta?.nombre || 'Especialista asignada'}
📅 *Fecha:* ${cita.fecha}
⏰ *Hora:* ${cita.horaInicio} - ${cita.horaFin} hrs
📍 *Ubicación:* ${salonConfig.direccion}
💵 *Total estimado:* ${salonConfig.moneda}${cita.precioTotal}

Te recomendamos llegar 5 minutos antes. Si necesitas reprogramar, por favor avísanos con anticipación. ¡Será un placer consentirte! 💖`;

  return `https://wa.me/${clientPhone}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Genera el enlace para que la terapeuta/admin notifique al cliente sobre rechazo o reprogramación
 */
export function getWhatsAppRejectionLink(
  cita: Cita,
  servicios: Servicio[],
  terapeuta: Terapeuta | undefined,
  salonConfig: ConfiguracionSalon
): string {
  const clientPhone = formatWhatsAppNumber(cita.clienteTelefono);
  const nombresServicios = cita.servicioIds
    .map(id => servicios.find(s => s.id === id)?.nombre || 'Servicio')
    .join(' + ');

  const mensaje = `Hola *${cita.clienteNombre}*, te saludamos de *${salonConfig.nombreSalon}*. 

Con respecto a tu solicitud de cita para *${nombresServicios}* el día *${cita.fecha}* a las *${cita.horaInicio}*, lamentablemente en esa franja no contamos con espacio disponible con *${terapeuta?.nombre || 'el equipo'}*.

¿Te gustaría que te ofrezcamos las siguientes opciones de horarios libres para atenderte con gusto? Quedamos a tu disposición. 🌸`;

  return `https://wa.me/${clientPhone}?text=${encodeURIComponent(mensaje)}`;
}
