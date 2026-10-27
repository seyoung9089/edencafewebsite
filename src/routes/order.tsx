import { createFileRoute } from '@tanstack/react-router'
import { OrderPage } from '@/components/order-page'
import { pageMeta } from '@/lib/seo'

// 마을 픽업 주문: villagers order for any pickup day (월~금) and pick up themselves.
export const Route = createFileRoute('/order')({ component: VillageOrderPage, head: () => pageMeta('/order') })

function VillageOrderPage() {
  return <OrderPage audience="village" />
}
