// npm run data — ../프로젝트목록.xlsx → src/data/projects.json
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { APP_DIR, OUT_PATH, readProjects } from './sheet.mjs'

try {
  const { source, projects, warnings } = await readProjects()
  await writeFile(OUT_PATH, JSON.stringify({ source, projects }, null, 2) + '\n', 'utf8')

  console.log(`${source} → ${path.relative(APP_DIR, OUT_PATH)} (${projects.length}건)`)
  for (const w of warnings) console.warn(`  주의: ${w}`)
} catch (error) {
  console.error(`데이터를 만들지 못했습니다.\n${error.message}`)
  process.exit(1)
}
