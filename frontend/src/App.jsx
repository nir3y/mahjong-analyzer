import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import GameList from './pages/GameList'
import Report from './pages/Report'
import Pattern from './pages/Pattern'
import Screenshot from './pages/Screenshot'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games/:tenhouId" element={<GameList />} />
        <Route path="/report/:gameId" element={<Report />} />
        <Route path="/pattern/:tenhouId" element={<Pattern />} />
        <Route path="/screenshot" element={<Screenshot />} />
      </Routes>
    </BrowserRouter>
  )
}
