import { createFileRoute, redirect } from '@tanstack/react-router'

// The customer/order management page is now part of the single /admin page.
export const Route = createFileRoute('/customer-management')({
  beforeLoad: () => {
    throw redirect({ to: '/admin' })
  },
})
