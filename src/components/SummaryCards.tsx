import type { Summary } from '../lib/status'

const CARDS: { key: keyof Summary; label: string; tone?: 'stalled' | 'overdue' }[] = [
  { key: 'total', label: '전체' },
  { key: 'inProgress', label: '진행 중' },
  { key: 'stalled', label: '2주 멈춤', tone: 'stalled' },
  { key: 'overdue', label: '마감 지남', tone: 'overdue' },
]

export function SummaryCards({ summary }: { summary: Summary }) {
  return (
    <dl className="summary" aria-label="요약 숫자">
      {CARDS.map(({ key, label, tone }) => (
        <div key={key} className={tone ? `stat stat-${tone}` : 'stat'}>
          <dt>{label}</dt>
          <dd>
            <span className="stat-value" data-testid={`count-${key}`}>
              {summary[key]}
            </span>
            <span className="stat-unit">건</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
