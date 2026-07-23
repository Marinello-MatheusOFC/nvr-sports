-- ============================================================
-- NVR Sports Platform - Database Schema
-- ============================================================

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT UNIQUE,
  phone TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('masculino', 'feminino', 'outro')),
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Function to auto-create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_user on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. EVENTS
-- ============================================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  location TEXT,
  city TEXT,
  state TEXT,
  date DATE NOT NULL,
  time TIME,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  badge_type TEXT CHECK (badge_type IN ('open', 'highlight', 'last-spots', 'new', 'popular')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. EVENT CATEGORIES
-- ============================================================
CREATE TABLE event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  distance_km NUMERIC(6,2),
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_participants INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. EVENT DETAILS (extended info, JSONB columns)
-- ============================================================
CREATE TABLE event_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  highlights JSONB DEFAULT '[]'::jsonb,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  routes JSONB DEFAULT '{}'::jsonb,
  kit_items JSONB DEFAULT '[]'::jsonb,
  schedule JSONB DEFAULT '[]'::jsonb,
  sponsors JSONB DEFAULT '{}'::jsonb
);

-- ============================================================
-- 5. REGISTRATIONS
-- ============================================================
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES event_categories(id) ON DELETE RESTRICT,
  tshirt_size TEXT NOT NULL CHECK (tshirt_size IN ('P', 'M', 'G', 'GG')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_method TEXT CHECK (payment_method IN ('credit_card', 'pix', 'boleto')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  confirmation_number TEXT NOT NULL UNIQUE,
  qr_code_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. CONTACT MESSAGES
-- ============================================================
CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'replied')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. TESTIMONIALS
-- ============================================================
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  author_role TEXT,
  author_initials TEXT,
  text TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_cpf ON profiles(cpf);

CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_badge ON events(badge_type);

CREATE INDEX idx_event_categories_event ON event_categories(event_id);

CREATE INDEX idx_event_details_event ON event_details(event_id);

CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_category ON registrations(category_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_confirmation ON registrations(confirmation_number);

CREATE INDEX idx_contact_messages_status ON contact_messages(status);

CREATE INDEX idx_testimonials_active ON testimonials(is_active) WHERE is_active = true;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Profiles: allow insert from trigger (service role)
CREATE POLICY "Allow profile creation"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Events: public read access
CREATE POLICY "Allow public read events"
  ON events FOR SELECT
  USING (true);

-- Event categories: public read access
CREATE POLICY "Allow public read event_categories"
  ON event_categories FOR SELECT
  USING (true);

-- Event details: public read access
CREATE POLICY "Allow public read event_details"
  ON event_details FOR SELECT
  USING (true);

-- Registrations: users can view/create their own
CREATE POLICY "Users can view own registrations"
  ON registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own registrations"
  ON registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Contact messages: anyone can insert
CREATE POLICY "Allow public insert contact_messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

-- Testimonials: public read access
CREATE POLICY "Allow public read testimonials"
  ON testimonials FOR SELECT
  USING (is_active = true);

-- ============================================================
-- SEED DATA - EVENTS
-- ============================================================
INSERT INTO events (id, title, description, slug, image_url, location, city, state, date, time, status, badge_type) VALUES

-- Event 1
(
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Corrida de São Paulo 2026',
  'A maior corrida de rua do Brasil. Percorra os principais pontos turísticos de São Paulo em uma corrida inesquecível com mais de 50.000 participantes.',
  'corrida-de-sao-paulo-2026',
  'https://images.unsplash.com/photo-1530143584546-02191cd6e1f2?w=800&q=80',
  'Avenida Paulista, 1000',
  'São Paulo',
  'SP',
  '2026-09-15',
  '06:30',
  'upcoming',
  'popular'
),

-- Event 2
(
  'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
  'Meia Maratona do Rio',
  'Corra pela cidade maravilhosa com vista para o Cristo Redentor. Uma experiência única com paisagens deslumbrantes da zona sul do Rio.',
  'meia-maratona-do-rio-2026',
  'https://images.unsplash.com/photo-1461896836934-bd45ba8a0020?w=800&q=80',
  'Copacabana, s/n',
  'Rio de Janeiro',
  'RJ',
  '2026-07-20',
  '07:00',
  'upcoming',
  'highlight'
),

-- Event 3
(
  'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
  'Corrida das Flores - Curitiba',
  'Atravesse os parques e jardins de Curitiba nesta corrida temática. Percursos sombreados e um clima agradável fazem deste evento uma experiência única.',
  'corrida-das-flores-curitiba-2026',
  'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&q=80',
  'Parque Tanguá',
  'Curitiba',
  'PR',
  '2026-08-10',
  '07:30',
  'upcoming',
  'new'
),

-- Event 4
(
  'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f80',
  'Maratona de Brasília',
  'Corra pelo eixo monumental e conheça a arquitetura de Oscar Niemeyer. Uma maratona plana e rápida, perfeita para quebras de recordes.',
  'maratona-de-brasilia-2026',
  'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=800&q=80',
  'Esplanada dos Ministérios',
  'Brasília',
  'DF',
  '2026-10-05',
  '06:00',
  'upcoming',
  'open'
),

-- Event 5
(
  'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8091',
  'Corrida da Uva - Bento Gonçalves',
  'Atravesse as vinícolas do Vale dos Vinhedos em uma corrida gastronômica e esportiva. Degustação de vinhos na chegada!',
  'corrida-da-uva-bento-goncalves-2026',
  'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=80',
  'Vale dos Vinhedos',
  'Bento Gonçalves',
  'RS',
  '2026-11-20',
  '08:00',
  'upcoming',
  'last-spots'
),

-- Event 6
(
  'f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f809102',
  'São Silvestre 2026',
  'O clássico final de ano de São Paulo. Uma tradição que vai do centro da cidade ao Estádio do Morumbi. Uma das corridas mais tradicionais do mundo.',
  'sao-silvestre-2026',
  'https://images.unsplash.com/photo-1596727362302-b8d891c42ab8?w=800&q=80',
  'Praça da Sé',
  'São Paulo',
  'SP',
  '2026-12-31',
  '08:00',
  'upcoming',
  'popular'
),

-- Event 7
(
  'a7b8c9d0-e1f2-4a5b-4c5d-6e7f80910213',
  'Corrida de Recife - Carnaval Run',
  'Uma corrida com cara de carnaval! Percursos coloridos, blocos musicais e muita animação. Venha celebrar o esporte com alegria!',
  'corrida-de-recife-carnaval-run-2026',
  'https://images.unsplash.com/photo-1486218119243-13883505764c?w=800&q=80',
  'Marco Zero',
  'Recife',
  'PE',
  '2026-02-14',
  '07:00',
  'completed',
  'highlight'
),

-- Event 8
(
  'b8c9d0e1-f2a3-4b5c-5d6e-7f8091021324',
  'Ultra Trail Serra da Mantiqueira',
  'Desafie seus limites nesta ultra trail pela Serra da Mantiqueira. 80km de pura natureza e aventura com paisagens de tirar o fôlego.',
  'ultra-trail-serra-mantiqueira-2026',
  'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80',
  'Camanducaia',
  'Minas Gerais',
  'MG',
  '2026-05-01',
  '05:00',
  'completed',
  'new'
);

-- ============================================================
-- SEED DATA - EVENT CATEGORIES
-- ============================================================
INSERT INTO event_categories (event_id, name, distance_km, description, price, max_participants) VALUES

-- Corrida de São Paulo 2026
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '5K',    5.00,  'Ideal para iniciantes e famílias', 120.00, 20000),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '10K',   10.00, 'Percurso intermediário pela Paulista', 180.00, 15000),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '21K',   21.00, 'Meia maratona clássica', 250.00, 10000),
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '42K',   42.00, 'Maratona completa por SP', 350.00, 5000),

-- Meia Maratona do Rio
('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', '5K',    5.00,  'Passeio pela orla de Copacabana', 150.00, 10000),
('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', '10K',   10.00, 'Percurso pela zona sul', 220.00, 8000),
('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', '21K',   21.00, 'Meia maratona do Rio de Janeiro', 300.00, 5000),

-- Corrida das Flores - Curitiba
('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', '5K',    5.00,  'Percurso pelos parques de Curitiba', 100.00, 8000),
('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', '10K',   10.00, 'Travessia dos jardins botânicos', 160.00, 6000),
('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', '21K',   21.00, 'Meia maratona temática', 230.00, 4000),

-- Maratona de Brasília
('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f80', '5K',    5.00,  'Passeio pelo Eixo Monumental', 90.00, 10000),
('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f80', '10K',   10.00, 'Percurso pela Esplanada', 150.00, 8000),
('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f80', '21K',   21.00, 'Meia maratona de Brasília', 220.00, 5000),
('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f80', '42K',   42.00, 'Maratona completa - plana e rápida', 300.00, 3000),

-- Corrida da Uva - Bento Gonçalves
('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8091', '5K',    5.00,  'Trilha leve pelos vinhedos', 130.00, 5000),
('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8091', '10K',   10.00, 'Percurso intermediário com degustação', 200.00, 4000),
('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8091', '21K',   21.00, 'Meia maratona do Vale dos Vinhedos', 280.00, 2500),

-- São Silvestre 2026
('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f809102', '15K',   15.00, 'Clássico da São Silvestre', 250.00, 20000),
('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f809102', '10K',   10.00, 'Versão reduzida do clássico', 200.00, 15000),

-- Corrida de Recife - Carnaval Run
('a7b8c9d0-e1f2-4a5b-4c5d-6e7f80910213', '5K',    5.00,  'Corrida animada de carnaval', 80.00, 8000),
('a7b8c9d0-e1f2-4a5b-4c5d-6e7f80910213', '10K',   10.00, 'Carnaval Run intermediária', 120.00, 5000),

-- Ultra Trail Serra da Mantiqueira
('b8c9d0e1-f2a3-4b5c-5d6e-7f8091021324', '25K',   25.00, 'Trail curta pela serra', 200.00, 3000),
('b8c9d0e1-f2a3-4b5c-5d6e-7f8091021324', '50K',   50.00, 'Trail média com trilhas desafiadoras', 350.00, 1500),
('b8c9d0e1-f2a3-4b5c-5d6e-7f8091021324', '80K',   80.00, 'Ultra trail completa - para experientes', 500.00, 800);

-- ============================================================
-- SEED DATA - EVENT DETAILS
-- ============================================================
INSERT INTO event_details (event_id, highlights, gallery_images, routes, kit_items, schedule, sponsors) VALUES

-- Corrida de São Paulo 2026
(
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  '["Percorrida pela Avenida Paulista", "Medalha comemorativa exclusiva", "Camiseta oficial NVR Sports", "Água e isotonico nas paradas", "Filmagem profissional"]'::jsonb,
  '["/images/gallery/sp-1.jpg", "/images/gallery/sp-2.jpg", "/images/gallery/sp-3.jpg", "/images/gallery/sp-4.jpg"]'::jsonb,
  '{"map_url": "/routes/sp-2026.gpx", "elevation_profile": "/images/routes/sp-elevation.png", "difficulty": "moderate"}'::jsonb,
  '["Camiseta técnica oficial", "Medalha pintado a tinta", "Número de peito", "Chip de cronometragem", "Saco de勾pe"]'::jsonb,
  '[
    {"time": "05:00", "title": "Abertura do Parque", "description": "Recepção e organização dos participantes"},
    {"time": "06:00", "title": "Aquecimento", "description": "Aquecimento coletivo na Paulista"},
    {"time": "06:30", "title": "Largada 42K", "description": "Maratona completa"},
    {"time": "07:00", "title": "Largada 21K", "description": "Meia maratona"},
    {"time": "07:30", "title": "Largada 10K", "description": "Corrida intermediária"},
    {"time": "08:00", "title": "Largada 5K", "description": "Corrida curta"},
    {"time": "12:00", "title": "Cerimônia de Premiação", "description": "Entrega de troféus e reconhecimento"}
  ]'::jsonb,
  '{"sponsors": [{"name": "Nike", "logo": "/images/sponsors/nike.png"}, {"name": "Gatorade", "logo": "/images/sponsors/gatorade.png"}, {"name": "Itaú", "logo": "/images/sponsors/itau.png"}]}'::jsonb
),

-- Meia Maratona do Rio
(
  'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
  '["Vista panorâmica do Cristo Redentor", "Percorrida pela orla de Copacabana", "Medalha exclusiva do Rio", "Música ao vivo nas paradas", "Paisagens deslumbrantes"]'::jsonb,
  '["/images/gallery/rio-1.jpg", "/images/gallery/rio-2.jpg", "/images/gallery/rio-3.jpg"]'::jsonb,
  '{"map_url": "/routes/rio-2026.gpx", "elevation_profile": "/images/routes/rio-elevation.png", "difficulty": "moderate"}'::jsonb,
  '["Camiseta técnica oficial", "Medalha comemorativa", "Número de peito", "Chip de cronometragem", "Guia do participante"]'::jsonb,
  '[
    {"time": "05:30", "title": "Recepção", "description": "Credenciamento na Copacabana"},
    {"time": "06:30", "title": "Aquecimento", "description": "Aquecimento na praia"},
    {"time": "07:00", "title": "Largada", "description": "Corrida pela orla"},
    {"time": "10:00", "title": "Cerimônia", "description": "Premiação na praia"}
  ]'::jsonb,
  '{"sponsors": [{"name": "Adidas", "logo": "/images/sponsors/adidas.png"}, {"name": "Caixa", "logo": "/images/sponsors/caixa.png"}]}'::jsonb
),

-- Corrida das Flores - Curitiba
(
  'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
  '["Percursos pelos parques de Curitiba", "Ambiente sombreado e agradável", "Medalha com flores", "Degustação de frutas na chegada", "Passeio pelo Jardim Botânico"]'::jsonb,
  '["/images/gallery/curitiba-1.jpg", "/images/gallery/curitiba-2.jpg"]'::jsonb,
  '{"map_url": "/routes/curitiba-2026.gpx", "elevation_profile": "/images/routes/curitiba-elevation.png", "difficulty": "easy"}'::jsonb,
  '["Camiseta com estampa floral", "Medalha com flores secas", "Número de peito", "Semente de árvore para plantar"]'::jsonb,
  '[
    {"time": "06:00", "title": "Abertura", "description": "Recepção no Parque Tanguá"},
    {"time": "07:00", "title": "Largada", "description": "Corrida pelos parques"},
    {"time": "10:00", "title": "Festa", "description": "Degustação e premiação"}
  ]'::jsonb,
  '{"sponsors": [{"name": "Sadia", "logo": "/images/sponsors/sadia.png"}]}'::jsonb
),

-- Maratona de Brasília
(
  'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f80',
  '["Plano e rápido - quebra recordes", "Pelo Eixo Monumental", "Arquitetura de Niemeyer", "Recepção profissional", "Paisagem única de Brasília"]'::jsonb,
  '["/images/gallery/brasilia-1.jpg", "/images/gallery/brasilia-2.jpg"]'::jsonb,
  '{"map_url": "/routes/brasilia-2026.gpx", "elevation_profile": "/images/routes/brasilia-elevation.png", "difficulty": "easy"}'::jsonb,
  '["Camiseta técnica oficial", "Medalha de Finisher", "Número de peito", "Chip de cronometragem"]'::jsonb,
  '[
    {"time": "05:00", "title": "Inscrição", "description": "Recepção na Esplanada"},
    {"time": "06:00", "title": "Largada", "description": "Início da maratona"},
    {"time": "12:00", "title": "Premiação", "description": "Cerimônia no Congresso"}
  ]'::jsonb,
  '{"sponsors": [{"name": "Banco do Brasil", "logo": "/images/sponsors/bb.png"}]}'::jsonb
),

-- Corrida da Uva
(
  'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8091',
  '["Percorrida por vinícolas", "Degustação de vinhos na chegada", "Paisagens do Vale dos Vinhedos", "Medalha com cacho de uva", "Experiência gastronômica"]'::jsonb,
  '["/images/gallery/bento-1.jpg", "/images/gallery/bento-2.jpg"]'::jsonb,
  '{"map_url": "/routes/bento-2026.gpx", "elevation_profile": "/images/routes/bento-elevation.png", "difficulty": "moderate"}'::jsonb,
  '["Camiseta com estampa de uva", "Medalha com cacho de uva", "Cálice de vinho comemorativo", "Cupom de degustação"]'::jsonb,
  '[
    {"time": "07:00", "title": "Recepção", "description": "Credenciamento nos vinhedos"},
    {"time": "08:00", "title": "Largada", "description": "Corrida pelas vinícolas"},
    {"time": "12:00", "title": "Festa da Uva", "description": "Degustação e premiação"}
  ]'::jsonb,
  '{"sponsors": [{"name": "Salton", "logo": "/images/sponsors/salton.png"}]}'::jsonb
),

-- São Silvestre 2026
(
  'f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f809102',
  '["Clássico de fim de ano", "Tradição desde 1925", "Percorrida pelo centro ao Morumbi", "Celebração de Réveillon esportivo", "Participantes de todo o Brasil"]'::jsonb,
  '["/images/gallery/silvestre-1.jpg", "/images/gallery/silvestre-2.jpg"]'::jsonb,
  '{"map_url": "/routes/silvestre-2026.gpx", "elevation_profile": "/images/routes/silvestre-elevation.png", "difficulty": "hard"}'::jsonb,
  '["Camiseta oficial São Silvestre", "Medalha comemorativa", "Número de peito", "Kit completo do participante"]'::jsonb,
  '[
    {"time": "07:00", "title": "Recepção", "description": "Praça da Sé"},
    {"time": "08:00", "title": "Largada", "description": "Início da corrida"},
    {"time": "12:00", "title": "Premiação", "description": "Estádio do Morumbi"}
  ]'::jsonb,
  '{"sponsors": [{"name": "Petrobras", "logo": "/images/sponsors/petrobras.png"}, {"name": "Nestlé", "logo": "/images/sponsors/nestle.png"}]}'::jsonb
),

-- Carnaval Run
(
  'a7b8c9d0-e1f2-4a5b-4c5d-6e7f80910213',
  '["Espírito de carnaval", "Blocos musicais no percurso", "Percorrida colorida", "Degustação de frutas tropicais", "Celebração do esporte"]'::jsonb,
  '["/images/gallery/recife-1.jpg", "/images/gallery/recife-2.jpg"]'::jsonb,
  '{"map_url": "/routes/recife-2026.gpx", "elevation_profile": "/images/routes/recife-elevation.png", "difficulty": "easy"}'::jsonb,
  '["Camiseta com estampa tropical", "Chapéu de carnaval", "Número de peito", "Bolinha de confete"]'::jsonb,
  '[
    {"time": "06:00", "title": "Recepção", "description": "Marco Zero"},
    {"time": "07:00", "title": "Largada", "description": "Corrida animada"},
    {"time": "10:00", "title": "Festa", "description": "Apresentação musical"}
  ]'::jsonb,
  '{"sponsors": [{"name": "Brahma", "logo": "/images/sponsors/brahma.png"}]}'::jsonb
),

-- Ultra Trail Serra da Mantiqueira
(
  'b8c9d0e1-f2a3-4b5c-5d6e-7f8091021324',
  '["Ultra trail de 80km", "Paisagens da Serra da Mantiqueira", "Trilhas desafiadoras", "Ponto de apoio a cada 10km", "Medalha de finisher ultra"]'::jsonb,
  '["/images/gallery/mantiqueira-1.jpg", "/images/gallery/mantiqueira-2.jpg"]'::jsonb,
  '{"map_url": "/routes/mantiqueira-2026.gpx", "elevation_profile": "/images/routes/mantiqueira-elevation.png", "difficulty": "very_hard"}'::jsonb,
  '["Camiseta técnica de longa distância", "Medalha de finisher", "Kit de emergência", "Garrafa reutilizável"]'::jsonb,
  '[
    {"time": "04:00", "title": "Check-in", "description": "Verificação de equipamentos"},
    {"time": "05:00", "title": "Largada", "description": "Início da ultra trail"},
    {"time": "20:00", "title": "Premiação", "description": "Cerimônia para finishers"}
  ]'::jsonb,
  '{"sponsors": [{"name": "Columbia", "logo": "/images/sponsors/columbia.png"}]}'::jsonb
);

-- ============================================================
-- SEED DATA - TESTIMONIALS
-- ============================================================
INSERT INTO testimonials (author_name, author_role, author_initials, text, rating) VALUES

('Ana Souza', 'Corredora Amadora', 'AS',
 'Inscrição super fácil e organizada! A NVR Sports é incrível, do cadastro ao final da corrida tudo foi muito bem planejado.', 5),

('Carlos Lima', 'Atleta Profissional', 'CL',
 'A melhor plataforma de inscrição que já usei. Tudo muito bem organizado e com suporte excelente.', 5),

('Maria Oliveira', 'Corredora de Rua', 'MO',
 'Adorei a experiência! A inscrição foi rápida e o evento superou minhas expectativas.', 5),

('Pedro Santos', 'Triatleta', 'PS',
 'NVR Sports entrega sempre a melhor experiência. Recomendo para todos os amantes da corrida.', 4),

('Juliana Costa', 'Corredora de Trail', 'JC',
 'Plataforma intuitiva e eventos incríveis. Já me inscrevi em 3 corridas pela NVR.', 5),

('Roberto Almeida', 'Maratonista', 'RA',
 'Excelente organização e comunicação. Recebi todas as informações a tempo. Nota 10!', 5);
