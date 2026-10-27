import type { CalendarDay } from '@/lib/pickup'

/**
 * Step 1 on /order and /parents: the next two weeks as a calendar, seven days
 * a row, starting today, so it moves along one square each day. Days that
 * can't be ordered for (too soon, weekends, or not this tab's day) are greyed.
 * Fridays get a small dot when this tab also has other days, because their
 * menu is different.
 */
export function PickupDatePicker({
  days,
  allowed,
  markFriday,
  selected,
  onSelect,
}: {
  days: CalendarDay[] | null
  /** Whether this tab takes orders for that day at all (학부모 = Fridays only) */
  allowed: (day: CalendarDay) => boolean
  markFriday: boolean
  selected: string | null
  onSelect: (iso: string) => void
}) {
  if (!days) {
    return (
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 14 }, (_, i) => (
          <div key={i} className="h-[72px] animate-pulse rounded-[10px] bg-eden-paper-dim" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((d, i) => {
        const open = d.open && allowed(d)
        const active = d.iso === selected
        // Month shown on the first square and wherever a new month starts.
        const showMonth = i === 0 || d.date === 1
        return (
          <button
            key={d.iso}
            type="button"
            disabled={!open}
            aria-pressed={active}
            aria-label={`${d.month}월 ${d.date}일 ${d.weekday}요일${open ? '' : ', 주문할 수 없음'}`}
            onClick={() => onSelect(d.iso)}
            className={`relative flex h-[72px] flex-col items-center justify-center rounded-[10px] border transition-colors ${
              active
                ? 'border-eden-ink bg-eden-ink text-eden-paper'
                : open
                  ? 'border-eden-sage-dim/40 bg-eden-paper text-eden-ink shadow-soft hover:border-eden-ink'
                  : 'cursor-not-allowed border-transparent bg-eden-line/25 text-eden-sage-dim/45'
            }`}
          >
            <span className="text-xs">{d.isToday ? '오늘' : d.weekday}</span>
            <span className="font-serif text-xl font-semibold leading-tight">{d.date}</span>
            <span className="h-3 text-[10px] leading-3">{showMonth ? `${d.month}월` : ''}</span>
            {markFriday && d.day === 'friday' && open ? (
              <span aria-hidden className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${active ? 'bg-eden-paper' : 'bg-eden-sand'}`} />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
