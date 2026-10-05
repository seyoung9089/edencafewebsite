import { useAuthActions } from '@convex-dev/auth/react'
import { useAction } from 'convex/react'
import { createFileRoute } from '@tanstack/react-router'
import { useRef, useState } from 'react'

import { api } from '@/convex/_generated/api'
import { useMountEffect } from '@/hooks/use-mount-effect'
import {
  describeGoogleAuthError,
  takeGoogleAuthHandoff,
  takeGoogleAuthPopupProof,
} from '@/lib/google-auth-handoff'

export const Route = createFileRoute('/auth/google/callback')({
  component: GoogleAuthCallbackPage,
})

function GoogleAuthCallbackPage() {
  const { signIn } = useAuthActions()
  const completeAuthorizationPopup = useAction(api.googleAuth.completeAuthorizationPopup)
  const handled = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useMountEffect(() => {
    if (handled.current) return
    handled.current = true
    const params = new URLSearchParams(window.location.hash.slice(1))
    const grant = params.get('macaly_google_grant')
    const oauthError = params.get('macaly_google_error')
    const flowId = params.get('macaly_google_flow')
    window.history.replaceState(null, '', window.location.pathname)

    if (flowId) {
      const popupVerifier = takeGoogleAuthPopupProof(flowId)
      if (!grant || !popupVerifier || oauthError) {
        setError('Google 로그인에 실패했습니다. 앱으로 돌아가서 다시 시도해주세요.')
        return
      }
      void completeAuthorizationPopup({ flowId, grant, popupVerifier })
        .then(() => window.close())
        .catch(() =>
          setError('Google 로그인에 실패했습니다. 앱으로 돌아가서 다시 시도해주세요.'),
        )
      return
    }

    const handoff = takeGoogleAuthHandoff()

    if (!grant || !handoff || oauthError) {
      setError(oauthError === 'access_denied' ? 'Google 로그인이 취소되었습니다.' : 'Google 로그인에 실패했습니다.')
      return
    }
    void signIn('macaly-google', {
      grant,
      handoffVerifier: handoff.verifier,
      linkToCurrentUser: handoff.mode === 'link',
    })
      .then(() => window.location.replace('/'))
      .catch((caught) =>
        setError(describeGoogleAuthError(caught, handoff.mode)),
      )
  })

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>
          <a href="/" className="text-sm underline">다시 시도하기</a>
        </div>
      </div>
    )
  }
  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <p className="text-sm text-muted-foreground">Google 로그인을 완료하는 중…</p>
    </div>
  )
}
