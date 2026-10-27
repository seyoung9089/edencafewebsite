import type { CalendarDay } from '@/lib/pickup'

/**
 * Step 1 on /order and /parents: one week of pickup, the next five weekdays
 * that still take orders, so it moves along one square each day (월~금 today,
 * 화~월 tomorrow). Days this tab doesn't take (학부모: anything but Friday)
 * are greyed. Fridays get a small dot when this tab also has other days,
 * because their menu is different.
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
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-[10px] bg-eden-paper-dim" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-5 gap-2">
      {days.map((d) => {
        const open = d.open && allowed(d)
        const active = d.iso === selected
        return (
          <button
            key={d.iso}
            type="button"
            disabled={!open}
            aria-pressed={active}
            aria-label={`${d.weekLabel} ${d.month}월 ${d.date}일 ${d.weekday}요일${open ? '' : ', 주문할 수 없음'}`}
            onClick={() => onSelect(d.iso)}
            className={`relative flex h-[104px] flex-col items-center justify-center gap-0.5 rounded-[10px] border px-1 transition-colors ${
              active
                ? 'border-eden-ink bg-eden-ink text-eden-paper'
                : open
                  ? 'border-eden-sage-dim/40 bg-eden-paper text-eden-ink shadow-soft hover:border-eden-ink'
                  : 'cursor-not-allowed border-transparent bg-eden-line/25 text-eden-sage-dim/45'
            }`}
          >
            <span className={`text-[11px] ${active ? 'text-eden-paper/75' : open ? 'text-eden-sage-dim' : ''}`}>{d.weekLabel}</span>
            <span className="font-serif text-2xl font-semibold leading-tight">{d.weekday}</span>
            <span className="text-sm font-semibold">
              {d.month}/{d.date}
            </span>
            {markFriday && d.day === 'friday' && open ? (
              <span aria-hidden className={`absolute right-2 top-2 h-2 w-2 rounded-full ${active ? 'bg-eden-paper' : 'bg-eden-sand'}`} />
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
