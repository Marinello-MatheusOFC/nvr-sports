import { Routes, Route } from 'react-router-dom'
import { ThemeProvider as SCThemeProvider } from 'styled-components'
import { useTheme } from './context/ThemeContext'
import { lightTheme, darkTheme } from './styles/theme'
import GlobalStyles from './styles/global'
import Layout from './components/Layout'
import Home from './pages/Home'
import { Login } from './pages/Login'
import { Cadastro } from './pages/Cadastro'
import Eventos from './pages/Eventos'
import Evento from './pages/Evento'
import Checkout from './pages/Checkout'
import Perfil from './pages/Perfil'
import Contato from './pages/Contato'
import NotFound from './pages/NotFound'

function ThemedApp() {
  const { theme } = useTheme()
  const currentTheme = theme === 'dark' ? darkTheme : lightTheme

  return (
    <SCThemeProvider theme={currentTheme}>
      <GlobalStyles />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/eventos/:slug" element={<Evento />} />
          <Route path="/checkout/:slug" element={<Checkout />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/contato" element={<Contato />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SCThemeProvider>
  )
}

export default function App() {
  return <ThemedApp />
}
