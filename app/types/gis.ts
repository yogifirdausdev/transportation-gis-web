export type Condition = 'good' | 'bad' | 'unassessed'

export interface Category {
  id: number
  slug: string
  name: string
  color: string
  icon: string
  active: boolean
}

export interface GisLocation {
  id: number
  category_id: number
  category_slug: string
  category_name: string
  category_color: string
  name: string
  district: string | null
  address: string | null
  condition: Condition
  latitude: number
  longitude: number
  road_width: number | null
  speed_bump_units: number | null
  speed_bump_m: number | null
  endcap_units: number | null
  before_photo_url: string | null
  after_photo_url: string | null
  notes: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}
