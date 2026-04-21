import { useState, useRef } from 'react'
import api from '../api/client'
import InsightCallout from '../components/Common/InsightCallout'

export default function Screenshot() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleAnalyze = async () => {
    if (!image) return
    setLoading(true)
    setResult('')
    try {
      const form = new FormData()
      form.append('file', image)
      const res = await api.post('/screenshot/analyze', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data.explanation)
    } catch {
      setResult('분석 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">스크린샷 분석기</h1>
        <p className="mt-1 text-sm text-slate-400">
          "왜 후리텐이야?", "왜 론 못 해?" — 게임 화면을 올리면 AI가 설명해드립니다
        </p>
      </div>

      <InsightCallout
        variant="info"
        title="어떤 상황이든 분석 가능합니다"
        detail="후리텐, 론 불가, 역 성립 여부, 점수 계산, 위험패 판단 등 마작 관련 모든 상황을 질문하세요."
      />

      <div className="mt-6 space-y-4">
        {/* 드롭존 */}
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileRef.current.click()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200
            ${dragging
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-slate-700 hover:border-slate-500 bg-slate-800/30'
            }
          `}
        >
          {preview ? (
            <img src={preview} alt="preview" className="max-h-64 mx-auto rounded-lg object-contain" />
          ) : (
            <div>
              <div className="text-4xl mb-3">📷</div>
              <p className="text-slate-300 font-medium">클릭하거나 이미지를 드래그하세요</p>
              <p className="text-slate-500 text-sm mt-1">PNG, JPG 지원</p>
            </div>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />

        <button
          onClick={handleAnalyze}
          disabled={!image || loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⟳</span> 분석 중...
            </span>
          ) : '분석하기'}
        </button>

        {/* 결과 */}
        {result && (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">AI 분석 결과</p>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{result}</p>
          </div>
        )}
      </div>
    </div>
  )
}
