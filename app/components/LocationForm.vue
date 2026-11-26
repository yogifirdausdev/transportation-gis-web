<script setup lang="ts">
import { Save, ImagePlus } from "lucide-vue-next";
const props = defineProps<{ model?: any; submitLabel?: string }>();
const emit = defineEmits<{ submit: [FormData] }>();
const { data: cats } = await useFetch("/api/admin/categories");
const { data: dists } = await useFetch("/api/admin/districts");
const form = reactive({
  location_name: props.model?.location_name || "",
  category_id: props.model?.category_id || "",
  district_id: props.model?.district_id || "",
  fiscal_year: props.model?.fiscal_year ?? "",
  implementation_status: props.model?.implementation_status || "EXISTING",
  latitude: props.model?.latitude ?? null,
  longitude: props.model?.longitude ?? null,
  condition: props.model?.condition || "Belum Dinilai",
});
const appPath = useAppPath();

const file = ref<File | null>(null);
const preview = ref(appPath(props.model?.photo_path || ""));
function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0] || null;
  file.value = f;
  if (f) preview.value = URL.createObjectURL(f);
}
function submit() {
  const fd = new FormData();
  Object.entries(form).forEach(([k, v]) => fd.append(k, String(v ?? "")));
  if (file.value) fd.append("photo", file.value);
  emit("submit", fd);
}
</script>
<template>
  <form class="grid gap-6 xl:grid-cols-[1fr_420px]" @submit.prevent="submit">
    <UiCard class="p-5 md:p-6"
      ><div class="grid gap-5 md:grid-cols-2">
        <div class="space-y-2 md:col-span-2">
          <UiLabel>Lokasi Kegiatan</UiLabel
          ><UiInput
            v-model="form.location_name"
            placeholder="Nama/alamat lokasi"
          />
        </div>
        <div class="space-y-2">
          <UiLabel>Kategori</UiLabel
          ><UiSelect v-model="form.category_id"
            ><option value="" disabled>Pilih kategori</option>
            <option
              v-for="c in cats?.categories || []"
              :key="c.id"
              :value="c.id"
            >
              {{ c.name }}
            </option></UiSelect
          >
        </div>
        <div class="space-y-2">
          <UiLabel>Kecamatan</UiLabel>
          <div
            v-if="model?.district_raw && !form.district_id"
            class="rounded-lg bg-amber-50 p-2 text-xs text-amber-800"
          >
            Nilai dari Excel tidak dikenali:
            <strong>{{ model.district_raw }}</strong
            >. Pilih kecamatan yang benar sebelum menyimpan.
          </div>
          <UiSelect v-model="form.district_id"
            ><option value="" disabled>Pilih kecamatan</option>
            <option
              v-for="d in dists?.districts || []"
              :key="d.id"
              :value="d.id"
            >
              {{ d.name }}
            </option></UiSelect
          >
        </div>
        <div class="space-y-2">
          <UiLabel>Status</UiLabel
          ><UiSelect v-model="form.implementation_status"
            ><option value="EXISTING">Terpasang</option>
            <option value="PLANNED">Direncanakan</option></UiSelect
          >
        </div>
        <div class="space-y-2">
          <UiLabel
            >Tahun Anggaran
            <span class="text-xs font-normal text-slate-400"
              >(opsional)</span
            ></UiLabel
          ><UiInput
            v-model="form.fiscal_year"
            type="number"
            min="2000"
            max="2100"
            placeholder="Contoh: 2027"
          />
        </div>
        <div class="space-y-2">
          <UiLabel
            >Kondisi
            <span class="text-xs font-normal text-slate-400"
              >(internal)</span
            ></UiLabel
          ><UiSelect v-model="form.condition"
            ><option>Baik / Sesuai</option>
            <option>Tidak Baik / Tidak Sesuai</option>
            <option>Belum Dinilai</option></UiSelect
          >
        </div>
        <div class="space-y-2">
          <UiLabel>Latitude</UiLabel
          ><UiInput v-model="form.latitude" type="number" step="0.0000001" />
        </div>
        <div class="space-y-2">
          <UiLabel>Longitude</UiLabel
          ><UiInput v-model="form.longitude" type="number" step="0.0000001" />
        </div>
        <div class="space-y-2 md:col-span-2">
          <UiLabel>Foto</UiLabel
          ><label
            class="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-slate-50 p-4 text-sm text-slate-600 hover:bg-slate-100"
            ><ImagePlus class="h-5 w-5 text-teal-700" /><span>{{
              file?.name || "Pilih satu foto"
            }}</span
            ><input
              type="file"
              accept="image/*"
              class="hidden"
              @change="onFile" /></label
          ><img
            v-if="preview"
            :src="preview"
            class="mt-3 h-44 w-full rounded-xl object-cover"
          />
        </div>
      </div>
      <div class="mt-6 flex justify-end">
        <UiButton type="submit"
          ><Save class="h-4 w-4" />{{
            submitLabel || "Simpan Lokasi"
          }}</UiButton
        >
      </div></UiCard
    >
    <div class="space-y-4">
      <MapPicker v-model:lat="form.latitude" v-model:lng="form.longitude" />
      <div
        v-if="model?.source_type"
        class="rounded-xl border bg-white p-4 text-sm"
      >
        <div class="font-medium text-slate-900">Sumber data</div>
        <div class="mt-2 text-slate-600">
          <template v-if="model.source_type === 'excel'"
            >Excel: <span class="font-medium">{{ model.source_file_name }}</span
            ><span v-if="model.source_row">
              · Baris {{ model.source_row }}</span
            ></template
          ><template v-else>Ditambahkan manual</template>
        </div>
      </div>
    </div>
  </form>
</template>
