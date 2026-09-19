export default defineNuxtRouteMiddleware(async () => {
  try {
    const fetcher = import.meta.server ? useRequestFetch() : $fetch
    const data = await fetcher<{ user: any }>(useApiUrl('/api/auth/me'))
    useState('auth-user', () => data.user).value = data.user
  } catch {
    return navigateTo('/admin/login')
  }
})
