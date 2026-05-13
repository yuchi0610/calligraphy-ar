'use client'

import { useRouter } from 'next/navigation'
import type { Scene, Ending } from '@/lib/types'

interface Props {
  scene: Scene
  nextScene: Scene | null
  endings: Ending[]
}

export default function SceneRenderer({ scene, nextScene, endings }: Props) {
  const router = useRouter()

  function advance() {
    if (scene.type === 'ending') return
    if (!nextScene) return

    if (nextScene.type === 'ending') {
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
      router.push(`/scene/${nextScene.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      {/* 場景類型標籤（開發用，上線前可移除） */}
      <div className="fixed top-4 left-4 text-xs text-zinc-600 z-50">
        [{scene.type}] {scene.title}
      </div>

      <div className="text-center max-w-lg">
        <p className="text-zinc-500 text-sm mb-4">{scene.title}</p>
        <p className="text-zinc-400 text-xs mb-12">（此場景內容待製作）</p>
        <button
          onClick={advance}
          className="border border-white/20 hover:border-white/50 text-white/70 hover:text-white text-sm tracking-widest px-8 py-3 transition-colors"
        >
          繼 續 →
        </button>
      </div>
    </div>
  )
}
