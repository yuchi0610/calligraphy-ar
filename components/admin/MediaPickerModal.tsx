'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface MediaFile {
  name: string
  url: string
  type: 'image' | 'video' | 'other'
}

function fileType(name: string): MediaFile['type'] {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image'
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video'
  return 'other'
}

interface Props {
  onSelect: (url: string) => void
  onClose: () => void
}

export default function MediaPickerModal({ onSelect, onClose }: Props) {
  const supabase = createClient()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.storage.from('media').list('', { sortBy: { column: 'created_at', order: 'desc' } }).then(({ data }) => {
      if (!data) { setLoading(false); return }
      const withUrls = data
        .filter(f => f.name !== '.emptyFolderPlaceholder')
        .map(f => {
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(f.name)
          return { name: f.name, url: urlData.publicUrl, type: fileType(f.name) }
        })
      setFiles(withUrls)
      setLoading(false)
    })
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-[600px] max-h-[75vh] flex flex-col overflow-hidden border border-stone-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h3 className="text-sm font-semibold text-stone-700">從媒體庫選取</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-base leading-none w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12 text-stone-400 text-sm">載入中…</div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm">媒體庫是空的，請先至媒體庫上傳檔案</div>
          ) : (
            <div className="grid grid-cols-4 gap-2.5">
              {files.map(file => (
                <button
                  key={file.name}
                  onClick={() => { onSelect(file.url); onClose() }}
                  className="group relative aspect-square rounded-lg overflow-hidden border-2 border-stone-100 hover:border-stone-700 transition-all"
                >
                  {file.type === 'image' ? (
                    <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                  ) : file.type === 'video' ? (
                    <video src={file.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <div className="w-full h-full bg-stone-50 flex items-center justify-center text-stone-400 text-xs">檔案</div>
                  )}
                  <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/10 transition-colors" />
                  <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {file.name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
