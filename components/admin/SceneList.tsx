'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createClient } from '@/lib/supabase/client'
import type { Scene, SceneType } from '@/lib/types'

const TYPE_LABEL: Record<SceneType, string> = {
  animation:  '動畫影片',
  newspaper:  '報紙翻頁',
  dialog:     '對話文字',
  signature:  '簽名互動',
  game:       '小遊戲',
  ending:     '結局',
}

const TYPE_COLOR: Record<SceneType, string> = {
  animation:  'bg-blue-500/20 text-blue-400',
  newspaper:  'bg-amber-500/20 text-amber-400',
  dialog:     'bg-purple-500/20 text-purple-400',
  signature:  'bg-green-500/20 text-green-400',
  game:       'bg-pink-500/20 text-pink-400',
  ending:     'bg-red-500/20 text-red-400',
}

function SortableRow({ scene, onDelete }: { scene: Scene; onDelete: (id: string) => void }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 group"
    >
      {/* drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-zinc-600 hover:text-zinc-400 cursor-grab active:cursor-grabbing touch-none"
      >
        ⠿
      </button>

      <span className="text-zinc-500 text-xs w-5 text-center">{scene.order}</span>

      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[scene.type]}`}>
        {TYPE_LABEL[scene.type]}
      </span>

      <span className="flex-1 text-sm text-white truncate">{scene.title}</span>

      <span className={`text-xs ${scene.visible ? 'text-green-400' : 'text-zinc-600'}`}>
        {scene.visible ? '顯示' : '隱藏'}
      </span>

      <button
        onClick={() => router.push(`/admin/scenes/${scene.id}`)}
        className="text-xs text-zinc-400 hover:text-yellow-400 px-2 py-1 transition-colors"
      >
        編輯
      </button>

      <button
        onClick={() => onDelete(scene.id)}
        className="text-xs text-zinc-600 hover:text-red-400 px-2 py-1 transition-colors"
      >
        刪除
      </button>
    </div>
  )
}

export default function SceneList({ initialScenes }: { initialScenes: Scene[] }) {
  const [scenes, setScenes] = useState(initialScenes)
  const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<SceneType>('animation')

  const sensors = useSensors(useSensor(PointerSensor))
  const supabase = createClient()
  const router = useRouter()

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = scenes.findIndex(s => s.id === active.id)
    const newIndex = scenes.findIndex(s => s.id === over.id)
    const reordered = arrayMove(scenes, oldIndex, newIndex).map((s, i) => ({ ...s, order: i + 1 }))
    setScenes(reordered)

    setSaving(true)
    await Promise.all(
      reordered.map(s => supabase.from('scenes').update({ order: s.order }).eq('id', s.id))
    )
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('確定要刪除這個場景嗎？')) return
    await supabase.from('scenes').delete().eq('id', id)
    setScenes(scenes.filter(s => s.id !== id))
  }

  async function handleAdd() {
    if (!newTitle.trim()) return
    const order = scenes.length + 1
    const { data, error } = await supabase
      .from('scenes')
      .insert({ type: newType, title: newTitle.trim(), order, config: {}, visible: true })
      .select()
      .single()

    if (!error && data) {
      router.push(`/admin/scenes/${data.id}`)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">場景列表</h2>
          <p className="text-xs text-zinc-500 mt-0.5">拖拉可調整順序，點「編輯」設定內容</p>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-xs text-yellow-400">儲存中…</span>}
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-yellow-400 hover:bg-yellow-300 text-zinc-900 font-bold text-sm px-4 py-2 rounded transition-colors"
          >
            + 新增場景
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 mb-4 flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-zinc-400 mb-1 block">場景名稱</label>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="例：開場動畫"
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">類型</label>
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as SceneType)}
              className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
            >
              {(Object.keys(TYPE_LABEL) as SceneType[]).map(t => (
                <option key={t} value={t}>{TYPE_LABEL[t]}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAdd}
            className="bg-yellow-400 hover:bg-yellow-300 text-zinc-900 font-bold text-sm px-4 py-2 rounded transition-colors"
          >
            建立
          </button>
          <button
            onClick={() => setShowAdd(false)}
            className="text-zinc-500 hover:text-white text-sm px-3 py-2"
          >
            取消
          </button>
        </div>
      )}

      {scenes.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">
          <p className="text-4xl mb-3">🎬</p>
          <p className="text-sm">尚未建立任何場景</p>
          <p className="text-xs mt-1">點「新增場景」開始建立體驗流程</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={scenes.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {scenes.map(scene => (
                <SortableRow key={scene.id} scene={scene} onDelete={handleDelete} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
