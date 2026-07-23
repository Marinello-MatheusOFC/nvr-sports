import React from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

const FooterWrapper = styled.footer`
  background: ${({ theme }) => theme.colors.card};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const FooterInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space[16]} ${({ theme }) => theme.space[6]} ${({ theme }) => theme.space[8]};
  display: grid;
  grid-template-columns: 1.5fr repeat(3, 1fr);
  gap: ${({ theme }) => theme.space[8]};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: ${({ theme }) => theme.space[10]} ${({ theme }) => theme.space[6]} ${({ theme }) => theme.space[6]};
  }
`

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`

const LogoImg = styled.img`
  height: auto;
  width: 200px;
  max-width: 200px;
`

const Description = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.7;
`

const SocialLinks = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[3]};
`

const SocialLink = styled.a`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
`

const ColumnTitle = styled.h4`
  font-family: ${({ theme }) => theme.font.headingFamily};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[2]};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const ColumnLink = styled(Link)`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: color ${({ theme }) => theme.transition.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`

const CopyrightBar = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[6]};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  text-align: center;
  font-family: ${({ theme }) => theme.font.headingFamily};
  font-size: ${({ theme }) => theme.font.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const socials = [
  { label: 'IG', href: '#' },
  { label: 'FB', href: '#' },
  { label: 'WA', href: '#' },
  { label: 'YT', href: '#' },
]

const platformLinks = [
  { path: '/eventos', label: 'Eventos' },
  { path: '/inscricoes', label: 'Inscrições' },
  { path: '/ranking', label: 'Ranking' },
  { path: '/blog', label: 'Blog' },
]

const companyLinks = [
  { path: '/sobre', label: 'Sobre nós' },
  { path: '/contato', label: 'Contato' },
  { path: '/parceiros', label: 'Parceiros' },
  { path: '/imprensa', label: 'Imprensa' },
]

const supportLinks = [
  { path: '/faq', label: 'FAQ' },
  { path: '/termos', label: 'Termos de uso' },
  { path: '/privacidade', label: 'Privacidade' },
  { path: '/suporte', label: 'Suporte' },
]

export function Footer() {
  return (
    <FooterWrapper>
      <FooterInner>
        <Brand>
          <LogoImg src="/logo.png" alt="NVR Sports" />
          <Description>
            Conectando corredores e ciclistas a eventos esportivos ao vivo.
            Sua próxima aventura começa aqui.
          </Description>
          <SocialLinks>
            {socials.map(s => (
              <SocialLink key={s.label} href={s.href}>{s.label}</SocialLink>
            ))}
          </SocialLinks>
        </Brand>

        <Column>
          <ColumnTitle>Plataforma</ColumnTitle>
          {platformLinks.map(l => (
            <ColumnLink key={l.path} to={l.path}>{l.label}</ColumnLink>
          ))}
        </Column>

        <Column>
          <ColumnTitle>Empresa</ColumnTitle>
          {companyLinks.map(l => (
            <ColumnLink key={l.path} to={l.path}>{l.label}</ColumnLink>
          ))}
        </Column>

        <Column>
          <ColumnTitle>Suporte</ColumnTitle>
          {supportLinks.map(l => (
            <ColumnLink key={l.path} to={l.path}>{l.label}</ColumnLink>
          ))}
        </Column>
      </FooterInner>

      <CopyrightBar>
        &copy; {new Date().getFullYear()} NVR Sports. Todos os direitos reservados.
      </CopyrightBar>
    </FooterWrapper>
  )
}
