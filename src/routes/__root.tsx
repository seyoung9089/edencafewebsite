import { HeadContent, Scripts, createRootRoute, useRouterState } from '@tanstack/react-router'
import { MacalyBridge } from '@macaly/bridge'

// CSS imported as a side effect — do NOT add `?url` or `?inline`.
//
// Why: TanStack Start runs two Vite build environments (client + ssr) with
// independent module graphs. A `?url` import resolves the CSS URL twice and
// the two passes can produce different hashes; the SSR pass bakes its hash
// into the prerendered HTML, but only the client's asset actually exists in
// `dist/client/assets/`, so the stylesheet 404s and the page loads unstyled.
//
// A bare side-effect import sidesteps the issue: only the client environment
// emits the CSS asset, and TanStack Start's manifest collection injects the
// correct hashed `<link rel="stylesheet">` into the rendered head from the
// client manifest. The CSS stays a shared, cacheable asset (important if
// prerender is expanded to multiple static pages — `?inline` would duplicate
// the CSS into every HTML file).
import '../styles.css'
import siteMetadata from '../metadata.json'
import AppConvexProvider from '@/components/convex-client-provider'
import { CartProvider } from '@/lib/cart'
import { CustomerAuthProvider } from '@/lib/customer-auth'
import { Toaster } from '@/components/ui/sonner'
import { BackToTop } from '@/components/back-to-top'
import { LocalDesignMode } from '@/components/local-design-mode'
import { designFont, initialDesignOverrides, renderDesignCss } from '@/lib/design-overrides'

const rootMeta = siteMetadata['/']

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: rootMeta.title },
      { name: 'description', content: rootMeta.description },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      { rel: 'manifest', href: '/manifest.json' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const fontUrls = Array.from(new Set(initialDesignOverrides.map((entry) => designFont(entry.font).url).filter(Boolean)))
  return (
    <html lang="ko" data-design-path={pathname} suppressHydrationWarning>
      <head>
        <HeadContent />
        {fontUrls.map((url) => <link key={url} rel="stylesheet" href={url} />)}
        <style id="design-overrides-style" dangerouslySetInnerHTML={{ __html: renderDesignCss(initialDesignOverrides) }} />
      </head>
      <MacalyBridge>
        <body>
          <AppConvexProvider>
            <CustomerAuthProvider><CartProvider>
              {children}
              <BackToTop />
              <Toaster />
            </CartProvider></CustomerAuthProvider>
          </AppConvexProvider>
          <LocalDesignMode />
          <Scripts />
        </body>
      </MacalyBridge>
    </html>
  )
}
