import { useState } from 'react'
import type { FormEvent } from 'react'
import styled from 'styled-components'
import { supabase } from '../lib/supabase'

const Page = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`

const Header = styled.section`
  position: relative;
  padding: ${({ theme }) => theme.space[16]} ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[16]};
  text-align: center;
  color: ${({ theme }) => theme.colors.white};
  background: url('https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1920&q=80') center/cover no-repeat;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.7) 100%);
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
  margin-bottom: ${({ theme }) => theme.space[2]};
  font-family: ${({ theme }) => theme.font.headingFamily};
  text-transform: uppercase;
  letter-spacing: 0.02em;
`

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.font.sizes.lg};
  opacity: 0.85;
  max-width: 600px;
  margin: 0 auto;
  font-family: ${({ theme }) => theme.font.headingFamily};
`

const Container = styled.div`
  max-width: 1200px;
  margin: ${({ theme }) => theme.space[8]} auto 0;
  padding: 0 ${({ theme }) => theme.space[4]} ${({ theme }) => theme.space[16]};
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: ${({ theme }) => theme.space[8]};
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
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
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[5]};
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space[4]};

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
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

const Textarea = styled.textarea`
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: ${({ theme }) => theme.font.sizes.base};
  font-family: inherit;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.card};
  outline: none;
  resize: vertical;
  min-height: 120px;
  transition: border-color ${({ theme }) => theme.transition.fast};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const SubmitBtn = styled.button`
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
  align-self: flex-start;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const ErrorText = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.error}12;
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.error}30;
`

const SuccessText = styled.div`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.success};
  background: ${({ theme }) => theme.colors.success}12;
  padding: ${({ theme }) => theme.space[3]} ${({ theme }) => theme.space[4]};
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.success}30;
`

/* ─── Contact Info Cards ─── */

const InfoCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`

const InfoCard = styled.div`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.space[5]};
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[4]};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

const InfoIcon = styled.span`
  font-size: 1.5rem;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.primary}12;
  border-radius: ${({ theme }) => theme.radius.md};
`

const InfoContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
`

const InfoLabel = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  font-weight: ${({ theme }) => theme.font.weights.semibold};
  color: ${({ theme }) => theme.colors.text};
`

const InfoValue = styled.span`
  font-size: ${({ theme }) => theme.font.sizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
`

const MapSection = styled.div`
  margin-top: ${({ theme }) => theme.space[6]};
`

const MapFrame = styled.iframe`
  width: 100%;
  height: 300px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.xl};
  box-shadow: ${({ theme }) => theme.shadows.md};
`

/* ─── Component ─── */

export default function Contato() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim() || !email.trim() || !subject || !message.trim()) {
      setError('Preencha todos os campos.')
      return
    }

    setLoading(true)

    const { error: insertError } = await supabase.from('contact_messages').insert({
      name: name.trim(),
      email: email.trim(),
      subject,
      message: message.trim(),
      status: 'pending',
    })

    if (insertError) {
      setError('Erro ao enviar mensagem. Tente novamente.')
    } else {
      setSuccess('Mensagem enviada com sucesso! Responderemos em breve.')
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    }
    setLoading(false)
  }

  return (
    <Page>
      <Header>
        <Title>Fale Conosco</Title>
        <Subtitle>Tem alguma dúvida ou sugestão? Estamos aqui para ajudar.</Subtitle>
      </Header>

      <Container>
        <Grid>
          <Card>
            <CardTitle>Enviar Mensagem</CardTitle>
            {error && <ErrorText>{error}</ErrorText>}
            {success && <SuccessText>{success}</SuccessText>}
            <Form onSubmit={handleSubmit}>
              <FormRow>
                <FormGroup>
                  <Label>Nome</Label>
                  <Input
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </FormGroup>
              </FormRow>
              <FormGroup>
                <Label>Assunto</Label>
                <Select value={subject} onChange={e => setSubject(e.target.value)}>
                  <option value="">Selecione o assunto</option>
                  <option value="Dúvida">Dúvida</option>
                  <option value="Inscrição">Inscrição</option>
                  <option value="Suporte Técnico">Suporte Técnico</option>
                  <option value="Parceria">Parceria</option>
                  <option value="Outro">Outro</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Mensagem</Label>
                <Textarea
                  placeholder="Escreva sua mensagem aqui..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </FormGroup>
              <SubmitBtn type="submit" disabled={loading}>
                {loading ? 'Enviando...' : '✉ Enviar Mensagem'}
              </SubmitBtn>
            </Form>
          </Card>

          <div>
            <InfoCards>
              <InfoCard>
                <InfoIcon>✉</InfoIcon>
                <InfoContent>
                  <InfoLabel>E-mail</InfoLabel>
                  <InfoValue>contato@nvrsports.com.br</InfoValue>
                </InfoContent>
              </InfoCard>
              <InfoCard>
                <InfoIcon>💬</InfoIcon>
                <InfoContent>
                  <InfoLabel>WhatsApp</InfoLabel>
                  <InfoValue>(11) 99999-0000</InfoValue>
                </InfoContent>
              </InfoCard>
              <InfoCard>
                <InfoIcon>📞</InfoIcon>
                <InfoContent>
                  <InfoLabel>Telefone</InfoLabel>
                  <InfoValue>(11) 3333-4444</InfoValue>
                </InfoContent>
              </InfoCard>
              <InfoCard>
                <InfoIcon>📍</InfoIcon>
                <InfoContent>
                  <InfoLabel>Endereço</InfoLabel>
                  <InfoValue>R. Antonio Turatti, 821 - Cidade Alta, Jaú/SP</InfoValue>
                </InfoContent>
              </InfoCard>
            </InfoCards>

            <MapSection>
              <MapFrame
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1975!2d-48.5527!3d-22.2963!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sR.+Antonio+Turatti,+821+-+Cidade+Alta,+Jaú/SP!5e0!3m2!1spt-BR!2sbr!4v1"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="NVR Sports - R. Antonio Turatti, 821 - Cidade Alta, Jaú/SP"
              />
            </MapSection>
          </div>
        </Grid>
      </Container>
    </Page>
  )
}
