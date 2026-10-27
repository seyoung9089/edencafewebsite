import type { PickupDate } from '@/lib/pickup'

const DAY_TAG = { weekday: '평일 메뉴', friday: '금요일 메뉴' } as const

/** Step 1 on /order: one big button per pickup day, closed days greyed out with their deadline. */
export function PickupDatePicker({
  dates,
  selected,
  onSelect,
}: {
  dates: PickupDate[] | null
  selected: string | null
  onSelect: (date: PickupDate) => void
}) {
  if (!dates) {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-card bg-eden-paper-dim" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {dates.map((d) => {
        const active = d.iso === selected
        return (
          <button
            key={d.iso}
            type="button"
            disabled={!d.open}
            aria-pressed={active}
            onClick={() => onSelect(d)}
            className={`rounded-card border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed ${
              active
                ? 'border-eden-ink bg-eden-ink text-eden-paper'
                : d.open
                  ? 'border-eden-line bg-eden-paper-dim hover:border-eden-ink'
                  : 'border-dashed border-eden-line bg-transparent opacity-50'
            }`}
          >
            <span className="flex flex-wrap items-baseline justify-between gap-x-2">
              <span className="font-serif text-lg font-semibold">{d.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  active ? 'bg-eden-paper/15 text-eden-paper' : d.day === 'friday' ? 'bg-eden-sand/25 text-eden-ink' : 'bg-eden-sage/40 text-eden-ink'
                }`}
              >
                {DAY_TAG[d.day]}
              </span>
            </span>
            <span className={`mt-1 block text-sm ${active ? 'text-eden-paper/80' : 'text-eden-sage-dim'}`}>
              {d.open ? `주문 마감: ${d.deadlineLabel} 23:59` : `주문 마감됨 (${d.deadlineLabel} 23:59)`}
            </span>
          </button>
        )
      })}
    </div>
  )
}
