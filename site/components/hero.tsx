import type { Child } from 'hono/jsx'

export function Hero({
  eyebrow,
  title,
  lead,
  id,
  actions,
}: {
  eyebrow: string
  title: string
  lead: string
  id?: string
  actions?: Child
}) {
  return (
    <section class='hero' id={id}>
      <p class='eyebrow'>{eyebrow}</p>
      <h1>{title}</h1>
      <p class='lead'>{lead}</p>
      {actions}
    </section>
  )
}
