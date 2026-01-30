import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const word = searchParams.get('word')
  const lang = searchParams.get('lang') || 'en'

  if (!word) {
    return NextResponse.json({ error: 'Word parameter required' }, { status: 400 })
  }

  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ipa_pronunciations')
      .select('ipa, has_more_variants, source_url')
      .eq('word', word.trim().toLowerCase())
      .eq('lang', lang)
      .single()

    if (error || !data) {
      return NextResponse.json({ ipa: [] })
    }

    return NextResponse.json({
      word: word.trim(),
      lang,
      ipa: data.ipa || [],
      hasMoreVariants: data.has_more_variants || false,
      source: 'wiktionary',
      sourceUrl: data.source_url,
      cached: true
    })
  } catch (error) {
    console.error('IPA API error:', error)
    return NextResponse.json({ ipa: [] })
  }
}
