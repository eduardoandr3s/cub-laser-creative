import Facebook from '../components/iconos/Facebook.astro';
import Instagram from '../components/iconos/Instagram.astro';
import TikTok from '../components/iconos/TikTok.astro';
import YouTube from '../components/iconos/YouTube.astro';
import { negocio } from './negocio';

const iconosRedes = { instagram: Instagram, tiktok: TikTok, facebook: Facebook, youtube: YouTube };
const nombresRedes = { instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook', youtube: 'YouTube' };

/** Redes con URL en `negocio.redes`, en el orden en que se muestran (pie y llamada final). */
export const redes = (Object.keys(iconosRedes) as (keyof typeof iconosRedes)[])
  .filter((red) => negocio.redes[red])
  .map((red) => ({ url: negocio.redes[red]!, nombre: nombresRedes[red], Icono: iconosRedes[red] }));
