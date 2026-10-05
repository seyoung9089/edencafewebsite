import { Link } from '@tanstack/react-router'

export function EmailAuthLink({ label = '이메일로 로그인하기', className = '' }: { label?: string; className?: string }) {
  return <Link to="/login" className={`inline-block border border-eden-ink px-5 py-3 text-center text-sm font-medium text-eden-ink hover:bg-eden-ink hover:text-eden-paper ${className}`}>{label}</Link>
}
