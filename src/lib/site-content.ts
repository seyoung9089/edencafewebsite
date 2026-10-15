import { useEffect, useReducer } from 'react'
import { supabase } from '@/lib/supabase'

// Site text and image links live in the Supabase `site_content` table
// (key -> value). Loaded once per page visit and shared by every component;
// the admin page calls refreshSiteContent() after saving.
let cache: Record<string, string> | undefined
let inflight: Promise<void> | null = null
const listeners = new Set<() => void>()

async function load() {
  const { data, error } = await supabase.from('site_content').select('key,value')
  // On error (e.g. table not created yet) fall back to the built-in defaults.
  cache = !error && data ? Object.fromEntries(data.map((row) => [row.key, row.value])) : (cache ?? {})
  listeners.forEach((notify) => notify())
}

export function refreshSiteContent(): Promise<void> {
  inflight = load()
  return inflight
}

export function useSiteContent(): Record<string, string> | undefined {
  const [, rerender] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    listeners.add(rerender)
    if (!inflight) void refreshSiteContent()
    return () => {
      listeners.delete(rerender)
    }
  }, [])
  return cache
}

/** Public URL of an admin-uploaded site image (e.g. 'hero.photo'), or null. */
export function useContentImage(key: string): string | null {
  return useSiteContent()?.[key] || null
}

export type ContentFieldType = 'input' | 'textarea'
export type ContentField = { group: string; key: string; label: string; type: ContentFieldType; default: string }

export const CONTENT_SCHEMA: ContentField[] = [
  { group: '히어로', key: 'hero.eyebrow', label: '상단 안내 문구', type: 'input', default: '별무리고등학교에서 시작된 카페 협동조합 · Since 2021' },
  { group: '히어로', key: 'hero.title', label: '큰 제목', type: 'input', default: '매일 아침 직접 굽는 빵과 커피' },
  { group: '히어로', key: 'hero.subtitle', label: '작은 설명', type: 'input', default: '오늘 주문하시면 내일 카페에서 찾아가실 수 있어요.' },

  { group: '카페소개', key: 'phil.label1', label: '첫 번째 소제목', type: 'input', default: '이든이라는 이름' },
  { group: '카페소개', key: 'phil.text1', label: '첫 번째 본문', type: 'textarea', default: '에덴, 순수했던 처음의 자리. 별무리고등학교 학생들의 작은 창업 프로젝트에서 시작해, 지금은 졸업생과 교사가 함께 꾸려가는 협동조합 카페가 되었습니다.' },
  { group: '카페소개', key: 'phil.label2', label: '두 번째 소제목', type: 'input', default: '우리가 만드는 방식' },
  { group: '카페소개', key: 'phil.text2', label: '두 번째 본문', type: 'textarea', default: '빠르게 팔기보다 오래 남을 한 잔을 생각합니다. 이익보다 재료와 진심을 먼저 두고, 매일 아침 우리 손으로 직접 굽고 내립니다.' },

  { group: '핵심가치', key: 'values.title', label: '섹션 제목', type: 'input', default: '이든이 지키는 네 가지' },
  { group: '핵심가치', key: 'values.subtitle', label: '섹션 부제', type: 'input', default: '거창한 약속 대신, 매일 지킬 수 있는 작은 기준을 세웠습니다.' },
  { group: '핵심가치', key: 'value.eco.title', label: '친환경 - 제목', type: 'input', default: '친환경' },
  { group: '핵심가치', key: 'value.eco.desc', label: '친환경 - 설명', type: 'textarea', default: '건강하고 친환경적인 식재료와 물품을 사용합니다.' },
  { group: '핵심가치', key: 'value.comm.title', label: '소통 - 제목', type: 'input', default: '소통' },
  { group: '핵심가치', key: 'value.comm.desc', label: '소통 - 설명', type: 'textarea', default: '고객과의 지속적인 소통으로 함께 자라는 카페입니다.' },
  { group: '핵심가치', key: 'value.price.title', label: '가성비 - 제목', type: 'input', default: '가성비' },
  { group: '핵심가치', key: 'value.price.desc', label: '가성비 - 설명', type: 'textarea', default: '이익보다 가치를 우선한, 정직한 가격의 음료를 제공합니다.' },
  { group: '핵심가치', key: 'value.rest.title', label: '편안함 - 제목', type: 'input', default: '편안함' },
  { group: '핵심가치', key: 'value.rest.desc', label: '편안함 - 설명', type: 'textarea', default: '에덴의 안식을 닮은, 순수하게 편안한 자리를 지향합니다.' },
  { group: '핵심가치', key: 'values.tagline', label: '하단 태그라인', type: 'input', default: '건강한 재료 + 정직한 마음 = 이든의 커피' },

  { group: '메뉴 섹션', key: 'menuHome.title', label: '섹션 제목', type: 'input', default: '오늘의 메뉴' },
  { group: '메뉴 섹션', key: 'menuHome.subtitle', label: '섹션 부제', type: 'input', default: '베이커리실에서 직접 굽는 빵과, 이든만의 방식으로 내리는 음료입니다.' },

  { group: '히스토리', key: 'history.title', label: '섹션 제목', type: 'input', default: '이든의 시간' },
  { group: '히스토리', key: 'history.subtitle', label: '섹션 부제', type: 'input', default: '작은 교실 프로젝트에서 시작해, 지금의 이든이 되기까지.' },
  { group: '히스토리', key: 'history.h1', label: '2021년 설명', type: 'textarea', default: '별무리고등학교 카페 창업 프로젝트로 시작' },
  { group: '히스토리', key: 'history.h2', label: '2022년 설명', type: 'textarea', default: '금산군 신활력사업 선정, 예산 지원을 받아 기반을 다짐' },
  { group: '히스토리', key: 'history.h3', label: '2023년 설명', type: 'textarea', default: '졸업생과 교사가 함께하는 카페 협동조합으로 구성' },
  { group: '히스토리', key: 'history.h4', label: '2024–2025년 설명', type: 'textarea', default: '별드림관으로 이전·확장하며 학생들의 카페 이용이 늘어남' },
  { group: '히스토리', key: 'history.h5', label: '2026년 설명', type: 'textarea', default: '베이커리실을 새롭게 이전' },

  { group: '오시는 길', key: 'location.addr', label: '주소', type: 'input', default: '충청남도 금산군 ○○○ 이든카페 (별드림관 1층)' },
  { group: '오시는 길', key: 'location.quote', label: '안내 문구', type: 'textarea', default: '"궁금하신 점이 있으면 편하게 문의해주세요!"' },
  { group: '연락처 · 운영시간', key: 'contact.phone', label: '전화번호 (누르면 전화가 걸려요)', type: 'input', default: '010-XXXX-XXXX' },
  { group: '연락처 · 운영시간', key: 'contact.hours', label: '운영 시간', type: 'input', default: '평일 09:00 – 18:00' },

  { group: '새소식', key: 'news.n1.tag', label: '공지1 태그', type: 'input', default: '공지' },
  { group: '새소식', key: 'news.n1.title', label: '공지1 제목', type: 'input', default: '추석 연휴 픽업 운영 안내' },
  { group: '새소식', key: 'news.n1.date', label: '공지1 날짜', type: 'input', default: '2026.09.10' },
  { group: '새소식', key: 'news.n1.body', label: '공지1 내용', type: 'textarea', default: '' },
  { group: '새소식', key: 'news.n2.tag', label: '공지2 태그', type: 'input', default: '소식' },
  { group: '새소식', key: 'news.n2.title', label: '공지2 제목', type: 'input', default: '가을 신메뉴 출시 안내' },
  { group: '새소식', key: 'news.n2.date', label: '공지2 날짜', type: 'input', default: '2026.09.02' },
  { group: '새소식', key: 'news.n2.body', label: '공지2 내용', type: 'textarea', default: '' },
  { group: '새소식', key: 'news.n3.tag', label: '공지3 태그', type: 'input', default: '소식' },
  { group: '새소식', key: 'news.n3.title', label: '공지3 제목', type: 'input', default: '베이커리실 이전 완료 안내' },
  { group: '새소식', key: 'news.n3.date', label: '공지3 날짜', type: 'input', default: '2026.08.20' },
  { group: '새소식', key: 'news.n3.body', label: '공지3 내용', type: 'textarea', default: '' },
  { group: '새소식', key: 'news.n4.tag', label: '공지4 태그 (전체페이지 전용)', type: 'input', default: '소식' },
  { group: '새소식', key: 'news.n4.title', label: '공지4 제목 (전체페이지 전용)', type: 'input', default: '여름 시즌 메뉴 안내' },
  { group: '새소식', key: 'news.n4.date', label: '공지4 날짜', type: 'input', default: '2026.06.15' },
  { group: '새소식', key: 'news.n4.body', label: '공지4 내용', type: 'textarea', default: '' },
  { group: '새소식', key: 'news.n5.tag', label: '공지5 태그 (전체페이지 전용)', type: 'input', default: '공지' },
  { group: '새소식', key: 'news.n5.title', label: '공지5 제목 (전체페이지 전용)', type: 'input', default: '정기 휴무일 변경 안내' },
  { group: '새소식', key: 'news.n5.date', label: '공지5 날짜', type: 'input', default: '2026.05.02' },
  { group: '새소식', key: 'news.n5.body', label: '공지5 내용', type: 'textarea', default: '' },
  { group: '새소식', key: 'news.n6.tag', label: '공지6 태그 (전체페이지 전용)', type: 'input', default: '소식' },
  { group: '새소식', key: 'news.n6.title', label: '공지6 제목 (전체페이지 전용)', type: 'input', default: '이든 협동조합 정기총회 안내' },
  { group: '새소식', key: 'news.n6.date', label: '공지6 날짜', type: 'input', default: '2026.03.20' },
  { group: '새소식', key: 'news.n6.body', label: '공지6 내용', type: 'textarea', default: '' },

  { group: '입금 계좌', key: 'pickup.time', label: '픽업 시간 (주문 완료 창에 표시)', type: 'input', default: '09:00 – 18:00' },
  { group: '입금 계좌', key: 'payment.bank', label: '은행', type: 'input', default: '새마을금고' },
  { group: '입금 계좌', key: 'payment.account', label: '계좌번호', type: 'input', default: '000-0000-0000-00' },
  { group: '입금 계좌', key: 'payment.holder', label: '예금주', type: 'input', default: '이든협동조합' },
  { group: '입금 계좌', key: 'payment.note', label: '입금 안내', type: 'input', default: '입금이 확인되면 메뉴를 준비해요.' },

  { group: '푸터 · 기타', key: 'footer.blurb', label: '푸터 소개문', type: 'textarea', default: '학생들의 작은 시작이 협동조합으로 자란 카페. 정직한 재료와 편안한 쉼을 나눕니다.' },
  { group: '푸터 · 기타', key: 'cta.title', label: '하단 CTA 제목', type: 'input', default: '이든에서 오늘의 첫 잔을 시작하세요' },
]

export const ALL_NEWS_KEYS = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6'] as const
export const HOME_NEWS_KEYS = ['n1', 'n2', 'n3'] as const

// Single source of truth for fallback text: every call site just passes the
// key, so a field can never silently render blank because someone forgot to
// repeat its default text at the call site.
const DEFAULTS: Record<string, string> = Object.fromEntries(CONTENT_SCHEMA.map((f) => [f.key, f.default]))

/** Returns the admin-edited value for `key`, falling back to the schema default. */
export function useContentValue(content: Record<string, string> | undefined, key: string): string {
  return content?.[key] ?? DEFAULTS[key] ?? ''
}
