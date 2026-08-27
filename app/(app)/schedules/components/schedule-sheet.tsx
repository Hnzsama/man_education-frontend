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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { toast } from "@/components/ui/toast"

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
]

interface ScheduleSheetProps {
  isOpen: boolean
  onClose: (open: boolean) => void
  selectedSemesterId: string
  editingScheduleId: string | null
  editingCourseId: string | null
  courses: any[]
  onSaveSuccess: () => void
}

export function ScheduleSheet({
  isOpen,
  onClose,
  selectedSemesterId,
  editingScheduleId,
  editingCourseId,
  courses,
  onSaveSuccess,
}: ScheduleSheetProps) {
  const [selectedCourseId, setSelectedCourseId] = React.useState("")
  const [dayOfWeek, setDayOfWeek] = React.useState("1")
  const [startTime, setStartTime] = React.useState("08:00")
  const [endTime, setEndTime] = React.useState("10:00")
  const [room, setRoom] = React.useState("")
  const [link, setLink] = React.useState("")
  const [formLoading, setFormLoading] = React.useState(false)

  React.useEffect(() => {
    if (!isOpen) return

    if (editingScheduleId && editingCourseId) {
      const token = getCookie("token")
      fetch(`${API_URL}/api/courses/${editingCourseId}/schedules`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) return res.json()
          throw new Error("Failed to load schedules")
        })
        .then((data: any[]) => {
          const sched = data.find(s => s.id === editingScheduleId)
          if (sched) {
            setSelectedCourseId(editingCourseId)
            setDayOfWeek(sched.dayOfWeek.toString())
            setStartTime(sched.startTime)
            setEndTime(sched.endTime)
            setRoom(sched.room || "")
            setLink(sched.link || "")
          }
        })
        .catch(err => {
          toast.add({ type: "error", description: err.message })
        })
    } else {
      setSelectedCourseId(courses.length > 0 ? courses[0].id : "")
      setDayOfWeek("1")
      setStartTime("08:00")
      setEndTime("10:00")
      setRoom("")
      setLink("")
    }
  }, [editingScheduleId, editingCourseId, isOpen, selectedSemesterId, courses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourseId) {
      toast.add({ type: "error", description: "Please choose a course first" })
      return
    }

    setFormLoading(true)
    const token = getCookie("token")
    if (!token) return

    try {
      const url = editingScheduleId
        ? `${API_URL}/api/courses/${editingCourseId}/schedules/${editingScheduleId}`
        : `${API_URL}/api/courses/${selectedCourseId}/schedules`
      const method = editingScheduleId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dayOfWeek: parseInt(dayOfWeek, 10),
          startTime,
          endTime,
          room: room || undefined,
          link: link || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to save schedule")
      }

      toast.add({
        type: "success",
        description: editingScheduleId ? "Jadwal kuliah diperbarui" : "Jadwal kuliah ditambahkan",
      })
      onSaveSuccess()
      onClose(false)
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to save schedule" })
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{editingScheduleId ? "Edit Jadwal Kuliah" : "Tambah Jadwal Kuliah"}</SheetTitle>
          <SheetDescription>
            {editingScheduleId
              ? "Perbarui detail waktu, ruangan, atau tautan kelas online."
              : "Masukkan jadwal mingguan baru untuk mata kuliah terpilih."}
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingScheduleId && (
              <Field>
                <FieldLabel>Mata Kuliah</FieldLabel>
                <Select value={selectedCourseId} onValueChange={(v) => setSelectedCourseId(v || "")}>
                  <SelectTrigger className="w-full">
                    <span data-slot="select-value">
                      {courses.find((c) => c.id === selectedCourseId)?.name || "Pilih mata kuliah"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
            <Field>
              <FieldLabel>Hari</FieldLabel>
              <Select value={dayOfWeek} onValueChange={(v) => setDayOfWeek(v || "1")}>
                <SelectTrigger className="w-full">
                  <span data-slot="select-value">
                    {DAYS_OF_WEEK.find((d) => d.value.toString() === dayOfWeek)?.label || "Choose a day"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {DAYS_OF_WEEK.map((d) => (
                      <SelectItem key={d.value} value={d.value.toString()}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="start-time">Jam Mulai</FieldLabel>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="end-time">Jam Selesai</FieldLabel>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="room">Ruangan (Opsional)</FieldLabel>
              <Input
                id="room"
                type="text"
                placeholder="e.g. Lab 3, Ruang 402"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="class-link">Link Online Class (Opsional)</FieldLabel>
              <Input
                id="class-link"
                type="url"
                placeholder="e.g. https://zoom.us/j/123456"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </Field>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="w-1/2" onClick={() => onClose(false)}>
                Batal
              </Button>
              <Button type="submit" className="w-1/2" disabled={formLoading}>
                {formLoading ? "Menyimpan..." : editingScheduleId ? "Simpan" : "Tambah"}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
