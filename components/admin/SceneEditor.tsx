'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Scene, SceneType } from '@/lib/types'

const TYPE_LABEL: Record<SceneType, string> = {
  animation: '動畫影片',
  newspaper: '報紙翻頁',
  dialog:    '對話文字',
  signature: '簽名互動',
  game:      '小遊戲',
  ending:    '結局',
}

// ── 各類型的欄位設定 ──────────────────────────────────────────

function AnimationForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="影片 URL" hint="Supabase Storage 或外部影片連結">
        <input value={(config.video_url as string) ?? ''} onChange={e => onChange({ ...config, video_url: e.target.value })}
          className={inputCls} placeholder="https://..." />
      </Field>
      <div className="flex gap-6">
        <Toggle label="自動播放" value={!!(config.autoplay ?? true)} onChange={v => onChange({ ...config, autoplay: v })} />
        <Toggle label="播完自動跳下一場景" value={!!(config.auto_advance ?? true)} onChange={v => onChange({ ...config, auto_advance: v })} />
        <Toggle label="循環播放" value={!!(config.loop)} onChange={v => onChange({ ...config, loop: v })} />
      </div>
    </div>
  )
}

function NewspaperForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const pages = (config.pages as Array<Record<string, unknown>>) ?? []

  function updatePage(i: number, key: string, val: string | number) {
    const next = pages.map((p, idx) => idx === i ? { ...p, [key]: val } : p)
    onChange({ ...config, pages: next })
  }

  function addPage() {
    onChange({ ...config, pages: [...pages, { year: 2000, image_url: '', headline: '', subtext: '' }] })
  }

  function removePage(i: number) {
    onChange({ ...config, pages: pages.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">依序排列各報紙頁面，使用者往前滑時會從第一頁翻到最後一頁</p>
      {pages.map((page, i) => (
        <div key={i} className="bg-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-300 font-medium">第 {i + 1} 頁</span>
            <button onClick={() => removePage(i)} className="text-xs text-zinc-600 hover:text-red-400">刪除</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="年份"><input type="number" value={(page.year as number) ?? ''} onChange={e => updatePage(i, 'year', Number(e.target.value))} className={inputCls} /></Field>
            <Field label="圖片 URL"><input value={(page.image_url as string) ?? ''} onChange={e => updatePage(i, 'image_url', e.target.value)} className={inputCls} placeholder="https://..." /></Field>
          </div>
          <Field label="標題"><input value={(page.headline as string) ?? ''} onChange={e => updatePage(i, 'headline', e.target.value)} className={inputCls} /></Field>
          <Field label="副文字（選填）"><input value={(page.subtext as string) ?? ''} onChange={e => updatePage(i, 'subtext', e.target.value)} className={inputCls} /></Field>
        </div>
      ))}
      <button onClick={addPage} className="w-full border border-dashed border-zinc-700 hover:border-yellow-400 text-zinc-500 hover:text-yellow-400 text-sm py-3 rounded-lg transition-colors">
        + 新增報紙頁面
      </button>
    </div>
  )
}

function DialogForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const dialogs = (config.dialogs as Array<Record<string, unknown>>) ?? []

  function updateDialog(i: number, key: string, val: string) {
    const next = dialogs.map((d, idx) => idx === i ? { ...d, [key]: val } : d)
    onChange({ ...config, dialogs: next })
  }

  function addDialog() {
    onChange({ ...config, dialogs: [...dialogs, { speaker: '', text: '', avatar_url: '' }] })
  }

  function removeDialog(i: number) {
    onChange({ ...config, dialogs: dialogs.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-4">
      <Field label="背景圖片 URL（選填）">
        <input value={(config.background_url as string) ?? ''} onChange={e => onChange({ ...config, background_url: e.target.value })} className={inputCls} placeholder="https://..." />
      </Field>
      {dialogs.map((d, i) => (
        <div key={i} className="bg-zinc-800 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-300 font-medium">對話 {i + 1}</span>
            <button onClick={() => removeDialog(i)} className="text-xs text-zinc-600 hover:text-red-400">刪除</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="說話者"><input value={(d.speaker as string) ?? ''} onChange={e => updateDialog(i, 'speaker', e.target.value)} className={inputCls} /></Field>
            <Field label="頭像 URL（選填）"><input value={(d.avatar_url as string) ?? ''} onChange={e => updateDialog(i, 'avatar_url', e.target.value)} className={inputCls} /></Field>
          </div>
          <Field label="對話內容">
            <textarea value={(d.text as string) ?? ''} onChange={e => updateDialog(i, 'text', e.target.value)} className={`${inputCls} h-20 resize-none`} />
          </Field>
        </div>
      ))}
      <button onClick={addDialog} className="w-full border border-dashed border-zinc-700 hover:border-yellow-400 text-zinc-500 hover:text-yellow-400 text-sm py-3 rounded-lg transition-colors">
        + 新增對話
      </button>
    </div>
  )
}

function SignatureForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="協議文件圖片 URL">
        <input value={(config.document_url as string) ?? ''} onChange={e => onChange({ ...config, document_url: e.target.value })} className={inputCls} placeholder="https://..." />
      </Field>
      <Field label="說明文字">
        <input value={(config.instruction as string) ?? ''} onChange={e => onChange({ ...config, instruction: e.target.value })} className={inputCls} placeholder="請在此簽署您的名字" />
      </Field>
    </div>
  )
}

function GameForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="遊戲 ID" hint="對應程式中的遊戲元件名稱">
        <input value={(config.game_id as string) ?? ''} onChange={e => onChange({ ...config, game_id: e.target.value })} className={inputCls} placeholder="game-01" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="最高分數">
          <input type="number" value={(config.max_score as number) ?? 100} onChange={e => onChange({ ...config, max_score: Number(e.target.value) })} className={inputCls} />
        </Field>
        <Field label="時間限制（秒）">
          <input type="number" value={(config.time_limit as number) ?? 60} onChange={e => onChange({ ...config, time_limit: Number(e.target.value) })} className={inputCls} />
        </Field>
      </div>
      <Field label="遊戲說明">
        <textarea value={(config.description as string) ?? ''} onChange={e => onChange({ ...config, description: e.target.value })} className={`${inputCls} h-20 resize-none`} />
      </Field>
    </div>
  )
}

// ── 共用 UI 元件 ──────────────────────────────────────────────

const inputCls = 'w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1.5">
        {label}
        {hint && <span className="ml-2 text-zinc-600">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        onClick={() => onChange(!value)}
        className={`w-9 h-5 rounded-full transition-colors relative ${value ? 'bg-yellow-400' : 'bg-zinc-700'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-xs text-zinc-400">{label}</span>
    </label>
  )
}

const CONFIG_FORM: Record<SceneType, React.FC<{ config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }>> = {
  animation: AnimationForm,
  newspaper: NewspaperForm,
  dialog:    DialogForm,
  signature: SignatureForm,
  game:      GameForm,
  ending:    ({ config, onChange }) => (
    <div className="space-y-4">
      <Field label="此場景會自動依積分跳轉對應結局" hint="">
        <p className="text-xs text-zinc-500 mt-1">請在「結局設定」頁面配置各結局的影片與積分門檻。</p>
      </Field>
    </div>
  ),
}

// ── 主元件 ───────────────────────────────────────────────────

export default function SceneEditor({ scene }: { scene: Scene }) {
  const router = useRouter()
  const [title, setTitle] = useState(scene.title)
  const [visible, setVisible] = useState(scene.visible)
  const [config, setConfig] = useState<Record<string, unknown>>(scene.config as Record<string, unknown>)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const ConfigForm = CONFIG_FORM[scene.type]

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('scenes').update({ title, visible, config, updated_at: new Date().toISOString() }).eq('id', scene.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.push('/admin/scenes')} className="text-zinc-500 hover:text-white text-sm">← 返回</button>
        <span className="text-zinc-700">/</span>
        <span className="text-sm text-zinc-400">編輯場景</span>
      </div>

      <div className="space-y-6">
        {/* 基本設定 */}
        <div className="bg-zinc-900 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-medium text-zinc-300">基本設定</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="場景名稱">
              <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
            </Field>
            <Field label="類型">
              <div className="bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-500">
                {TYPE_LABEL[scene.type]}（建立後不可修改）
              </div>
            </Field>
          </div>
          <Toggle label="在體驗中顯示此場景" value={visible} onChange={setVisible} />
        </div>

        {/* 類型專屬設定 */}
        <div className="bg-zinc-900 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-medium text-zinc-300">內容設定</h3>
          <ConfigForm config={config} onChange={setConfig} />
        </div>

        {/* 儲存 */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-zinc-900 font-bold px-6 py-2.5 rounded text-sm transition-colors"
          >
            {saving ? '儲存中…' : saved ? '✓ 已儲存' : '儲存'}
          </button>
        </div>
      </div>
    </div>
  )
}
