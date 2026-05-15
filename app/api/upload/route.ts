import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://uozojwiklovkckbygegp.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvem9qd2lrbG92a2NrYnlnZWdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODY1Njk1OCwiZXhwIjoyMDk0MjMyOTU4fQ.SpNTXGkJxgFk5zM6DUK3OkwDLdPN5-5drqpH4csPbOc'

function getSupabase() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const filename = formData.get('filename') as string | null
  if (!file || !filename) return NextResponse.json({ error: '缺少檔案或檔名' }, { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const { error } = await getSupabase().storage
    .from('media')
    .upload(filename, arrayBuffer, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = getSupabase().storage.from('media').getPublicUrl(filename)
  return NextResponse.json({ url: data.publicUrl })
}

export async function DELETE(request: NextRequest) {
  const { filename } = await request.json()
  if (!filename) return NextResponse.json({ error: '缺少檔名' }, { status: 400 })

  const { error } = await getSupabase().storage.from('media').remove([filename])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const { data, error } = await getSupabase().storage
    .from('media')
    .list('', { sortBy: { column: 'created_at', order: 'desc' } })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ files: data ?? [] })
}
