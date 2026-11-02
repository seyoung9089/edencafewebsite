import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { CONTENT_SCHEMA, refreshSiteContent, useSiteContent } from '@/lib/site-content'
import { removeSiteImage, uploadSiteImage } from '@/lib/storage'
import { getErrorMessage } from '@/lib/errors'
import { buttonClass } from './use-staff'

const IMAGE_SLOTS = [
  { key: 'hero.bgPhoto', label: '히어로 배경 사진', desc: '메인 화면 맨 위 전체 배경 (없으면 기본 일러스트)' },
  { key: 'hero.photo', label: '히어로 대표 이미지', desc: '메인 화면 가운데 겹쳐지는 이미지' },
  { key: 'location.photo', label: '오시는 길 사진', desc: '지도 영역에 표시할 매장 · 약도 사진' },
  { key: 'history.photo', label: '히스토리 대표 사진', desc: '최신 연혁 항목 옆에 보여줄 사진' },
]

export function ContentPanel() {
  const stored = useSiteContent()
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (!stored || initialized.current) return
    setValues(Object.fromEntries(CONTENT_SCHEMA.map((f) => [f.key, stored[f.key] ?? f.default])))
    initialized.current = true
  }, [stored])

  const groups = new Map<string, typeof CONTENT_SCHEMA>()
  for (const f of CONTENT_SCHEMA) groups.set(f.group, [...(groups.get(f.group) ?? []), f])

  const save = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('site_content')
      .upsert(CONTENT_SCHEMA.map((f) => ({ key: f.key, value: values[f.key] ?? f.default })))
    setSaving(false)
    if (error) return void toast.error(error.message)
    await refreshSiteContent()
    toast.success('저장했어요. 사이트에 바로 반영됐어요.')
  }

  return (
    <div>
      <h3 className="mb-2 font-serif text-lg font-semibold">이미지</h3>
      <p className="mb-4 text-xs text-eden-sage-dim">사진을 올리면 바로 반영돼요. 사진이 없으면 기본 일러스트가 보여요.</p>
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {IMAGE_SLOTS.map((slot) => (
          <ImageSlot key={slot.key} slotKey={slot.key} label={slot.label} desc={slot.desc} current={stored?.[slot.key] || null} />
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold">글귀</h3>
        <button onClick={() => void save()} disabled={saving || !initialized.current} className={buttonClass}>
          {saving ? '저장 중…' : '전체 저장'}
        </button>
      </div>
      <div className="space-y-8 rounded-[10px] border border-eden-line bg-eden-paper p-5">
        {[...groups].map(([group, fields]) => (
          <div key={group}>
            <div className="mb-3 border-b border-eden-line pb-1.5 font-serif text-sm font-semibold text-eden-sand">{group}</div>
            {fields.map((f) => (
              <label key={f.key} className="mb-3 block">
                <span className="mb-1 block text-xs text-eden-sage-dim">{f.label}</span>
                {f.type === 'textarea' ? (
                  <textarea
                    value={values[f.key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="min-h-20 w-full rounded-[10px] border border-eden-line bg-eden-paper-dim px-3 py-2 text-sm"
                  />
                ) : (
                  <input
                    value={values[f.key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full rounded-[10px] border border-eden-line bg-eden-paper-dim px-3 py-2 text-sm"
                  />
                )}
              </label>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function ImageSlot({ slotKey, label, desc, current }: { slotKey: string; label: string; desc: string; current: string | null }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const setImage = async (file: File | null) => {
    setBusy(true)
    try {
      if (file) {
        const url = await uploadSiteImage(file, 'site')
        const { error } = await supabase.from('site_content').upsert({ key: slotKey, value: url })
        if (error) throw error
      } else {
        const { error } = await supabase.from('site_content').delete().eq('key', slotKey)
        if (error) throw error
      }
      await removeSiteImage(current).catch(() => {})
      await refreshSiteContent()
      toast.success(file ? '사진을 올렸어요.' : '사진을 지웠어요.')
    } catch (e) {
      toast.error(getErrorMessage(e, '사진을 저장하지 못했어요.'))
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="rounded-[10px] border border-eden-line bg-eden-paper p-4">
      <h4 className="font-serif text-sm font-semibold">{label}</h4>
      <p className="mb-3 text-xs text-eden-sage-dim">{desc}</p>
      <div className="mb-3 flex h-28 items-center justify-center overflow-hidden rounded-[10px] border border-dashed border-eden-line bg-eden-paper-dim text-xs text-eden-sage-dim">
        {current ? <img src={current} alt="" className="h-full w-full object-cover" /> : '사진 없음'}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void setImage(e.target.files?.[0] ?? null)} />
      <div className="flex gap-3 text-xs">
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className="underline">
          {busy ? '저장 중…' : current ? '사진 변경' : '사진 올리기'}
        </button>
        {current ? (
          <button type="button" disabled={busy} onClick={() => void setImage(null)} className="text-eden-sage-dim underline">
            삭제
          </button>
        ) : null}
      </div>
    </div>
  )
}
