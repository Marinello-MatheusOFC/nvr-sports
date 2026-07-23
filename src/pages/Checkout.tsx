import React, { useState, useEffect, useMemo } from 'react'
import styled, { css } from 'styled-components'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import type { Event, EventCategory } from '../types/database'

type TshirtSize = 'P' | 'M' | 'G' | 'GG'
type PaymentMethod = 'credit_card' | 'pix' | 'boleto'
type Gender = 'masculino' | 'feminino' | 'outro'

interface PersonalData {
  name: string
  email: string
  cpf: string
  phone: string
  birth_date: string
  gender: Gender | ''
}

const STEP_LABELS = ['Dados', 'Categoria', 'Kit', 'Resumo', 'Pagamento']

const TSHIRT_SIZES: TshirtSize[] = ['P', 'M', 'G', 'GG']

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

function generateConfirmation() {
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `NVR-2026-${rand}`
}

function maskCpf(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) {
    return d
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return d
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function maskCardNumber(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 16)
  return d.replace(/(\d{4})(?=\d)/g, '$1 ')
}

function maskExpiry(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.replace(/(\d{2})(\d)/, '$1/$2')
}

/* ─── Styled Components ─────────────────────────────── */

const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.space[8]} ${({ theme }) => theme.space[4]};

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[3]};
  }
`

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  text-decoration: none;
  margin-bottom: ${({ theme }) => theme.space[6]};
  transition: color ${({ theme }) => theme.transition.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: ${({ theme }) => theme.space[8]};
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const MainCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[6]};
`

/* ─── Step Indicator ─────────────────────────────────── */

const StepBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.space[6]};
`

const StepLabels = styled.div`
  display: flex;
  justify-content: space-between;
`

const StepLabel = styled.span<{ $active: boolean; $done: boolean }>`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  color: ${({ $active, $done, theme }) =>
    $done ? theme.colors.success : $active ? theme.colors.primary : theme.colors.textSecondary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  white-space: nowrap;

  @media (max-width: 600px) {
    font-size: ${({ theme }) => theme.font.sizes.xs};
  }
`

const StepNumber = styled.span<{ $active: boolean; $done: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: ${({ theme }) => theme.radius.full};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.font.sizes.xs};
  font-weight: ${({ theme }) => theme.font.weights.semibold};

  ${({ $done, $active, theme }) =>
    $done
      ? css`
          background: ${theme.colors.success};
          color: ${theme.colors.white};
        `
      : $active
      ? css`
          background: ${theme.colors.primary};
          color: ${theme.colors.white};
        `
      : css`
          background: ${theme.colors.border};
          color: ${theme.colors.textSecondary};
        `}
`

const ProgressBar = styled.div`
  height: 4px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  overflow: hidden;
`

const ProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => $pct}%;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.full};
  transition: width ${({ theme }) => theme.transition.slow};
`

/* ─── Card / Form Styles ─────────────────────────────── */

const Card = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.space[6]};
`

const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.sizes.xl};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[5]};
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
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
  font-family: ${({ theme }) => theme.font.family};
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

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space[4]};

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`

const FormRow = styled.div`
  ${FormGroup} + ${FormGroup} {
    margin-top: ${({ theme }) => theme.space[4]};
  }
`

const RadioGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[4]};
  flex-wrap: wrap;
`

const RadioLabel = styled.label<{ $checked: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
  border: 2px solid ${({ $checked, theme }) => ($checked ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radius.md};
  cursor: pointer;
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  color: ${({ $checked, theme }) => ($checked ? theme.colors.primary : theme.colors.text)};
  background: ${({ $checked, theme }) => ($checked ? theme.colors.primary + '0D' : 'transparent')};
  transition: all ${({ theme }) => theme.transition.fast};

  input {
    display: none;
  }
`

/* ─── Category Cards ──────────────────────────────── */

const CategoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[5]};
`

const CategoryCard = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
  width: 100%;
  padding: ${({ theme }) => theme.space[5]};
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.primary + '0D' : theme.colors.card};
  border: 2px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  text-align: left;
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

const CategoryBadge = styled.span`
  flex-shrink: 0;
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[3]};
  background: ${({ theme }) => theme.colors.primary + '1A'};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.font.sizes.xs};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  border-radius: ${({ theme }) => theme.radius.full};
  text-transform: uppercase;
  white-space: nowrap;
`

const CategoryInfo = styled.div`
  flex: 1;
`

const CategoryName = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[1]};
`

const CategoryDesc = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const CategoryPrice = styled.div`
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.font.sizes.lg};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.primary};
  white-space: nowrap;
`

const RadioDot = styled.span<{ $checked: boolean }>`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: 2px solid ${({ $checked, theme }) =>
    $checked ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: ${({ theme }) => theme.radius.full};
    background: ${({ $checked, theme }) =>
      $checked ? theme.colors.primary : 'transparent'};
    transition: background ${({ theme }) => theme.transition.fast};
  }
`

/* ─── Kit ──────────────────────────────────────── */

const KitPreview = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[5]};
  padding: ${({ theme }) => theme.space[5]};
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin-bottom: ${({ theme }) => theme.space[5]};

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
  }
`

const KitIcon = styled.div`
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.primary + '1A'};
  border-radius: ${({ theme }) => theme.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
`

const KitInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`

const KitTitle = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
`

const KitSubtitle = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const SizeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.space[3]};

  @media (max-width: 500px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

const SizeCard = styled.button<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[5]} ${({ theme }) => theme.space[3]};
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.primary + '0D' : theme.colors.card};
  border: 2px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

const SizeLetter = styled.span`
  font-size: ${({ theme }) => theme.font.sizes['2xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.text};
`

const SizeName = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const SizeGuide = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.space[4]};
  line-height: 1.6;
`

/* ─── Buttons ──────────────────────────────── */

const BtnRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[3]};
  margin-top: ${({ theme }) => theme.space[2]};
`

const Button = styled.button<{ $variant?: 'primary' | 'outline' | 'success' }>`
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[6]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  font-family: ${({ theme }) => theme.font.family};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.fast};
  border: 2px solid transparent;

  ${({ $variant, theme }) =>
    $variant === 'outline'
      ? css`
          background: transparent;
          border-color: ${theme.colors.border};
          color: ${theme.colors.text};
          &:hover {
            border-color: ${theme.colors.primary};
            color: ${theme.colors.primary};
          }
        `
      : $variant === 'success'
      ? css`
          background: ${theme.colors.success};
          color: ${theme.colors.white};
          &:hover {
            background: ${theme.colors.success}dd;
          }
        `
      : css`
          background: ${theme.colors.primary};
          color: ${theme.colors.white};
          &:hover {
            background: ${theme.colors.primaryHover};
          }
        `}
`

/* ─── Summary Cards ──────────────────────────────── */

const SummaryCard = styled.div`
  padding: ${({ theme }) => theme.space[5]};
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin-bottom: ${({ theme }) => theme.space[4]};
`

const SummaryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.space[3]};
`

const SummaryLabel = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const EditBtn = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  font-family: ${({ theme }) => theme.font.family};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};

  &:hover {
    text-decoration: underline;
  }
`

const SummaryText = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.base};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.6;
`

const TotalCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.space[5]};
  background: ${({ theme }) => theme.colors.primary + '0D'};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.lg};
`

const TotalLabel = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.lg};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
`

const TotalPrice = styled.span`
  font-size: ${({ theme }) => theme.font.sizes['2xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.primary};
`

/* ─── Payment ──────────────────────────────── */

const PaymentMethods = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
  margin-bottom: ${({ theme }) => theme.space[6]};
`

const PaymentCard = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
  width: 100%;
  padding: ${({ theme }) => theme.space[5]};
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.primary + '0D' : theme.colors.card};
  border: 2px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  cursor: pointer;
  text-align: left;
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

const PaymentIcon = styled.div`
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.primary + '1A'};
  border-radius: ${({ theme }) => theme.radius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
`

const PaymentInfo = styled.div`
  flex: 1;
`

const PaymentName = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
`

const PaymentDesc = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const InfoBox = styled.div<{ $type: 'pix' | 'boleto' }>`
  padding: ${({ theme }) => theme.space[5]};
  border-radius: ${({ theme }) => theme.radius.lg};
  margin-bottom: ${({ theme }) => theme.space[5]};

  ${({ $type, theme }) =>
    $type === 'pix'
      ? css`
          background: ${theme.colors.success}1A;
          border: 1px solid ${theme.colors.success};
        `
      : css`
          background: ${theme.colors.warning}1A;
          border: 1px solid ${theme.colors.warning};
        `}
`

const InfoBoxTitle = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  margin-bottom: ${({ theme }) => theme.space[2]};
`

const InfoBoxText = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  line-height: 1.6;
`

const InstallmentSelect = styled.select`
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-family: ${({ theme }) => theme.font.family};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.card};
  outline: none;
  width: 100%;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

const SecurityNote = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.space[5]};
  text-align: center;
`

/* ─── Sidebar ──────────────────────────────── */

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[5]};
  position: sticky;
  top: ${({ theme }) => theme.space[8]};
`

const SideCard = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.space[5]};
`

const SideTitle = styled.h3`
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[4]};
`

const SideRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.space[2]} 0;
`

const SideLabel = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const SideValue = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  color: ${({ theme }) => theme.colors.text};
`

const SideDivider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin: ${({ theme }) => theme.space[3]} 0;
`

const SideTotal = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const SideTotalLabel = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.lg};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
`

const SideTotalValue = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.xl};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.primary};
`

const CouponRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]};
`

const CouponInput = styled(Input)`
  flex: 1;
  font-size: ${({ theme }) => theme.font.sizes.sm};
`

const CouponBtn = styled.button`
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[3]};
  background: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  font-family: ${({ theme }) => theme.font.family};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.colors.secondaryHover};
  }
`

const TrustBadge = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => theme.space[3]} 0;
`

const TrustBadgeRow = styled(TrustBadge)`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const TrustIcon = styled.span`
  font-size: 1.25rem;
  flex-shrink: 0;
`

const TrustText = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  color: ${({ theme }) => theme.colors.text};
`

const TrustSubtext = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

/* ─── Confirmation ──────────────────────────────── */

const Confirmation = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: ${({ theme }) => theme.space[10]} ${({ theme }) => theme.space[6]};
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
`

const SuccessCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.success}1A;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin-bottom: ${({ theme }) => theme.space[5]};
`

const ConfTitle = styled.h1`
  font-size: ${({ theme }) => theme.font.sizes['3xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[3]};
`

const ConfText = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.base};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.space[6]};
  max-width: 400px;
  line-height: 1.6;
`

const QRPlaceholder = styled.div`
  width: 160px;
  height: 160px;
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.space[5]};
  background: ${({ theme }) => theme.colors.background};
`

const ConfNumber = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.xl};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.primary};
  letter-spacing: 0.05em;
  margin-bottom: ${({ theme }) => theme.space[2]};
`

const ConfNumberLabel = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.space[8]};
`

const ConfActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[3]};

  @media (max-width: 500px) {
    flex-direction: column;
    width: 100%;
  }
`

const ConfActionsButton = styled(Button)`
  @media (max-width: 500px) {
    width: 100%;
    text-align: center;
    justify-content: center;
  }
`

/* ─── Loading / Error ──────────────────────────────── */

const LoadingWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  font-size: ${({ theme }) => theme.font.sizes.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ErrorWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: ${({ theme }) => theme.space[4]};
  text-align: center;
`

const ErrorTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.sizes['2xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.text};
`

const ErrorText = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.base};
  color: ${({ theme }) => theme.colors.textSecondary};
`

/* ─── Login Prompt ──────────────────────────────── */

const LoginPrompt = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: ${({ theme }) => theme.space[4]};
  text-align: center;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.space[10]};
`

/* ─── Component ──────────────────────────────── */

export default function Checkout() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [confirmationNumber, setConfirmationNumber] = useState('')

  const [event, setEvent] = useState<Event | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [tshirtSize, setTshirtSize] = useState<TshirtSize>('M')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card')

  const [personal, setPersonal] = useState<PersonalData>({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    birth_date: '',
    gender: '',
  })

  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [installments, setInstallments] = useState(1)

  const [coupon, setCoupon] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: `/eventos/${slug}/checkout` } })
    }
  }, [user, authLoading, navigate, slug])

  useEffect(() => {
    if (user && !authLoading) {
      setPersonal({
        name: user.name || '',
        email: user.email || '',
        cpf: maskCpf(user.cpf || ''),
        phone: maskPhone(user.phone || ''),
        birth_date: user.birth_date || '',
        gender: user.gender || '',
      })
    }
  }, [user, authLoading])

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    supabase
      .from('events')
      .select('*, categories:event_categories(*)')
      .eq('slug', slug)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('Evento não encontrado.')
        } else {
          setEvent(data)
        }
        setLoading(false)
      })
  }, [slug])

  const selectedCategory = useMemo(
    () => event?.categories?.find(c => c.id === selectedCategoryId) ?? null,
    [event, selectedCategoryId],
  )

  const basePrice = selectedCategory?.price ?? 0
  const discount = paymentMethod === 'pix' ? basePrice * 0.05 : 0
  const totalPrice = basePrice - discount

  const progressPct = ((step - 1) / (STEP_LABELS.length - 1)) * 100

  function updatePersonal(field: keyof PersonalData, value: string) {
    setPersonal(prev => ({ ...prev, [field]: value }))
  }

  function canAdvanceFromStep1() {
    return personal.name && personal.email && personal.cpf && personal.phone
  }

  function canAdvanceFromStep2() {
    return !!selectedCategoryId
  }

  function canAdvanceFromStep3() {
    return !!tshirtSize
  }

  async function handleSubmit() {
    if (!event || !selectedCategory || !user) return
    setSubmitting(true)

    const confNum = generateConfirmation()

    const { error: insertError } = await supabase.from('registrations').insert({
      user_id: user.id,
      event_id: event.id,
      category_id: selectedCategory.id,
      tshirt_size: tshirtSize,
      status: 'confirmed',
      payment_method: paymentMethod,
      payment_status: paymentMethod === 'boleto' ? 'pending' : 'paid',
      total_price: totalPrice,
      confirmation_number: confNum,
      qr_code_data: null,
    })

    if (insertError) {
      setError('Erro ao finalizar inscrição. Tente novamente.')
      setSubmitting(false)
      return
    }

    setConfirmationNumber(confNum)
    setConfirmed(true)
    setSubmitting(false)
  }

  if (authLoading || loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingWrap>Carregando...</LoadingWrap>
        </Container>
      </PageWrapper>
    )
  }

  if (!user) {
    return (
      <PageWrapper>
        <Container>
          <LoginPrompt>
            <div style={{ fontSize: '2.5rem' }}>🔒</div>
            <ErrorTitle>Faça login para continuar</ErrorTitle>
            <ErrorText>
              Você precisa estar logado para se inscrever em um evento.
            </ErrorText>
            <Button onClick={() => navigate('/login')}>
              Ir para Login
            </Button>
          </LoginPrompt>
        </Container>
      </PageWrapper>
    )
  }

  if (error && !event) {
    return (
      <PageWrapper>
        <Container>
          <ErrorWrap>
            <div style={{ fontSize: '3rem' }}>⚠️</div>
            <ErrorTitle>Algo deu errado</ErrorTitle>
            <ErrorText>{error}</ErrorText>
            <Button onClick={() => navigate(-1)}>Voltar</Button>
          </ErrorWrap>
        </Container>
      </PageWrapper>
    )
  }

  if (confirmed) {
    return (
      <PageWrapper>
        <Container>
          <Confirmation>
            <SuccessCircle>✓</SuccessCircle>
            <ConfTitle>Inscrição Confirmada!</ConfTitle>
            <ConfText>
              Sua inscrição no evento <strong>{event?.title}</strong> foi
              realizada com sucesso. Você receberá um e-mail de confirmação em
              breve.
            </ConfText>
            <QRPlaceholder>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <rect x="5" y="5" width="25" height="25" rx="2" fill="#1A1A2E" />
                <rect x="10" y="10" width="15" height="15" rx="1" fill="#FAFBFC" />
                <rect x="13" y="13" width="9" height="9" rx="1" fill="#1A1A2E" />
                <rect x="70" y="5" width="25" height="25" rx="2" fill="#1A1A2E" />
                <rect x="75" y="10" width="15" height="15" rx="1" fill="#FAFBFC" />
                <rect x="78" y="13" width="9" height="9" rx="1" fill="#1A1A2E" />
                <rect x="5" y="70" width="25" height="25" rx="2" fill="#1A1A2E" />
                <rect x="10" y="75" width="15" height="15" rx="1" fill="#FAFBFC" />
                <rect x="13" y="78" width="9" height="9" rx="1" fill="#1A1A2E" />
                <rect x="35" y="5" width="8" height="8" fill="#1A1A2E" />
                <rect x="48" y="5" width="8" height="8" fill="#1A1A2E" />
                <rect x="35" y="18" width="8" height="8" fill="#1A1A2E" />
                <rect x="55" y="18" width="8" height="8" fill="#1A1A2E" />
                <rect x="35" y="35" width="8" height="8" fill="#1A1A2E" />
                <rect x="48" y="35" width="8" height="8" fill="#1A1A2E" />
                <rect x="55" y="48" width="8" height="8" fill="#1A1A2E" />
                <rect x="35" y="55" width="8" height="8" fill="#1A1A2E" />
                <rect x="48" y="55" width="8" height="8" fill="#1A1A2E" />
                <rect x="70" y="35" width="8" height="8" fill="#1A1A2E" />
                <rect x="83" y="35" width="8" height="8" fill="#1A1A2E" />
                <rect x="70" y="48" width="8" height="8" fill="#1A1A2E" />
                <rect x="70" y="70" width="8" height="8" fill="#1A1A2E" />
                <rect x="83" y="70" width="8" height="8" fill="#1A1A2E" />
                <rect x="70" y="83" width="8" height="8" fill="#1A1A2E" />
                <rect x="83" y="83" width="8" height="8" fill="#1A1A2E" />
                <rect x="48" y="70" width="8" height="8" fill="#1A1A2E" />
                <rect x="48" y="83" width="8" height="8" fill="#1A1A2E" />
                <rect x="5" y="35" width="8" height="8" fill="#1A1A2E" />
                <rect x="18" y="48" width="8" height="8" fill="#1A1A2E" />
                <rect x="5" y="55" width="8" height="8" fill="#1A1A2E" />
              </svg>
            </QRPlaceholder>
            <ConfNumber>{confirmationNumber}</ConfNumber>
            <ConfNumberLabel>Número de confirmação</ConfNumberLabel>
            <ConfActions>
              <ConfActionsButton
                $variant="outline"
                onClick={() => navigate('/eventos')}
              >
                Ver eventos
              </ConfActionsButton>
              <ConfActionsButton onClick={() => navigate('/')}>
                Voltar ao início
              </ConfActionsButton>
            </ConfActions>
          </Confirmation>
        </Container>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <Container>
        <BackLink to={`/eventos/${slug}`}>← Voltar para o evento</BackLink>

        <StepBar>
          <StepLabels>
            {STEP_LABELS.map((label, i) => {
              const num = i + 1
              const done = step > num
              const active = step === num
              return (
                <StepLabel key={label} $active={active} $done={done}>
                  <StepNumber $active={active} $done={done}>
                    {done ? '✓' : num}
                  </StepNumber>
                  {label}
                </StepLabel>
              )
            })}
          </StepLabels>
          <ProgressBar>
            <ProgressFill $pct={progressPct} />
          </ProgressBar>
        </StepBar>

        <Layout>
          <MainCol>
            {/* Step 1 */}
            {step === 1 && (
              <Card>
                <CardTitle>Dados Pessoais</CardTitle>
                <FormGrid>
                  <FormGroup style={{ gridColumn: '1 / -1' }}>
                    <Label>Nome completo</Label>
                    <Input
                      placeholder="Seu nome completo"
                      value={personal.name}
                      onChange={e => updatePersonal('name', e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={personal.email}
                      onChange={e => updatePersonal('email', e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>CPF</Label>
                    <Input
                      placeholder="000.000.000-00"
                      value={personal.cpf}
                      onChange={e =>
                        updatePersonal('cpf', maskCpf(e.target.value))
                      }
                      maxLength={14}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Telefone</Label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={personal.phone}
                      onChange={e =>
                        updatePersonal('phone', maskPhone(e.target.value))
                      }
                      maxLength={15}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Data de nascimento</Label>
                    <Input
                      type="date"
                      value={personal.birth_date}
                      onChange={e =>
                        updatePersonal('birth_date', e.target.value)
                      }
                    />
                  </FormGroup>
                </FormGrid>
                <FormRow>
                  <FormGroup>
                    <Label>Gênero</Label>
                    <RadioGroup>
                      {(['masculino', 'feminino', 'outro'] as const).map(g => (
                        <RadioLabel key={g} $checked={personal.gender === g}>
                          <input
                            type="radio"
                            name="gender"
                            value={g}
                            checked={personal.gender === g}
                            onChange={() => updatePersonal('gender', g)}
                          />
                          {g.charAt(0).toUpperCase() + g.slice(1)}
                        </RadioLabel>
                      ))}
                    </RadioGroup>
                  </FormGroup>
                </FormRow>
                <BtnRow>
                  <div />
                  <Button
                    onClick={() => canAdvanceFromStep1() && setStep(2)}
                    disabled={!canAdvanceFromStep1()}
                  >
                    Próximo →
                  </Button>
                </BtnRow>
              </Card>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <Card>
                <CardTitle>Selecione a Categoria</CardTitle>
                <CategoryList>
                  {event?.categories?.map(cat => (
                    <CategoryCard
                      key={cat.id}
                      $selected={selectedCategoryId === cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      type="button"
                    >
                      <RadioDot $checked={selectedCategoryId === cat.id} />
                      <CategoryBadge>{cat.name}</CategoryBadge>
                      <CategoryInfo>
                        <CategoryName>
                          {cat.distance_km}km
                        </CategoryName>
                        <CategoryDesc>{cat.description}</CategoryDesc>
                      </CategoryInfo>
                      <CategoryPrice>{formatCurrency(cat.price)}</CategoryPrice>
                    </CategoryCard>
                  ))}
                </CategoryList>
                <BtnRow>
                  <Button $variant="outline" onClick={() => setStep(1)}>
                    ← Anterior
                  </Button>
                  <Button
                    onClick={() => canAdvanceFromStep2() && setStep(3)}
                    disabled={!canAdvanceFromStep2()}
                  >
                    Próximo →
                  </Button>
                </BtnRow>
              </Card>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <Card>
                <CardTitle>Kit de Corrida</CardTitle>
                <KitPreview>
                  <KitIcon>👕</KitIcon>
                  <KitInfo>
                    <KitTitle>Camiseta oficial NVR Sports Run 2026</KitTitle>
                    <KitSubtitle>
                      Incluída na inscrição · 100% algodão
                    </KitSubtitle>
                  </KitInfo>
                </KitPreview>
                <Label>Selecione o tamanho</Label>
                <SizeGrid>
                  {TSHIRT_SIZES.map(size => (
                    <SizeCard
                      key={size}
                      $selected={tshirtSize === size}
                      onClick={() => setTshirtSize(size)}
                      type="button"
                    >
                      <SizeLetter>{size}</SizeLetter>
                      <SizeName>
                        {size === 'P'
                          ? 'Pequeno'
                          : size === 'M'
                          ? 'Médio'
                          : size === 'G'
                          ? 'Grande'
                          : 'Extra Grande'}
                      </SizeName>
                    </SizeCard>
                  ))}
                </SizeGrid>
                <SizeGuide>
                  ℹ️ Em caso de dúvida, consulte o guia de tamanhos. Caso não
                  informe, enviaremos o tamanho <strong>M</strong> por padrão.
                </SizeGuide>
                <BtnRow>
                  <Button $variant="outline" onClick={() => setStep(2)}>
                    ← Anterior
                  </Button>
                  <Button onClick={() => setStep(4)}>Próximo →</Button>
                </BtnRow>
              </Card>
            )}

            {/* Step 4 */}
            {step === 4 && (
              <Card>
                <CardTitle>Resumo do Pedido</CardTitle>
                <SummaryCard>
                  <SummaryHeader>
                    <SummaryLabel>Dados Pessoais</SummaryLabel>
                    <EditBtn onClick={() => setStep(1)}>✏ Editar</EditBtn>
                  </SummaryHeader>
                  <SummaryText>
                    {personal.name}
                    <br />
                    {personal.email}
                    <br />
                    CPF: {personal.cpf} · Tel: {personal.phone}
                  </SummaryText>
                </SummaryCard>
                <SummaryCard>
                  <SummaryHeader>
                    <SummaryLabel>Categoria</SummaryLabel>
                    <EditBtn onClick={() => setStep(2)}>✏ Editar</EditBtn>
                  </SummaryHeader>
                  <SummaryText>
                    {selectedCategory?.name} — {selectedCategory?.distance_km}km
                    <br />
                    {selectedCategory && formatCurrency(selectedCategory.price)}
                  </SummaryText>
                </SummaryCard>
                <SummaryCard>
                  <SummaryHeader>
                    <SummaryLabel>Kit</SummaryLabel>
                    <EditBtn onClick={() => setStep(3)}>✏ Editar</EditBtn>
                  </SummaryHeader>
                  <SummaryText>
                    Camiseta — Tamanho {tshirtSize}
                  </SummaryText>
                </SummaryCard>
                <TotalCard>
                  <TotalLabel>Total</TotalLabel>
                  <TotalPrice>{formatCurrency(totalPrice)}</TotalPrice>
                </TotalCard>
                <BtnRow>
                  <Button $variant="outline" onClick={() => setStep(3)}>
                    ← Anterior
                  </Button>
                  <Button onClick={() => setStep(5)}>Ir para Pagamento →</Button>
                </BtnRow>
              </Card>
            )}

            {/* Step 5 */}
            {step === 5 && (
              <Card>
                <CardTitle>Pagamento</CardTitle>
                <PaymentMethods>
                  <PaymentCard
                    $selected={paymentMethod === 'credit_card'}
                    onClick={() => setPaymentMethod('credit_card')}
                    type="button"
                  >
                    <RadioDot $checked={paymentMethod === 'credit_card'} />
                    <PaymentIcon>💳</PaymentIcon>
                    <PaymentInfo>
                      <PaymentName>Cartão de Crédito</PaymentName>
                      <PaymentDesc>Parcelamento até 3x sem juros</PaymentDesc>
                    </PaymentInfo>
                  </PaymentCard>
                  <PaymentCard
                    $selected={paymentMethod === 'pix'}
                    onClick={() => setPaymentMethod('pix')}
                    type="button"
                  >
                    <RadioDot $checked={paymentMethod === 'pix'} />
                    <PaymentIcon>📱</PaymentIcon>
                    <PaymentInfo>
                      <PaymentName>PIX</PaymentName>
                      <PaymentDesc>5% de desconto · Aprovação instantânea</PaymentDesc>
                    </PaymentInfo>
                  </PaymentCard>
                  <PaymentCard
                    $selected={paymentMethod === 'boleto'}
                    onClick={() => setPaymentMethod('boleto')}
                    type="button"
                  >
                    <RadioDot $checked={paymentMethod === 'boleto'} />
                    <PaymentIcon>📄</PaymentIcon>
                    <PaymentInfo>
                      <PaymentName>Boleto Bancário</PaymentName>
                      <PaymentDesc>Compensação em até 3 dias úteis</PaymentDesc>
                    </PaymentInfo>
                  </PaymentCard>
                </PaymentMethods>

                {paymentMethod === 'pix' && (
                  <InfoBox $type="pix">
                    <InfoBoxTitle>📱 Pagamento via PIX</InfoBoxTitle>
                    <InfoBoxText>
                      Ao finalizar, você receberá um QR Code e uma chave PIX
                      para pagamento. O desconto de <strong>5%</strong> será
                      aplicado automaticamente. Aprovação é instantânea.
                    </InfoBoxText>
                  </InfoBox>
                )}

                {paymentMethod === 'boleto' && (
                  <InfoBox $type="boleto">
                    <InfoBoxTitle>📄 Pagamento via Boleto</InfoBoxTitle>
                    <InfoBoxText>
                      O boleto será gerado após a finalização e leva até{' '}
                      <strong>3 dias úteis</strong> para compensação. Sua
                      inscrição será confirmada após a confirmação do
                      pagamento.
                    </InfoBoxText>
                  </InfoBox>
                )}

                {paymentMethod === 'credit_card' && (
                  <FormGrid>
                    <FormGroup style={{ gridColumn: '1 / -1' }}>
                      <Label>Número do cartão</Label>
                      <Input
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={e =>
                          setCardNumber(maskCardNumber(e.target.value))
                        }
                        maxLength={19}
                      />
                    </FormGroup>
                    <FormGroup style={{ gridColumn: '1 / -1' }}>
                      <Label>Nome no cartão</Label>
                      <Input
                        placeholder="Nome impresso no cartão"
                        value={cardName}
                        onChange={e => setCardName(e.target.value.toUpperCase())}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Validade</Label>
                      <Input
                        placeholder="MM/AA"
                        value={cardExpiry}
                        onChange={e =>
                          setCardExpiry(maskExpiry(e.target.value))
                        }
                        maxLength={5}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>CVV</Label>
                      <Input
                        placeholder="000"
                        value={cardCvv}
                        onChange={e =>
                          setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                        }
                        maxLength={4}
                      />
                    </FormGroup>
                    <FormGroup style={{ gridColumn: '1 / -1' }}>
                      <Label>Parcelas</Label>
                      <InstallmentSelect
                        value={installments}
                        onChange={e => setInstallments(Number(e.target.value))}
                      >
                        {[1, 2, 3].map(n => (
                          <option key={n} value={n}>
                            {n}x de {formatCurrency(totalPrice / n)}{' '}
                            {n === 1 ? '(à vista)' : 'sem juros'}
                          </option>
                        ))}
                      </InstallmentSelect>
                    </FormGroup>
                  </FormGrid>
                )}

                <BtnRow>
                  <Button $variant="outline" onClick={() => setStep(4)}>
                    ← Anterior
                  </Button>
                  <Button
                    $variant="success"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? 'Processando...' : 'Finalizar Inscrição ✓'}
                  </Button>
                </BtnRow>

                <SecurityNote>
                  🔒 Pagamento 100% seguro. Seus dados são criptografados e
                  protegidos.
                </SecurityNote>
              </Card>
            )}
          </MainCol>

          {/* Sidebar */}
          {!confirmed && (
            <Sidebar>
              <SideCard>
                <SideTitle>Resumo do Pedido</SideTitle>
                <SideRow>
                  <SideLabel>Categoria</SideLabel>
                  <SideValue>
                    {selectedCategory
                      ? `${selectedCategory.name} — ${selectedCategory.distance_km}km`
                      : '—'}
                  </SideValue>
                </SideRow>
                <SideRow>
                  <SideLabel>Camiseta</SideLabel>
                  <SideValue>{tshirtSize}</SideValue>
                </SideRow>
                {paymentMethod === 'pix' && discount > 0 && (
                  <SideRow>
                    <SideLabel style={{ color: '#10B981' }}>
                      Desconto PIX (5%)
                    </SideLabel>
                    <SideValue style={{ color: '#10B981' }}>
                      − {formatCurrency(discount)}
                    </SideValue>
                  </SideRow>
                )}
                <SideDivider />
                <SideTotal>
                  <SideTotalLabel>Total</SideTotalLabel>
                  <SideTotalValue>{formatCurrency(totalPrice)}</SideTotalValue>
                </SideTotal>
              </SideCard>

              <SideCard>
                <SideTitle>Cupom de Desconto</SideTitle>
                <CouponRow>
                  <CouponInput
                    placeholder="Código do cupom"
                    value={coupon}
                    onChange={e => setCoupon(e.target.value.toUpperCase())}
                  />
                  <CouponBtn>Aplicar</CouponBtn>
                </CouponRow>
              </SideCard>

              <SideCard>
                <TrustBadge>
                  <TrustIcon>🔒</TrustIcon>
                  <div>
                    <TrustText>Compra segura</TrustText>
                    <TrustSubtext>Dados criptografados com SSL</TrustSubtext>
                  </div>
                </TrustBadge>
                <TrustBadge>
                  <TrustIcon>💬</TrustIcon>
                  <div>
                    <TrustText>Suporte 24h</TrustText>
                    <TrustSubtext>Atendimento via WhatsApp</TrustSubtext>
                  </div>
                </TrustBadge>
                <TrustBadge>
                  <TrustIcon>↩️</TrustIcon>
                  <div>
                    <TrustText>Cancelamento grátis</TrustText>
                    <TrustSubtext>Até 7 dias antes do evento</TrustSubtext>
                  </div>
                </TrustBadge>
              </SideCard>
            </Sidebar>
          )}
        </Layout>
      </Container>
    </PageWrapper>
  )
}
