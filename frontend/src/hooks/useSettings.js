import { useState, useCallback } from 'react'

const SETTINGS_KEY = 'mahjong_coach_settings'

export const DEFAULT_SETTINGS = {
  dangerTiles:    true,   // 🚨 위험패 표시
  winProbability: true,   // 📊 화료 확률 바
  yakuPath:       true,   // 🗺️ 족보 힌트 (yaku hints)
  tileHeatmap:    true,   // 🔥 패 효율 히트맵
  replayMode:     true,   // ⏪ 복기 모드
}

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  const toggle = useCallback((key) => {
    setSettings(prev => {
      const next = { ...prev, [key]: !prev[key] }
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return { settings, toggle }
}
