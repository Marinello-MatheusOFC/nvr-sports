import { useState, useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Event, Testimonial } from '../types/database'
import { EventCard } from '../components/EventCard'

const filterTags = ['Todos', 'Road Run', 'Trail Run', 'Ultramaratona', '5K', '10K', '21K', '42K']

const faqData = [
  {
    question: 'Como faço minha inscrição?',
    answer: 'Escolha o evento desejado, selecione a categoria, preencha seus dados pessoais e efetue o pagamento. Você receberá uma confirmação por e-mail com todos os detalhes.',
  },
  {
    question: 'Posso cancelar minha inscrição?',
    answer: 'Sim, o cancelamento pode ser feito até 30 dias antes do evento para reembolso integral. Entre 15 e 30 dias, haverá retenção de 50%. Menos de 15 dias não há reembolso.',
  },
  {
    question: 'O que está incluído no kit do atleta?',
    answer: 'O kit inclui camisa do evento, medalha de participação, chip de cronometragem, numeração, e itens patrocinadores. O conteúdo pode variar conforme o evento.',
  },
  {
    question: 'Quais formas de pagamento são aceitas?',
    answer: 'Aceitamos cartão de crédito (até 6x sem juros), PIX com desconto de 10%, e boleto bancário com prazo de 3 dias úteis para compensação.',
  },
  {
    question: 'Recebo certificado de participação?',
    answer: 'Sim! Todos os participantes que cruzarem a linha de chegada receberão certificado digital, disponível para download na sua área do atleta após o evento.',
  },
]

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const marquee = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`

const scrollBounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(8px); }
`

const Section = styled.section`
  padding: ${({ theme }) => theme.space[16]} ${({ theme }) => theme.space[6]};
  max-width: 1200px;
  margin: 0 auto;
`

const SectionLabel = styled.span`
  display: inline-block;
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.primary}12;
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[3]};
  border-radius: ${({ theme }) => theme.radius.full};
  margin-bottom: ${({ theme }) => theme.space[4]};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.sizes['3xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[3]};
  line-height: 1.2;
  font-family: ${({ theme }) => theme.font.headingFamily};
  text-transform: uppercase;
  letter-spacing: 0.02em;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.font.sizes['2xl']};
  }
`

const SectionSubtitle = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 600px;
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.space[12]};
  font-family: ${({ theme }) => theme.font.headingFamily};
`

// ── Hero ──

const Hero = styled.section`
  position: relative;
  min-height: calc(100vh - 155px);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, #000000 60%, #1A0A0A 100%);
  overflow: hidden;
  padding: ${({ theme }) => theme.space[6]};
`

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  max-width: 800px;
  animation: ${fadeInUp} 0.8s ease both;
`

const HeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[4]};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.white};
  margin-top: ${({ theme }) => theme.space[4]};
  margin-bottom: ${({ theme }) => theme.space[8]};
`

const HeroTitle = styled.h1`
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.white};
  line-height: 1.1;
  margin-bottom: ${({ theme }) => theme.space[6]};
  font-family: ${({ theme }) => theme.font.headingFamily};
  text-transform: uppercase;
  letter-spacing: 0.02em;

  span {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const HeroSubtitle = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.xl};
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.space[10]};
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  font-family: ${({ theme }) => theme.font.headingFamily};

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.font.sizes.lg};
  }
`

const HeroButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[4]};
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.space[12]};
`

const PrimaryBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[8]};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  border-radius: ${({ theme }) => theme.radius.lg};
  text-decoration: none;
  transition: background ${({ theme }) => theme.transition.base},
              transform ${({ theme }) => theme.transition.base};

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
    transform: translateY(-2px);
  }
`

const OutlineBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[8]};
  background: transparent;
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: ${({ theme }) => theme.radius.lg};
  text-decoration: none;
  transition: background ${({ theme }) => theme.transition.base},
              border-color ${({ theme }) => theme.transition.base};

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: ${({ theme }) => theme.colors.white};
  }
`

const Countdown = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[4]};
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.space[10]};
  flex-wrap: wrap;
`

const CountdownItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 70px;
`

const CountdownNumber = styled.span`
  font-size: ${({ theme }) => theme.font.sizes['4xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.white};
  line-height: 1;
  background: rgba(255, 255, 255, 0.08);
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[4]};
  min-width: 70px;
  text-align: center;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const CountdownLabel = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.xs};
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: ${({ theme }) => theme.space[2]};
`

const ScrollIndicator = styled.div`
  position: absolute;
  bottom: ${({ theme }) => theme.space[8]};
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: ${({ theme }) => theme.font.sizes.xl};
  animation: ${scrollBounce} 2s ease-in-out infinite;
  cursor: pointer;
`

// ── Stats ──

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.space[8]};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.space[6]};
  }
`

const StatCard = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.space[8]};
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

const StatNumber = styled.span<{ $color: string }>`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ $color }) => $color};
  display: block;
  margin-bottom: ${({ theme }) => theme.space[2]};
`

const StatLabel = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.base};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.font.weights.medium};
`

// ── About ──

const AboutGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space[12]};
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const AboutText = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[6]};
`

const AboutDescription = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.7;
`

const ValueCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`

const ValueCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[4]};
  padding: ${({ theme }) => theme.space[4]};
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
`

const ValueIcon = styled.span`
  font-size: ${({ theme }) => theme.font.sizes['2xl']};
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.primary}12;
  border-radius: ${({ theme }) => theme.radius.md};
`

const ValueContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`

const ValueTitle = styled.h4`
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
`

const ValueText = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
`

const AboutImage = styled.div`
  position: relative;
  border-radius: ${({ theme }) => theme.radius.xl};
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    min-height: 400px;
    background: ${({ theme }) => theme.colors.border};
  }

  @media (max-width: 900px) {
    order: -1;
  }
`

const ExperienceBadge = styled.div`
  position: absolute;
  bottom: ${({ theme }) => theme.space[6]};
  right: ${({ theme }) => theme.space[6]};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[5]};
  border-radius: ${({ theme }) => theme.radius.lg};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  font-size: ${({ theme }) => theme.font.sizes.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`

// ── Events ──

const FilterChips = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]};
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.space[8]};
`

const Chip = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[4]};
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.border)};
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.card)};
  color: ${({ $active, theme }) => ($active ? theme.colors.white : theme.colors.textSecondary)};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.base};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ $active, theme }) => ($active ? theme.colors.white : theme.colors.primary)};
  }
`

const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: ${({ theme }) => theme.space[6]};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const EventsFooter = styled.div`
  text-align: center;
  margin-top: ${({ theme }) => theme.space[10]};
`

// ── Sponsors ──

const SponsorsWrap = styled.div`
  overflow: hidden;
  padding: ${({ theme }) => theme.space[12]} 0;
  background: ${({ theme }) => theme.colors.background};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const MarqueeTrack = styled.div`
  display: flex;
  width: max-content;
  animation: ${marquee} 25s linear infinite;

  &:hover {
    animation-play-state: paused;
  }
`

const SponsorItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.space[6]} ${({ theme }) => theme.space[10]};
  font-size: ${({ theme }) => theme.font.sizes['2xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.textSecondary};
  opacity: 0.5;
  white-space: nowrap;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: opacity ${({ theme }) => theme.transition.base};
  user-select: none;

  &:hover {
    opacity: 1;
  }
`

// ── Testimonials ──

const TestimonialsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: ${({ theme }) => theme.space[6]};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const TestimonialCard = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.space[6]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

const TestimonialStars = styled.div`
  color: ${({ theme }) => theme.colors.accent};
  font-size: ${({ theme }) => theme.font.sizes.lg};
  letter-spacing: 2px;
`

const TestimonialQuote = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.base};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.7;
  font-style: italic;
  flex: 1;
`

const TestimonialAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  padding-top: ${({ theme }) => theme.space[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const AuthorAvatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${({ theme }) => theme.font.weights.bold};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  flex-shrink: 0;
`

const AuthorInfo = styled.div`
  display: flex;
  flex-direction: column;
`

const AuthorName = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
`

const AuthorRole = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

// ── FAQ ──

const FAQList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
  max-width: 800px;
  margin: 0 auto;
`

const FAQItem = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
`

const FAQQuestion = styled.button<{ $open: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space[5]};
  background: none;
  border: none;
  cursor: pointer;
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
  text-align: left;
  transition: background ${({ theme }) => theme.transition.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`

const FAQArrow = styled.span<{ $open: boolean }>`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: transform ${({ theme }) => theme.transition.base};
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0)')};
`

const FAQAnswer = styled.div<{ $open: boolean }>`
  max-height: ${({ $open }) => ($open ? '200px' : '0')};
  overflow: hidden;
  transition: max-height ${({ theme }) => theme.transition.slow};
`

const FAQAnswerInner = styled.p`
  padding: 0 ${({ theme }) => theme.space[5]} ${({ theme }) => theme.space[5]};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.7;
`

// ── CTA Banner ──

const CTABanner = styled.section`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, #000000 100%);
  padding: ${({ theme }) => theme.space[16]} ${({ theme }) => theme.space[6]};
  text-align: center;
  border-radius: ${({ theme }) => theme.radius['2xl']};
  margin: 0 ${({ theme }) => theme.space[6]};
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
`

const CTATitle = styled.h2`
  font-size: ${({ theme }) => theme.font.sizes['3xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.white};
  margin-bottom: ${({ theme }) => theme.space[4]};
  font-family: ${({ theme }) => theme.font.headingFamily};
  text-transform: uppercase;
  letter-spacing: 0.02em;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.font.sizes['2xl']};
  }
`

const CTASubtitle = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.lg};
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: ${({ theme }) => theme.space[8]};
  font-family: ${({ theme }) => theme.font.headingFamily};
`

// ── Map ──

const MapSection = styled.section`
  padding: ${({ theme }) => theme.space[12]} ${({ theme }) => theme.space[6]};
  max-width: 1200px;
  margin: 0 auto;
`

const MapFrame = styled.iframe`
  width: 100%;
  height: 400px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadows.md};
`

// ── Component ──

function useCountUp(target: number, duration: number, inView: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start = 0
    const startTime = performance.now()

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  }, [target, duration, inView])

  return count
}

function StatItem({ value, suffix, label, color }: { value: number; suffix: string; label: string; color: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const count = useCountUp(value, 2000, inView)

  return (
    <StatCard ref={ref}>
      <StatNumber $color={color}>
        {count.toLocaleString('pt-BR')}{suffix}
      </StatNumber>
      <StatLabel>{label}</StatLabel>
    </StatCard>
  )
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const target = new Date('2026-08-15T07:00:00').getTime()

    const tick = () => {
      const now = Date.now()
      const diff = Math.max(0, target - now)
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    supabase
      .from('events')
      .select('*, categories:event_categories(*)')
      .order('date')
      .then(({ data }) => {
        if (data) setEvents(data)
      })
  }, [])

  useEffect(() => {
    supabase
      .from('testimonials')
      .select('*')
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) setTestimonials(data)
      })
  }, [])

  const filteredEvents =
    activeFilter === 'Todos'
      ? events.slice(0, 6)
      : events
          .filter((e) =>
            e.categories?.some((c) =>
              c.name.toLowerCase().includes(activeFilter.toLowerCase())
            )
          )
          .slice(0, 6)

  const sponsors = ['NIKE', 'ADIDAS', 'GARMIN', 'ASICS', 'SALOMON', 'COLUMBIA', 'UNDER ARMOUR', 'NEW BALANCE']

  return (
    <>
      {/* ── Hero ── */}
      <Hero>
        <HeroContent>
          <HeroBadge>⚡ Próxima prova: 15 de Agosto 2026</HeroBadge>
          <HeroTitle>
            Corra. Supere. <span>Conquiste.</span>
          </HeroTitle>
          <HeroSubtitle>
            A plataforma de inscrições para provas de corrida que conecta atletas, 
            desafios e experiências inesquecíveis. Do 5K ao ultramaratona.
          </HeroSubtitle>

          <Countdown>
            <CountdownItem>
              <CountdownNumber>{String(countdown.days).padStart(2, '0')}</CountdownNumber>
              <CountdownLabel>Dias</CountdownLabel>
            </CountdownItem>
            <CountdownItem>
              <CountdownNumber>{String(countdown.hours).padStart(2, '0')}</CountdownNumber>
              <CountdownLabel>Horas</CountdownLabel>
            </CountdownItem>
            <CountdownItem>
              <CountdownNumber>{String(countdown.minutes).padStart(2, '0')}</CountdownNumber>
              <CountdownLabel>Min</CountdownLabel>
            </CountdownItem>
            <CountdownItem>
              <CountdownNumber>{String(countdown.seconds).padStart(2, '0')}</CountdownNumber>
              <CountdownLabel>Seg</CountdownLabel>
            </CountdownItem>
          </Countdown>

          <HeroButtons>
            <PrimaryBtn to="/eventos">Inscreva-se Agora</PrimaryBtn>
            <OutlineBtn to="/eventos">Conheça os Eventos</OutlineBtn>
          </HeroButtons>
        </HeroContent>
        <ScrollIndicator>↓</ScrollIndicator>
      </Hero>

      {/* ── Stats ── */}
      <Section>
        <StatsRow>
          <StatItem value={20000} suffix="+" label="Atletas Ativos" color="#FF0000" />
          <StatItem value={40} suffix="+" label="Provas e Desafios" color="#FF0000" />
          <StatItem value={3} suffix="" label="Professores Especializados" color="#000000" />
        </StatsRow>
      </Section>

      {/* ── About ── */}
      <Section>
        <AboutGrid>
          <AboutText>
            <div>
              <SectionLabel>Quem Somos</SectionLabel>
              <SectionTitle>
                A plataforma que conecta atletas a provas incríveis
              </SectionTitle>
            </div>
            <AboutDescription>
              Somos uma plataforma dedicada a conectar atletas de todos os níveis com as melhores 
              provas de corrida do Brasil. Desde 2018, ajudamos milhares de corredores a alcançar 
              seus objetivos, oferecendo uma experiência completa de inscrição, acompanhamento e 
              celebração da corrida.
            </AboutDescription>
            <ValueCards>
              <ValueCard>
                <ValueIcon>🎯</ValueIcon>
                <ValueContent>
                  <ValueTitle>Missão</ValueTitle>
                  <ValueText>Democratizar o acesso a provas de corrida e promover a prática esportiva saudável.</ValueText>
                </ValueContent>
              </ValueCard>
              <ValueCard>
                <ValueIcon>🔭</ValueIcon>
                <ValueContent>
                  <ValueTitle>Visão</ValueTitle>
                  <ValueText>Ser a maior plataforma de corrida da América Latina até 2030.</ValueText>
                </ValueContent>
              </ValueCard>
              <ValueCard>
                <ValueIcon>💡</ValueIcon>
                <ValueContent>
                  <ValueTitle>Valores</ValueTitle>
                  <ValueText>Inclusão, transparência, excelência e paixão por corrida.</ValueText>
                </ValueContent>
              </ValueCard>
            </ValueCards>
          </AboutText>
          <AboutImage>
            <img
              src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&h=700&fit=crop"
              alt="Atleta correndo"
            />
            <ExperienceBadge>8+ Anos de experiência</ExperienceBadge>
          </AboutImage>
        </AboutGrid>
      </Section>

      {/* ── Events ── */}
      <Section>
        <SectionLabel>Agenda</SectionLabel>
        <SectionTitle>Próximos Eventos</SectionTitle>
        <SectionSubtitle>
          Encontre a prova perfeita para o seu nível e objetivos.
        </SectionSubtitle>

        <FilterChips>
          {filterTags.map((tag) => (
            <Chip
              key={tag}
              $active={activeFilter === tag}
              onClick={() => setActiveFilter(tag)}
            >
              {tag}
            </Chip>
          ))}
        </FilterChips>

        <EventsGrid>
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </EventsGrid>

        {filteredEvents.length === 0 && (
          <p style={{ textAlign: 'center', color: '#6B7280', padding: '2rem 0' }}>
            Nenhum evento encontrado para este filtro.
          </p>
        )}

        <EventsFooter>
          <PrimaryBtn to="/eventos">Ver Todos os Eventos</PrimaryBtn>
        </EventsFooter>
      </Section>

      {/* ── Sponsors ── */}
      <SponsorsWrap>
        <MarqueeTrack>
          {[...sponsors, ...sponsors].map((name, i) => (
            <SponsorItem key={`${name}-${i}`}>{name}</SponsorItem>
          ))}
        </MarqueeTrack>
      </SponsorsWrap>

      {/* ── Testimonials ── */}
      <Section>
        <SectionLabel>Depoimentos</SectionLabel>
        <SectionTitle>O que os atletas dizem</SectionTitle>
        <SectionSubtitle>
          Histórias reais de quem já viveu a experiência NVR Sports.
        </SectionSubtitle>

        <TestimonialsGrid>
          {testimonials.map((t) => (
            <TestimonialCard key={t.id}>
              <TestimonialStars>
                {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
              </TestimonialStars>
              <TestimonialQuote>"{t.text}"</TestimonialQuote>
              <TestimonialAuthor>
                <AuthorAvatar>{t.author_initials}</AuthorAvatar>
                <AuthorInfo>
                  <AuthorName>{t.author_name}</AuthorName>
                  <AuthorRole>{t.author_role}</AuthorRole>
                </AuthorInfo>
              </TestimonialAuthor>
            </TestimonialCard>
          ))}
        </TestimonialsGrid>

        {testimonials.length === 0 && (
          <p style={{ textAlign: 'center', color: '#6B7280', padding: '2rem 0' }}>
            Nenhum depoimento disponível no momento.
          </p>
        )}
      </Section>

      {/* ── FAQ ── */}
      <Section>
        <div style={{ textAlign: 'center' }}>
          <SectionLabel>Ajuda</SectionLabel>
          <SectionTitle>Perguntas Frequentes</SectionTitle>
          <SectionSubtitle style={{ margin: '0 auto 3rem' }}>
            Tudo o que você precisa saber antes da sua corrida.
          </SectionSubtitle>
        </div>

        <FAQList>
          {faqData.map((item, index) => (
            <FAQItem key={index}>
              <FAQQuestion
                $open={activeFAQ === index}
                onClick={() => setActiveFAQ(activeFAQ === index ? null : index)}
              >
                {item.question}
                <FAQArrow $open={activeFAQ === index}>▼</FAQArrow>
              </FAQQuestion>
              <FAQAnswer $open={activeFAQ === index}>
                <FAQAnswerInner>{item.answer}</FAQAnswerInner>
              </FAQAnswer>
            </FAQItem>
          ))}
        </FAQList>
      </Section>

      {/* ── CTA Banner ── */}
      <CTABanner>
        <CTATitle>Pronto para correr?</CTATitle>
        <CTASubtitle>
          Junte-se a milhares de atletas e comece sua jornada hoje mesmo.
        </CTASubtitle>
        <PrimaryBtn to="/cadastro" style={{ background: '#fff', color: '#FF0000' }}>
          Criar Conta Grátis
        </PrimaryBtn>
      </CTABanner>

      {/* ── Map ── */}
      <MapSection>
        <SectionLabel>Localização</SectionLabel>
        <SectionTitle>Onde estamos</SectionTitle>
        <MapFrame
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1975!2d-48.5527!3d-22.2963!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sR.+Antonio+Turatti,+821+-+Cidade+Alta,+Jaú/SP!5e0!3m2!1spt-BR!2sbr!4v1"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="NVR Sports - R. Antonio Turatti, 821 - Cidade Alta, Jaú/SP"
        />
      </MapSection>
    </>
  )
}
