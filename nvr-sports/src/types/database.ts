export interface User {
  id: string
  name: string
  email: string
  cpf: string
  phone: string
  birth_date: string
  gender: 'masculino' | 'feminino' | 'outro'
  address: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  description: string
  slug: string
  image_url: string
  location: string
  city: string
  state: string
  date: string
  time: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  badge_type: 'open' | 'highlight' | 'last-spots' | 'new' | 'popular'
  created_at: string
  updated_at: string
  categories?: EventCategory[]
  details?: EventDetail
}

export interface EventCategory {
  id: string
  event_id: string
  name: string
  distance_km: number
  description: string
  price: number
  max_participants: number | null
  created_at: string
}

export interface EventDetail {
  id: string
  event_id: string
  highlights: Highlight[]
  gallery_images: string[]
  routes: Route[]
  kit_items: KitItem[]
  schedule: ScheduleItem[]
  sponsors: Sponsor[]
}

export interface Highlight {
  icon: string
  title: string
  description: string
}

export interface Route {
  name: string
  distance: string
  subtitle: string
  description: string
}

export interface KitItem {
  icon: string
  name: string
}

export interface ScheduleItem {
  time: string
  title: string
  description: string
}

export interface Sponsor {
  tier: string
  names: string[]
}

export interface Registration {
  id: string
  user_id: string
  event_id: string
  category_id: string
  tshirt_size: 'P' | 'M' | 'G' | 'GG'
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  payment_method: 'credit_card' | 'pix' | 'boleto'
  payment_status: 'pending' | 'paid' | 'refunded'
  total_price: number
  confirmation_number: string
  qr_code_data: string | null
  created_at: string
  updated_at: string
  event?: Event
  category?: EventCategory
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'pending' | 'read' | 'replied'
  created_at: string
}

export interface Testimonial {
  id: string
  author_name: string
  author_role: string
  author_initials: string
  text: string
  rating: number
  is_active: boolean
  created_at: string
}
