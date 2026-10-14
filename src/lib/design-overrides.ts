import savedOverrides from '@/design-overrides.json'

export const DESIGN_FONTS = [
  { id: 'eden', label: '현재 글꼴 · Montserrat / Noto Sans KR', css: "'Montserrat', 'Noto Sans KR', sans-serif", url: undefined },
  { id: 'noto-sans', label: 'Noto Sans KR', css: "'Noto Sans KR', sans-serif", url: undefined },
  { id: 'noto-serif', label: 'Noto Serif KR', css: "'Noto Serif KR', serif", url: 'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;600;700&display=swap' },
  { id: 'gowun-dodum', label: '고운 돋움', css: "'Gowun Dodum', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap' },
  { id: 'gowun-batang', label: '고운 바탕', css: "'Gowun Batang', serif", url: 'https://fonts.googleapis.com/css2?family=Gowun+Batang&display=swap' },
  { id: 'nanum-gothic', label: '나눔고딕', css: "'Nanum Gothic', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&display=swap' },
  { id: 'gaegu', label: '개구', css: "'Gaegu', cursive", url: 'https://fonts.googleapis.com/css2?family=Gaegu:wght@300;400;700&display=swap' },
] as const

export type DesignFontId = (typeof DESIGN_FONTS)[number]['id']

export type DesignOverride = {
  path: string
  selector: string
  text: string
  font: DesignFontId
  size: number
  weight: number
}

export const initialDesignOverrides = savedOverrides as DesignOverride[]

export function designFont(id: string) {
  return DESIGN_FONTS.find((font) => font.id === id) ?? DESIGN_FONTS[0]
}

export function renderDesignCss(overrides: DesignOverride[]): string {
  return overrides.map((entry) => {
    const font = designFont(entry.font)
    return `html[data-design-path=${JSON.stringify(entry.path)}] ${entry.selector} { font-family: ${font.css}; font-size: ${entry.size}px; font-weight: ${entry.weight}; }`
  }).join('\n')
}
