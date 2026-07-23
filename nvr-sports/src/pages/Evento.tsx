import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Event, EventCategory } from '../types/database'

type Tab = 'sobre' | 'categorias' | 'percursos' | 'kit' | 'cronograma' | 'patrocinadores'

const tabs: { key: Tab; label: string }[] = [
  { key: 'sobre', label: 'Sobre' },
  { key: 'categorias', label: 'Categorias' },
  { key: 'percursos', label: 'Percursos' },
  { key: 'kit', label: 'Kit do Atleta' },
  { key: 'cronograma', label: 'Cronograma' },
  { key: 'patrocinadores', label: 'Patrocinadores' },
]

const statusLabels: Record<string, string> = {
  upcoming: 'Em breve',
  ongoing: 'Acontecendo',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
}

const statusColors: Record<string, string> = {
  upcoming: '#FF0000',
  ongoing: '#10B981',
  completed: '#6B7280',
  cancelled: '#EF4444',
}

const tierLabels: Record<string, string> = {
  gold: '🥇 Ouro',
  silver: '🥈 Prata',
  bronze: '🥉 Bronze',
  main: '⭐ Principal',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function iconToEmoji(icon: string) {
  const map: Record<string, string> = {
    'bi-geo-alt': '📍',
    'bi-calendar': '📅',
    'bi-people': '👥',
    'bi-clock': '🕐',
    'bi-award': '🏆',
    'bi-water': '💧',
    'bi-cup-hot': '☕',
    'bi-trophy': '🏆',
    'bi-map': '🗺️',
    'bi-camera': '📸',
    'bi-star': '⭐',
    'bi-gift': '🎁',
    'bi-check-circle': '✅',
  }
  return map[icon] || '📌'
}

function computeCountdown(dateStr: string) {
  const target = new Date(dateStr + 'T00:00:00').getTime()
  const now = Date.now()
  const diff = target - now
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 }
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  return { days, hours, minutes }
}

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`

const Hero = styled.section`
  position: relative;
  padding: ${({ theme }) => theme.space[16]} ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[12]};
  background: linear-gradient(135deg, #FF0000 0%, #000000 50%, #1A0A0A 100%);
  color: ${({ theme }) => theme.colors.white};
`

const HeroInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`

const Badges = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[4]};
  flex-wrap: wrap;
`

const Badge = styled.span<{ $bg: string }>`
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[3]};
  background: ${({ $bg }) => $bg};
  color: #fff;
  font-size: ${({ theme }) => theme.font.sizes.xs};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  border-radius: ${({ theme }) => theme.radius.full};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`

const HeroTitle = styled.h1`
  font-size: ${({ theme }) => theme.font.sizes['4xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  margin-bottom: ${({ theme }) => theme.space[3]};
  font-family: ${({ theme }) => theme.font.headingFamily};
  text-transform: uppercase;
  letter-spacing: 0.02em;
`

const HeroDesc = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.lg};
  opacity: 0.85;
  max-width: 700px;
  margin-bottom: ${({ theme }) => theme.space[6]};
  line-height: 1.6;
  font-family: ${({ theme }) => theme.font.headingFamily};
`

const MetaGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[6]};
`

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.font.sizes.base};
  opacity: 0.9;

  span:first-child {
    font-size: ${({ theme }) => theme.font.sizes.xl};
  }
`

const TabsBar = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.space[4]};
  display: flex;
  gap: 0;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
`

const TabBtn = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[5]};
  border: none;
  border-bottom: 3px solid ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
  background: transparent;
  color: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.textSecondary)};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  cursor: pointer;
  white-space: nowrap;
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`

const BodyLayout = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space[8]} ${({ theme }) => theme.space[4]};
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: ${({ theme }) => theme.space[8]};
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`

const MainContent = styled.div`
  min-width: 0;
`

const Sidebar = styled.aside`
  position: sticky;
  top: ${({ theme }) => theme.space[4]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`

const CtaButton = styled(Link)`
  display: block;
  text-align: center;
  padding: ${({ theme }) => theme.space[4]};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.font.sizes.lg};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  border-radius: ${({ theme }) => theme.radius.lg};
  text-decoration: none;
  transition: background ${({ theme }) => theme.transition.fast};
  text-transform: uppercase;
  letter-spacing: 0.04em;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`

const SummaryCard = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.space[6]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`

const SummaryTitle = styled.h3`
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.text};
`

const SummaryRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};

  span:first-child {
    font-size: ${({ theme }) => theme.font.sizes.lg};
    width: 24px;
    text-align: center;
  }
`

const CountdownGrid = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[3]};
  justify-content: center;
`

const CdBlock = styled.div`
  text-align: center;
`

const CdNum = styled.div`
  font-size: ${({ theme }) => theme.font.sizes['2xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.primary};
  line-height: 1;
`

const CdLabel = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.space[1]};
`

const ShareRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]};
  justify-content: center;
`

const ShareBtn = styled.button`
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[3]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.sizes['2xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[6]};
  font-family: ${({ theme }) => theme.font.headingFamily};
  text-transform: uppercase;
  letter-spacing: 0.02em;
`

const DescriptionText = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.base};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.8;
  margin-bottom: ${({ theme }) => theme.space[8]};
`

const HighlightsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.space[4]};
  margin-bottom: ${({ theme }) => theme.space[8]};

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const HighlightCard = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.space[5]};
  display: flex;
  gap: ${({ theme }) => theme.space[3]};
  align-items: flex-start;
`

const HighlightIcon = styled.span`
  font-size: ${({ theme }) => theme.font.sizes['2xl']};
  line-height: 1;
  flex-shrink: 0;
`

const HighlightTitle = styled.h4`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[1]};
`

const HighlightDesc = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
`

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.space[3]};
  margin-bottom: ${({ theme }) => theme.space[8]};

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const GalleryImg = styled.img`
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radius.lg};
`

const MapPlaceholder = styled.div`
  width: 100%;
  height: 300px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.font.sizes.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const CategoryCard = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.space[6]};
  margin-bottom: ${({ theme }) => theme.space[4]};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[4]};
`

const CatInfo = styled.div``

const CatName = styled.h3`
  font-size: ${({ theme }) => theme.font.sizes.xl};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[1]};
`

const CatMeta = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const CatDesc = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.space[2]};
  line-height: 1.5;
`

const CatPrice = styled.div`
  font-size: ${({ theme }) => theme.font.sizes['2xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.primary};
  white-space: nowrap;
`

const RouteCard = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.space[6]};
  margin-bottom: ${({ theme }) => theme.space[4]};
`

const RouteDistanceBadge = styled.span`
  display: inline-block;
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[3]};
  background: ${({ theme }) => theme.colors.primary}18;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.font.sizes.xs};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  border-radius: ${({ theme }) => theme.radius.full};
  margin-bottom: ${({ theme }) => theme.space[2]};
`

const RouteTitle = styled.h3`
  font-size: ${({ theme }) => theme.font.sizes.lg};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[1]};
`

const RouteSubtitle = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.accent};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  margin-bottom: ${({ theme }) => theme.space[2]};
`

const RouteDesc = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
`

const kitImages: Record<string, string> = {
  'camiseta': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&q=80',
  'medalha': 'https://images.unsplash.com/photo-1584813636634-4d4f66e4c3dc?w=300&q=80',
  'número': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&q=80',
  'chip': 'https://images.unsplash.com/photo-1576444356170-66073FEF4C07?w=300&q=80',
  'saco': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&q=80',
  'guia': 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&q=80',
  'default': 'https://images.unsplash.com/photo-1576444356170-66073FEF4C07?w=300&q=80',
}

function getKitImage(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, url] of Object.entries(kitImages)) {
    if (lower.includes(key)) return url
  }
  return kitImages.default
}

const KitGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: ${({ theme }) => theme.space[4]};
`

const KitItemCard = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.space[5]};
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  overflow: hidden;
  transition: transform ${({ theme }) => theme.transition.fast};

  &:hover {
    transform: translateY(-4px);
  }
`

const KitImg = styled.img`
  width: 80px;
  height: 80px;
  border-radius: ${({ theme }) => theme.radius.full};
  object-fit: cover;
  border: 2px solid ${({ theme }) => theme.colors.border};
`

const KitName = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  color: ${({ theme }) => theme.colors.text};
`

const Timeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`

const TimelineItem = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[4]};
  padding: ${({ theme }) => theme.space[4]} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`

const TimelineTime = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.primary};
  white-space: nowrap;
  min-width: 70px;
`

const TimelineBody = styled.div``

const TimelineTitle = styled.h4`
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[1]};
`

const TimelineDesc = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
`

const TierSection = styled.div`
  margin-bottom: ${({ theme }) => theme.space[6]};
`

const TierTitle = styled.h3`
  font-size: ${({ theme }) => theme.font.sizes.lg};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[3]};
`

const SponsorsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[3]};
`

const SponsorChip = styled.span`
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[4]};
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  color: ${({ theme }) => theme.colors.text};
`

const LoadingWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  font-size: ${({ theme }) => theme.font.sizes.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ErrorWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: ${({ theme }) => theme.space[4]};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: ${({ theme }) => theme.font.weights.semibold};

  &:hover {
    text-decoration: underline;
  }
`

export default function Evento() {
  const { slug } = useParams<{ slug: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('sobre')
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 })

  useEffect(() => {
    async function load() {
      if (!slug) return
      setLoading(true)
      const { data, error: err } = await supabase
        .from('events')
        .select('*, categories:event_categories(*), details:event_details(*)')
        .eq('slug', slug)
        .single()
      if (err || !data) {
        setError(true)
      } else {
        setEvent(data as Event)
      }
      setLoading(false)
    }
    load()
  }, [slug])

  useEffect(() => {
    if (!event) return
    setCountdown(computeCountdown(event.date))
    const id = setInterval(() => setCountdown(computeCountdown(event.date)), 60000)
    return () => clearInterval(id)
  }, [event])

  if (loading) return <Page><LoadingWrap>Carregando evento...</LoadingWrap></Page>
  if (error || !event) {
    return (
      <Page>
        <ErrorWrap>
          <p>Evento não encontrado.</p>
          <BackLink to="/eventos">← Voltar para Eventos</BackLink>
        </ErrorWrap>
      </Page>
    )
  }

  const details = event.details
  const distances = event.categories
    ? event.categories.map(c => `${c.distance_km}K`).join(' · ')
    : ''

  const minPrice = event.categories?.length
    ? Math.min(...event.categories.map(c => c.price))
    : null

  return (
    <Page>
      <Hero>
        <HeroInner>
          <Badges>
            <Badge $bg="#FF0000">{event.categories?.[0]?.name ?? 'Evento'}</Badge>
            <Badge $bg={statusColors[event.status] || '#6B7280'}>{statusLabels[event.status] || event.status}</Badge>
          </Badges>
          <HeroTitle>{event.title}</HeroTitle>
          <HeroDesc>{event.description}</HeroDesc>
          <MetaGrid>
            <MetaItem><span>📍</span> {event.location}, {event.city}/{event.state}</MetaItem>
            <MetaItem><span>📅</span> {formatDate(event.date)}</MetaItem>
            {event.categories && (
              <MetaItem><span>🏃</span> {event.categories.length} categoria(s)</MetaItem>
            )}
            {distances && <MetaItem><span>📏</span> {distances}</MetaItem>}
          </MetaGrid>
        </HeroInner>
      </Hero>

      <TabsBar>
        {tabs.map(t => (
          <TabBtn key={t.key} $active={activeTab === t.key} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </TabBtn>
        ))}
      </TabsBar>

      <BodyLayout>
        <MainContent>
          {activeTab === 'sobre' && (
            <>
              <SectionTitle>Sobre o Evento</SectionTitle>
              <DescriptionText>{event.description}</DescriptionText>

              {details?.highlights && details.highlights.length > 0 && (
                <>
                  <HighlightsGrid>
                    {details.highlights.map((h, i) => {
                      const highlight = typeof h === 'string' ? { title: h, description: '', icon: 'pin' } : h
                      return (
                        <HighlightCard key={i}>
                          <HighlightIcon>{iconToEmoji(highlight.icon)}</HighlightIcon>
                          <div>
                            <HighlightTitle>{highlight.title}</HighlightTitle>
                            {highlight.description && <HighlightDesc>{highlight.description}</HighlightDesc>}
                          </div>
                        </HighlightCard>
                      )
                    })}
                  </HighlightsGrid>
                </>
              )}

              {details?.gallery_images && details.gallery_images.length > 0 && (
                <GalleryGrid>
                  {details.gallery_images.map((img, i) => (
                    <GalleryImg key={i} src={img} alt={`Galeria ${i + 1}`} loading="lazy" />
                  ))}
                </GalleryGrid>
              )}

              <SectionTitle>Localização</SectionTitle>
              <MapPlaceholder>📍 Mapa — {event.location}, {event.city}/{event.state}</MapPlaceholder>
            </>
          )}

          {activeTab === 'categorias' && (
            <>
              <SectionTitle>Categorias</SectionTitle>
              {event.categories?.map(cat => (
                <CategoryCard key={cat.id}>
                  <CatInfo>
                    <CatName>{cat.name}</CatName>
                    <CatMeta>{cat.distance_km} km · {cat.max_participants ? `Até ${cat.max_participants} atletas` : 'Vagas ilimitadas'}</CatMeta>
                    {cat.description && <CatDesc>{cat.description}</CatDesc>}
                  </CatInfo>
                  <CatPrice>{cat.price === 0 ? 'Grátis' : `R$ ${cat.price.toFixed(2)}`}</CatPrice>
                </CategoryCard>
              ))}
            </>
          )}

          {activeTab === 'percursos' && (
            <>
              <SectionTitle>Percursos</SectionTitle>
              {details?.routes ? (
                <RouteCard>
                  <RouteDistanceBadge>{(details.routes as Record<string, string>).difficulty || 'Moderado'}</RouteDistanceBadge>
                  <RouteTitle>{event.title} — Percurso Oficial</RouteTitle>
                  <RouteSubtitle>📍 {event.location}, {event.city}/{event.state}</RouteSubtitle>
                  <RouteDesc>
                    Confira o mapa oficial do percurso. Dificuldade: {(details.routes as Record<string, string>).difficulty || 'Não informado'}.
                    O percurso foi planejado para proporcionar uma experiência única aos participantes.
                  </RouteDesc>
                </RouteCard>
              ) : (
                <DescriptionText>Informações de percursos não disponíveis no momento.</DescriptionText>
              )}
            </>
          )}

          {activeTab === 'kit' && (
            <>
              <SectionTitle>Kit do Atleta</SectionTitle>
              {details?.kit_items && details.kit_items.length > 0 ? (
                <KitGrid>
                  {details.kit_items.map((item, i) => {
                    const kitItem = typeof item === 'string' ? item : item.name
                    return (
                      <KitItemCard key={i}>
                        <KitImg src={getKitImage(kitItem)} alt={kitItem} loading="lazy" />
                        <KitName>{kitItem}</KitName>
                      </KitItemCard>
                    )
                  })}
                </KitGrid>
              ) : (
                <DescriptionText>Informações do kit não disponíveis no momento.</DescriptionText>
              )}
            </>
          )}

          {activeTab === 'cronograma' && (
            <>
              <SectionTitle>Cronograma</SectionTitle>
              {details?.schedule && details.schedule.length > 0 ? (
                <Timeline>
                  {details.schedule.map((item, i) => (
                    <TimelineItem key={i}>
                      <TimelineTime>{item.time}</TimelineTime>
                      <TimelineBody>
                        <TimelineTitle>{item.title}</TimelineTitle>
                        <TimelineDesc>{item.description}</TimelineDesc>
                      </TimelineBody>
                    </TimelineItem>
                  ))}
                </Timeline>
              ) : (
                <DescriptionText>Cronograma não disponível no momento.</DescriptionText>
              )}
            </>
          )}

          {activeTab === 'patrocinadores' && (
            <>
              <SectionTitle>Patrocinadores</SectionTitle>
              {details?.sponsors && details.sponsors.length > 0 ? (
                details.sponsors.map((tier, i) => (
                  <TierSection key={i}>
                    <TierTitle>{tierLabels[tier.tier] || tier.tier}</TierTitle>
                    <SponsorsList>
                      {tier.names.map((name, j) => (
                        <SponsorChip key={j}>{name}</SponsorChip>
                      ))}
                    </SponsorsList>
                  </TierSection>
                ))
              ) : (
                <DescriptionText>Informações de patrocinadores não disponíveis.</DescriptionText>
              )}
            </>
          )}
        </MainContent>

        <Sidebar>
          <CtaButton to={`/checkout/${event.slug}`}>
            QUERO ME INSCREVER
          </CtaButton>

          <SummaryCard>
            <SummaryTitle>Resumo do Evento</SummaryTitle>
            <SummaryRow><span>📅</span> {formatDate(event.date)}</SummaryRow>
            <SummaryRow><span>🕐</span> {event.time}</SummaryRow>
            <SummaryRow><span>📍</span> {event.location}, {event.city}</SummaryRow>
            {distances && <SummaryRow><span>📏</span> {distances}</SummaryRow>}
            {minPrice !== null && (
              <SummaryRow>
                <span>💰</span>
                {minPrice === 0 ? 'Grátis' : `A partir de R$ ${minPrice.toFixed(2)}`}
              </SummaryRow>
            )}
          </SummaryCard>

          <SummaryCard>
            <SummaryTitle>Contagem Regressiva</SummaryTitle>
            <CountdownGrid>
              <CdBlock><CdNum>{countdown.days}</CdNum><CdLabel>dias</CdLabel></CdBlock>
              <CdBlock><CdNum>{countdown.hours}</CdNum><CdLabel>horas</CdLabel></CdBlock>
              <CdBlock><CdNum>{countdown.minutes}</CdNum><CdLabel>min</CdLabel></CdBlock>
            </CountdownGrid>
          </SummaryCard>

          <SummaryCard>
            <SummaryTitle>Compartilhar</SummaryTitle>
            <ShareRow>
              <ShareBtn>Facebook</ShareBtn>
              <ShareBtn>Twitter</ShareBtn>
              <ShareBtn>WhatsApp</ShareBtn>
              <ShareBtn>Link</ShareBtn>
            </ShareRow>
          </SummaryCard>
        </Sidebar>
      </BodyLayout>
    </Page>
  )
}
