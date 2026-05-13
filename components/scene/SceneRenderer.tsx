'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Scene, Ending, DialogConfig, AnimationConfig, NewspaperConfig, SignatureConfig, GameConfig } from '@/lib/types'

interface Props {
  scene: Scene
  nextScene: Scene | null
  endings: Ending[]
  onFinish: () => void
}

export default function SceneRenderer({ scene, nextScene, endings, onFinish }: Props) {
  const router = useRouter()

  function goNext() {
    if (nextScene?.type === 'ending') {
      const scores = JSON.parse(sessionStorage.getItem('scores') ?? '{}') as Record<string, number>
      const total = Object.values(scores).reduce((a, b) => a + b, 0)
      const matched = endings.find(e => total >= e.score_min && total <= e.score_max) ?? endings[0]

      const sessionId = sessionStorage.getItem('session_id')
      if (sessionId) {
        fetch('/api/sessions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: sessionId, scores, total_score: total, ending_type: matched?.type }),
        })
      }
      router.push(`/ending/${matched?.type ?? 'C'}`)
    } else {
      onFinish()
    }
  }

  function addScore(key: string, value: number) {
    const scores = JSON.parse(sessionStorage.getItem('scores') ?? '{}') as Record<string, number>
    scores[key] = value
    sessionStorage.setItem('scores', JSON.stringify(scores))
  }

  switch (scene.type) {
    case 'dialog':
      return <DialogScene scene={scene} onFinish={goNext} />
    case 'animation':
      return <AnimationScene scene={scene} onFinish={goNext} />
    case 'newspaper':
      return <NewspaperScene scene={scene} onFinish={goNext} />
    case 'signature':
      return <SignatureScene scene={scene} onFinish={goNext} />
    case 'game':
      return <GameScene scene={scene} onFinish={(score) => { addScore(scene.id, score); goNext() }} />
    default:
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
          <p className="text-zinc-500 text-sm mb-8">{scene.title}</p>
          <button onClick={goNext} className={btnCls}>繼 續 →</button>
        </div>
      )
  }
}

// ── 共用樣式 ─────────────────────────────────────────────────────
const btnCls = 'border border-white/30 hover:border-white/60 text-white text-sm tracking-widest px-10 py-4 transition-colors'

// ── 對話場景 ─────────────────────────────────────────────────────
function DialogScene({ scene, onFinish }: { scene: Scene; onFinish: () => void }) {
  const config = scene.config as DialogConfig
  const dialogs = config.dialogs ?? []
  const [index, setIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const currentText = dialogs[index]?.text ?? ''
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0
    function tick() {
      i++
      setDisplayed(currentText.slice(0, i))
      if (i < currentText.length) {
        timerRef.current = setTimeout(tick, 35)
      } else {
        setDone(true)
      }
    }
    if (currentText) tick()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [index, currentText])

  function handleTap() {
    if (!done) {
      // 快速顯示完整文字
      if (timerRef.current) clearTimeout(timerRef.current)
      setDisplayed(currentText)
      setDone(true)
      return
    }
    if (index < dialogs.length - 1) {
      setIndex(i => i + 1)
    } else {
      onFinish()
    }
  }

  const current = dialogs[index]

  return (
    <div
      className="min-h-screen bg-black text-white flex flex-col justify-end p-0 cursor-pointer select-none"
      style={config.background_url ? { backgroundImage: `url(${config.background_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      onClick={handleTap}
    >
      {/* 進度點 */}
      <div className="flex justify-center gap-1.5 mb-4">
        {dialogs.map((_, i) => (
          <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i <= index ? 'bg-white' : 'bg-white/20'}`} />
        ))}
      </div>

      {/* 對話框 */}
      <div className="bg-black/80 backdrop-blur border-t border-white/10 p-6 pb-10">
        {current?.speaker && (
          <div className="flex items-center gap-2 mb-3">
            {current.avatar_url && (
              <img src={current.avatar_url} alt={current.speaker} className="w-8 h-8 rounded-full object-cover" />
            )}
            <span className="text-xs text-yellow-400 font-medium tracking-wider">{current.speaker}</span>
          </div>
        )}
        <p className="text-sm leading-relaxed text-white/90 min-h-[3rem]">{displayed}</p>
        {done && (
          <p className="text-xs text-white/30 mt-3 text-right">
            {index < dialogs.length - 1 ? '點擊繼續' : '點擊結束'}
          </p>
        )}
      </div>
    </div>
  )
}

// ── 影片場景 ─────────────────────────────────────────────────────
function AnimationScene({ scene, onFinish }: { scene: Scene; onFinish: () => void }) {
  const config = scene.config as AnimationConfig
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    if (config.auto_advance && videoRef.current) {
      videoRef.current.onended = () => {
        if (config.auto_advance) onFinish()
        else setEnded(true)
      }
    }
  }, [config.auto_advance, onFinish])

  if (!config.video_url) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
        <p className="text-zinc-500 text-sm">影片 URL 未設定</p>
        <button onClick={onFinish} className={btnCls}>繼 續 →</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
      <video
        ref={videoRef}
        src={config.video_url}
        autoPlay={config.autoplay ?? true}
        loop={config.loop ?? false}
        playsInline
        className="w-full max-h-screen object-contain"
        onEnded={() => { if (!config.auto_advance) setEnded(true) }}
      />
      {(ended || !config.auto_advance) && (
        <div className="absolute bottom-10 w-full flex justify-center">
          <button onClick={onFinish} className={btnCls}>繼 續 →</button>
        </div>
      )}
    </div>
  )
}

// ── 報紙場景 ─────────────────────────────────────────────────────
function NewspaperScene({ scene, onFinish }: { scene: Scene; onFinish: () => void }) {
  const config = scene.config as NewspaperConfig
  const pages = config.pages ?? []
  const [index, setIndex] = useState(0)
  const startX = useRef<number | null>(null)

  function handleSwipe(dx: number) {
    if (dx < -50 && index < pages.length - 1) setIndex(i => i + 1)
    if (dx > 50 && index > 0) setIndex(i => i - 1)
  }

  if (!pages.length) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6">
        <p className="text-zinc-500 text-sm">尚未設定報紙頁面</p>
        <button onClick={onFinish} className={btnCls}>繼 續 →</button>
      </div>
    )
  }

  const page = pages[index]

  return (
    <div
      className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col select-none"
      onTouchStart={e => { startX.current = e.touches[0].clientX }}
      onTouchEnd={e => { if (startX.current !== null) { handleSwipe(e.changedTouches[0].clientX - startX.current); startX.current = null } }}
      onMouseDown={e => { startX.current = e.clientX }}
      onMouseUp={e => { if (startX.current !== null) { handleSwipe(e.clientX - startX.current); startX.current = null } }}
    >
      {/* 報頭 */}
      <div className="border-b-2 border-zinc-900 text-center py-3">
        <p className="text-xs tracking-widest text-zinc-500">{page.year} 年</p>
      </div>

      {page.image_url && (
        <img src={page.image_url} alt={page.headline} className="w-full max-h-56 object-cover" />
      )}

      <div className="p-6 flex-1">
        <h2 className="text-xl font-bold leading-tight mb-3 font-serif">{page.headline}</h2>
        {page.subtext && <p className="text-sm text-zinc-600 leading-relaxed">{page.subtext}</p>}
      </div>

      {/* 分頁控制 */}
      <div className="flex items-center justify-between px-6 pb-8">
        <button
          onClick={() => index > 0 && setIndex(i => i - 1)}
          className="text-sm text-zinc-500 disabled:opacity-30"
          disabled={index === 0}
        >← 上一頁</button>
        <span className="text-xs text-zinc-400">{index + 1} / {pages.length}</span>
        {index < pages.length - 1
          ? <button onClick={() => setIndex(i => i + 1)} className="text-sm text-zinc-700">下一頁 →</button>
          : <button onClick={onFinish} className="text-sm text-yellow-600 font-medium">完成 →</button>
        }
      </div>
    </div>
  )
}

// ── 簽名場景 ─────────────────────────────────────────────────────
function SignatureScene({ scene, onFinish }: { scene: Scene; onFinish: () => void }) {
  const config = scene.config as SignatureConfig
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [signed, setSigned] = useState(false)
  const [uploading, setUploading] = useState(false)

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const source = 'touches' in e ? e.touches[0] : e
    return { x: source.clientX - rect.left, y: source.clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    drawing.current = true
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
    setSigned(true)
  }

  function endDraw() { drawing.current = false }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    setSigned(false)
  }

  async function handleSubmit() {
    if (!signed) return
    setUploading(true)
    const canvas = canvasRef.current!
    const blob = await new Promise<Blob>(r => canvas.toBlob(b => r(b!), 'image/png'))
    const sessionId = sessionStorage.getItem('session_id') ?? 'unknown'
    const filename = `signatures/${sessionId}.png`

    const formData = new FormData()
    formData.append('file', blob, filename)

    // 上傳到 API（如有需要可擴充）
    await fetch('/api/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sessionId, signature_url: filename }),
    })
    setUploading(false)
    onFinish()
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      {config.document_url && (
        <img src={config.document_url} alt="協議文件" className="max-w-sm w-full mb-6 rounded opacity-90" />
      )}
      <p className="text-sm text-zinc-400 mb-4">{config.instruction || '請在此簽署您的名字'}</p>
      <div className="border border-white/20 rounded bg-white mb-4">
        <canvas
          ref={canvasRef}
          width={320}
          height={120}
          className="block touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div className="flex gap-4">
        <button onClick={clearCanvas} className="text-xs text-zinc-500 hover:text-white px-4 py-2 border border-zinc-700 rounded">重寫</button>
        <button
          onClick={handleSubmit}
          disabled={!signed || uploading}
          className="text-xs bg-white text-black px-6 py-2 rounded disabled:opacity-40 hover:bg-zinc-200 transition-colors"
        >
          {uploading ? '提交中…' : '確認簽名'}
        </button>
      </div>
    </div>
  )
}

// ── 遊戲場景（佔位，依 game_id 擴充） ──────────────────────────
function GameScene({ scene, onFinish }: { scene: Scene; onFinish: (score: number) => void }) {
  const config = scene.config as GameConfig

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 gap-6">
      <h2 className="text-lg font-bold">{config.title || scene.title}</h2>
      {config.description && <p className="text-sm text-zinc-400 max-w-xs text-center">{config.description}</p>}
      <p className="text-xs text-zinc-600">遊戲元件 [{config.game_id}] 開發中</p>
      <button onClick={() => onFinish(0)} className={btnCls}>跳 過 →</button>
    </div>
  )
}
