// 오늘 · 지난 날수 · '2주 멈춤' / '마감 지남' 판정 · 숫자 4개.
// 날짜는 모두 'YYYY-MM-DD' 글자로 다룬다(시각 무시).

export type Project = {
  row: number
  category: string | null
  name: string | null
  owner: string | null
  due: string | null
  status: string | null
  updatedAt: string | null
  nextDecision: string | null
}

export type JudgedProject = Project & {
  daysSinceUpdate: number | null
  daysToDue: number | null
  stalled: boolean
  overdue: boolean
  undetermined: boolean
}

export type Summary = {
  total: number
  inProgress: number
  stalled: number
  overdue: number
}

export const STALL_DAYS = 14
export const DONE = '완료'
export const IN_PROGRESS = '진행'
export const UNKNOWN = '[확인 필요]'

const DAY_MS = 86_400_000
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const seoulDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** 지금 시각의 한국 날짜. 브라우저가 어느 시간대에 있어도 같다. */
export function todayInSeoul(now: Date = new Date()): string {
  return seoulDate.format(now)
}

export function isIsoDate(value: string | null): value is string {
  return value !== null && ISO_DATE.test(value) && !Number.isNaN(Date.parse(value))
}

/** to − from (일). 둘 다 'YYYY-MM-DD'. */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS)
}

export function weekdayOf(date: string): string {
  return WEEKDAYS[new Date(Date.parse(date)).getUTCDay()]
}

export function judge(project: Project, today: string): JudgedProject {
  const daysSinceUpdate = isIsoDate(project.updatedAt) ? daysBetween(project.updatedAt, today) : null
  const daysToDue = isIsoDate(project.due) ? daysBetween(today, project.due) : null
  // 상태를 모르면 끝났는지도 모르므로 판정하지 않는다.
  const open = project.status !== null && project.status !== DONE

  return {
    ...project,
    daysSinceUpdate,
    daysToDue,
    stalled: open && daysSinceUpdate !== null && daysSinceUpdate > STALL_DAYS,
    overdue: open && daysToDue !== null && daysToDue < 0,
    undetermined: project.status === null || daysSinceUpdate === null || daysToDue === null,
  }
}

export function summarize(projects: JudgedProject[]): Summary {
  return {
    total: projects.length,
    inProgress: projects.filter((p) => p.status === IN_PROGRESS).length,
    stalled: projects.filter((p) => p.stalled).length,
    overdue: projects.filter((p) => p.overdue).length,
  }
}

/** 마감 칸 아래 작은 글씨. 완료 건은 붙이지 않는다. */
export function dueLabel(p: JudgedProject): string | null {
  if (p.status === DONE || p.daysToDue === null) return null
  if (p.daysToDue === 0) return '오늘 마감'
  return p.daysToDue > 0 ? `D-${p.daysToDue}` : `${-p.daysToDue}일 지남`
}

/** 마지막 업데이트 칸 아래 작은 글씨. */
export function sinceLabel(p: JudgedProject): string | null {
  if (p.daysSinceUpdate === null) return null
  if (p.daysSinceUpdate === 0) return '오늘'
  return p.daysSinceUpdate > 0 ? `${p.daysSinceUpdate}일 전` : '앞날 날짜'
}
