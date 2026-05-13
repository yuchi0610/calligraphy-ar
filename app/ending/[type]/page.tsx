export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import type { Ending } from '@/lib/types'

export default async function EndingPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('endings').select('*').eq('type', type.toUpperCase()).single()
  const ending = data as Ending | null

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <p className="text-xs tracking-widest text-zinc-500 mb-6">結局 {type.toUpperCase()}</p>
        <h2 className="text-xl font-bold mb-6">{ending?.label ?? '—'}</h2>
        {ending?.config.video_url && (
          <video
            src={ending.config.video_url}
            autoPlay
            playsInline
            className="w-full rounded mb-8"
          />
        )}
        <p className="text-zinc-400 text-sm leading-relaxed mb-12">
          {ending?.config.description ?? ''}
        </p>
        <a href="/" className="text-xs text-zinc-600 hover:text-white transition-colors">
          重新開始
        </a>
      </div>
    </div>
  )
}
