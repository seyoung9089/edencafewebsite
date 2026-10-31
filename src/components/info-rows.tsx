import type { ReactNode } from 'react'

export type InfoRow = { label: string; value: ReactNode; note?: ReactNode }

/** Grey label on the left, value on the right, one row per fact (픽업 | 11월 2일(월)). */
export function InfoRows({ rows, className = '' }: { rows: InfoRow[]; className?: string }) {
  return (
    <dl className={`divide-y divide-eden-line text-left text-[15px] ${className}`}>
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[4.5rem_1fr] gap-3 py-2.5">
          <dt className="text-eden-sage-dim">{row.label}</dt>
          <dd>
            <span className="font-semibold">{row.value}</span>
            {row.note ? <span className="mt-0.5 block text-sm text-eden-sage-dim">{row.note}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}
