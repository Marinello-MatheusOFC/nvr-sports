import styled from 'styled-components'
import { Link } from 'react-router-dom'

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.space[6]};
`

const Content = styled.div`
  text-align: center;
  max-width: 480px;
`

const Code = styled.h1`
  font-size: 8rem;
  font-weight: ${({ theme }) => theme.font.weights.bold};
  color: ${({ theme }) => theme.colors.primary};
  line-height: 1;
  margin-bottom: ${({ theme }) => theme.space[4]};
  letter-spacing: -0.04em;

  @media (max-width: 600px) {
    font-size: 5rem;
  }
`

const Message = styled.h2`
  font-size: ${({ theme }) => theme.font.sizes['2xl']};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.space[3]};
`

const Description = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.base};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
  margin-bottom: ${({ theme }) => theme.space[8]};
`

const HomeBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[6]};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  border-radius: ${({ theme }) => theme.radius.md};
  text-decoration: none;
  transition: background ${({ theme }) => theme.transition.base},
              transform ${({ theme }) => theme.transition.base};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
    transform: translateY(-2px);
  }
`

export default function NotFound() {
  return (
    <Page>
      <Content>
        <Code>404</Code>
        <Message>Página não encontrada</Message>
        <Description>
          Ops! A página que você procura não existe ou foi movida.
          Que tal voltar para a página inicial?
        </Description>
        <HomeBtn to="/">← Voltar ao início</HomeBtn>
      </Content>
    </Page>
  )
}
