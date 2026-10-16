<script setup lang="ts">
const lat = defineModel<number | null>('lat')
const lng = defineModel<number | null>('lng')
const el=ref<HTMLElement|null>(null); let map:any=null; let L:any=null; let marker:any=null; let ro:ResizeObserver|null=null
function setMarker(a:number,b:number){ lat.value=a; lng.value=b; if(!L||!map)return; if(marker) marker.setLatLng([a,b]); else marker=L.circleMarker([a,b],{radius:9,weight:3,color:'#fff',fillColor:'#0f766e',fillOpacity:1}).addTo(map) }
async function init(){ if(!import.meta.client||!el.value)return; L=await import('leaflet'); map=L.map(el.value,{preferCanvas:true}).setView([lat.value||-6.2,lng.value||106.82], lat.value&&lng.value?16:11); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map); map.on('click',(e:any)=>setMarker(Number(e.latlng.lat.toFixed(7)),Number(e.latlng.lng.toFixed(7)))); if(lat.value&&lng.value)setMarker(Number(lat.value),Number(lng.value)); ro=new ResizeObserver(()=>map.invalidateSize({animate:false})); ro.observe(el.value); setTimeout(()=>map.invalidateSize({animate:false}),100) }
watch([lat,lng],([a,b])=>{if(a&&b&&map)setMarker(Number(a),Number(b))})
onMounted(init); onBeforeUnmount(()=>{ro?.disconnect();map?.remove()})
</script>
<template><div class="overflow-hidden rounded-xl border bg-slate-100"><div ref="el" class="h-72 w-full"></div><div class="border-t bg-white px-3 py-2 text-xs text-slate-500">Klik peta untuk memilih koordinat.</div></div></template>
