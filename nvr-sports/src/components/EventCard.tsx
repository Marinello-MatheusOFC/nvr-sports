import React, { useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import type { Event } from '../types/database'

interface EventCardProps {
  event: Event
}

const badgeLabels: Record<Event['badge_type'], string> = {
  open: 'Aberto',
  highlight: 'Destaque',
  'last-spots': 'Últimas Vagas',
  new: 'Novo',
  popular: 'Popular',
}

const badgeColors: Record<Event['badge_type'], string> = {
  open: '#10B981',
  highlight: '#FF0000',
  'last-spots': '#EF4444',
  new: '#FF0000',
  popular: '#000000',
}

const CardLink = styled(Link)`
  display: block;
  background: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  transition: transform ${({ theme }) => theme.transition.base},
              box-shadow ${({ theme }) => theme.transition.base};

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`

const ImageWrap = styled.div`
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
`

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const Badge = styled.span<{ $color: string }>`
  position: absolute;
  top: ${({ theme }) => theme.space[3]};
  left: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[3]};
  background: ${({ $color }) => $color};
  color: #fff;
  font-size: ${({ theme }) => theme.font.sizes.xs};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  border-radius: ${({ theme }) => theme.radius.full};
  text-transform: uppercase;
  letter-spacing: 0.02em;
`

const CategoryTag = styled.span`
  position: absolute;
  top: ${({ theme }) => theme.space[3]};
  right: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[3]};
  background: ${({ theme }) => theme.colors.primary}dd;
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.font.sizes.xs};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  border-radius: ${({ theme }) => theme.radius.full};
`

const CardBody = styled.div`
  padding: ${({ theme }) => theme.space[5]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
`

const Title = styled.h3`
  font-size: ${({ theme }) => theme.font.sizes.lg};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.3;
`

const MetaList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`

const MetaItem = styled.li`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.space[2]};
  padding-top: ${({ theme }) => theme.space[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const Price = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.xl};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.primary};
`

const ActionBtn = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.white};
  background: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[4]};
  border-radius: ${({ theme }) => theme.radius.md};
  transition: background ${({ theme }) => theme.transition.fast};

  ${CardLink}:hover & {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fallbackImages = [
  'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80',
  'https://images.unsplash.com/photo-1530143584546-02191cd6e1f2?w=800&q=80',
  'https://images.unsplash.com/photo-1461896836934-bd45ba8a0020?w=800&q=80',
  'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&q=80',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
  'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80',
  'https://images.unsplash.com/photo-1486218119243-13883505764c?w=800&q=80',
  'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=800&q=80',
]

export function EventCard({ event }: EventCardProps) {
  const fallbackImg = fallbackImages[Math.abs(event.title.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % fallbackImages.length]
  const [imgSrc, setImgSrc] = useState(event.image_url || fallbackImg)

  const distances = event.categories
    ? event.categories.map(c => c.distance_km).sort((a, b) => a - b).join(', ') + ' km'
    : ''

  const minPrice = event.categories?.length
    ? Math.min(...event.categories.map(c => c.price))
    : null

  return (
    <CardLink to={`/eventos/${event.slug}`}>
      <ImageWrap>
        <Image src={imgSrc} alt={event.title} loading="lazy" onError={() => setImgSrc(fallbackImg)} />
        <Badge $color={badgeColors[event.badge_type]}>
          {badgeLabels[event.badge_type]}
        </Badge>
        {event.categories?.[0] && (
          <CategoryTag>{event.categories[0].name}</CategoryTag>
        )}
      </ImageWrap>
      <CardBody>
        <Title>{event.title}</Title>
        <MetaList>
          <MetaItem>{event.location}, {event.city}/{event.state}</MetaItem>
          <MetaItem>{formatDate(event.date)} · {event.time}</MetaItem>
          {distances && <MetaItem>{distances}</MetaItem>}
        </MetaList>
        <Footer>
          {minPrice !== null ? (
            <Price>
              {minPrice === 0 ? 'Grátis' : `R$ ${minPrice.toFixed(2)}`}
            </Price>
          ) : (
            <Price />
          )}
          <ActionBtn>Inscreva-se</ActionBtn>
        </Footer>
      </CardBody>
    </CardLink>
  )
}
