import React, { useEffect, useState, useMemo } from 'react'
import styled from 'styled-components'
import { supabase } from '../lib/supabase'
import type { Event } from '../types/database'
import { EventCard } from '../components/EventCard'

const typeOptions = ['Todos', 'Road Run', 'Trail Run', 'Ultramaratona'] as const
const distanceOptions = ['Todas', '5K', '10K', '21K', '42K'] as const
const monthOptions = [
  { label: 'Todos', value: null },
  { label: 'Agosto 2026', value: '2026-08' },
  { label: 'Setembro 2026', value: '2026-09' },
  { label: 'Outubro 2026', value: '2026-10' },
  { label: 'Novembro 2026', value: '2026-11' },
] as const

const PER_PAGE = 9

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`

const Header = styled.section`
  position: relative;
  padding: ${({ theme }) => theme.space[16]} ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[12]};
  text-align: center;
  color: ${({ theme }) => theme.colors.white};
  background: url('https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1920&q=80') center/cover no-repeat;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.65) 100%);
  }

  & > * {
    position: relative;
    z-index: 1;
  }
`

const Title = styled.h1`
  font-size: ${({ theme }) => theme.font.sizes['4xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  margin-top: ${({ theme }) => theme.space[8]};
  margin-bottom: ${({ theme }) => theme.space[3]};
  font-family: ${({ theme }) => theme.font.headingFamily};
  text-transform: uppercase;
  letter-spacing: 0.02em;
`

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.lg};
  opacity: 0.85;
  max-width: 600px;
  margin: 0 auto ${({ theme }) => theme.space[8]};
  font-family: ${({ theme }) => theme.font.headingFamily};
`

const SearchInput = styled.input`
  max-width: 520px;
  width: 100%;
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[5]};
  border: none;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.font.sizes.base};
  outline: none;

  &::placeholder {
    color: #9CA3AF;
  }
`

const FiltersBar = styled.div`
  max-width: 1200px;
  margin: -2rem auto 0;
  padding: ${({ theme }) => theme.space[6]};
  background: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[4]};
  align-items: center;
  position: relative;
  z-index: 1;
`

const Select = styled.select`
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[4]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  cursor: pointer;
  outline: none;
`

const ChipsWrap = styled.div`
  max-width: 1200px;
  margin: ${({ theme }) => theme.space[8]} auto ${({ theme }) => theme.space[4]};
  padding: 0 ${({ theme }) => theme.space[4]};
  display: flex;
  gap: ${({ theme }) => theme.space[2]};
  flex-wrap: wrap;
`

const Chip = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[4]};
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.border)};
  background: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.card)};
  color: ${({ $active, theme }) => ($active ? theme.colors.white : theme.colors.text)};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.fast};
`

const Content = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[16]};
`

const Count = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.space[6]};
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.space[6]};

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const EmptyState = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: ${({ theme }) => theme.space[16]} 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.font.sizes.lg};
`

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
  margin-top: ${({ theme }) => theme.space[10]};
`

const PageBtn = styled.button`
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[5]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.card};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.fast};

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const PageInfo = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export default function Eventos() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [type, setType] = useState<string>(typeOptions[0])
  const [distance, setDistance] = useState<string>(distanceOptions[0])
  const [month, setMonth] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('events')
        .select('*, categories:event_categories(*)')
        .order('date')
      setEvents(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return events.filter(ev => {
      if (search) {
        const q = search.toLowerCase()
        if (!ev.title.toLowerCase().includes(q) && !ev.city.toLowerCase().includes(q)) return false
      }
      if (type !== 'Todos' && ev.categories?.every(c => c.name !== type)) return false
      if (distance !== 'Todas') {
        const km = parseInt(distance)
        if (ev.categories?.every(c => c.distance_km !== km)) return false
      }
      if (month && !ev.date.startsWith(month)) return false
      return true
    })
  }, [events, search, type, distance, month])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  useEffect(() => {
    setPage(1)
  }, [search, type, distance, month])

  return (
    <Page>
      <Header>
        <Title>Eventos</Title>
        <Subtitle>Encontre a corrida perfeita para você. Explore eventos, inscreva-se e conquiste sua próxima meta.</Subtitle>
        <SearchInput
          placeholder="🔍  Buscar evento, cidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </Header>

      <FiltersBar>
        <Select value={type} onChange={e => setType(e.target.value)}>
          {typeOptions.map(t => <option key={t}>{t}</option>)}
        </Select>
        <Select value={distance} onChange={e => setDistance(e.target.value)}>
          {distanceOptions.map(d => <option key={d}>{d}</option>)}
        </Select>
      </FiltersBar>

      <ChipsWrap>
        {monthOptions.map(m => (
          <Chip key={m.label} $active={month === m.value} onClick={() => setMonth(m.value)}>
            {m.label}
          </Chip>
        ))}
      </ChipsWrap>

      <Content>
        <Count>{loading ? 'Carregando...' : `${filtered.length} evento(s) encontrado(s)`}</Count>
        <Grid>
          {loading ? (
            <EmptyState>Carregando eventos...</EmptyState>
          ) : paged.length === 0 ? (
            <EmptyState>Nenhum evento encontrado com os filtros selecionados.</EmptyState>
          ) : (
            paged.map(ev => <EventCard key={ev.id} event={ev} />)
          )}
        </Grid>
        {totalPages > 1 && (
          <Pagination>
            <PageBtn disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              ← Anterior
            </PageBtn>
            <PageInfo>{page} / {totalPages}</PageInfo>
            <PageBtn disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Próxima →
            </PageBtn>
          </Pagination>
        )}
      </Content>
    </Page>
  )
}
