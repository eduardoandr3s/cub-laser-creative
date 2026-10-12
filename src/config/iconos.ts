import BadgeCheck from '@lucide/astro/icons/badge-check';
import BriefcaseBusiness from '@lucide/astro/icons/briefcase-business';
import Gift from '@lucide/astro/icons/gift';
import HeartHandshake from '@lucide/astro/icons/heart-handshake';
import Palette from '@lucide/astro/icons/palette';
import PartyPopper from '@lucide/astro/icons/party-popper';
import PencilRuler from '@lucide/astro/icons/pencil-ruler';
import Sparkles from '@lucide/astro/icons/sparkles';
import Trees from '@lucide/astro/icons/trees';
import Truck from '@lucide/astro/icons/truck';
import Zap from '@lucide/astro/icons/zap';

/**
 * Iconos que se pueden usar en los textos de inicio (`src/config/inicio.ts`).
 * La clave es el nombre del icono en https://lucide.dev/icons/.
 * Para usar otro, impórtalo arriba y añádelo aquí.
 */
export const iconos = {
  'badge-check': BadgeCheck,
  'briefcase-business': BriefcaseBusiness,
  gift: Gift,
  'heart-handshake': HeartHandshake,
  palette: Palette,
  'party-popper': PartyPopper,
  'pencil-ruler': PencilRuler,
  sparkles: Sparkles,
  trees: Trees,
  truck: Truck,
  zap: Zap,
};

export type NombreIcono = keyof typeof iconos;
