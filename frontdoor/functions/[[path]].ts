interface Env {
  NUCAWEBSITE: Fetcher
}

export const onRequest: PagesFunction<Env> = async (context) => {
  return context.env.NUCAWEBSITE.fetch(context.request)
}
