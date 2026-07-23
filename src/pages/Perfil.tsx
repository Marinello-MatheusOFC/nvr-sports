import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Registration } from '../types/database'

type Section = 'dashboard' | 'inscricoes' | 'certificados' | 'comprovantes' | 'editar'

const navItems: { key: Section; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '📊' },
  { key: 'inscricoes', label: 'Minhas Inscrições', icon: '📝' },
  { key: 'certificados', label: 'Certificados', icon: '🏅' },
  { key: 'comprovantes', label: 'Comprovantes', icon: '📄' },
  { key: 'editar', label: 'Editar Perfil', icon: '✏' },
]

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function maskCpf(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskPhone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

/* ─── Styles ─── */

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`

const Header = styled.section`
  background: linear-gradient(135deg, #FF0000 0%, #CC0000 100%);
  padding: ${({ theme }) => theme.space[16]} ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[10]};
  text-align: center;
  color: ${({ theme }) => theme.colors.white};
`

const Title = styled.h1`
  font-size: ${({ theme }) => theme.font.sizes['4xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  margin-bottom: ${({ theme }) => theme.space[2]};
  font-family: ${({ theme }) => theme.font.headingFamily};
  text-transform: uppercase;
  letter-spacing: 0.02em;
`

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.lg};
  opacity: 0.85;
  font-family: ${({ theme }) => theme.font.headingFamily};
`

const Container = styled.div`
  max-width: 1200px;
  margin: -${({ theme }) => theme.space[8]} auto 0;
  padding: 0 ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[16]};
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: ${({ theme }) => theme.space[6]};
  position: relative;
  z-index: 1;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

/* ─── Sidebar ─── */

const SidebarCard = styled.aside`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.space[6]};
  position: sticky;
  top: ${({ theme }) => theme.space[4]};
  height: fit-content;
  box-shadow: ${({ theme }) => theme.shadows.sm};

  @media (max-width: 900px) {
    position: static;
  }
`

const AvatarWrapper = styled.div`
  position: relative;
  width: 88px;
  height: 88px;
  margin: 0 auto ${({ theme }) => theme.space[4]};
`

const Avatar = styled.div<{ $hasImage?: boolean }>`
  width: 88px;
  height: 88px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ $hasImage, theme }) => $hasImage ? 'transparent' : theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.font.sizes['2xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  overflow: hidden;
  border: 3px solid ${({ theme }) => theme.colors.card};
  box-shadow: ${({ theme }) => theme.shadows.md};
`

const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const AvatarEditBtn = styled.button`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border: 2px solid ${({ theme }) => theme.colors.card};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transition.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`

const UserName = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.space[1]};
`

const UserEmail = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.space[6]};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const SideNav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`

const NavBtn = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  width: 100%;
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ $active, theme }) => ($active ? theme.colors.primary + '12' : 'transparent')};
  color: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.textSecondary)};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  cursor: pointer;
  text-align: left;
  transition: all ${({ theme }) => theme.transition.fast};
  font-family: inherit;

  &:hover {
    background: ${({ $active, theme }) => ($active ? theme.colors.primary + '12' : theme.colors.background)};
    color: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.text)};
  }
`

const LogoutBtn = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  width: 100%;
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  cursor: pointer;
  text-align: left;
  transition: background ${({ theme }) => theme.transition.fast};
  font-family: inherit;
  margin-top: ${({ theme }) => theme.space[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding-top: ${({ theme }) => theme.space[4]};

  &:hover {
    background: ${({ theme }) => theme.colors.error}0D;
  }
`

/* ─── Main Content ─── */

const Main = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[6]};
`

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.space[4]};

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.space[5]};
  text-align: center;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

const StatIcon = styled.div`
  font-size: ${({ theme }) => theme.font.sizes['2xl']};
  margin-bottom: ${({ theme }) => theme.space[2]};
`

const StatNumber = styled.div`
  font-size: ${({ theme }) => theme.font.sizes['2xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.space[1]};
`

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Card = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.space[6]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.sizes.xl};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[5]};
  font-family: ${({ theme }) => theme.font.headingFamily};
  text-transform: uppercase;
  letter-spacing: 0.02em;
`

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space[6]};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

/* ─── Dashboard ─── */

const ActivityItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => theme.space[3]} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`

const ActivityIcon = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.lg};
  flex-shrink: 0;
  margin-top: 2px;
`

const ActivityText = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.5;
`

const ActivityDate = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const EventMiniCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
  padding: ${({ theme }) => theme.space[4]};
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin-bottom: ${({ theme }) => theme.space[3]};
  border: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    margin-bottom: 0;
  }
`

const EventThumb = styled.div`
  width: 60px;
  height: 60px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  overflow: hidden;
`

const EventMiniInfo = styled.div`
  flex: 1;
`

const EventMiniTitle = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[1]};
`

const EventMiniDate = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

/* ─── Inscrições ─── */

const RegCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
  padding: ${({ theme }) => theme.space[4]};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin-bottom: ${({ theme }) => theme.space[3]};

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
  }
`

const RegImage = styled.div`
  width: 80px;
  height: 80px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  overflow: hidden;
`

const RegInfo = styled.div`
  flex: 1;
`

const RegTitle = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[1]};
`

const RegDetail = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[3]};
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.font.sizes.xs};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  text-transform: uppercase;
  background: ${({ $status, theme }) =>
    $status === 'confirmed' ? theme.colors.success + '1A' :
    $status === 'completed' ? theme.colors.primary + '1A' :
    $status === 'cancelled' ? theme.colors.error + '1A' :
    theme.colors.warning + '1A'};
  color: ${({ $status, theme }) =>
    $status === 'confirmed' ? theme.colors.success :
    $status === 'completed' ? theme.colors.primary :
    $status === 'cancelled' ? theme.colors.error :
    theme.colors.warning};
`

const QRBtn = styled.button`
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[4]};
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.fast};
  font-family: inherit;
  white-space: nowrap;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`

const RegActions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space[2]};

  @media (max-width: 600px) {
    align-items: center;
  }
`

/* ─── Certificados ─── */

const CertCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[5]};
  padding: ${({ theme }) => theme.space[5]};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin-bottom: ${({ theme }) => theme.space[3]};

  &:last-child {
    margin-bottom: 0;
  }
`

const CertIcon = styled.div`
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.primary}1A;
  border-radius: ${({ theme }) => theme.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
`

const CertInfo = styled.div`
  flex: 1;
`

const CertTitle = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[1]};
`

const CertDate = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const DownloadBtn = styled.button`
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[4]};
  background: ${({ theme }) => theme.colors.primary};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.white};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transition.fast};
  font-family: inherit;
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`

/* ─── Comprovantes ─── */

const ReceiptItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space[4]};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin-bottom: ${({ theme }) => theme.space[3]};

  &:last-child {
    margin-bottom: 0;
  }

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: ${({ theme }) => theme.space[3]};
  }
`

const ReceiptInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`

const ReceiptTitle = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
`

const ReceiptDate = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ReceiptValue = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.lg};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.primary};
`

/* ─── Editar Perfil ─── */

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[5]};
`

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space[4]};

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`

const FormGroupFull = styled(FormGroup)`
  grid-column: 1 / -1;
`

const Label = styled.label`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  color: ${({ theme }) => theme.colors.text};
`

const Input = styled.input`
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-family: inherit;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.card};
  outline: none;
  transition: border-color ${({ theme }) => theme.transition.fast};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const Select = styled.select`
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-family: inherit;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.card};
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

const BtnRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[3]};
  margin-top: ${({ theme }) => theme.space[2]};
`

const SaveBtn = styled.button`
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[6]};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transition.fast};
  font-family: inherit;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const CancelBtn = styled.button`
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[6]};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.fast};
  font-family: inherit;

  &:hover {
    border-color: ${({ theme }) => theme.colors.text};
    color: ${({ theme }) => theme.colors.text};
  }
`

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.space[12]} ${({ theme }) => theme.space[4]};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.space[4]};
`

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.lg};
  margin-bottom: ${({ theme }) => theme.space[2]};
`

const SuccessMsg = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.success};
  background: ${({ theme }) => theme.colors.success}12;
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.success}30;
  margin-bottom: ${({ theme }) => theme.space[4]};
`

const PhotoUploadLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[4]};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transition.fast};
  width: fit-content;
  font-family: inherit;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`

const HiddenInput = styled.input`
  display: none;
`

/* ─── Component ─── */

export default function Perfil() {
  const { user, loading: authLoading, signOut, updateProfile } = useAuth()
  const navigate = useNavigate()

  const [activeSection, setActiveSection] = useState<Section>('dashboard')
  const [registrations, setRegistrations] = useState<Registration[]>([])

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    birth_date: '',
    phone: '',
    gender: '',
    address: '',
  })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        cpf: maskCpf(user.cpf || ''),
        birth_date: user.birth_date || '',
        phone: maskPhone(user.phone || ''),
        gender: user.gender || '',
        address: user.address || '',
      })
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    supabase
      .from('registrations')
      .select('*, event:events(*), category:event_categories(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setRegistrations(data)
      })
  }, [user])

  if (authLoading || !user) return null

  const upcomingEvents = registrations.filter(
    r => r.event && (r.event.status === 'upcoming' || r.event.status === 'ongoing')
  )
  const completedRegs = registrations.filter(r => r.status === 'completed')
  const totalDistance = registrations.reduce((acc, r) => {
    if (r.category?.distance_km) return acc + r.category.distance_km
    return acc
  }, 0)
  const uniqueEvents = new Set(registrations.map(r => r.event_id)).size

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')
    updateProfile({
      name: formData.name,
      cpf: formData.cpf.replace(/\D/g, ''),
      birth_date: formData.birth_date,
      phone: formData.phone.replace(/\D/g, ''),
      gender: formData.gender as 'masculino' | 'feminino' | 'outro',
      address: formData.address,
    }).then(result => {
      setSaving(false)
      if (result.error) {
        setSaveMsg('Erro ao salvar: ' + result.error)
      } else {
        setSaveMsg('Perfil atualizado com sucesso!')
      }
    })
  }

  function handleLogout() {
    signOut()
    navigate('/')
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      updateProfile({ avatar_url: dataUrl })
    }
    reader.readAsDataURL(file)
  }

  return (
    <Page>
      <Header>
        <Title>Área do Atleta</Title>
        <Subtitle>Gerencie suas inscrições, certificados e dados pessoais</Subtitle>
      </Header>

      <Container>
        <SidebarCard>
          <AvatarWrapper>
            <Avatar $hasImage={!!user.avatar_url}>
              {user.avatar_url ? (
                <AvatarImg src={user.avatar_url} alt={user.name} />
              ) : (
                getInitials(user.name)
              )}
            </Avatar>
            <AvatarEditBtn as="label">
              ✏
              <HiddenInput type="file" accept="image/*" onChange={handleAvatarUpload} />
            </AvatarEditBtn>
          </AvatarWrapper>
          <UserName>{user.name}</UserName>
          <UserEmail>{user.email}</UserEmail>

          <SideNav>
            {navItems.map(item => (
              <NavBtn
                key={item.key}
                $active={activeSection === item.key}
                onClick={() => { setActiveSection(item.key); setSaveMsg('') }}
              >
                <span>{item.icon}</span>
                {item.label}
              </NavBtn>
            ))}
          </SideNav>

          <LogoutBtn onClick={handleLogout}>
            <span>🚪</span> Sair da Conta
          </LogoutBtn>
        </SidebarCard>

        <Main>
          <StatsRow>
            <StatCard>
              <StatIcon>📝</StatIcon>
              <StatNumber>{registrations.length}</StatNumber>
              <StatLabel>Inscrições</StatLabel>
            </StatCard>
            <StatCard>
              <StatIcon>🏃</StatIcon>
              <StatNumber>{uniqueEvents}</StatNumber>
              <StatLabel>Provas</StatLabel>
            </StatCard>
            <StatCard>
              <StatIcon>📏</StatIcon>
              <StatNumber>{totalDistance}km</StatNumber>
              <StatLabel>Distância Total</StatLabel>
            </StatCard>
            <StatCard>
              <StatIcon>🏆</StatIcon>
              <StatNumber>{completedRegs.length}</StatNumber>
              <StatLabel>Recordes</StatLabel>
            </StatCard>
          </StatsRow>

          {activeSection === 'dashboard' && (
            <CardGrid>
              <Card>
                <CardTitle>Próximos Eventos</CardTitle>
                {upcomingEvents.length === 0 ? (
                  <EmptyState>
                    <EmptyIcon>📅</EmptyIcon>
                    <EmptyText>Nenhum evento próximo</EmptyText>
                    <Link to="/eventos" style={{ color: '#FF0000', fontWeight: 600, fontSize: '0.875rem' }}>
                      Explorar Eventos →
                    </Link>
                  </EmptyState>
                ) : (
                  upcomingEvents.slice(0, 4).map(r => (
                    <EventMiniCard key={r.id}>
                      <EventThumb>🏃</EventThumb>
                      <EventMiniInfo>
                        <EventMiniTitle>{r.event?.title}</EventMiniTitle>
                        <EventMiniDate>
                          {r.event?.date ? formatDate(r.event.date) : ''} · {r.category?.name}
                        </EventMiniDate>
                      </EventMiniInfo>
                      <StatusBadge $status={r.status}>{r.status}</StatusBadge>
                    </EventMiniCard>
                  ))
                )}
              </Card>

              <Card>
                <CardTitle>Atividade Recente</CardTitle>
                {registrations.length === 0 ? (
                  <EmptyState>
                    <EmptyIcon>📋</EmptyIcon>
                    <EmptyText>Nenhuma atividade ainda</EmptyText>
                  </EmptyState>
                ) : (
                  registrations.slice(0, 5).map(r => (
                    <ActivityItem key={r.id}>
                      <ActivityIcon>
                        {r.status === 'confirmed' ? '✅' : r.status === 'completed' ? '🏅' : r.status === 'cancelled' ? '❌' : '⏳'}
                      </ActivityIcon>
                      <div>
                        <ActivityText>
                          Inscrição em <strong>{r.event?.title}</strong>
                        </ActivityText>
                        <ActivityDate>{formatDate(r.created_at)}</ActivityDate>
                      </div>
                    </ActivityItem>
                  ))
                )}
              </Card>
            </CardGrid>
          )}

          {activeSection === 'inscricoes' && (
            <Card>
              <CardTitle>Minhas Inscrições</CardTitle>
              {registrations.length === 0 ? (
                <EmptyState>
                  <EmptyIcon>📝</EmptyIcon>
                  <EmptyText>Você ainda não tem inscrições</EmptyText>
                  <Link to="/eventos" style={{ color: '#FF0000', fontWeight: 600, fontSize: '0.875rem' }}>
                    Ver Eventos Disponíveis →
                  </Link>
                </EmptyState>
              ) : (
                registrations.map(r => (
                  <RegCard key={r.id}>
                    <RegImage>🏃</RegImage>
                    <RegInfo>
                      <RegTitle>{r.event?.title}</RegTitle>
                      <RegDetail>{r.category?.name} · {r.event?.date ? formatDate(r.event.date) : ''}</RegDetail>
                    </RegInfo>
                    <RegActions>
                      <StatusBadge $status={r.status}>{r.status}</StatusBadge>
                      <QRBtn>📱 QR Code</QRBtn>
                    </RegActions>
                  </RegCard>
                ))
              )}
            </Card>
          )}

          {activeSection === 'certificados' && (
            <Card>
              <CardTitle>Certificados</CardTitle>
              {completedRegs.length === 0 ? (
                <EmptyState>
                  <EmptyIcon>🏅</EmptyIcon>
                  <EmptyText>Nenhum certificado disponível</EmptyText>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                    Complete um evento para receber seu certificado.
                  </p>
                </EmptyState>
              ) : (
                completedRegs.map(r => (
                  <CertCard key={r.id}>
                    <CertIcon>🏅</CertIcon>
                    <CertInfo>
                      <CertTitle>{r.event?.title}</CertTitle>
                      <CertDate>{r.category?.name} · {r.event?.date ? formatDate(r.event.date) : ''}</CertDate>
                    </CertInfo>
                    <DownloadBtn>📥 Download PDF</DownloadBtn>
                  </CertCard>
                ))
              )}
            </Card>
          )}

          {activeSection === 'comprovantes' && (
            <Card>
              <CardTitle>Comprovantes</CardTitle>
              {registrations.length === 0 ? (
                <EmptyState>
                  <EmptyIcon>📄</EmptyIcon>
                  <EmptyText>Nenhum comprovante disponível</EmptyText>
                </EmptyState>
              ) : (
                registrations.map(r => (
                  <ReceiptItem key={r.id}>
                    <ReceiptInfo>
                      <ReceiptTitle>{r.event?.title} — {r.category?.name}</ReceiptTitle>
                      <ReceiptDate>{formatDate(r.created_at)} · {r.confirmation_number}</ReceiptDate>
                    </ReceiptInfo>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <ReceiptValue>R$ {r.total_price.toFixed(2).replace('.', ',')}</ReceiptValue>
                      <DownloadBtn>📥 Baixar</DownloadBtn>
                    </div>
                  </ReceiptItem>
                ))
              )}
            </Card>
          )}

          {activeSection === 'editar' && (
            <Card>
              <CardTitle>Editar Perfil</CardTitle>
              {saveMsg && <SuccessMsg>{saveMsg}</SuccessMsg>}
              <Form onSubmit={handleSave}>
                <FormGrid>
                  <FormGroup>
                    <Label>Nome</Label>
                    <Input
                      placeholder="Seu nome completo"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      disabled
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>CPF</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={e => setFormData(prev => ({ ...prev, cpf: maskCpf(e.target.value) }))}
                      maxLength={14}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Data de Nascimento</Label>
                    <Input
                      type="date"
                      value={formData.birth_date}
                      onChange={e => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Telefone</Label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={e => setFormData(prev => ({ ...prev, phone: maskPhone(e.target.value) }))}
                      maxLength={15}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Sexo</Label>
                    <Select
                      value={formData.gender}
                      onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    >
                      <option value="">Selecione</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="outro">Outro</option>
                    </Select>
                  </FormGroup>
                  <FormGroupFull>
                    <Label>Foto de Perfil</Label>
                    <PhotoUploadLabel>
                      📷 Trocar foto
                      <HiddenInput type="file" accept="image/*" onChange={handleAvatarUpload} />
                    </PhotoUploadLabel>
                  </FormGroupFull>
                  <FormGroupFull>
                    <Label>Endereço</Label>
                    <Input
                      placeholder="Rua, número - Bairro, Cidade/UF"
                      value={formData.address}
                      onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </FormGroupFull>
                </FormGrid>
                <BtnRow>
                  <SaveBtn type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </SaveBtn>
                  <CancelBtn type="button" onClick={() => {
                    setFormData({
                      name: user.name || '',
                      email: user.email || '',
                      cpf: maskCpf(user.cpf || ''),
                      birth_date: user.birth_date || '',
                      phone: maskPhone(user.phone || ''),
                      gender: user.gender || '',
                      address: user.address || '',
                    })
                    setSaveMsg('')
                  }}>
                    Cancelar
                  </CancelBtn>
                </BtnRow>
              </Form>
            </Card>
          )}
        </Main>
      </Container>
    </Page>
  )
}
