export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import SceneRenderer from '@/components/scene/SceneRenderer'
import { notFound } from 'next/navigation'
import type { Scene, Ending } from '@/lib/types'

export default async function ScenePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: scenes }, { data: endings }] = await Promise.all([
    supabase.from('scenes').select('*').eq('visible', true).order('order'),
    supabase.from('endings').select('*').order('type'),
  ])

  const sceneList = (scenes ?? []) as Scene[]
  const endingList = (endings ?? []) as Ending[]

  // 'start' → 第一個場景
  const currentScene = id === 'start'
    ? sceneList[0]
    : sceneList.find(s => s.id === id)

  if (!currentScene) notFound()

  const currentIndex = sceneList.findIndex(s => s.id === currentScene.id)
  const nextScene = sceneList[currentIndex + 1] ?? null

  return (
    <SceneRenderer
      scene={currentScene}
      nextScene={nextScene}
      endings={endingList}
      onFinish={() => {}}
    />
  )
}
