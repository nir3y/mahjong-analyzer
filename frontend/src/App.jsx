import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import Home from './pages/Home'
import GameList from './pages/GameList'
import Report from './pages/Report'
import Pattern from './pages/Pattern'
import Screenshot from './pages/Screenshot'
import Game from './pages/Game'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games/:tenhouId" element={<AppLayout><GameList /></AppLayout>} />
        <Route path="/report/:gameId" element={<AppLayout><Report /></AppLayout>} />
        <Route path="/pattern/:tenhouId" element={<AppLayout><Pattern /></AppLayout>} />
        <Route path="/screenshot" element={<AppLayout><Screenshot /></AppLayout>} />
        <Route path="/game" element={<Game />} />
      </Routes>
    </BrowserRouter>
  )
}
