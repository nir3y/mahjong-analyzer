import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Screenshot() {
  const navigate = useNavigate()
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const handleFile = (file) => {
    if (!file) return
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
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
    } catch (e) {
      setResult('분석 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-white">←</button>
          <h1 className="text-2xl font-bold">🔍 스크린샷 분석기</h1>
        </div>
        <p className="text-gray-400 mb-6 text-sm">
          "왜 후리텐이야?", "왜 론을 못 해?" — 게임 화면을 올리면 AI가 설명해드립니다.
        </p>

        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current.click()}
          className="border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-colors mb-4"
        >
          {preview ? (
            <img src={preview} alt="preview" className="max-h-64 mx-auto rounded-xl" />
          ) : (
            <div>
              <div className="text-4xl mb-3">📷</div>
              <div className="text-gray-400">클릭하거나 이미지를 드래그하세요</div>
              <div className="text-gray-600 text-sm mt-1">PNG, JPG 지원</div>
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
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-colors mb-6"
        >
          {loading ? '분석 중...' : '분석하기'}
        </button>

        {result && (
          <div className="bg-gray-900 rounded-2xl p-6">
            <div className="text-gray-400 text-sm mb-3">AI 분석 결과</div>
            <div className="text-gray-100 leading-relaxed whitespace-pre-wrap text-sm">
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
