<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
const props=defineProps<{latitude:number;longitude:number}>()
const emit=defineEmits<{change:[{latitude:number;longitude:number}]}>()
const el=ref<HTMLElement|null>(null)
let L:typeof import('leaflet')|null=null
let map:import('leaflet').Map|null=null
let marker:import('leaflet').CircleMarker|null=null
let ro:ResizeObserver|null=null

async function init(){
  await nextTick(); await new Promise<void>(r=>requestAnimationFrame(()=>r()))
  if(!el.value||el.value.clientHeight<40)return
  L=await import('leaflet')
  map=L.map(el.value,{center:[props.latitude||-6.1754,props.longitude||106.8272],zoom:props.latitude?16:11,preferCanvas:true})
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors',maxZoom:20}).addTo(map)
  marker=L.circleMarker(map.getCenter(),{radius:8,color:'#fff',weight:2,fillColor:'#1d4ed8',fillOpacity:1}).addTo(map)
  if(props.latitude&&props.longitude) marker.setLatLng([props.latitude,props.longitude])
  map.on('click',(e)=>{ marker?.setLatLng(e.latlng); emit('change',{latitude:e.latlng.lat,longitude:e.latlng.lng}) })
  ro=new ResizeObserver(()=>requestAnimationFrame(()=>map?.invalidateSize({pan:false}))); ro.observe(el.value)
  setTimeout(()=>map?.invalidateSize({pan:false}),100)
}
watch(()=>[props.latitude,props.longitude],([lat,lng])=>{if(map&&marker&&Number(lat)&&Number(lng)){marker.setLatLng([Number(lat),Number(lng)])}}, {deep:true})
onMounted(init)
onBeforeUnmount(()=>{ro?.disconnect();map?.off();map?.remove();map=null})
</script>
<template><div ref="el" class="h-[320px] w-full rounded-lg border bg-muted" /></template>
