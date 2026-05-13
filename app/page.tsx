'use client'

import { useRouter } from 'next/navigation'

export default function StartPage() {
  const router = useRouter()

  async function handleStart() {
    const res = await fetch('/api/sessions', { method: 'POST' })
    const { id } = await res.json()
    sessionStorage.setItem('session_id', id)
    sessionStorage.setItem('scores', JSON.stringify({}))
    router.push('/scene/start')
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-white">
      <div className="text-center max-w-sm">
        <p className="text-xs tracking-widest text-zinc-500 mb-6">互動敘事體驗</p>
        <h1 className="text-2xl font-bold leading-relaxed mb-2">核去核從</h1>
        <p className="text-sm text-zinc-400 mb-12">核能背後的和平抉擇</p>
        <button
          onClick={handleStart}
          className="border border-white/30 hover:border-white/60 text-white text-sm tracking-widest px-10 py-4 transition-colors"
        >
          開 始 體 驗
        </button>
      </div>
    </div>
  )
}
