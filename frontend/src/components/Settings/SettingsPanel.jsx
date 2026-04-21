/** 기능 설정 패널 (모달) */
export default function SettingsPanel({ settings, onToggle, onClose }) {
  const features = [
    {
      key: 'dangerTiles',
      icon: '🚨',
      label: '위험패 표시',
      desc: '상대 버림패 분석으로 내 손패의 위험도를 색 점으로 표시 (초록=안전, 빨강=주의)',
    },
    {
      key: 'winProbability',
      icon: '📊',
      label: '화료 확률 바',
      desc: '남은 패산과 유효패 수를 기반으로 이번 판 예상 화료 확률을 표시',
    },
    {
      key: 'yakuPath',
      icon: '🀄',
      label: '족보 힌트',
      desc: '현재 손패로 노릴 수 있는 족보(역)와 달성 조건을 사이드바에 표시',
    },
    {
      key: 'tileHeatmap',
      icon: '🔥',
      label: '패 효율 히트맵',
      desc: '손패 각 타일에 버렸을 때 효율 순위를 색 표시 (초록=효율 좋음, 빨강=비추천)',
    },
    {
      key: 'replayMode',
      icon: '⏪',
      label: '복기 모드',
      desc: '게임 종료 후 잘못된 선택 순간을 자동 분석해 복기 리스트로 보여줌',
    },
  ]

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-100">⚙️ 코칭 기능 설정</h2>
            <p className="text-xs text-slate-500 mt-0.5">기능을 끄고 켜면 자동으로 저장됩니다</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {/* 기능 목록 */}
        <div className="flex flex-col gap-2.5">
          {features.map(({ key, icon, label, desc }) => (
            <div
              key={key}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                settings[key]
                  ? 'bg-indigo-950/40 border-indigo-700/40'
                  : 'bg-slate-700/30 border-slate-600/30'
              }`}
              onClick={() => onToggle(key)}
            >
              <span className="text-xl shrink-0 mt-0.5">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${settings[key] ? 'text-slate-100' : 'text-slate-400'}`}>
                  {label}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
              {/* 토글 스위치 */}
              <div
                className={`shrink-0 w-10 h-5 rounded-full transition-colors relative mt-0.5 ${
                  settings[key] ? 'bg-indigo-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                    settings[key] ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 하단 버튼 */}
        <button
          onClick={onClose}
          className="mt-5 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  )
}
