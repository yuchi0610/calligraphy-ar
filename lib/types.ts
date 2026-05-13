export type SceneType = 'animation' | 'newspaper' | 'dialog' | 'signature' | 'game' | 'ending'

export interface Scene {
  id: string
  type: SceneType
  title: string
  order: number
  config: SceneConfig
  visible: boolean
  created_at: string
  updated_at: string
}

export interface AnimationConfig {
  video_url: string
  autoplay: boolean
  loop: boolean
  auto_advance: boolean
}

export interface NewspaperPage {
  year: number
  image_url: string
  headline: string
  subtext?: string
}

export interface NewspaperConfig {
  pages: NewspaperPage[]
}

export interface DialogLine {
  speaker: string
  text: string
  avatar_url?: string
}

export interface DialogConfig {
  background_url?: string
  dialogs: DialogLine[]
}

export interface SignatureConfig {
  document_url: string
  instruction: string
  signature_area: { x: number; y: number; width: number; height: number }
}

export interface GameConfig {
  game_id: string
  title: string
  description: string
  max_score: number
  time_limit: number
}

export type SceneConfig =
  | AnimationConfig
  | NewspaperConfig
  | DialogConfig
  | SignatureConfig
  | GameConfig
  | Record<string, unknown>

export interface Ending {
  id: string
  type: 'A' | 'B' | 'C'
  label: string
  score_min: number
  score_max: number
  config: {
    video_url?: string
    description?: string
    image_url?: string
  }
}

export interface Session {
  id: string
  started_at: string
  ended_at?: string
  scores: Record<string, number>
  total_score: number
  ending_type?: string
  user_agent?: string
  signature_url?: string
}
