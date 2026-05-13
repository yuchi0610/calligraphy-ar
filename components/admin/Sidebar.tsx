'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/admin/scenes',   label: '場景管理', icon: '🎬' },
  { href: '/admin/media',    label: '媒體庫',   icon: '🖼️' },
  { href: '/admin/endings',  label: '結局設定', icon: '🏁' },
  { href: '/admin/sessions', label: '遊玩紀錄', icon: '📊' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="px-5 py-6 border-b border-zinc-800">
        <p className="text-xs text-zinc-500 tracking-widest mb-1">後台管理</p>
        <h1 className="text-white font-bold text-sm leading-tight">核去核從<br/>互動體驗</h1>
      </div>

      <nav className="flex-1 py-4">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                active
                  ? 'bg-yellow-400/10 text-yellow-400 border-r-2 border-yellow-400'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={handleLogout}
          className="w-full text-sm text-zinc-500 hover:text-white transition-colors py-2"
        >
          登出
        </button>
      </div>
    </aside>
  )
}
