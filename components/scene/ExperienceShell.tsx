'use client'

import { useState } from 'react'
import SceneRenderer from './SceneRenderer'
import type { Scene, Ending } from '@/lib/types'

interface Props {
  scenes: Scene[]
  endings: Ending[]
}

// Mobile: fixed inset-0 so layout doesn't reflow when viewport resizes (fullscreen entry)
// Desktop (sm+): centered 390px column
const SHELL = 'fixed inset-0 overflow-hidden sm:relative sm:inset-auto sm:overflow-visible sm:max-w-[390px] sm:mx-auto sm:min-h-dvh'

export default function ExperienceShell({ scenes, endings }: Props) {
  const [sceneIndex, setSceneIndex] = useState(0)
  const [flashing, setFlashing] = useState(false)

  const currentScene = scenes[sceneIndex]
  const nextScene = scenes[sceneIndex + 1] ?? null

  function handleFinish() {
    setSceneIndex(i => i + 1)
  }

  // Called by newspaper scene — white flash covers the transition so there's no black frame
  function handleFinishWithFlash() {
    setFlashing(true)
    setSceneIndex(i => i + 1)
    setTimeout(() => setFlashing(false), 1200)
  }

  if (!currentScene) {
    return (
      <div className={`${SHELL} bg-black text-white flex items-center justify-center`}>
        <p className="text-stone-500 text-sm">體驗已結束</p>
      </div>
    )
  }

  return (
    <div className={`${SHELL} bg-black`}>
      <SceneRenderer
        key={currentScene.id}
        scene={currentScene}
        nextScene={nextScene}
        endings={endings}
        onFinish={handleFinish}
        onFinishWithFlash={handleFinishWithFlash}
      />
      {flashing && (
        <div
          className="fixed inset-0 bg-white pointer-events-none z-[9999]"
          style={{ animation: 'flashAnim 1.2s cubic-bezier(0.23,1,0.32,1) forwards' }}
        />
      )}
    </div>
  )
}
