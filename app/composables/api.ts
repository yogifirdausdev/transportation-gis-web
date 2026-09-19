export function useApiUrl(path: string) {
  const base = useRuntimeConfig().app.baseURL || '/'
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}` || '/'
}
