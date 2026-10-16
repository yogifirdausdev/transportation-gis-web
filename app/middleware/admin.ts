export default defineNuxtRouteMiddleware(async () => {
  const requestFetch = useRequestFetch()
  try {
    const me = await requestFetch('/api/auth/me') as any
    useState<any>('auth-user').value = me.user
  } catch {
    return navigateTo('/admin/login')
  }
})
