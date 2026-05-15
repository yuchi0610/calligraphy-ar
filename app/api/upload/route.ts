import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function POST(request: NextRequest) {
  if (!SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: '請在 .env.local 加入 SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    )
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const filename = formData.get('filename') as string | null

  if (!file || !filename) {
    return NextResponse.json({ error: '缺少檔案或檔名' }, { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabase.storage
    .from('media')
    .upload(filename, arrayBuffer, { contentType: file.type, upsert: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data } = supabase.storage.from('media').getPublicUrl(filename)
  return NextResponse.json({ url: data.publicUrl })
}

export async function DELETE(request: NextRequest) {
  if (!SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: '請在 .env.local 加入 SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
  }

  const { filename } = await request.json()
  if (!filename) return NextResponse.json({ error: '缺少檔名' }, { status: 400 })

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const { error } = await supabase.storage.from('media').remove([filename])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function GET() {
  if (!SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: '請在 .env.local 加入 SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const { data, error } = await supabase.storage
    .from('media')
    .list('', { sortBy: { column: 'created_at', order: 'desc' } })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ files: data ?? [] })
}
