'use client'

import { useState } from 'react'
import SceneRenderer from './SceneRenderer'
import type { Scene, Ending } from '@/lib/types'

interface Props {
  scenes: Scene[]
  endings: Ending[]
}

export default function ExperienceShell({ scenes, endings }: Props) {
  const [sceneIndex, setSceneIndex] = useState(0)

  const currentScene = scenes[sceneIndex]
  const nextScene = scenes[sceneIndex + 1] ?? null

  if (!currentScene) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-zinc-500 text-sm">體驗已結束</p>
      </div>
    )
  }

  function handleFinish() {
    setSceneIndex(i => i + 1)
  }

  return (
    <SceneRenderer
      key={currentScene.id}
      scene={currentScene}
      nextScene={nextScene}
      endings={endings}
      onFinish={handleFinish}
    />
  )
}
