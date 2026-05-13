import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://uozojwiklovkckbygegp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvem9qd2lrbG92a2NrYnlnZWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTY5NTgsImV4cCI6MjA5NDIzMjk1OH0.YvveVfXmTlRXqMciUreffmuGc0H7aGqC1-rs_yFCbUk'

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const userAgent = req.headers.get('user-agent') ?? ''

  const { data, error } = await supabase
    .from('sessions')
    .insert({ user_agent: userAgent, scores: {}, total_score: 0 })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function PATCH(req: NextRequest) {
  const supabase = getSupabase()
  const body = await req.json()
  const { id, scores, total_score, ending_type, signature_url } = body

  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const update: Record<string, unknown> = {}
  if (scores !== undefined) update.scores = scores
  if (total_score !== undefined) update.total_score = total_score
  if (ending_type !== undefined) { update.ending_type = ending_type; update.ended_at = new Date().toISOString() }
  if (signature_url !== undefined) update.signature_url = signature_url

  const { error } = await supabase.from('sessions').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
