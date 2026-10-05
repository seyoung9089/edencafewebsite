import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { CONTENT_SCHEMA } from '@/lib/site-content'
import { getErrorMessage } from '@/lib/errors'
import { blobToDataUrl, resizeImage } from '@/lib/image'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const IMAGE_SLOTS = [
  { key: 'hero.bgPhoto', label: '히어로 배경 사진', desc: '메인 화면 맨 위 전체 배경으로 깔리는 사진 (없으면 기존 일러스트 유지)' },
  { key: 'hero.photo', label: '히어로 대표 이미지', desc: '메인 화면 가운데 겹쳐지는 이미지' },
  { key: 'location.photo', label: '오시는 길 사진', desc: '지도 영역에 표시할 매장 · 약도 사진' },
  { key: 'history.photo', label: '히스토리 대표 사진', desc: '최신 연혁 항목 옆에 보여줄 사진' },
]

function ImageSlotRow({ slotKey, label, desc }: { slotKey: string; label: string; desc: string }) {
  const current = useQuery(api.siteContent.getImage, { key: slotKey })
  const setImage = useMutation(api.siteContent.setImage)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const onFile = async (file: File) => {
    setUploading(true)
    try {
      // Shrink first: phone photos are several MB, but these images are
      // stored inside a database document that is limited to about 1MB.
      const blob = await resizeImage(file, 1400, 0.8)
      const dataUrl = await blobToDataUrl(blob)
      await setImage({ key: slotKey, value: dataUrl })
      toast.success('이미지가 반영되었습니다.')
    } catch (e) {
      toast.error(getErrorMessage(e, '업로드에 실패했습니다.'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="border border-eden-line bg-eden-paper p-5">
      <h4 className="mb-1 font-serif text-sm font-semibold">{label}</h4>
      <p className="mb-3 text-[11.5px] text-eden-sage-dim">{desc}</p>
      <div className="mb-3 flex h-[110px] items-center justify-center overflow-hidden border border-dashed border-eden-line bg-eden-paper-dim text-[11px] text-eden-sage-dim">
        {current ? <img src={current} alt="" className="h-full w-full object-cover" /> : '이미지 없음'}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="text-[11px]"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onFile(f)
          }}
          disabled={uploading}
        />
        {uploading ? <span className="text-[11px] text-eden-sage-dim">올리는 중…</span> : null}
        {current ? (
          <button
            onClick={() => void setImage({ key: slotKey, value: null })}
            className="text-[11.5px] text-eden-sage-dim underline hover:text-eden-sand"
          >
            삭제
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function AdminContentPanel() {
  const stored = useQuery(api.siteContent.getAll)
  const setMany = useMutation(api.siteContent.setMany)
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const initialized = useRef(false)

  useEffect(() => {
    if (stored && !initialized.current) {
      const initial: Record<string, string> = {}
      CONTENT_SCHEMA.forEach((f) => {
        initial[f.key] = stored[f.key] ?? f.default
      })
      setValues(initial)
      initialized.current = true
    }
  }, [stored])

  const groups: Record<string, typeof CONTENT_SCHEMA> = {}
  const order: string[] = []
  CONTENT_SCHEMA.forEach((f) => {
    if (!groups[f.group]) {
      groups[f.group] = []
      order.push(f.group)
    }
    groups[f.group].push(f)
  })

  const save = async () => {
    setSaving(true)
    try {
      await setMany({ entries: CONTENT_SCHEMA.map((f) => ({ key: f.key, value: values[f.key] ?? f.default })) })
      toast.success('저장되었습니다. 사이트에 바로 반영됐어요.')
    } catch (e) {
      toast.error(getErrorMessage(e, '저장에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h3 className="mb-5 font-serif text-lg font-semibold">이미지 관리</h3>
      <p className="mb-4 text-xs text-eden-sage-dim">이미지를 올리면 실제 화면에 바로 반영됩니다. 파일을 선택하지 않으면 기존 일러스트가 유지됩니다.</p>
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {IMAGE_SLOTS.map((s) => (
          <ImageSlotRow key={s.key} slotKey={s.key} label={s.label} desc={s.desc} />
        ))}
      </div>

      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold">글귀 수정</h3>
        <button onClick={() => void save()} disabled={saving} className="bg-eden-ink px-5 py-2 text-xs font-medium text-eden-paper disabled:opacity-50">
          {saving ? '저장 중…' : '전체 저장'}
        </button>
      </div>
      <div className="max-h-[560px] overflow-y-auto border border-eden-line bg-eden-paper p-5">
        {order.map((g) => (
          <div key={g} className="mb-6 last:mb-0">
            <div className="mb-3 border-b border-eden-line pb-1.5 font-serif text-sm font-semibold text-eden-sand">{g}</div>
            {groups[g].map((f) => (
              <div key={f.key} className="mb-3">
                <label className="mb-1 block text-[11.5px] text-eden-sage-dim">{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea
                    value={values[f.key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="min-h-[56px] w-full border border-eden-line bg-eden-paper-dim px-2.5 py-2 text-[13px]"
                  />
                ) : (
                  <input
                    value={values[f.key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    className="w-full border border-eden-line bg-eden-paper-dim px-2.5 py-2 text-[13px]"
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
