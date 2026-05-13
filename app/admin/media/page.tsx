'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MediaFile {
  name: string
  url: string
  size: number
  created_at: string
  type: 'image' | 'video' | 'other'
}

function fileType(name: string): MediaFile['type'] {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video'
  return 'other'
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function MediaPage() {
  const supabase = createClient()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function loadFiles() {
    const { data } = await supabase.storage.from('media').list('', { sortBy: { column: 'created_at', order: 'desc' } })
    if (!data) return

    const withUrls: MediaFile[] = data
      .filter(f => f.name !== '.emptyFolderPlaceholder')
      .map(f => {
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(f.name)
        return {
          name: f.name,
          url: urlData.publicUrl,
          size: f.metadata?.size ?? 0,
          created_at: f.created_at ?? '',
          type: fileType(f.name),
        }
      })
    setFiles(withUrls)
    setLoading(false)
  }

  useEffect(() => { loadFiles() }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
    await supabase.storage.from('media').upload(filename, file)
    await loadFiles()
    setUploading(false)
    e.target.value = ''
  }

  async function handleDelete(name: string) {
    if (!confirm(`確定刪除 ${name}？`)) return
    await supabase.storage.from('media').remove([name])
    setFiles(files.filter(f => f.name !== name))
  }

  function handleCopy(url: string) {
    navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-white">媒體庫</h2>
          <p className="text-xs text-zinc-500 mt-0.5">上傳圖片和影片，點複製連結後貼入場景設定</p>
        </div>
        <div className="flex items-center gap-3">
          {uploading && <span className="text-xs text-yellow-400">上傳中…</span>}
          <input ref={inputRef} type="file" accept="image/*,video/*" onChange={handleUpload} className="hidden" />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-zinc-900 font-bold text-sm px-4 py-2 rounded transition-colors"
          >
            + 上傳檔案
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-zinc-600 text-sm">載入中…</div>
      ) : files.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">
          <p className="text-4xl mb-3">🖼️</p>
          <p className="text-sm">媒體庫是空的</p>
          <p className="text-xs mt-1">點「上傳檔案」開始新增圖片或影片</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map(file => (
            <div key={file.name} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
              <div className="aspect-video bg-zinc-800 flex items-center justify-center overflow-hidden">
                {file.type === 'image' ? (
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                ) : file.type === 'video' ? (
                  <video src={file.url} className="w-full h-full object-cover" muted />
                ) : (
                  <span className="text-3xl">📄</span>
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-white truncate mb-1">{file.name}</p>
                <p className="text-xs text-zinc-500 mb-3">{formatSize(file.size)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(file.url)}
                    className="flex-1 text-xs py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                  >
                    {copied === file.url ? '✓ 已複製' : '複製連結'}
                  </button>
                  <button
                    onClick={() => handleDelete(file.name)}
                    className="text-xs px-2 py-1.5 rounded bg-zinc-800 hover:bg-red-900 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    刪
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
