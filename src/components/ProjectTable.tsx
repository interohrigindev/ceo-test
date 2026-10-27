import type { ReactNode } from 'react'
import { dueLabel, sinceLabel, UNKNOWN, type JudgedProject } from '../lib/status'

function Cell({ label, className, value, sub, children }: {
  label: string
  className?: string
  value: string | null
  sub?: string | null
  children?: ReactNode
}) {
  return (
    <td data-label={label} className={className}>
      <span className={value === null ? 'cell-main unknown' : 'cell-main'}>{value ?? UNKNOWN}</span>
      {sub && <span className="cell-sub">{sub}</span>}
      {children}
    </td>
  )
}

function rowClass(p: JudgedProject) {
  if (p.overdue) return 'row-overdue'
  if (p.stalled) return 'row-stalled'
  return undefined
}

export function ProjectTable({ projects }: { projects: JudgedProject[] }) {
  return (
    <table className="projects">
      <caption className="visually-hidden">프로젝트 목록</caption>
      <thead>
        <tr>
          <th scope="col">구분</th>
          <th scope="col">프로젝트</th>
          <th scope="col">담당(역할)</th>
          <th scope="col">마감</th>
          <th scope="col">상태</th>
          <th scope="col">마지막 업데이트</th>
          <th scope="col">다음 결정</th>
        </tr>
      </thead>
      <tbody>
        {projects.length === 0 && (
          <tr className="empty">
            <td colSpan={7}>조건에 맞는 프로젝트가 없습니다.</td>
          </tr>
        )}
        {projects.map((p) => (
          <tr key={p.row} data-row={p.row} className={rowClass(p)}>
            <Cell label="구분" className="col-category" value={p.category} />
            <Cell label="프로젝트" className="col-name" value={p.name} sub={`엑셀 ${p.row}행`} />
            <Cell label="담당(역할)" value={p.owner} />
            <Cell label="마감" value={p.due} sub={dueLabel(p)} />
            <Cell label="상태" className="col-status" value={p.status}>
              {(p.stalled || p.overdue) && (
                <span className="badges">
                  {p.stalled && <span className="badge badge-stalled">2주 멈춤</span>}
                  {p.overdue && <span className="badge badge-overdue">마감 지남</span>}
                </span>
              )}
            </Cell>
            <Cell label="마지막 업데이트" value={p.updatedAt} sub={sinceLabel(p)} />
            <Cell label="다음 결정" className="col-next" value={p.nextDecision} />
          </tr>
        ))}
      </tbody>
    </table>
  )
}
