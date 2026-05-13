'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Ending } from '@/lib/types'

const ENDING_TYPES: Array<{ type: Ending['type']; label: string; color: string }> = [
  { type: 'A', label: '結局 A（最佳）', color: 'text-yellow-400' },
  { type: 'B', label: '結局 B（中間）', color: 'text-blue-400' },
  { type: 'C', label: '結局 C（最差）', color: 'text-red-400' },
]

const inputCls = 'w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400'

export default function EndingsPage() {
  const supabase = createClient()
  const [endings, setEndings] = useState<Ending[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('endings').select('*').order('type').then(({ data }) => {
      if (data) setEndings(data as Ending[])
    })
  }, [])

  function updateEnding(type: Ending['type'], key: string, val: string | number) {
    setEndings(endings.map(e => e.type === type ? { ...e, [key]: val } : e))
  }

  function updateConfig(type: Ending['type'], key: string, val: string) {
    setEndings(endings.map(e => e.type === type ? { ...e, config: { ...e.config, [key]: val } } : e))
  }

  async function handleSave() {
    setSaving(true)
    await Promise.all(
      endings.map(e =>
        supabase.from('endings').update({
          label: e.label,
          score_min: e.score_min,
          score_max: e.score_max,
          config: e.config,
        }).eq('id', e.id)
      )
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">結局設定</h2>
          <p className="text-xs text-zinc-500 mt-0.5">設定各結局的積分門檻與對應內容</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-zinc-900 font-bold text-sm px-4 py-2 rounded transition-colors"
        >
          {saving ? '儲存中…' : saved ? '✓ 已儲存' : '儲存所有設定'}
        </button>
      </div>

      <div className="space-y-4">
        {ENDING_TYPES.map(({ type, label, color }) => {
          const ending = endings.find(e => e.type === type)
          if (!ending) return null
          return (
            <div key={type} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <h3 className={`font-bold text-sm ${color}`}>{label}</h3>
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">標題文字</label>
                <input value={ending.label} onChange={e => updateEnding(type, 'label', e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">最低積分</label>
                  <input type="number" value={ending.score_min} onChange={e => updateEnding(type, 'score_min', Number(e.target.value))} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5">最高積分</label>
                  <input type="number" value={ending.score_max} onChange={e => updateEnding(type, 'score_max', Number(e.target.value))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">結局影片 URL</label>
                <input value={ending.config.video_url ?? ''} onChange={e => updateConfig(type, 'video_url', e.target.value)} className={inputCls} placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">結局說明文字</label>
                <textarea value={ending.config.description ?? ''} onChange={e => updateConfig(type, 'description', e.target.value)} className={`${inputCls} h-20 resize-none`} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
