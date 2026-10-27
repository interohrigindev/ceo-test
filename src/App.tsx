import { useEffect, useMemo, useState } from 'react'
import { Filters } from './components/Filters'
import { ProjectTable } from './components/ProjectTable'
import { SummaryCards } from './components/SummaryCards'
import { matchesFilters, NO_FILTERS, type FilterState } from './lib/filters'
import { loadProjects } from './lib/loadProjects'
import { judge, STALL_DAYS, summarize, todayInSeoul, weekdayOf } from './lib/status'

const { source, projects } = loadProjects()

/** 앱을 연 날(한국 시간). 켜 둔 채 자정이 지나면 다시 볼 때 바뀐다. */
function useToday() {
  const [today, setToday] = useState(() => todayInSeoul())
  useEffect(() => {
    const refresh = () => setToday(todayInSeoul())
    const timer = window.setInterval(refresh, 60_000)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])
  return today
}

export default function App() {
  const today = useToday()
  const [filters, setFilters] = useState<FilterState>(NO_FILTERS)

  const judged = useMemo(() => projects.map((p) => judge(p, today)), [today])
  const summary = useMemo(() => summarize(judged), [judged])
  const visible = judged.filter((p) => matchesFilters(p, filters))
  const undetermined = judged.filter((p) => p.undetermined).length

  return (
    <div className="page">
      <header className="masthead">
        <h1>프로젝트 현황판</h1>
        <p className="as-of" data-testid="as-of">
          기준일 {today}({weekdayOf(today)})
        </p>
      </header>

      <SummaryCards summary={summary} />

      <p className="legend">
        2주 멈춤: 마지막 업데이트 뒤 {STALL_DAYS}일 넘게 지남 · 마감 지남: 마감일이 지났는데 끝나지 않음 · 완료 건은 세지
        않음
      </p>

      <Filters
        projects={projects}
        filters={filters}
        onChange={setFilters}
        shown={visible.length}
        total={judged.length}
      />

      <ProjectTable projects={visible} />

      {undetermined > 0 && (
        <p className="note">날짜나 상태가 비어 판정하지 못한 줄 {undetermined}건 — [확인 필요]</p>
      )}

      <footer className="source">
        자료: {source} · {projects.length}건
      </footer>
    </div>
  )
}
