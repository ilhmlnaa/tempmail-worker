import { ANIME_FIRST_NAMES } from '../data/anime-first-names'

function secureRandomIndex(max: number): number {
  if (max <= 0) throw new Error('max must be positive')
  const limit = Math.floor(0x100000000 / max) * max
  const value = new Uint32Array(1)
  do {
    crypto.getRandomValues(value)
  } while (value[0] >= limit)
  return value[0] % max
}

export function generateAnimeLocalPart(): string {
  const name = ANIME_FIRST_NAMES[secureRandomIndex(ANIME_FIRST_NAMES.length)]
  const suffix = secureRandomIndex(256).toString(16).padStart(2, '0')
  return `${name}0x${suffix}`
}
