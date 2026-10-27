import { describe, expect, it } from 'vitest'
import { loadProjects } from './loadProjects'
import { filterOptions, matchesFilters, NO_FILTERS } from './filters'
import { dueLabel, judge, sinceLabel, summarize, todayInSeoul, weekdayOf, type Project } from './status'

const base: Project = {
  row: 2,
  category: '신사업',
  name: '시험 프로젝트',
  owner: '시험 담당',
  due: '2026-11-30',
  status: '진행',
  updatedAt: '2026-10-13',
  nextDecision: '-',
}

describe('규칙', () => {
  it('2주 멈춤은 14일째가 아니라 15일째부터', () => {
    expect(judge({ ...base, updatedAt: '2026-10-13' }, '2026-10-27').stalled).toBe(false) // 14일
    expect(judge({ ...base, updatedAt: '2026-10-12' }, '2026-10-27').stalled).toBe(true) // 15일
  })

  it('마감 지남은 마감 당일이 아니라 다음 날부터', () => {
    expect(judge({ ...base, due: '2026-10-27' }, '2026-10-27').overdue).toBe(false)
    expect(judge({ ...base, due: '2026-10-26' }, '2026-10-27').overdue).toBe(true)
  })

  it('완료 건은 날짜가 아무리 지나도 표시하지 않는다', () => {
    const done = judge({ ...base, status: '완료', updatedAt: '2025-01-01', due: '2025-01-01' }, '2026-10-27')
    expect(done.stalled).toBe(false)
    expect(done.overdue).toBe(false)
    expect(dueLabel(done)).toBeNull()
  })

  it("'준비'도 끝나지 않은 건이라 판정한다", () => {
    expect(judge({ ...base, status: '준비', updatedAt: '2026-10-01' }, '2026-10-27').stalled).toBe(true)
  })

  it('날짜가 비면 [확인 필요] 대상, 판정에서 빠진다', () => {
    const blank = judge({ ...base, updatedAt: null, due: null }, '2026-10-27')
    expect(blank.stalled).toBe(false)
    expect(blank.overdue).toBe(false)
    expect(blank.undetermined).toBe(true)
  })

  it('상태가 비면 판정하지 않는다', () => {
    const blank = judge({ ...base, status: null, updatedAt: '2026-01-01', due: '2026-01-01' }, '2026-10-27')
    expect(blank.stalled || blank.overdue).toBe(false)
    expect(blank.undetermined).toBe(true)
  })

  it('작은 글씨', () => {
    const p = judge({ ...base, due: '2026-10-31', updatedAt: '2026-09-02' }, '2026-10-27')
    expect(dueLabel(p)).toBe('D-4')
    expect(sinceLabel(p)).toBe('55일 전')
    expect(dueLabel(judge({ ...base, due: '2026-10-15' }, '2026-10-27'))).toBe('12일 지남')
    expect(dueLabel(judge({ ...base, due: '2026-10-27' }, '2026-10-27'))).toBe('오늘 마감')
  })
})

describe('오늘 = 한국 날짜', () => {
  it('UTC 10/26 15:30 은 한국 10/27 00:30', () => {
    expect(todayInSeoul(new Date('2026-10-26T15:30:00Z'))).toBe('2026-10-27')
  })
  it('UTC 10/26 14:59 는 한국 10/26 23:59', () => {
    expect(todayInSeoul(new Date('2026-10-26T14:59:00Z'))).toBe('2026-10-26')
  })
  it('요일', () => {
    expect(weekdayOf('2026-10-27')).toBe('화')
  })
})

// 아래는 지금 프로젝트목록.xlsx 기준 기대값(개발계획서 §4). 엑셀이 바뀌면 같이 고친다.
describe('현재 자료 기대값', () => {
  const { projects } = loadProjects()
  const at = (today: string) => summarize(projects.map((p) => judge(p, today)))

  it('10/27: 전체 10 · 진행 중 8 · 2주 멈춤 6 · 마감 지남 3', () => {
    expect(at('2026-10-27')).toEqual({ total: 10, inProgress: 8, stalled: 6, overdue: 3 })
  })

  it('줄별 표시 (10/27)', () => {
    const judged = projects.map((p) => judge(p, '2026-10-27'))
    expect(judged.filter((p) => p.stalled).map((p) => p.row)).toEqual([2, 4, 5, 7, 8, 11])
    expect(judged.filter((p) => p.overdue).map((p) => p.row)).toEqual([7, 8, 11])
  })

  it.each([
    ['2026-10-28', 6, 3],
    ['2026-10-29', 7, 3],
    ['2026-10-30', 8, 3],
    ['2026-10-31', 8, 3],
    ['2026-11-01', 9, 4],
  ])('%s: 2주 멈춤 %i · 마감 지남 %i', (today, stalled, overdue) => {
    expect(at(today)).toMatchObject({ stalled, overdue })
  })

  it('거르기', () => {
    const count = (f: Partial<typeof NO_FILTERS>) =>
      projects.filter((p) => matchesFilters(p, { ...NO_FILTERS, ...f })).length
    expect(count({})).toBe(10)
    expect(count({ category: '경영관리' })).toBe(5)
    expect(count({ owner: '인사총무 리더' })).toBe(2)
    expect(count({ status: '완료' })).toBe(1)
    expect(count({ category: '신사업', owner: '마케팅 리더' })).toBe(2)
    expect(filterOptions(projects, 'status')).toEqual(['진행', '준비', '완료'])
    expect(filterOptions(projects, 'category')).toEqual(['신사업', '경영관리'])
    expect(filterOptions(projects, 'owner')).toHaveLength(8)
  })
})
