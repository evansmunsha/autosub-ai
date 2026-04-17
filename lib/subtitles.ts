export interface SubtitleLine {
  id: number
  start: string
  end: string
  original: string
  text: string
}

export interface SubtitleTextUpdate {
  id: number
  text: string
}

export function parseSubtitleLines(input: string | null | undefined) {
  if (!input) {
    return [] as SubtitleLine[]
  }

  const value = JSON.parse(input)

  if (!Array.isArray(value)) {
    throw new Error('Stored subtitle data is invalid.')
  }

  return value as SubtitleLine[]
}

export function mergeSubtitleTextUpdates(
  subtitles: SubtitleLine[],
  updates: SubtitleTextUpdate[]
) {
  const updateMap = new Map(updates.map((update) => [update.id, update.text]))

  return subtitles.map((subtitle) => {
    const text = updateMap.get(subtitle.id)

    if (text === undefined) {
      return subtitle
    }

    return {
      ...subtitle,
      text,
    }
  })
}

export function buildSrtFromSubtitleLines(subtitles: SubtitleLine[]) {
  return subtitles
    .map(
      (subtitle, index) =>
        `${index + 1}\n${subtitle.start} --> ${subtitle.end}\n${subtitle.text}`
    )
    .join('\n\n')
}
