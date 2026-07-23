import { useState } from 'react'
import type { FormEvent } from 'react'
import styled from 'styled-components'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

function getPasswordStrength(password: string): number {
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

const strengthLabels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte']
const strengthColors = ['#EF4444', '#F97316', '#F59E0B', '#22C55E', '#10B981']

const Page = styled.div`
  display: flex;
  min-height: 100vh;
`

const LeftPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: ${({ theme }) => theme.space[10]} ${({ theme }) => theme.space[16]};
  max-width: 640px;

  @media (max-width: 1024px) {
    padding: ${({ theme }) => theme.space[8]};
  }

  @media (max-width: 768px) {
    max-width: 100%;
    padding: ${({ theme }) => theme.space[6]};
  }
`

const RightPanel = styled.div`
  flex: 1;
  background: linear-gradient(135deg, #FF0000 0%, #000000 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.space[16]};
  color: #fff;

  @media (max-width: 768px) {
    display: none;
  }
`

const ThemeToggle = styled.button`
  position: fixed;
  top: ${({ theme }) => theme.space[4]};
  right: ${({ theme }) => theme.space[4]};
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: ${({ theme }) => theme.colors.text};
  z-index: 50;
  transition: background ${({ theme }) => theme.transition.fast};
  box-shadow: ${({ theme }) => theme.shadows.md};

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[8]};
`

const LogoImg = styled.img`
  height: 70px;
  width: auto;
`

const LogoText = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.xl};
  color: ${({ theme }) => theme.colors.text};
`

const Title = styled.h1`
  font-size: ${({ theme }) => theme.font.sizes['3xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[2]};
  font-family: ${({ theme }) => theme.font.headingFamily};
  text-transform: uppercase;
  letter-spacing: 0.02em;
`

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.base};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.space[6]};
  font-family: ${({ theme }) => theme.font.headingFamily};
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`

const Row = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[4]};

  @media (max-width: 600px) {
    flex-direction: column;
  }
`

const InputGroup = styled.div`
  position: relative;
  flex: 1;
`

const InputIcon = styled.span`
  position: absolute;
  left: ${({ theme }) => theme.space[4]};
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.font.sizes.base};
  pointer-events: none;
`

const Input = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
  padding-left: 2.75rem;
  padding-right: 2.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.card};
  transition: border-color ${({ theme }) => theme.transition.fast};
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const ToggleBtn = styled.button`
  position: absolute;
  right: ${({ theme }) => theme.space[3]};
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  padding: ${({ theme }) => theme.space[1]};

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`

const StrengthBar = styled.div`
  display: flex;
  gap: 4px;
  margin-top: ${({ theme }) => theme.space[2]};
`

const StrengthSegment = styled.div<{ $filled: boolean; $color: string }>`
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: ${({ $filled, $color, theme }) => ($filled ? $color : theme.colors.border)};
  transition: background ${({ theme }) => theme.transition.fast};
`

const StrengthLabel = styled.span<{ $color: string }>`
  font-size: ${({ theme }) => theme.font.sizes.xs};
  color: ${({ $color }) => $color};
  margin-top: 2px;
  display: block;
`

const CheckboxLabel = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;

  input {
    margin-top: 3px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: ${({ theme }) => theme.font.weights.medium};

    &:hover {
      text-decoration: underline;
    }
  }
`

const SubmitBtn = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.space[3]};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  border-radius: ${({ theme }) => theme.radius.md};
  transition: background ${({ theme }) => theme.transition.fast};
  margin-top: ${({ theme }) => theme.space[2]};
  font-family: inherit;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.font.sizes.sm};

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }
`

const SocialBtn = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.space[3]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.card};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[2]};
  transition: background ${({ theme }) => theme.transition.fast};
  font-family: inherit;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const FooterText = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.space[4]};
`

const FooterLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.font.weights.semibold};

  &:hover {
    text-decoration: underline;
  }
`

const ErrorText = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.error}12;
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.error}30;
`

const SuccessText = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.success};
  background: ${({ theme }) => theme.colors.success}12;
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.success}30;
`

const RightContent = styled.div`
  max-width: 420px;
  text-align: center;
`

const TrophyIcon = styled.div`
  font-size: 4rem;
  margin-bottom: ${({ theme }) => theme.space[6]};
`

const RightTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.sizes['3xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  margin-bottom: ${({ theme }) => theme.space[4]};
  line-height: 1.2;
  font-family: ${({ theme }) => theme.font.headingFamily};
  text-transform: uppercase;
  letter-spacing: 0.02em;
`

const RightDesc = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.base};
  opacity: 0.85;
  margin-bottom: ${({ theme }) => theme.space[10]};
  line-height: 1.6;
  font-family: ${({ theme }) => theme.font.headingFamily};
`

const StatsRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[10]};
  justify-content: center;
`

const StatItem = styled.div`
  text-align: center;
`

const StatNumber = styled.div`
  font-size: ${({ theme }) => theme.font.sizes['2xl']};
  font-weight: ${({ theme }) => theme.font.weights.bold};
  margin-bottom: ${({ theme }) => theme.space[1]};
`

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  opacity: 0.8;
`

export function Cadastro() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const { signUp } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const strength = getPasswordStrength(password)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim()) {
      setError('Nome completo é obrigatório')
      return
    }

    if (!email.includes('@')) {
      setError('E-mail inválido')
      return
    }

    const cpfDigits = cpf.replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      setError('CPF deve conter 11 dígitos')
      return
    }

    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      setError('Telefone inválido')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (!acceptTerms) {
      setError('Você precisa aceitar os Termos de Uso')
      return
    }

    setLoading(true)

    const { data: existingCpf } = await supabase
      .from('profiles')
      .select('id')
      .eq('cpf', cpfDigits)
      .single()

    if (existingCpf) {
      setError('CPF já cadastrado')
      setLoading(false)
      return
    }

    const result = await signUp({
      name: name.trim(),
      email: email.trim(),
      cpf: cpfDigits,
      phone: phone.replace(/\D/g, ''),
      birth_date: '',
      gender: '',
      password,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess('Conta criada com sucesso! Verifique seu e-mail para confirmar.')
      setTimeout(() => navigate('/login'), 3000)
    }
  }

  return (
    <Page>
      <ThemeToggle onClick={toggleTheme}>
        {theme === 'light' ? '☀' : '☾'}
      </ThemeToggle>

      <LeftPanel>
        <LogoLink to="/">
          <LogoImg src="/logo.png" alt="NVR Sports" />
        </LogoLink>

        <Title>Crie sua conta</Title>
        <Subtitle>Comece a correr com a comunidade NVR Sports</Subtitle>

        <Form onSubmit={handleSubmit}>
          {error && <ErrorText>{error}</ErrorText>}
          {success && <SuccessText>{success}</SuccessText>}

          <InputGroup>
            <InputIcon>👤</InputIcon>
            <Input
              type="text"
              placeholder="Nome completo"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </InputGroup>

          <InputGroup>
            <InputIcon>✉</InputIcon>
            <Input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </InputGroup>

          <Row>
            <InputGroup>
              <InputIcon>📋</InputIcon>
              <Input
                type="text"
                placeholder="CPF"
                value={cpf}
                onChange={e => setCpf(maskCpf(e.target.value))}
                required
              />
            </InputGroup>
            <InputGroup>
              <InputIcon>📞</InputIcon>
              <Input
                type="text"
                placeholder="Telefone"
                value={phone}
                onChange={e => setPhone(maskPhone(e.target.value))}
                required
              />
            </InputGroup>
          </Row>

          <InputGroup>
            <InputIcon>🔒</InputIcon>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Crie uma senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <ToggleBtn type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? '🙈' : '👁'}
            </ToggleBtn>
          </InputGroup>

          {password.length > 0 && (
            <>
              <StrengthBar>
                {[0, 1, 2, 3, 4].map(i => (
                  <StrengthSegment
                    key={i}
                    $filled={i < strength}
                    $color={strengthColors[strength - 1] || strengthColors[0]}
                  />
                ))}
              </StrengthBar>
              <StrengthLabel $color={strengthColors[strength - 1] || strengthColors[0]}>
                {strengthLabels[strength - 1] || 'Muito fraca'}
              </StrengthLabel>
            </>
          )}

          <InputGroup>
            <InputIcon>🔒</InputIcon>
            <Input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirme a senha"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
            <ToggleBtn type="button" onClick={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? '🙈' : '👁'}
            </ToggleBtn>
          </InputGroup>

          <CheckboxLabel>
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={e => setAcceptTerms(e.target.checked)}
            />
            <span>
              Li e aceito os{' '}
              <a href="/termos" target="_blank" rel="noopener noreferrer">Termos de Uso</a>
              {' '}e a{' '}
              <a href="/privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</a>
            </span>
          </CheckboxLabel>

          <SubmitBtn type="submit" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </SubmitBtn>
        </Form>

        <Divider style={{ margin: '1.5rem 0' }}>ou</Divider>

        <SocialBtn type="button" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}>
          <span>G</span> Cadastrar com Google
        </SocialBtn>

        <FooterText>
          Já tem conta? <FooterLink to="/login">Entre</FooterLink>
        </FooterText>
      </LeftPanel>

      <RightPanel>
        <RightContent>
          <TrophyIcon>🏆</TrophyIcon>
          <RightTitle>Junte-se a milhares de atletas.</RightTitle>
          <RightDesc>
            Faça parte da maior comunidade de corrida do Brasil. Acompanhe seus
            resultados, descubra novos eventos e compete com atletas de todo o país.
          </RightDesc>

          <StatsRow>
            <StatItem>
              <StatNumber>50k+</StatNumber>
              <StatLabel>Corredores</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>200+</StatNumber>
              <StatLabel>Cidades</StatLabel>
            </StatItem>
          </StatsRow>
        </RightContent>
      </RightPanel>
    </Page>
  )
}
