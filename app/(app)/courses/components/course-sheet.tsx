"use client"
import * as React from "react"
import { API_URL } from "@/lib/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { toast } from "@/components/ui/toast"

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
}

interface CourseSheetProps {
  isOpen: boolean
  onClose: (open: boolean) => void
  selectedSemesterId: string
  editingCourseId: string | null
  onSaveSuccess: () => void
}

export function CourseSheet({
  isOpen,
  onClose,
  selectedSemesterId,
  editingCourseId,
  onSaveSuccess,
}: CourseSheetProps) {
  const [code, setCode] = React.useState("")
  const [name, setName] = React.useState("")
  const [credits, setCredits] = React.useState("3")
  const [lecturer, setLecturer] = React.useState("")
  const [formLoading, setFormLoading] = React.useState(false)

  React.useEffect(() => {
    if (!isOpen) return

    if (editingCourseId && selectedSemesterId) {
      const token = getCookie("token")
      fetch(`${API_URL}/api/semesters/${selectedSemesterId}/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) return res.json()
          throw new Error("Failed to load courses")
        })
        .then((data: any[]) => {
          const course = data.find(c => c.id === editingCourseId)
          if (course) {
            setCode(course.code)
            setName(course.name)
            setCredits(course.credits.toString())
            setLecturer(course.lecturer || "")
          }
        })
        .catch(err => {
          toast.add({ type: "error", description: err.message })
        })
    } else {
      setCode("")
      setName("")
      setCredits("3")
      setLecturer("")
    }
  }, [editingCourseId, selectedSemesterId, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSemesterId) {
      toast.add({ type: "error", description: "Please select a semester first" })
      return
    }

    setFormLoading(true)
    const token = getCookie("token")
    if (!token) return

    try {
      const url = editingCourseId
        ? `${API_URL}/api/semesters/${selectedSemesterId}/courses/${editingCourseId}`
        : `${API_URL}/api/semesters/${selectedSemesterId}/courses`
      const method = editingCourseId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code,
          name,
          credits: parseInt(credits, 10),
          lecturer: lecturer || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to save course")
      }

      toast.add({
        type: "success",
        description: editingCourseId ? "Mata kuliah berhasil diperbarui" : "Mata kuliah berhasil ditambahkan",
      })
      onSaveSuccess()
      onClose(false)
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to save course" })
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editingCourseId ? "Edit Mata Kuliah" : "Tambah Mata Kuliah"}</SheetTitle>
          <SheetDescription>
            {editingCourseId
              ? "Perbarui kode, nama mata kuliah, sks, dan dosen pengampu."
              : "Tambahkan mata kuliah baru ke semester yang sedang aktif."}
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="course-code">Kode MK</FieldLabel>
              <Input
                id="course-code"
                type="text"
                placeholder="e.g. IF123"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="course-name">Nama Mata Kuliah</FieldLabel>
              <Input
                id="course-name"
                type="text"
                placeholder="e.g. Pemrograman Web"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="course-credits">SKS</FieldLabel>
              <Input
                id="course-credits"
                type="number"
                min="1"
                max="8"
                value={credits}
                onChange={(e) => setCredits(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="course-lecturer">Dosen Pengampu (Opsional)</FieldLabel>
              <Input
                id="course-lecturer"
                type="text"
                placeholder="e.g. Dr. Budi Santoso"
                value={lecturer}
                onChange={(e) => setLecturer(e.target.value)}
              />
            </Field>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="w-1/2" onClick={() => onClose(false)}>
                Batal
              </Button>
              <Button type="submit" className="w-1/2" disabled={formLoading}>
                {formLoading ? "Menyimpan..." : editingCourseId ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
