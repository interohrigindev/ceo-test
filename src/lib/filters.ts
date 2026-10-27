import { UNKNOWN, type Project } from './status'

export type FilterKey = 'category' | 'owner' | 'status'
export type FilterState = Record<FilterKey, string> // '' = 전체

export const FILTER_FIELDS: { key: FilterKey; label: string }[] = [
  { key: 'category', label: '구분' },
  { key: 'owner', label: '담당' },
  { key: 'status', label: '상태' },
]

export const NO_FILTERS: FilterState = { category: '', owner: '', status: '' }

const shown = (value: string | null) => value ?? UNKNOWN

/** 선택지는 데이터에서 뽑는다. 담당은 가나다순, 나머지는 엑셀에 나온 순서. */
export function filterOptions(projects: Project[], key: FilterKey): string[] {
  const values = [...new Set(projects.map((p) => shown(p[key])))]
  return key === 'owner' ? values.sort((a, b) => a.localeCompare(b, 'ko')) : values
}

export function matchesFilters(project: Project, filters: FilterState): boolean {
  return FILTER_FIELDS.every(({ key }) => filters[key] === '' || shown(project[key]) === filters[key])
}

export function hasFilters(filters: FilterState): boolean {
  return FILTER_FIELDS.some(({ key }) => filters[key] !== '')
}
