import { useState } from 'react'
import type { FormEvent } from 'react'
import styled from 'styled-components'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'

const Page = styled.div`
  display: flex;
  min-height: 100vh;
`

const LeftPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: ${({ theme }) => theme.space[16]};
  max-width: 560px;

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
  margin-bottom: ${({ theme }) => theme.space[10]};
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
  margin-bottom: ${({ theme }) => theme.space[8]};
  font-family: ${({ theme }) => theme.font.headingFamily};
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[5]};
`

const InputGroup = styled.div`
  position: relative;
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
  font-size: ${({ theme }) => theme.font.sizes.base};
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
  font-size: ${({ theme }) => theme.font.sizes.base};
  padding: ${({ theme }) => theme.space[1]};

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`

const ForgotLink = styled(Link)`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  text-align: right;
  margin-top: -${({ theme }) => theme.space[2]};

  &:hover {
    text-decoration: underline;
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

const RightContent = styled.div`
  max-width: 420px;
  text-align: center;
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

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn(email, password)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      navigate('/')
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

        <Title>Bem-vindo de volta</Title>
        <Subtitle>Entre na sua conta para gerenciar suas corridas</Subtitle>

        <Form onSubmit={handleSubmit}>
          {error && <ErrorText>{error}</ErrorText>}

          <InputGroup>
            <InputIcon>✉</InputIcon>
            <Input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </InputGroup>

          <InputGroup>
            <InputIcon>🔒</InputIcon>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Sua senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <ToggleBtn type="button" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? '🙈' : '👁'}
            </ToggleBtn>
          </InputGroup>

          <ForgotLink to="/esqueci-senha">Esqueceu a senha?</ForgotLink>

          <SubmitBtn type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </SubmitBtn>
        </Form>

        <Divider style={{ margin: '1.5rem 0' }}>ou</Divider>

        <SocialBtn type="button" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}>
          <span>G</span> Entrar com Google
        </SocialBtn>

        <FooterText style={{ marginTop: '2rem' }}>
          Não tem conta? <FooterLink to="/cadastro">Cadastre-se</FooterLink>
        </FooterText>
      </LeftPanel>

      <RightPanel>
        <RightContent>
          <RightTitle>Cada corrida conta.</RightTitle>
          <RightDesc>
            Gerencie suas inscrições, acompanhe seus resultados e faça parte da
            maior comunidade de corrida do Brasil.
          </RightDesc>

          <StatsRow>
            <StatItem>
              <StatNumber>12k+</StatNumber>
              <StatLabel>Atletas ativos</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>350+</StatNumber>
              <StatLabel>Provas realizadas</StatLabel>
            </StatItem>
          </StatsRow>
        </RightContent>
      </RightPanel>
    </Page>
  )
}
