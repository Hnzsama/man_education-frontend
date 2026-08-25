"use client"
import * as React from "react"
import { API_URL } from "@/lib/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
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
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon } from "@hugeicons/core-free-icons"
import { toast } from "@/components/ui/toast"

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
}

interface CalendarEventSheetProps {
  isOpen: boolean
  onClose: (open: boolean) => void
  editingTask: any | null
  prefillDate: string
  allCourses: any[]
  onSaveSuccess: () => void
  onDeleteRequest: (id: string) => void
}

export function CalendarEventSheet({
  isOpen,
  onClose,
  editingTask,
  prefillDate,
  allCourses,
  onSaveSuccess,
  onDeleteRequest,
}: CalendarEventSheetProps) {
  const [fTitle, setFTitle] = React.useState("")
  const [fDesc, setFDesc] = React.useState("")
  const [fCourseId, setFCourseId] = React.useState("none")
  const [fDeadline, setFDeadline] = React.useState("")
  const [fStatus, setFStatus] = React.useState("PENDING")
  const [fPriority, setFPriority] = React.useState("MEDIUM")
  const [fIsGroupTask, setFIsGroupTask] = React.useState(false)
  const [fMyPart, setFMyPart] = React.useState("")
  const [fWeight, setFWeight] = React.useState("")
  const [fSubMethod, setFSubMethod] = React.useState("OFFLINE")
  const [fSubLink, setFSubLink] = React.useState("")

  const [formLoading, setFormLoading] = React.useState(false)
  const [checklistItems, setChecklistItems] = React.useState<any[]>([])
  const [newCheckTitle, setNewCheckTitle] = React.useState("")

  React.useEffect(() => {
    if (editingTask) {
      setFTitle(editingTask.title)
      setFDesc(editingTask.description || "")
      setFCourseId(editingTask.courseId || "none")
      // Helper to convert date to local ISO-like string
      const toLocalDateTimeString = (dateStr: string) => {
        if (!dateStr) return ""
        const localDate = new Date(dateStr)
        const offset = localDate.getTimezoneOffset()
        const adjustedDate = new Date(localDate.getTime() - (offset * 60 * 1000))
        return adjustedDate.toISOString().slice(0, 16)
      }
      setFDeadline(toLocalDateTimeString(editingTask.deadline))
      setFStatus(editingTask.status)
      setFPriority(editingTask.priority)
      setFIsGroupTask(editingTask.isGroupTask || false)
      setFMyPart(editingTask.myPart || "")
      setFWeight(editingTask.weightPercentage?.toString() || "")
      setFSubMethod(editingTask.submissionMethod || "OFFLINE")
      setFSubLink(editingTask.submissionLink || "")
      setChecklistItems(editingTask.checklist || [])
    } else {
      setFTitle("")
      setFDesc("")
      setFCourseId("none")
      setFStatus("PENDING")
      setFPriority("MEDIUM")
      setFIsGroupTask(false)
      setFMyPart("")
      setFWeight("")
      setFSubMethod("OFFLINE")
      setFSubLink("")
      setChecklistItems([])
      setFDeadline(prefillDate)
    }
  }, [editingTask, prefillDate, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    const token = getCookie("token")
    if (!token) return

    try {
      const url = editingTask ? `${API_URL}/api/tasks/${editingTask.id}` : `${API_URL}/api/tasks`
      const method = editingTask ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: fTitle,
          description: fDesc || undefined,
          courseId: fCourseId === "none" ? undefined : fCourseId,
          deadline: new Date(fDeadline).toISOString(),
          status: fStatus,
          priority: fPriority,
          isGroupTask: fIsGroupTask,
          myPart: fIsGroupTask ? (fMyPart || null) : null,
          weightPercentage: fWeight ? parseInt(fWeight, 10) : null,
          submissionMethod: fSubMethod,
          submissionLink: fSubLink || null
        })
      })

      if (!res.ok) throw new Error("Failed to save task")
      toast.add({ type: "success", description: editingTask ? "Task updated!" : "Task added to calendar!" })
      onSaveSuccess()
      onClose(false)
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to save task" })
    } finally {
      setFormLoading(false)
    }
  }

  // Checklist actions
  const handleToggleCheckItem = async (itemId: string, isCompleted: boolean) => {
    if (!editingTask) return
    const token = getCookie("token")
    try {
      const res = await fetch(`${API_URL}/api/tasks/${editingTask.id}/checklist/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isCompleted })
      })
      if (!res.ok) throw new Error("Failed to toggle item")
      setChecklistItems(prev => prev.map(item => item.id === itemId ? { ...item, isCompleted } : item))
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    }
  }

  const handleDeleteCheckItem = async (itemId: string) => {
    if (!editingTask) return
    const token = getCookie("token")
    try {
      const res = await fetch(`${API_URL}/api/tasks/${editingTask.id}/checklist/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to delete item")
      setChecklistItems(prev => prev.filter(item => item.id !== itemId))
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    }
  }

  const handleAddCheckItem = async () => {
    if (!editingTask || !newCheckTitle.trim()) return
    const token = getCookie("token")
    try {
      const res = await fetch(`${API_URL}/api/tasks/${editingTask.id}/checklist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: newCheckTitle })
      })
      if (!res.ok) throw new Error("Failed to add checklist item")
      const newItem = await res.json()
      setChecklistItems(prev => [...prev, newItem])
      setNewCheckTitle("")
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[440px] overflow-y-auto font-sans flex flex-col">
        <SheetHeader className="pb-4 border-b border-border/40">
          <SheetTitle className="text-base">{editingTask ? "Edit Task" : "New Task"}</SheetTitle>
          <SheetDescription className="text-xs">
            {editingTask ? "Update your task details." : "Add a new task to your calendar."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-4 px-6 pb-6 flex-1">
          <Field>
            <FieldLabel className="text-xs font-semibold">Title *</FieldLabel>
            <Input
              value={fTitle}
              onChange={(e) => setFTitle(e.target.value)}
              placeholder="e.g. Complete Assignment 3"
              className="h-9 text-sm"
              required
            />
          </Field>

          <Field>
            <FieldLabel className="text-xs font-semibold">Description</FieldLabel>
            <Input
              value={fDesc}
              onChange={(e) => setFDesc(e.target.value)}
              placeholder="Optional notes…"
              className="h-9 text-sm"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel className="text-xs font-semibold">Deadline *</FieldLabel>
              <Input
                type="datetime-local"
                value={fDeadline}
                onChange={(e) => setFDeadline(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </Field>
            <Field>
              <FieldLabel className="text-xs font-semibold">Priority</FieldLabel>
              <Select value={fPriority} onValueChange={(v) => setFPriority(v || fPriority)}>
                <SelectTrigger className="w-full h-9">
                  <span data-slot="select-value" className="text-sm">
                    {fPriority.charAt(0) + fPriority.slice(1).toLowerCase()}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field>
            <FieldLabel className="text-xs font-semibold">Course</FieldLabel>
            <Select value={fCourseId} onValueChange={(v) => setFCourseId(v || fCourseId)}>
              <SelectTrigger className="w-full h-9">
                <span data-slot="select-value" className="text-sm">
                  {allCourses.find(c => c.id === fCourseId)?.name || "No specific course"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="none">No specific course</SelectItem>
                  {allCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          {editingTask && (
            <Field>
              <FieldLabel className="text-xs font-semibold">Status</FieldLabel>
              <Select value={fStatus} onValueChange={(v) => setFStatus(v || fStatus)}>
                <SelectTrigger className="w-full h-9">
                  <span data-slot="select-value" className="text-sm">{fStatus.replace("_"," ")}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}

          <div className="flex items-center gap-2 mt-1">
            <Checkbox
              id="isGroupTask"
              checked={fIsGroupTask}
              onCheckedChange={(checked) => setFIsGroupTask(!!checked)}
            />
            <label htmlFor="isGroupTask" className="text-xs font-semibold select-none cursor-pointer">
              Tugas Kelompok
            </label>
          </div>

          {fIsGroupTask && (
            <Field>
              <FieldLabel className="text-xs font-semibold">Porsi Tugas Saya</FieldLabel>
              <Input
                value={fMyPart}
                onChange={(e) => setFMyPart(e.target.value)}
                placeholder="e.g. Desain UI & frontend"
                className="h-9 text-sm"
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel className="text-xs font-semibold">Bobot Nilai (%)</FieldLabel>
              <Input
                type="number"
                value={fWeight}
                onChange={(e) => setFWeight(e.target.value)}
                placeholder="e.g. 15"
                className="h-9 text-sm"
              />
            </Field>
            <Field>
              <FieldLabel className="text-xs font-semibold">Metode Pengumpulan</FieldLabel>
              <Select value={fSubMethod} onValueChange={(v) => setFSubMethod(v || "OFFLINE")}>
                <SelectTrigger className="w-full h-9">
                  <span data-slot="select-value" className="text-sm">{fSubMethod}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="OFFLINE">Offline</SelectItem>
                    <SelectItem value="GFORM">Google Form</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="LMS">LMS Kampus</SelectItem>
                    <SelectItem value="UPLOAD">Upload</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field>
            <FieldLabel className="text-xs font-semibold">Link Pengumpulan</FieldLabel>
            <Input
              value={fSubLink}
              onChange={(e) => setFSubLink(e.target.value)}
              placeholder="e.g. https://lms.univ.ac.id/submit"
              className="h-9 text-sm"
            />
          </Field>

          {editingTask && (
            <div className="border-t border-border/40 pt-4 flex flex-col gap-2">
              <h4 className="text-xs font-bold text-foreground/75 uppercase tracking-wider">Sub-Todo Checklist</h4>
              <div className="space-y-2">
                {checklistItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-xl border bg-card text-xs">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={item.isCompleted}
                        onCheckedChange={(checked) => handleToggleCheckItem(item.id, !!checked)}
                      />
                      <span className={item.isCompleted ? "line-through text-muted-foreground" : ""}>{item.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCheckItem(item.id)}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  value={newCheckTitle}
                  onChange={(e) => setNewCheckTitle(e.target.value)}
                  placeholder="Tambah checklist baru..."
                  className="h-8 text-xs border rounded-xl px-2.5 bg-background flex-1 focus-visible:outline-none"
                />
                <Button type="button" size="sm" className="h-8 text-xs" onClick={handleAddCheckItem}>
                  Tambah
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-2 pt-4 border-t border-border/40">
            <Button type="submit" className="flex-1 h-9 text-sm" disabled={formLoading}>
              {formLoading ? "Saving…" : editingTask ? "Update Task" : "Add to Calendar"}
            </Button>
            {editingTask && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => onDeleteRequest(editingTask.id)}
              >
                <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
