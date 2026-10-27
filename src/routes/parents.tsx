import { createFileRoute } from '@tanstack/react-router'
import { OrderPage } from '@/components/order-page'
import { pageMeta } from '@/lib/seo'

// 학부모 주문: parents order for Friday; the student picks up after school.
export const Route = createFileRoute('/parents')({ component: ParentsOrderPage, head: () => pageMeta('/parents') })

function ParentsOrderPage() {
  return <OrderPage audience="parents" />
}
