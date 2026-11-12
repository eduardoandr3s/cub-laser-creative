import { MAX_DESCRIPCION } from '../lib/limites';
import { escribirTrabajo, fotosReferenciadas, type DatosTrabajo } from '../lib/panel/markdown';
import { ARCHIVO_TRABAJO, siguienteNombreFoto } from '../lib/panel/rutas';
import { slugificar, validarTrabajo, type ErrorCampo } from '../lib/panel/validacion';
import * as api from './api';
import type { Categoria, TrabajoGuardado } from './datos';
import { estilos, h, nuevoId } from './dom';
import { reducirFoto } from './fotos';
import { crearEstadoPublicacion } from './publicacion';

/** Foto en el formulario: ya guardada (tiene `sha` desde el principio) o recién elegida. */
interface FotoFormulario {
  nombre: string;
  alt: string;
  sha?: string;
  /** Vista previa: el archivo del repositorio o la foto reducida en memoria. */
  url: string;
  nueva: boolean;
  estado: 'lista' | 'subiendo' | 'error';
  progreso: number;
  error?: string;
}

export interface ContextoFormulario {
  trabajos: TrabajoGuardado[];
  categorias: Categoria[];
  /** Tras guardar: actualiza la lista del panel. */
  alGuardar(trabajo: TrabajoGuardado): void;
  /** Tras eliminar: vuelve a la lista con un aviso de publicación. */
  alEliminar(slug: string, titulo: string, commit: string): void;
  /** Vuelve a leer el repositorio y abre este trabajo (tras un conflicto). */
  recargar(slug: string): void;
  /** Cambia la dirección sin volver a pintar (tras crear el trabajo). */
  fijarRuta(hash: string): void;
}

export interface VistaFormulario {
  elemento: HTMLElement;
  sinGuardar(): boolean;
  cerrar(): void;
}

const hoy = () => new Date().toISOString().slice(0, 10);

function datosVacios(): DatosTrabajo {
  return {
    titulo: '',
    descripcion: '',
    categoria: '',
    fecha: hoy(),
    borrador: true,
    material: '',
    destacado: false,
    portada: { src: '', alt: '' },
    imagenes: [],
    videos: [],
    instagram: [],
  };
}

/** Mantiene el foco (y la posición del cursor) en el mismo control después de volver a pintar. */
function conservarFoco(pintar: () => void) {
  const activo = document.activeElement as HTMLInputElement | null;
  const clave = activo?.dataset?.foco;
  const seleccion = activo && 'selectionStart' in activo ? [activo.selectionStart, activo.selectionEnd] : null;
  pintar();
  if (!clave) return;
  const nuevo = document.querySelector<HTMLInputElement>(`[data-foco="${CSS.escape(clave)}"]`);
  nuevo?.focus();
  if (nuevo && seleccion && seleccion[0] !== null) {
    try {
      nuevo.setSelectionRange(seleccion[0], seleccion[1]);
    } catch {
      // Algunos tipos de campo no admiten selección.
    }
  }
}

function mover<T>(lista: T[], desde: number, hasta: number) {
  const [elemento] = lista.splice(desde, 1);
  lista.splice(hasta, 0, elemento!);
}

export function vistaFormulario(ctx: ContextoFormulario, guardado: TrabajoGuardado | null): VistaFormulario {
  let nuevo = !guardado;
  let slug = guardado?.slug ?? '';
  let slugAMano = false;
  let indexSha = guardado?.indexSha ?? null;
  const archivos: Record<string, string> = { ...guardado?.archivos };
  const datos: DatosTrabajo = guardado?.trabajo ? structuredClone(guardado.trabajo.datos) : datosVacios();
  let cuerpo = guardado?.trabajo?.cuerpo ?? '';
  let referenciadasAlAbrir = new Set(fotosReferenciadas(datos));
  const nombresUsados = new Set(Object.keys(archivos));
  let sucio = false;
  let guardando = false;

  const fotoGuardada = (src: string, alt: string): FotoFormulario => {
    const sha = archivos[src];
    return sha
      ? { nombre: src, alt, sha, url: api.urlArchivo(sha, src), nueva: false, estado: 'lista', progreso: 1 }
      : { nombre: src, alt, url: '', nueva: false, estado: 'error', progreso: 0, error: `No se encuentra «${src}» en la carpeta del trabajo.` };
  };
  let portada: FotoFormulario | null = datos.portada.src ? fotoGuardada(datos.portada.src, datos.portada.alt) : null;
  const imagenes: FotoFormulario[] = datos.imagenes.map((foto) => fotoGuardada(foto.src, foto.alt));
  const barras = new WeakMap<FotoFormulario, HTMLProgressElement>();

  const marcarSucio = () => {
    sucio = true;
  };
  const alSalir = (evento: BeforeUnloadEvent) => {
    if (sucio) evento.preventDefault();
  };
  window.addEventListener('beforeunload', alSalir);

  const publicacion = crearEstadoPublicacion();
  const resumenErrores = h('div', { tabindex: '-1', class: 'empty:hidden' });

  // --- Campos sencillos ---------------------------------------------------------------

  /** Campo con etiqueta, ayuda y hueco para el error; `ruta` es la del schema (`titulo`…). */
  function campo(ruta: string, etiqueta: string, control: HTMLElement, ayuda?: string | Node) {
    const id = control.id || nuevoId(ruta.replace(/\W/g, '-'));
    control.id = id;
    control.dataset.campo = ruta;
    control.dataset.foco = ruta;
    const idAyuda = `${id}-ayuda`;
    const idError = `${id}-error`;
    control.setAttribute('aria-describedby', ayuda ? `${idError} ${idAyuda}` : idError);
    return h(
      'div',
      { class: 'mt-5 first:mt-0' },
      h('label', { for: id, class: estilos.etiqueta }, etiqueta),
      control,
      h('p', { id: idError, class: estilos.error, 'data-error': ruta, hidden: true }),
      ayuda && h('p', { id: idAyuda, class: estilos.ayuda }, ayuda),
    );
  }

  const casilla = (etiqueta: string, ayuda: string, valor: boolean, cambiar: (v: boolean) => void) => {
    const id = nuevoId('casilla');
    return h(
      'div',
      { class: 'mt-5 flex gap-3' },
      h('input', {
        type: 'checkbox',
        id,
        checked: valor,
        class: 'mt-1 size-6 shrink-0 accent-tinta',
        'aria-describedby': `${id}-ayuda`,
        onChange: (e: Event) => {
          cambiar((e.target as HTMLInputElement).checked);
          marcarSucio();
        },
      }),
      h(
        'div',
        {},
        h('label', { for: id, class: estilos.etiqueta }, etiqueta),
        h('p', { id: `${id}-ayuda`, class: estilos.ayuda }, ayuda),
      ),
    );
  };

  const texto = (valor: string, cambiar: (v: string) => void, extra: Record<string, unknown> = {}) =>
    h('input', {
      type: 'text',
      value: valor,
      class: estilos.campo,
      onInput: (e: Event) => {
        cambiar((e.target as HTMLInputElement).value);
        marcarSucio();
      },
      ...extra,
    });

  // Identificador (solo al crear): se propone a partir del título hasta que se edita a mano.
  const entradaSlug = texto(slug, (v) => {
    slug = v.trim();
    slugAMano = true;
    pintarDireccion();
  }, { autocapitalize: 'off', spellcheck: 'false', inputmode: 'url' });
  const direccion = h('span', { class: 'font-semibold break-all text-tinta' });
  const pintarDireccion = () => {
    direccion.textContent = `cublasercreative.es/trabajos/${slug || '…'}/`;
  };
  pintarDireccion();
  const bloqueSlug = h('div', {});
  const pintarBloqueSlug = () => {
    bloqueSlug.replaceChildren(
      nuevo
        ? campo('slug', 'Identificador (dirección del trabajo)', entradaSlug,
            h('span', {}, 'Dirección: ', direccion, '. Se propone a partir del título; después de guardar ya no se puede cambiar.'))
        : h('p', { class: 'mt-5 text-sm text-tinta-suave' }, 'Dirección: ', direccion),
    );
  };
  pintarBloqueSlug();

  const entradaTitulo = texto(datos.titulo, (v) => {
    datos.titulo = v;
    if (nuevo && !slugAMano) {
      slug = slugificar(v);
      entradaSlug.value = slug;
      pintarDireccion();
    }
  }, { autocomplete: 'off' });

  const contador = h('span', { 'aria-live': 'polite' });
  const pintarContador = () => {
    const restantes = MAX_DESCRIPCION - datos.descripcion.trim().length;
    contador.textContent =
      restantes >= 0
        ? `Quedan ${restantes} ${restantes === 1 ? 'carácter' : 'caracteres'}.`
        : `Sobran ${-restantes} ${restantes === -1 ? 'carácter' : 'caracteres'}.`;
    contador.className = restantes >= 0 ? '' : 'font-semibold text-magenta-texto';
  };
  pintarContador();
  const entradaDescripcion = h('textarea', {
    rows: 3,
    class: estilos.campo,
    textContent: datos.descripcion,
    onInput: (e: Event) => {
      datos.descripcion = (e.target as HTMLTextAreaElement).value;
      pintarContador();
      marcarSucio();
    },
  });

  const entradaCategoria = h(
    'select',
    {
      class: estilos.campo,
      onChange: (e: Event) => {
        datos.categoria = (e.target as HTMLSelectElement).value;
        marcarSucio();
      },
    },
    h('option', { value: '', selected: !datos.categoria }, 'Elige una categoría'),
    ...ctx.categorias.map((c) => h('option', { value: c.id, selected: c.id === datos.categoria }, c.nombre)),
  );

  const entradaFecha = h('input', {
    type: 'date',
    value: datos.fecha,
    class: estilos.campo,
    onInput: (e: Event) => {
      datos.fecha = (e.target as HTMLInputElement).value;
      marcarSucio();
    },
  });

  const entradaCuerpo = h('textarea', {
    rows: 8,
    class: estilos.campo,
    textContent: cuerpo,
    onInput: (e: Event) => {
      cuerpo = (e.target as HTMLTextAreaElement).value;
      marcarSucio();
    },
  });

  // --- Fotos --------------------------------------------------------------------------

  const contenedorFotos = h('div', {});

  function tarjetaFoto(foto: FotoFormulario, posicion: number | null) {
    const esPortada = posicion === null;
    const nombreFoto = esPortada ? 'la portada' : `la foto ${posicion + 1}`;
    const clave = `foto-${foto.nombre}`;
    const barra = h('progress', { max: 1, value: foto.progreso, class: 'w-full', 'aria-label': `Subiendo ${nombreFoto}` });
    barras.set(foto, barra);

    const entradaAlt = h('input', {
      type: 'text',
      value: foto.alt,
      class: estilos.campo,
      onInput: (e: Event) => {
        foto.alt = (e.target as HTMLInputElement).value;
        marcarSucio();
      },
    });
    entradaAlt.dataset.foco = `${clave}-alt`;

    const boton = (texto: string, etiqueta: string, accion: () => void, foco: string, deshabilitado = false) => {
      const b = h('button', { type: 'button', class: estilos.botonPequeno, 'aria-label': etiqueta, disabled: deshabilitado, onClick: accion }, texto);
      b.dataset.foco = `${clave}-${foco}`;
      return b;
    };

    return h(
      esPortada ? 'div' : 'li',
      { class: 'flex flex-col gap-3 rounded-2xl bg-papel p-3 ring-1 ring-tinta/10' },
      foto.url
        ? h('img', { src: foto.url, alt: '', class: 'aspect-4/3 w-full rounded-xl bg-madera object-contain' })
        : h('div', { class: 'aspect-4/3 w-full rounded-xl bg-madera' }),
      foto.estado === 'subiendo' && barra,
      foto.estado === 'error' && h('p', { class: estilos.error, role: 'alert' }, foto.error ?? 'Error con esta foto.'),
      esPortada
        ? campo('portada.alt', 'Descripción de la portada (obligatoria)', entradaAlt,
            'Qué se ve en la foto, en una frase. La leen los lectores de pantalla y Google.')
        : campo(`imagenes.${posicion}.alt`, `Descripción de la foto ${posicion + 1} (opcional)`, entradaAlt),
      !esPortada &&
        h(
          'div',
          { class: 'flex flex-wrap gap-2' },
          boton('Usar como portada', `Usar la foto ${posicion + 1} como portada`, () => {
            const anterior = portada;
            portada = foto;
            imagenes.splice(posicion, 1);
            if (anterior) imagenes.unshift(anterior);
            marcarSucio();
            conservarFoco(pintarFotos);
            contenedorFotos.querySelector<HTMLElement>('[data-foco="portada.alt"]')?.focus();
          }, 'portada', foto.estado !== 'lista'),
          boton('↑', `Subir la foto ${posicion + 1}`, () => {
            mover(imagenes, posicion, posicion - 1);
            marcarSucio();
            conservarFoco(pintarFotos);
          }, 'subir', posicion === 0),
          boton('↓', `Bajar la foto ${posicion + 1}`, () => {
            mover(imagenes, posicion, posicion + 1);
            marcarSucio();
            conservarFoco(pintarFotos);
          }, 'bajar', posicion === imagenes.length - 1),
          boton('Quitar', `Quitar la foto ${posicion + 1}`, () => {
            imagenes.splice(posicion, 1);
            marcarSucio();
            pintarFotos();
            botonAnadirFotos.focus();
          }, 'quitar'),
        ),
    );
  }

  async function subir(foto: FotoFormulario, archivo: File) {
    try {
      const reducida = await reducirFoto(archivo);
      foto.url = URL.createObjectURL(reducida.blob);
      conservarFoco(pintarFotos);
      foto.sha = await api.subirFoto(reducida.base64, (fraccion) => {
        foto.progreso = fraccion;
        const barra = barras.get(foto);
        if (barra) barra.value = fraccion;
      });
      foto.estado = 'lista';
    } catch (error) {
      foto.estado = 'error';
      foto.error = (error as Error).message;
    }
    conservarFoco(pintarFotos);
  }

  async function anadirFotos(lista: FileList | null, comoPortada: boolean) {
    const elegidas = [...(lista ?? [])];
    if (elegidas.length === 0) return;
    const pendientes = elegidas.map((archivo) => {
      const nombre = siguienteNombreFoto(nombresUsados);
      nombresUsados.add(nombre);
      const foto: FotoFormulario = { nombre, alt: '', url: '', nueva: true, estado: 'subiendo', progreso: 0 };
      return { foto, archivo };
    });
    if (comoPortada) {
      portada = pendientes[0]!.foto;
      pendientes.length = 1;
    } else {
      imagenes.push(...pendientes.map((p) => p.foto));
    }
    marcarSucio();
    conservarFoco(pintarFotos);
    // Una a una, para no cargar varias fotos grandes en memoria a la vez.
    for (const { foto, archivo } of pendientes) await subir(foto, archivo);
  }

  const selectorFotos = (multiple: boolean, alElegir: (lista: FileList | null) => void) =>
    h('input', {
      type: 'file',
      accept: 'image/jpeg,image/png,image/webp',
      multiple,
      class: 'sr-only',
      tabindex: '-1',
      onChange: (e: Event) => {
        const entrada = e.target as HTMLInputElement;
        alElegir(entrada.files);
        entrada.value = '';
      },
    });
  const selectorPortada = selectorFotos(false, (lista) => anadirFotos(lista, true));
  const selectorAdicionales = selectorFotos(true, (lista) => anadirFotos(lista, false));
  const botonPortada = h('button', { type: 'button', class: estilos.botonSecundario, onClick: () => selectorPortada.click() });
  botonPortada.dataset.foco = 'boton-portada';
  botonPortada.dataset.campo = 'portada.src';
  const botonAnadirFotos = h('button', { type: 'button', class: estilos.botonSecundario, onClick: () => selectorAdicionales.click() }, '+ Añadir fotos');
  botonAnadirFotos.dataset.foco = 'boton-fotos';

  function pintarFotos() {
    botonPortada.textContent = portada ? 'Cambiar la portada' : 'Elegir la foto de portada';
    contenedorFotos.replaceChildren(
      h('h3', { class: 'text-lg font-bold' }, 'Portada'),
      h('p', { class: estilos.ayuda }, 'La foto principal: sale en la galería, en la ficha y al compartir el enlace.'),
      h(
        'div',
        { class: 'mt-3 max-w-md' },
        portada && tarjetaFoto(portada, null),
        h('div', { class: 'mt-3' }, botonPortada, selectorPortada),
        h('p', { class: estilos.error, 'data-error': 'portada.src', hidden: true }),
      ),
      h('h3', { class: 'mt-8 text-lg font-bold' }, 'Más fotos'),
      h('p', { class: estilos.ayuda }, 'Se muestran en este orden debajo del texto. Puedes hacerlas con la cámara del móvil.'),
      imagenes.length > 0
        ? h('ul', { class: 'mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3' }, ...imagenes.map((foto, i) => tarjetaFoto(foto, i)))
        : '',
      h('div', { class: 'mt-3' }, botonAnadirFotos, selectorAdicionales),
    );
  }
  pintarFotos();

  // --- Listas de enlaces (YouTube e Instagram) -----------------------------------------

  function listaEnlaces(ruta: 'videos' | 'instagram', singular: string, ejemplo: string) {
    const contenedor = h('div', {});
    const enlaces = datos[ruta];
    const anadir = h('button', {
      type: 'button',
      class: estilos.botonSecundario,
      onClick: () => {
        enlaces.push('');
        marcarSucio();
        pintar();
        contenedor.querySelector<HTMLElement>(`[data-foco="${ruta}.${enlaces.length - 1}"]`)?.focus();
      },
    }, `+ Añadir ${singular}`);

    function pintar() {
      contenedor.replaceChildren(
        enlaces.length === 0
          ? ''
          : h(
            'ol',
            { class: 'grid gap-4' },
            ...enlaces.map((enlace, i) => {
              const entrada = texto(enlace, (v) => {
                enlaces[i] = v;
              }, { type: 'url', inputmode: 'url', autocomplete: 'off', placeholder: ejemplo });
              const boton = (contenido: string, etiqueta: string, foco: string, accion: () => void, deshabilitado = false) => {
                const b = h('button', { type: 'button', class: estilos.botonPequeno, 'aria-label': etiqueta, disabled: deshabilitado, onClick: accion }, contenido);
                b.dataset.foco = `${ruta}.${i}.${foco}`;
                return b;
              };
              const mueve = (hasta: number, foco: string) => () => {
                mover(enlaces, i, hasta);
                marcarSucio();
                pintar();
                contenedor.querySelector<HTMLElement>(`[data-foco="${ruta}.${hasta}.${foco}"]`)?.focus();
              };
              return h(
                'li',
                { class: 'rounded-2xl bg-papel p-3 ring-1 ring-tinta/10' },
                campo(`${ruta}.${i}`, `Enlace ${i + 1}`, entrada),
                h(
                  'div',
                  { class: 'mt-2 flex flex-wrap gap-2' },
                  boton('↑', `Subir el enlace ${i + 1}`, 'subir', mueve(i - 1, 'subir'), i === 0),
                  boton('↓', `Bajar el enlace ${i + 1}`, 'bajar', mueve(i + 1, 'bajar'), i === enlaces.length - 1),
                  boton('Quitar', `Quitar el enlace ${i + 1}`, 'quitar', () => {
                    enlaces.splice(i, 1);
                    marcarSucio();
                    pintar();
                    anadir.focus();
                  }),
                ),
              );
            }),
          ),
        h('div', { class: 'mt-3' }, anadir),
      );
    }
    pintar();
    return contenedor;
  }

  // --- Errores, guardado y eliminación ------------------------------------------------

  function mostrarErrores(errores: ErrorCampo[]) {
    for (const parrafo of formulario.querySelectorAll<HTMLElement>('[data-error]')) {
      parrafo.hidden = true;
      parrafo.textContent = '';
    }
    for (const control of formulario.querySelectorAll('[aria-invalid]')) control.removeAttribute('aria-invalid');

    if (errores.length === 0) {
      resumenErrores.replaceChildren();
      return;
    }
    const enlaces: HTMLElement[] = [];
    for (const { campo: ruta, mensaje } of errores) {
      const control = formulario.querySelector<HTMLElement>(`[data-campo="${ruta}"]`);
      const parrafo = formulario.querySelector<HTMLElement>(`[data-error="${ruta}"]`);
      control?.setAttribute('aria-invalid', 'true');
      if (parrafo) {
        parrafo.textContent = mensaje;
        parrafo.hidden = false;
      }
      enlaces.push(
        h('li', {}, control
          ? h('a', { href: `#${control.id}`, class: 'underline underline-offset-2', onClick: (e: Event) => {
              e.preventDefault();
              control.focus();
            } }, mensaje)
          : mensaje),
      );
    }
    resumenErrores.replaceChildren(
      h(
        'div',
        { role: 'alert', class: 'rounded-2xl bg-madera p-4 text-magenta-texto' },
        h('p', { class: 'font-bold' }, errores.length === 1 ? 'Falta corregir 1 cosa antes de guardar:' : `Faltan por corregir ${errores.length} cosas antes de guardar:`),
        h('ul', { class: 'mt-2 list-disc pl-6' }, ...enlaces),
      ),
    );
    resumenErrores.focus();
  }

  function mostrarFallo(mensaje: string, conRecarga = false) {
    resumenErrores.replaceChildren(
      h(
        'div',
        { role: 'alert', class: 'rounded-2xl bg-madera p-4' },
        h('p', { class: 'font-semibold text-magenta-texto' }, mensaje),
        conRecarga &&
          h('button', { type: 'button', class: `${estilos.botonSecundario} mt-3`, onClick: () => {
            sucio = false;
            ctx.recargar(slug);
          } }, 'Volver a cargar el trabajo'),
      ),
    );
    resumenErrores.focus();
  }

  const botonGuardar = h('button', { type: 'submit', class: estilos.botonPrincipal }, 'Guardar');

  async function guardar(evento: Event) {
    evento.preventDefault();
    if (guardando) return;

    if ([portada, ...imagenes].some((f) => f?.estado === 'subiendo')) {
      mostrarFallo('Espera a que terminen de subirse las fotos y vuelve a pulsar «Guardar».');
      return;
    }
    const conError = [portada, ...imagenes].find((f) => f?.estado === 'error');
    if (conError) {
      mostrarFallo(`Hay una foto con problemas (${conError.error}). Quítala o cámbiala antes de guardar.`);
      return;
    }

    datos.portada = portada ? { src: portada.nombre, alt: portada.alt } : { src: '', alt: '' };
    datos.imagenes = imagenes.map((f) => ({ src: f.nombre, alt: f.alt }));
    const errores = validarTrabajo(datos, {
      categorias: ctx.categorias.map((c) => c.id),
      nuevo: nuevo ? { slug, existentes: ctx.trabajos.map((t) => t.slug) } : undefined,
    });
    mostrarErrores(errores);
    if (errores.length > 0) return;

    const markdown = escribirTrabajo({ datos, cuerpo });
    const usadasAhora = new Set(fotosReferenciadas(datos));
    const fotosNuevas = Object.fromEntries(
      [portada, ...imagenes].filter((f): f is FotoFormulario => !!f?.nueva && !!f.sha).map((f) => [f.nombre, f.sha!]),
    );
    const borrar = [...referenciadasAlAbrir].filter((nombre) => !usadasAhora.has(nombre));

    guardando = true;
    botonGuardar.disabled = true;
    botonGuardar.textContent = 'Guardando…';
    publicacion.parar();
    try {
      const { commit } = await api.guardar({
        slug,
        nuevo,
        indexSha: nuevo ? null : indexSha,
        titulo: datos.titulo,
        markdown,
        fotos: fotosNuevas,
        borrar,
      });

      // El repositorio ya tiene esta versión: se sigue editando a partir de ella.
      indexSha = await api.shaDeGit(markdown);
      archivos[ARCHIVO_TRABAJO] = indexSha;
      for (const [nombre, sha] of Object.entries(fotosNuevas)) archivos[nombre] = sha;
      for (const nombre of borrar) delete archivos[nombre];
      for (const foto of [portada, ...imagenes]) if (foto) foto.nueva = false;
      referenciadasAlAbrir = usadasAhora;
      const eraNuevo = nuevo;
      nuevo = false;
      sucio = false;
      ctx.alGuardar({ slug, archivos: { ...archivos }, indexSha, trabajo: { datos: structuredClone(datos), cuerpo } });

      if (eraNuevo) {
        ctx.fijarRuta(`#/trabajo/${slug}`);
        titulo.textContent = datos.titulo;
        pintarBloqueSlug();
        botonEliminar.hidden = false;
      }
      if (datos.borrador) {
        publicacion.mensaje('Guardado. Está marcado como borrador: no se verá en la web hasta que lo desmarques.');
      } else {
        publicacion.seguir(commit, {
          publicando: 'Guardado. Publicando en la web… (suele tardar menos de un minuto)',
          publicado: 'Publicado: el cambio ya se ve en la web.',
          enlace: `/trabajos/${slug}/`,
        });
      }
      resumenErrores.replaceChildren();
      publicacion.elemento.scrollIntoView({ block: 'nearest' });
    } catch (error) {
      const e = error as api.ErrorApi;
      mostrarFallo(e.message, e.estado === 409 && !nuevo);
    } finally {
      guardando = false;
      botonGuardar.disabled = false;
      botonGuardar.textContent = 'Guardar';
    }
  }

  const dialogo = h('dialog', { class: 'm-auto max-w-md rounded-2xl p-6 backdrop:bg-tinta/50', 'aria-labelledby': 'titulo-eliminar' });
  async function confirmarEliminacion() {
    const confirmar = h('button', { type: 'button', class: estilos.botonPeligro }, 'Sí, eliminar');
    const cancelar = h('button', { type: 'button', class: estilos.botonSecundario, onClick: () => dialogo.close() }, 'Cancelar');
    const mensaje = h('p', { class: 'mt-3 text-magenta-texto empty:hidden', role: 'alert' });
    dialogo.replaceChildren(
      h('h2', { id: 'titulo-eliminar', class: 'text-xl font-bold' }, `¿Eliminar «${datos.titulo || slug}»?`),
      h('p', { class: 'mt-3' }, 'Se borrarán el trabajo y todas sus fotos, y dejará de verse en la web.'),
      h('p', { class: 'mt-2 text-tinta-suave' }, 'Si solo quieres ocultarlo por un tiempo, márcalo como borrador y guarda.'),
      mensaje,
      h('div', { class: 'mt-6 flex flex-wrap gap-3' }, cancelar, confirmar),
    );
    confirmar.addEventListener('click', async () => {
      confirmar.disabled = true;
      confirmar.textContent = 'Eliminando…';
      try {
        const { commit } = await api.eliminar({ slug, indexSha: indexSha!, titulo: datos.titulo });
        sucio = false;
        dialogo.close();
        ctx.alEliminar(slug, datos.titulo, commit);
      } catch (error) {
        mensaje.textContent = (error as Error).message;
        confirmar.disabled = false;
        confirmar.textContent = 'Sí, eliminar';
      }
    });
    dialogo.showModal();
    cancelar.focus();
  }
  const botonEliminar = h('button', { type: 'button', class: estilos.botonPeligro, hidden: nuevo, onClick: confirmarEliminacion }, 'Eliminar trabajo');

  // --- Estructura ---------------------------------------------------------------------

  const titulo = h('h1', { id: 'titulo-formulario', tabindex: '-1', class: 'mt-2 text-3xl font-extrabold tracking-tight text-balance' },
    nuevo ? 'Nuevo trabajo' : datos.titulo || slug);

  const seccion = (tituloSeccion: string, ...contenido: (Node | false | null)[]) =>
    h('fieldset', { class: `${estilos.tarjeta} mt-6` },
      h('legend', { class: 'float-left mb-4 w-full text-xl font-bold' }, tituloSeccion),
      h('div', { class: 'clear-both' }, ...contenido));

  const formulario = h(
    'form',
    { novalidate: true, onSubmit: guardar, 'aria-labelledby': 'titulo-formulario' },
    seccion(
      'Datos',
      campo('titulo', 'Título', entradaTitulo),
      bloqueSlug,
      campo('descripcion', 'Descripción corta', entradaDescripcion,
        h('span', {}, 'Sale en la tarjeta de la galería y en Google. ', contador)),
      campo('categoria', 'Categoría', entradaCategoria),
      campo('fecha', 'Fecha del trabajo', entradaFecha, 'Ordena la galería: los más recientes salen primero.'),
      campo('material', 'Material (opcional)', texto(datos.material, (v) => {
        datos.material = v;
      }), 'Por ejemplo: DM de 5 mm.'),
      casilla('Destacado', 'Sale en la portada de la web, en «Trabajos destacados».', datos.destacado, (v) => {
        datos.destacado = v;
      }),
      casilla('Borrador', 'Mientras esté marcado, el trabajo se guarda pero no se ve en la web.', datos.borrador, (v) => {
        datos.borrador = v;
      }),
    ),
    seccion('Fotos', contenedorFotos),
    seccion('Texto del trabajo',
      campo('cuerpo', 'Descripción larga', entradaCuerpo,
        'Cuenta la historia del encargo. Deja una línea en blanco entre párrafos; **así** sale en negrita.')),
    seccion('Videos de YouTube',
      h('p', { class: `${estilos.ayuda} mb-3` }, 'Pega el enlace del video o del short (botón «Compartir» → «Copiar enlace»).'),
      listaEnlaces('videos', 'video', 'https://youtube.com/shorts/…')),
    seccion('Publicaciones de Instagram',
      h('p', { class: `${estilos.ayuda} mb-3` }, 'Pega el enlace de la publicación o del reel (los tres puntos → «Copiar enlace»), no el de tu perfil.'),
      listaEnlaces('instagram', 'publicación', 'https://www.instagram.com/p/…')),
    // Barra fija con lo que se usa siempre; «Eliminar» queda al final, fuera de la barra.
    h(
      'div',
      { class: 'sticky bottom-0 z-10 -mx-4 mt-6 flex flex-wrap items-center gap-3 border-t border-tinta/10 bg-papel/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border' },
      botonGuardar,
      h('a', { href: '#/', class: estilos.botonSecundario }, 'Volver a la lista'),
    ),
  );

  const elemento = h(
    'div',
    {},
    h('a', { href: '#/', class: `${estilos.enlace} inline-flex min-h-11 items-center` }, '← Volver a la lista'),
    titulo,
    h('div', { class: 'mt-4 grid gap-3' }, resumenErrores, publicacion.elemento),
    formulario,
    h('div', { class: 'mt-10 border-t border-tinta/10 pt-6' }, botonEliminar),
    dialogo,
  );

  return {
    elemento,
    sinGuardar: () => sucio || [portada, ...imagenes].some((f) => f?.estado === 'subiendo'),
    cerrar() {
      publicacion.parar();
      window.removeEventListener('beforeunload', alSalir);
    },
  };
}
