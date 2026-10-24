import { createFileRoute, redirect } from '@tanstack/react-router'

// The news list now sits at the top of the 문의사항 page.
export const Route = createFileRoute('/news')({
  beforeLoad: () => {
    throw redirect({ to: '/support' })
  },
})
