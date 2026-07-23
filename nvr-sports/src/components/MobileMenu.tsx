import React from 'react'
import styled, { css, keyframes } from 'styled-components'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  display: flex;
  justify-content: flex-end;
  opacity: 0;
  pointer-events: none;
  transition: opacity ${({ theme }) => theme.transition.base};

  ${({ $isOpen }) => $isOpen && css`
    opacity: 1;
    pointer-events: auto;
  `}
`

const Panel = styled.div`
  width: min(320px, 85vw);
  height: 100%;
  background: ${({ theme }) => theme.colors.card};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.space[8]} ${({ theme }) => theme.space[6]};
  position: relative;
`

const CloseBtn = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.space[4]};
  right: ${({ theme }) => theme.space[4]};
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => theme.space[2]};
  line-height: 1;
`

const NavList = styled.nav`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  margin-top: ${({ theme }) => theme.space[12]};
`

const MobileLink = styled(Link)`
  display: block;
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
  font-size: ${({ theme }) => theme.font.sizes.lg};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radius.md};
  transition: background ${({ theme }) => theme.transition.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const LoginBtn = styled(Link)`
  display: block;
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
  font-size: ${({ theme }) => theme.font.sizes.lg};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.md};
  transition: background ${({ theme }) => theme.transition.fast};
  margin-top: auto;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const SignupBtn = styled(Link)`
  display: block;
  width: 100%;
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.font.sizes.lg};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  text-align: center;
  border-radius: ${({ theme }) => theme.radius.md};
  transition: background ${({ theme }) => theme.transition.fast};
  margin-top: ${({ theme }) => theme.space[3]};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <Overlay $isOpen={isOpen} onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <CloseBtn onClick={onClose}>✕</CloseBtn>
        <NavList>
          <MobileLink to="/" onClick={onClose}>Home</MobileLink>
          <MobileLink to="/eventos" onClick={onClose}>Eventos</MobileLink>
          <MobileLink to="/contato" onClick={onClose}>Contato</MobileLink>
        </NavList>
        <LoginBtn to="/login" onClick={onClose}>Entrar</LoginBtn>
        <SignupBtn to="/signup" onClick={onClose}>Inscreva-se</SignupBtn>
      </Panel>
    </Overlay>
  )
}
