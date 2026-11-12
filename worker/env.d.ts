// Variables que no están en `wrangler.jsonc`: el secreto de GitHub y, solo en `.dev.vars`, el acceso local.
interface Env {
  /** Token *fine-grained* de GitHub con permiso de escritura en el repositorio (secreto). */
  GITHUB_TOKEN?: string;
  /** `1` en `.dev.vars` para probar en `localhost` sin Cloudflare Access. */
  ACCESO_LOCAL?: string;
}
