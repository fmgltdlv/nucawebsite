import { raw } from 'hono/html'
import { jsonForScript } from '../lib/security/html'

/** Embed JSON for client-side parsing without HTML entity escaping. */
export function JsonScript({ id, json }: { id: string; json: string }) {
  return (
    <script id={id} type="application/json">
      {raw(jsonForScript(json))}
    </script>
  )
}
