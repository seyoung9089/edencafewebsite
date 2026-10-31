import { createFileRoute } from '@tanstack/react-router'
import { OrderPage } from '@/components/order-page'
import { pageMeta } from '@/lib/seo'

// 답례품 예약: gifts for an event or a gathering, picked up at the cafe.
export const Route = createFileRoute('/gifts')({ component: GiftOrderPage, head: () => pageMeta('/gifts') })

function GiftOrderPage() {
  return <OrderPage audience="gift" />
}
