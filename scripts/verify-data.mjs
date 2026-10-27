// npm run verify:data — projects.json 이 지금 엑셀과 칸마다 같은지 본다.
// build-data 의 변환을 거치지 않고 엑셀 칸 값을 직접 읽어 비교한다.
import { readFile } from 'node:fs/promises'
import { FIELDS, OUT_PATH, SOURCE_NAME, checkHeaders, readRawRows } from './sheet.mjs'

function cellText(value) {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const text = String(value).trim()
  return text === '' ? null : text
}

const json = JSON.parse(await readFile(OUT_PATH, 'utf8'))
const rows = await readRawRows()
const { headers, missing } = checkHeaders(rows[0])
if (missing.length > 0) {
  console.error(`${SOURCE_NAME} 첫 줄 제목이 다릅니다. 없는 제목: ${missing.join(', ')}`)
  process.exit(1)
}

const sheetRows = rows
  .map((cells, i) => ({ row: i + 1, cells }))
  .slice(1)
  .filter(({ cells }) => cells.some((c) => cellText(c) !== null))

const problems = []
if (sheetRows.length !== json.projects.length) {
  problems.push(`줄 수가 다름: 엑셀 ${sheetRows.length}줄 / json ${json.projects.length}줄`)
}

let checked = 0
for (const { row, cells } of sheetRows) {
  const project = json.projects.find((p) => p.row === row)
  if (!project) {
    problems.push(`${row}행이 json에 없음`)
    continue
  }
  for (const field of FIELDS) {
    const excel = cellText(cells[headers.indexOf(field.header)])
    const value = project[field.key]
    checked += 1
    if (excel !== value) {
      problems.push(`${row}행 ${field.header}: 엑셀 "${excel ?? '(빈칸)'}" / json "${value ?? '(빈칸)'}"`)
    }
  }
}

if (problems.length > 0) {
  console.error(`대조 실패 ${problems.length}건 — npm run data 로 다시 만들어 보세요.`)
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}
console.log(`대조 통과: ${SOURCE_NAME} ${sheetRows.length}줄 × ${FIELDS.length}칸 = ${checked}칸이 json과 같습니다.`)
