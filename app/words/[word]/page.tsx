import { notFound } from "next/navigation"
import { WORD_DATA } from "@/lib/word-data"
import { WordRouteView } from "@/components/word-route-view"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

interface WordPageProps {
  params: { word: string }
}

export function generateStaticParams() {
  return WORD_DATA.map((entry) => ({
    word: encodeURIComponent(entry.word),
  }))
}

type CommunityWord = {
  word: string
  definition: string
  sentence: string
  category: string
}

async function getCommunityWord(word: string): Promise<CommunityWord | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("word_catalog")
    .select("word, definition, sentence, category")
    .eq("word_lower", word.toLowerCase())
    .eq("status", "approved")
    .maybeSingle()
  return data
}

export default async function WordPage({ params }: WordPageProps) {
  const decoded = decodeURIComponent(params.word)
  const index = WORD_DATA.findIndex((item) => item.word.toLowerCase() === decoded.toLowerCase())

  // Found in static data
  if (index >= 0) {
    return <WordRouteView initialIndex={index} />
  }

  // Try community words
  const communityWord = await getCommunityWord(decoded)
  if (communityWord) {
    return (
      <WordRouteView
        communityWord={{
          word: communityWord.word,
          stubDefinition: communityWord.definition,
          exampleSentence: communityWord.sentence,
          category: communityWord.category,
        }}
      />
    )
  }

  notFound()
}
