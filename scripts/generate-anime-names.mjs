import fs from 'fs/promises'
import path from 'path'

async function generate() {
  const inputFile = path.resolve(process.cwd(), 'scripts', 'anime_characters.json')
  const outputFile = path.resolve(process.cwd(), 'src', 'data', 'anime-first-names.ts')

  try {
    const raw = await fs.readFile(inputFile, 'utf-8')
    const dataset = JSON.parse(raw)

    const nameSet = new Set()

    for (const record of dataset) {
      if (!record.Character_Name) continue

      // Ambil kata pertama
      const firstName = record.Character_Name.split(/\s+/)[0]
      if (!firstName) continue

      // Bersihkan dan ubah ke lowercase (hanya a-z)
      const cleanName = firstName.toLowerCase().replace(/[^a-z]/g, '')
      
      // Ambil yang panjangnya 3 s/d 12 karakter supaya pas jadi username
      if (cleanName.length >= 3 && cleanName.length <= 12) {
        nameSet.add(cleanName)
      }
    }

    const uniqueNames = Array.from(nameSet).sort()

    const tsContent = `// Auto-generated from scripts/anime_characters.json. DO NOT EDIT.
export const ANIME_FIRST_NAMES = ${JSON.stringify(uniqueNames, null, 2)} as const;
`

    await fs.writeFile(outputFile, tsContent, 'utf-8')
    console.log(`Generated ${uniqueNames.length} unique anime first names to src/data/anime-first-names.ts`)
  } catch (err) {
    console.error('Failed to generate names:', err)
    process.exit(1)
  }
}

generate()
