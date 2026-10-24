import { createFileRoute, redirect } from '@tanstack/react-router'

// Ordering now happens on /order, with the order summary on the same page.
export const Route = createFileRoute('/menu')({
  beforeLoad: () => {
    throw redirect({ to: '/order' })
  },
})
