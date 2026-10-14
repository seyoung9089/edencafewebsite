import { useEffect, useRef, useState } from 'react'
import { DESIGN_FONTS, designFont, initialDesignOverrides, renderDesignCss, type DesignFontId, type DesignOverride } from '@/lib/design-overrides'

const panelStyle: React.CSSProperties = {
  position: 'fixed', right: 18, bottom: 18, zIndex: 2147483647,
  width: 290, padding: 16, borderRadius: 14, background: '#fff', color: '#222',
  boxShadow: '0 8px 35px #0004', border: '1px solid #ddd',
  fontFamily: 'Arial, sans-serif', fontSize: 13, lineHeight: 1.5,
}
const inputStyle: React.CSSProperties = { display: 'block', width: '100%', marginTop: 5, padding: 7, border: '1px solid #bbb', borderRadius: 6, background: 'white', color: '#222' }
const buttonStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 7, border: '1px solid #bbb', background: '#fff', color: '#222', cursor: 'pointer' }

function selectorFor(element: HTMLElement): string | null {
  const parts: string[] = []
  let current: HTMLElement | null = element
  while (current && current !== document.body) {
    const parent: HTMLElement | null = current.parentElement
    if (!parent) return null
    const siblings = Array.from(parent.children).filter((child) => child.tagName === current!.tagName)
    const index = siblings.indexOf(current) + 1
    parts.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${index})`)
    current = parent
  }
  return current === document.body ? `body > ${parts.join(' > ')}` : null
}

function textElement(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element
  while (current && current !== document.body) {
    if (current.closest('[data-local-design-ui]') || current.closest('input, textarea, select, [contenteditable="true"]')) return null
    const directText = Array.from(current.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && !!node.textContent?.trim())
    if (directText) return current
    current = current.parentElement
  }
  return null
}

function loadFont(font: DesignFontId) {
  const url = designFont(font).url
  if (url && !document.querySelector(`link[href="${url}"]`)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    document.head.appendChild(link)
  }
}

export function LocalDesignMode() {
  const [available, setAvailable] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<{ element: HTMLElement; selector: string; text: string } | null>(null)
  const [font, setFont] = useState<DesignFontId>('eden')
  const [size, setSize] = useState(16)
  const [weight, setWeight] = useState(400)
  const [saved, setSaved] = useState<DesignOverride[]>(initialDesignOverrides)
  const [status, setStatus] = useState('')
  const originalStyle = useRef<{ element: HTMLElement; fontFamily: string; fontSize: string; fontWeight: string } | null>(null)

  useEffect(() => {
    setAvailable(import.meta.env.DEV && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname))
  }, [])

  function restorePreview() {
    if (!originalStyle.current) return
    const { element, fontFamily, fontSize, fontWeight } = originalStyle.current
    element.style.fontFamily = fontFamily
    element.style.fontSize = fontSize
    element.style.fontWeight = fontWeight
    originalStyle.current = null
  }

  useEffect(() => {
    if (!available || !open) return
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof HTMLElement) || target.closest('[data-local-design-ui]')) return
      const element = textElement(target)
      if (!element) return
      const selector = selectorFor(element)
      if (!selector) return
      event.preventDefault()
      event.stopPropagation()
      restorePreview()
      const text = element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 100) ?? ''
      const existing = saved.find((item) => item.path === window.location.pathname && item.selector === selector)
      const computed = window.getComputedStyle(element)
      setSelected({ element, selector, text })
      setFont(existing?.font ?? 'eden')
      setSize(existing?.size ?? Math.max(8, Math.min(120, Math.round(parseFloat(computed.fontSize) || 16))))
      const computedWeight = parseInt(computed.fontWeight, 10) || 400
      setWeight(existing?.weight ?? Math.max(100, Math.min(900, Math.round(computedWeight / 100) * 100)))
      setStatus('글꼴을 선택하면 즉시 미리보기가 바뀝니다.')
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [available, open, saved])

  useEffect(() => {
    if (!selected) return
    if (!originalStyle.current || originalStyle.current.element !== selected.element) {
      originalStyle.current = {
        element: selected.element,
        fontFamily: selected.element.style.fontFamily,
        fontSize: selected.element.style.fontSize,
        fontWeight: selected.element.style.fontWeight,
      }
    }
    loadFont(font)
    selected.element.style.fontFamily = designFont(font).css
    selected.element.style.fontSize = `${size}px`
    selected.element.style.fontWeight = String(weight)
  }, [selected, font, size, weight])

  useEffect(() => () => restorePreview(), [])

  async function update(action: 'save' | 'delete') {
    if (!selected) return
    setStatus('저장 중…')
    try {
      const response = await fetch('/__design/overrides', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'save'
          ? { action, entry: { path: window.location.pathname, selector: selected.selector, text: selected.text, font, size, weight } }
          : { action, path: window.location.pathname, selector: selected.selector }),
      })
      if (!response.ok) throw new Error(`저장 실패 (${response.status})`)
      const entries: DesignOverride[] = await response.json()
      restorePreview()
      setSaved(entries)
      const style = document.getElementById('design-overrides-style')
      if (style) style.textContent = renderDesignCss(entries)
      setStatus(action === 'save' ? '저장했습니다. 파일: src/design-overrides.json' : '이 글자의 변경을 지웠습니다.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '저장 실패')
    }
  }

  if (!available) return null
  return (
    <div data-local-design-ui style={panelStyle}>
      <button type="button" style={{ ...buttonStyle, width: '100%', fontWeight: 700 }} onClick={() => {
        if (open) { restorePreview(); setSelected(null) }
        setOpen(!open)
      }}>{open ? '디자인 모드 닫기' : '✦ 디자인 모드 열기'}</button>
      {open && <div style={{ paddingTop: 12 }}>
        <p style={{ margin: '0 0 12px' }}>바꾸고 싶은 글자를 화면에서 클릭하세요.</p>
        {selected && <>
          <div style={{ maxHeight: 52, overflow: 'hidden', padding: 7, background: '#f5f5f5', borderRadius: 6 }} title={selected.text}>{selected.text || '선택한 글자'}</div>
          <label style={{ display: 'block', marginTop: 10 }}>글꼴
            <select aria-label="글꼴" style={inputStyle} value={font} onChange={(event) => setFont(event.target.value as DesignFontId)}>
              {DESIGN_FONTS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label style={{ display: 'block', marginTop: 10 }}>글자 크기 (px)
            <input aria-label="글자 크기" style={inputStyle} type="number" min={8} max={120} value={size} onChange={(event) => setSize(Math.max(8, Math.min(120, Number(event.target.value) || 8)))} />
          </label>
          <label style={{ display: 'block', marginTop: 10 }}>굵기
            <select aria-label="굵기" style={inputStyle} value={weight} onChange={(event) => setWeight(Number(event.target.value))}>
              {[300, 400, 500, 600, 700, 800, 900].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button type="button" style={{ ...buttonStyle, background: '#222', color: 'white', flex: 1 }} onClick={() => void update('save')}>저장</button>
            <button type="button" style={buttonStyle} onClick={() => void update('delete')}>변경 지우기</button>
          </div>
        </>}
        {status && <p role="status" style={{ margin: '10px 0 0', fontSize: 12 }}>{status}</p>}
      </div>}
    </div>
  )
}
