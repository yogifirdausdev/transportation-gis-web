<script setup lang="ts">
import { apiPath } from '@/utils/api'
import { LockKeyhole, LoaderCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
definePageMeta({layout:false})
const email=ref('');const password=ref('');const loading=ref(false);const error=ref('')
async function submit(){loading.value=true;error.value='';try{await $fetch(apiPath('/api/auth/login'),{method:'POST',body:{email:email.value,password:password.value},credentials:'include'});await navigateTo('/admin')}catch(e:any){error.value=e?.data?.statusMessage||'Email atau password tidak valid.'}finally{loading.value=false}}
</script>
<template><div class="grid min-h-dvh place-items-center bg-muted/40 p-4"><Card class="w-full max-w-md"><CardHeader><div class="mb-5"><AppLogo /></div><CardTitle>Masuk ke GIS Admin</CardTitle><CardDescription>Kelola lokasi, import data, kategori, dan akun operator.</CardDescription></CardHeader><CardContent><form class="space-y-4" @submit.prevent="submit"><Alert v-if="error" variant="destructive">{{error}}</Alert><div class="space-y-2"><Label for="email">Email</Label><Input id="email" v-model="email" type="email" autocomplete="username" required /></div><div class="space-y-2"><Label for="password">Password</Label><Input id="password" v-model="password" type="password" autocomplete="current-password" required /></div><Button class="w-full" type="submit" :disabled="loading"><LoaderCircle v-if="loading" class="size-4 animate-spin" /><LockKeyhole v-else class="size-4" />Sign in</Button><NuxtLink to="/" class="block text-center text-xs text-muted-foreground hover:text-foreground">← Kembali ke public map</NuxtLink></form></CardContent></Card></div></template>
