import type { CalendarDay } from '@/lib/pickup'

/**
 * Step 1 on /order and /parents. 마을 픽업 주문: one week of pickup, the next
 * five weekdays that still take orders, so it moves along one square each day
 * (월~금 today, 화~월 tomorrow). 학부모 주문: the next two Fridays. A day past
 * the two-week window is greyed. Fridays get a small dot when this tab also
 * has other days, because their menu is different.
 */
export function PickupDatePicker({
  days,
  markFriday,
  selected,
  onSelect,
}: {
  days: CalendarDay[] | null
  markFriday: boolean
  selected: string | null
  onSelect: (iso: string) => void
}) {
  // Two Fridays sit side by side at a comfortable width, not stretched over five columns.
  const grid = days && days.length <= 2 ? 'grid max-w-sm grid-cols-2 gap-2' : 'grid grid-cols-5 gap-2'
  if (!days) {
    return (
      <div className={grid}>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-[2px] bg-eden-paper-dim" />
        ))}
      </div>
    )
  }
  return (
    <div className={grid}>
      {days.map((d) => {
        const open = d.open
        const active = d.iso === selected
        return (
          <button
            key={d.iso}
            type="button"
            disabled={!open}
            aria-pressed={active}
            aria-label={`${d.month}월 ${d.date}일 ${d.weekday}요일${open ? '' : `, ${d.closedNote ?? '주문할 수 없음'}`}`}
            onClick={() => onSelect(d.iso)}
            className={`relative flex h-[88px] flex-col items-center justify-center gap-0.5 rounded-[2px] border px-1 transition-colors ${
              active
                ? 'border-eden-accent bg-eden-accent text-white'
                : open
                  ? 'border-eden-line bg-white text-eden-ink hover:border-eden-ink'
                  : 'cursor-not-allowed border-transparent bg-eden-line/25 text-eden-mute/45'
            }`}
          >
            <span className="text-2xl font-medium leading-tight">{d.weekday}</span>
            <span className="text-sm font-semibold">
              {d.month}/{d.date}
            </span>
            {!open && d.closedNote ? <span className="text-[13px] font-semibold text-eden-mute">{d.closedNote}</span> : null}
            {markFriday && d.day === 'friday' && open ? (
              <span aria-hidden className={`absolute right-2 top-2 h-2 w-2 rounded-full ${active ? 'bg-eden-paper' : 'bg-eden-accent'}`} />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
