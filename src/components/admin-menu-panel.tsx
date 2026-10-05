import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { getErrorMessage } from '@/lib/errors'
import { resizeImage } from '@/lib/image'
import { useState } from 'react'
import { toast } from 'sonner'

type Category = 'bakery' | 'drink'
type MenuRow = {
  _id: Id<'menuItems'>
  category: Category
  name: string
  description: string
  price: number
  soldOut?: boolean
  imageUrl: string | null
}
type FormState = { category: Category; name: string; description: string; price: string }

const EMPTY_FORM: FormState = { category: 'bakery', name: '', description: '', price: '' }

export function AdminMenuPanel() {
  const items = useQuery(api.menu.list)
  const toggleSoldOut = useMutation(api.menu.toggleSoldOut)
  const createItem = useMutation(api.menu.create)
  const updateItem = useMutation(api.menu.update)
  const removeItem = useMutation(api.menu.remove)
  const setImage = useMutation(api.menu.setImage)
  const generateUploadUrl = useMutation(api.menu.generateUploadUrl)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MenuRow | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [saving, setSaving] = useState(false)

  const resetPhotoState = () => {
    if (filePreview) URL.revokeObjectURL(filePreview)
    setFile(null)
    setFilePreview(null)
    setRemovePhoto(false)
  }

  const openAdd = () => {
    resetPhotoState()
    setEditing(null)
    setForm(EMPTY_FORM)
    setOpen(true)
  }

  const openEdit = (item: MenuRow) => {
    resetPhotoState()
    setEditing(item)
    setForm({
      category: item.category,
      name: item.name,
      description: item.description,
      price: String(item.price),
    })
    setOpen(true)
  }

  const closeDialog = () => {
    resetPhotoState()
    setOpen(false)
  }

  const onPickFile = (f: File | null) => {
    if (filePreview) URL.revokeObjectURL(filePreview)
    setFile(f)
    setFilePreview(f ? URL.createObjectURL(f) : null)
    if (f) setRemovePhoto(false)
  }

  const uploadPhoto = async (f: File): Promise<Id<'_storage'>> => {
    const blob = await resizeImage(f, 1200, 0.85)
    const url = await generateUploadUrl({})
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: blob })
    if (!res.ok) throw new Error('사진 업로드에 실패했습니다.')
    const { storageId } = (await res.json()) as { storageId: string }
    return storageId as Id<'_storage'>
  }

  const save = async () => {
    const price = Number(form.price.replace(/,/g, '').trim())
    if (!form.name.trim()) return toast.error('메뉴 이름을 입력해주세요.')
    if (form.price.trim() === '' || !Number.isInteger(price) || price < 0) {
      return toast.error('가격은 0 이상의 숫자로 입력해주세요.')
    }
    setSaving(true)
    try {
      if (editing) {
        await updateItem({
          id: editing._id,
          category: form.category,
          name: form.name,
          description: form.description,
          price,
        })
        if (file) {
          await setImage({ id: editing._id, imageId: await uploadPhoto(file) })
        } else if (removePhoto && editing.imageUrl) {
          await setImage({ id: editing._id, imageId: null })
        }
        toast.success('메뉴가 수정되었습니다.')
      } else {
        const imageId = file ? await uploadPhoto(file) : undefined
        await createItem({
          category: form.category,
          name: form.name,
          description: form.description,
          price,
          imageId,
        })
        toast.success('메뉴가 추가되었습니다.')
      }
      closeDialog()
    } catch (e) {
      toast.error(getErrorMessage(e, '저장에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (item: MenuRow) => {
    if (!window.confirm(`"${item.name}" 메뉴를 삭제할까요?\n삭제하면 되돌릴 수 없어요.`)) return
    try {
      await removeItem({ id: item._id })
      toast.success('메뉴가 삭제되었습니다.')
    } catch (e) {
      toast.error(getErrorMessage(e, '삭제에 실패했습니다.'))
    }
  }

  const previewSrc = file ? filePreview : !removePhoto ? (editing?.imageUrl ?? null) : null

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-serif text-lg font-semibold">메뉴 관리</h3>
        <button onClick={openAdd} className="bg-eden-ink px-4 py-2 text-xs font-medium text-eden-paper">
          + 메뉴 추가
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-eden-line text-left text-xs text-eden-sage-dim">
            <th className="pb-3 font-normal">사진</th>
            <th className="pb-3 font-normal">상품명</th>
            <th className="pb-3 font-normal">카테고리</th>
            <th className="pb-3 font-normal">가격</th>
            <th className="pb-3 font-normal">상태</th>
            <th className="pb-3 font-normal">관리</th>
          </tr>
        </thead>
        <tbody>
          {!items ? (
            <tr><td colSpan={6} className="py-6 text-center text-eden-sage-dim">불러오는 중…</td></tr>
          ) : items.length === 0 ? (
            <tr><td colSpan={6} className="py-6 text-center text-eden-sage-dim">등록된 메뉴가 없습니다. 위의 "메뉴 추가"로 등록해보세요.</td></tr>
          ) : (
            items.map((item) => (
              <tr key={item._id} className="border-b border-eden-line">
                <td className="py-3 pr-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-12 w-12 object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center bg-eden-line text-[10px] text-eden-sage-dim">없음</div>
                  )}
                </td>
                <td className="py-3">{item.name}</td>
                <td className="py-3">{item.category === 'bakery' ? '베이커리' : '음료'}</td>
                <td className="py-3">{item.price.toLocaleString('ko-KR')}원</td>
                <td className="py-3">
                  <button
                    onClick={() => void toggleSoldOut({ id: item._id })}
                    className={`rounded-full px-3.5 py-1 text-[11px] font-bold ${item.soldOut ? 'bg-eden-line text-eden-sage-dim' : 'bg-eden-sage text-eden-ink-2'}`}
                  >
                    {item.soldOut ? '품절' : '판매중'}
                  </button>
                </td>
                <td className="py-3">
                  <button onClick={() => openEdit(item)} className="mr-3 text-xs text-eden-sage-dim underline hover:text-eden-sand">
                    수정
                  </button>
                  <button onClick={() => void onDelete(item)} className="text-xs text-eden-sage-dim underline hover:text-destructive">
                    삭제
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-h-[90vh] max-w-[440px] overflow-y-auto bg-eden-paper">
          <DialogTitle className="font-serif text-lg">{editing ? '메뉴 수정' : '메뉴 추가'}</DialogTitle>

          <label className="mt-2 block text-xs text-eden-sage-dim">카테고리</label>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
            className="w-full border border-eden-line bg-eden-paper-dim px-3 py-2 text-sm"
          >
            <option value="bakery">베이커리</option>
            <option value="drink">음료</option>
          </select>

          <label className="block text-xs text-eden-sage-dim">메뉴 이름</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="예: 단호박 크림빵"
            className="w-full border border-eden-line bg-eden-paper-dim px-3 py-2 text-sm"
          />

          <label className="block text-xs text-eden-sage-dim">설명</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="메뉴를 한두 줄로 소개해주세요."
            className="min-h-[70px] w-full border border-eden-line bg-eden-paper-dim px-3 py-2 text-sm"
          />

          <label className="block text-xs text-eden-sage-dim">가격 (원)</label>
          <input
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            inputMode="numeric"
            placeholder="4500"
            className="w-full border border-eden-line bg-eden-paper-dim px-3 py-2 text-sm"
          />

          <label className="block text-xs text-eden-sage-dim">사진 (선택)</label>
          <div className="flex h-[140px] items-center justify-center overflow-hidden border border-dashed border-eden-line bg-eden-paper-dim text-[11px] text-eden-sage-dim">
            {previewSrc ? <img src={previewSrc} alt="" className="h-full w-full object-cover" /> : '사진 없음'}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="image/*"
              className="text-[11px]"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
            {previewSrc ? (
              <button
                type="button"
                onClick={() => {
                  onPickFile(null)
                  setRemovePhoto(true)
                }}
                className="text-[11.5px] text-eden-sage-dim underline hover:text-destructive"
              >
                사진 삭제
              </button>
            ) : null}
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button onClick={closeDialog} className="border border-eden-line px-5 py-2 text-xs text-eden-sage-dim">
              취소
            </button>
            <button
              onClick={() => void save()}
              disabled={saving}
              className="bg-eden-ink px-5 py-2 text-xs font-medium text-eden-paper disabled:opacity-50"
            >
              {saving ? '저장 중…' : editing ? '수정 저장' : '메뉴 추가'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
