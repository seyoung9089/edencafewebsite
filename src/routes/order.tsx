import { createFileRoute } from '@tanstack/react-router'
import { OrderPage } from '@/components/order-page'
import { pageMeta } from '@/lib/seo'

// 마을 픽업 주문: villagers order for any pickup day (월~금) and pick up themselves.
// ?date=YYYY-MM-DD comes from the date buttons on the home page.
export const Route = createFileRoute('/order')({
  component: VillageOrderPage,
  head: () => pageMeta('/order'),
  validateSearch: (search: Record<string, unknown>): { date?: string } =>
    typeof search.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(search.date) ? { date: search.date } : {},
})

function VillageOrderPage() {
  const { date } = Route.useSearch()
  return <OrderPage audience="village" initialDate={date} />
}
