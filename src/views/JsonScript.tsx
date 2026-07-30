import { raw } from 'hono/html'

/** Embed JSON for client-side parsing without HTML entity escaping. */
export function JsonScript({ id, json }: { id: string; json: string }) {
  return (
    <script id={id} type="application/json">
      {raw(json)}
    </script>
  )
}
