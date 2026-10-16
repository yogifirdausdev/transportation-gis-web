import { apiPath } from '@/utils/api'
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/admin/login') return
  try {
    await $fetch(apiPath('/api/auth/me'), { credentials: 'include' })
  } catch {
    return navigateTo('/admin/login')
  }
})
