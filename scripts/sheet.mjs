// 프로젝트목록.xlsx 를 읽어 화면에 필요한 7칸만 꺼낸다. 원본은 읽기만 한다.
import { readSheet } from 'read-excel-file/node'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const SOURCE_NAME = '프로젝트목록.xlsx'
export const SOURCE_PATH = path.resolve(APP_DIR, '..', SOURCE_NAME)
export const OUT_PATH = path.join(APP_DIR, 'src', 'data', 'projects.json')

// 엑셀 첫 줄에 있어야 하는 제목 8개. '시작'은 확인만 하고 옮기지 않는다.
export const EXPECTED_HEADERS = ['구분', '프로젝트', '담당(역할)', '시작', '마감', '상태', '마지막 업데이트', '다음 결정']

// 엑셀 제목 → json 이름. 여기 없는 칸은 옮기지 않는다.
export const FIELDS = [
  { header: '구분', key: 'category', type: 'text' },
  { header: '프로젝트', key: 'name', type: 'text' },
  { header: '담당(역할)', key: 'owner', type: 'text' },
  { header: '마감', key: 'due', type: 'date' },
  { header: '상태', key: 'status', type: 'text' },
  { header: '마지막 업데이트', key: 'updatedAt', type: 'date' },
  { header: '다음 결정', key: 'nextDecision', type: 'text' },
]

const ISO_DATE = /^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/
const EXCEL_EPOCH = Date.UTC(1899, 11, 30)

function pad(n) {
  return String(n).padStart(2, '0')
}

function isRealDate(y, m, d) {
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}

function toText(value) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text === '' ? null : text
}

// 글자('2026-10-15'), 엑셀 날짜형(Date), 날짜 일련번호(숫자)를 모두 'YYYY-MM-DD'로 맞춘다.
export function toIsoDate(value) {
  if (value === null || value === undefined) return { value: null }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return { value: null, problem: '날짜가 아님' }
    return { value: value.toISOString().slice(0, 10) }
  }
  if (typeof value === 'number') {
    const date = new Date(EXCEL_EPOCH + Math.round(value) * 86_400_000)
    return { value: date.toISOString().slice(0, 10) }
  }
  const text = String(value).trim()
  if (text === '') return { value: null }
  const match = ISO_DATE.exec(text)
  if (!match) return { value: null, problem: `날짜로 읽을 수 없음: "${text}"` }
  const [y, m, d] = match.slice(1).map(Number)
  if (!isRealDate(y, m, d)) return { value: null, problem: `없는 날짜: "${text}"` }
  return { value: `${y}-${pad(m)}-${pad(d)}` }
}

export async function readRawRows() {
  return readSheet(SOURCE_PATH)
}

export function checkHeaders(headerRow) {
  const headers = headerRow.map((h) => toText(h) ?? '')
  const missing = EXPECTED_HEADERS.filter((h) => !headers.includes(h))
  const extra = headers.filter((h) => h !== '' && !EXPECTED_HEADERS.includes(h))
  return { headers, missing, extra }
}

export async function readProjects() {
  const rows = await readRawRows()
  if (rows.length === 0) throw new Error(`${SOURCE_NAME}에 내용이 없습니다.`)

  const { headers, missing, extra } = checkHeaders(rows[0])
  if (missing.length > 0) {
    throw new Error(
      `${SOURCE_NAME} 첫 줄 제목이 다릅니다.\n  없는 제목: ${missing.join(', ')}\n  지금 제목: ${headers.join(' | ')}`,
    )
  }

  const warnings = []
  if (extra.length > 0) warnings.push(`옮기지 않은 칸: ${extra.join(', ')}`)

  const projects = []
  rows.slice(1).forEach((cells, i) => {
    const row = i + 2 // 엑셀 행 번호(1행은 제목)
    if (cells.every((c) => toText(c) === null)) return

    const project = { row }
    for (const field of FIELDS) {
      const raw = cells[headers.indexOf(field.header)]
      if (field.type === 'date') {
        const { value, problem } = toIsoDate(raw)
        if (problem) warnings.push(`${row}행 ${field.header}: ${problem} → [확인 필요]`)
        project[field.key] = value
      } else {
        project[field.key] = toText(raw)
      }
    }
    projects.push(project)
  })

  return { source: SOURCE_NAME, projects, warnings }
}
