import { FILTER_FIELDS, filterOptions, hasFilters, NO_FILTERS, type FilterState } from '../lib/filters'
import type { Project } from '../lib/status'

type Props = {
  projects: Project[]
  filters: FilterState
  onChange: (next: FilterState) => void
  shown: number
  total: number
}

export function Filters({ projects, filters, onChange, shown, total }: Props) {
  return (
    <section className="filters" aria-label="거르기">
      {FILTER_FIELDS.map(({ key, label }) => (
        <label key={key} className="filter">
          <span className="filter-label">{label}</span>
          <select value={filters[key]} onChange={(e) => onChange({ ...filters, [key]: e.target.value })}>
            <option value="">전체</option>
            {filterOptions(projects, key).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button type="button" className="reset" onClick={() => onChange(NO_FILTERS)} disabled={!hasFilters(filters)}>
        모두 보기
      </button>
      <p className="result-count" data-testid="result-count" aria-live="polite">
        {shown}건 / {total}건
      </p>
    </section>
  )
}
