import { useState, useEffect, useRef } from 'react'
import styled, { css } from 'styled-components'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { MobileMenu } from './MobileMenu'

const StyledNav = styled.header<{ $scrolled: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: linear-gradient(180deg, #1A0808 0%, #2A1212 100%);
  border-bottom: 2px solid rgba(255, 0, 0, 0.2);
  transition: all ${({ theme }) => theme.transition.slow};

  ${({ $scrolled, theme }) => $scrolled && css`
    background: rgba(26, 8, 8, 0.95);
    backdrop-filter: blur(16px);
    border-bottom-color: rgba(255, 0, 0, 0.35);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  `}
`

const StyledNavInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[6]};
  height: 155px;
`

const LogoLink = styled(Link)`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  justify-self: start;
`

const LogoImg = styled.img`
  height: 150px;
  width: auto;
  transition: transform ${({ theme }) => theme.transition.fast};

  &:hover {
    transform: scale(1.03);
  }
`

const NavLinks = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[10]};

  @media (max-width: 768px) {
    display: none;
  }
`

const NavLink = styled(Link)<{ $active: boolean }>`
  font-family: ${({ theme }) => theme.font.headingFamily};
  font-size: ${({ theme }) => theme.font.sizes.lg};
  font-weight: ${({ $active, theme }) =>
    $active ? theme.font.weights.bold : theme.font.weights.semibold};
  color: rgba(255, 255, 255, ${({ $active }) => ($active ? '1' : '0.7')});
  position: relative;
  padding: ${({ theme }) => theme.space[2]} 0;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  transition: color ${({ theme }) => theme.transition.fast};

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 3px;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 2px;
    transition: width ${({ theme }) => theme.transition.fast};
  }

  &:hover {
    color: #FFFFFF;
  }

  &:hover::after {
    width: 100%;
  }

  ${({ $active }) => $active && css`
    color: #FFFFFF;
    &::after {
      width: 100%;
    }
  `}
`

const NavActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[4]};

  @media (max-width: 768px) {
    display: none;
  }
`

const ThemeToggleBtn = styled.button`
  width: 42px;
  height: 42px;
  border-radius: ${({ theme }) => theme.radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #FFFFFF;
    border-color: rgba(255, 255, 255, 0.25);
  }
`

const LoginLink = styled(Link)`
  font-family: ${({ theme }) => theme.font.headingFamily};
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  color: rgba(255, 255, 255, 0.85);
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[4]};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    color: #FFFFFF;
    border-color: rgba(255, 255, 255, 0.45);
    background: rgba(255, 255, 255, 0.08);
  }
`

const SignupLink = styled(Link)`
  font-family: ${({ theme }) => theme.font.headingFamily};
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: #FFFFFF;
  background: ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[5]};
  border-radius: ${({ theme }) => theme.radius.md};
  box-shadow: 0 2px 12px rgba(255, 0, 0, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
    box-shadow: 0 4px 20px rgba(255, 0, 0, 0.45);
    transform: translateY(-1px);
  }
`

const ProfileWrapper = styled.div`
  position: relative;
`

const ProfileBtn = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[3]};
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: ${({ theme }) => theme.radius.full};
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.fast};
  font-family: inherit;

  &:hover {
    border-color: rgba(255, 0, 0, 0.5);
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.2);
  }
`

const ProfileName = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.medium};
  color: rgba(255, 255, 255, 0.9);

  @media (max-width: 900px) {
    display: none;
  }
`

const Avatar = styled.span`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  font-size: ${({ theme }) => theme.font.sizes.xs};
  box-shadow: 0 2px 8px rgba(255, 0, 0, 0.3);
`

const Dropdown = styled.div<{ $open: boolean }>`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 240px;
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
  padding: ${({ theme }) => theme.space[2]};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  transform: translateY(${({ $open }) => ($open ? '0' : '-8px')});
  transition: all 0.2s ease;
  z-index: 200;
`

const DropdownHeader = styled.div`
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[3]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: ${({ theme }) => theme.space[1]};
`

const DropdownName = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
`

const DropdownEmail = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
`

const DropdownLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[3]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.text};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`

const DropdownBtn = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  width: 100%;
  padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[3]};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.error};
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background ${({ theme }) => theme.transition.fast};
  font-family: inherit;

  &:hover {
    background: ${({ theme }) => theme.colors.error}0D;
  }
`

const DropdownDivider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: ${({ theme }) => theme.space[1]} 0;
`

const HamburgerBtn = styled.button`
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 40px;
  height: 40px;

  @media (max-width: 768px) {
    display: flex;
  }

  span {
    display: block;
    width: 24px;
    height: 2px;
    background: #FFFFFF;
    border-radius: 2px;
    transition: transform ${({ theme }) => theme.transition.fast};
  }
`

const links = [
  { path: '/', label: 'Home' },
  { path: '/eventos', label: 'Eventos' },
  { path: '/contato', label: 'Contato' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setDropdownOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : ''

  return (
    <>
      <StyledNav $scrolled={scrolled}>
        <StyledNavInner>
          <LogoLink to="/">
            <LogoImg src="/logo.png" alt="NVR Sports" />
          </LogoLink>

          <NavLinks>
            {links.map(link => (
              <NavLink
                key={link.path}
                to={link.path}
                $active={location.pathname === link.path}
              >
                {link.label}
              </NavLink>
            ))}
          </NavLinks>

          <NavActions>
            <ThemeToggleBtn onClick={toggleTheme}>
              {theme === 'light' ? '☀' : '☾'}
            </ThemeToggleBtn>

            {user ? (
              <ProfileWrapper ref={dropdownRef}>
                <ProfileBtn onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <ProfileName>{user.name?.split(' ')[0]}</ProfileName>
                  <Avatar>{userInitials}</Avatar>
                </ProfileBtn>
                <Dropdown $open={dropdownOpen}>
                  <DropdownHeader>
                    <DropdownName>{user.name}</DropdownName>
                    <DropdownEmail>{user.email}</DropdownEmail>
                  </DropdownHeader>
                  <DropdownLink to="/perfil">
                    <span>👤</span> Meu Perfil
                  </DropdownLink>
                  <DropdownLink to="/perfil">
                    <span>📝</span> Minhas Inscrições
                  </DropdownLink>
                  <DropdownLink to="/perfil">
                    <span>🏅</span> Certificados
                  </DropdownLink>
                  <DropdownDivider />
                  <DropdownBtn onClick={() => { signOut(); setDropdownOpen(false) }}>
                    <span>🚪</span> Sair da Conta
                  </DropdownBtn>
                </Dropdown>
              </ProfileWrapper>
            ) : (
              <>
                <LoginLink to="/login">Entrar</LoginLink>
                <SignupLink to="/cadastro">Inscreva-se</SignupLink>
              </>
            )}

            <HamburgerBtn onClick={() => setMenuOpen(true)}>
              <span />
              <span />
              <span />
            </HamburgerBtn>
          </NavActions>
        </StyledNavInner>
      </StyledNav>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
