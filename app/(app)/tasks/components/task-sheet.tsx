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
import { Delete02Icon, File01Icon } from "@hugeicons/core-free-icons"
import { toast } from "@/components/ui/toast"

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
}

interface TaskSheetProps {
  isOpen: boolean
  onClose: (open: boolean) => void
  editingTaskId: string | null
  courses: any[]
  onSaveSuccess: () => void
}

export function TaskSheet({
  isOpen,
  onClose,
  editingTaskId,
  courses,
  onSaveSuccess,
}: TaskSheetProps) {
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [courseId, setCourseId] = React.useState("none")
  const [deadline, setDeadline] = React.useState("")
  const [status, setStatus] = React.useState("PENDING")
  const [priority, setPriority] = React.useState("MEDIUM")
  const [isGroupTask, setIsGroupTask] = React.useState(false)
  const [myPart, setMyPart] = React.useState("")
  const [weightPercentage, setWeightPercentage] = React.useState("")
  const [submissionMethod, setSubmissionMethod] = React.useState("OFFLINE")
  const [submissionLink, setSubmissionLink] = React.useState("")
  const [formLoading, setFormLoading] = React.useState(false)

  // Attachment states
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([])
  const [existingAttachments, setExistingAttachments] = React.useState<any[]>([])
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Load editing task details
  React.useEffect(() => {
    if (!isOpen) return

    if (editingTaskId) {
      const token = getCookie("token")
      fetch(`${API_URL}/api/tasks/${editingTaskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) return res.json()
          throw new Error("Failed to load task")
        })
        .then(data => {
          setTitle(data.title)
          setDescription(data.description || "")
          setCourseId(data.courseId || "none")
          setStatus(data.status)
          setPriority(data.priority)
          setIsGroupTask(data.isGroupTask || false)
          setMyPart(data.myPart || "")
          setWeightPercentage(data.weightPercentage?.toString() || "")
          setSubmissionMethod(data.submissionMethod || "OFFLINE")
          setSubmissionLink(data.submissionLink || "")
          setExistingAttachments(data.attachments || [])
          
          // Timezone conversion for local datetime input
          if (data.deadline) {
            const localDate = new Date(data.deadline)
            const offset = localDate.getTimezoneOffset()
            const adjustedDate = new Date(localDate.getTime() - (offset * 60 * 1000))
            setDeadline(adjustedDate.toISOString().slice(0, 16))
          }
        })
        .catch(err => {
          toast.add({ type: "error", description: err.message })
        })
    } else {
      setTitle("")
      setDescription("")
      setCourseId("none")
      setDeadline("")
      setStatus("PENDING")
      setPriority("MEDIUM")
      setIsGroupTask(false)
      setMyPart("")
      setWeightPercentage("")
      setSubmissionMethod("OFFLINE")
      setSubmissionLink("")
      setExistingAttachments([])
      setSelectedFiles([])
    }
  }, [editingTaskId, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    const token = getCookie("token")
    if (!token) return

    try {
      const url = editingTaskId ? `${API_URL}/api/tasks/${editingTaskId}` : `${API_URL}/api/tasks`
      const method = editingTaskId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description: description || undefined,
          courseId: courseId === "none" ? undefined : courseId,
          deadline: new Date(deadline).toISOString(),
          status,
          priority,
          isGroupTask,
          myPart: isGroupTask ? (myPart || null) : null,
          weightPercentage: weightPercentage ? parseInt(weightPercentage, 10) : null,
          submissionMethod,
          submissionLink: submissionLink || null
        })
      })

      if (!res.ok) throw new Error("Failed to save task")
      const savedTask = await res.json()

      // Handle file uploads if any
      if (selectedFiles.length > 0) {
        const taskId = editingTaskId || savedTask.id
        const formData = new FormData()
        selectedFiles.forEach((file) => {
          formData.append("files", file)
        })

        const uploadRes = await fetch(`${API_URL}/api/tasks/${taskId}/attachments`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        })

        if (!uploadRes.ok) throw new Error("Task saved, but attachment upload failed")
      }

      toast.add({ type: "success", description: editingTaskId ? "Task updated!" : "Task created!" })
      onSaveSuccess()
      onClose(false)
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to save task" })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!editingTaskId) return
    const token = getCookie("token")
    try {
      const res = await fetch(`${API_URL}/api/tasks/${editingTaskId}/attachments/${attachmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Gagal menghapus lampiran")
      toast.add({ type: "success", description: "Lampiran berhasil dihapus" })
      setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId))
      onSaveSuccess()
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md flex flex-col h-full overflow-hidden">
        <SheetHeader className="shrink-0 pb-4 border-b px-6 pt-6">
          <SheetTitle>{editingTaskId ? "Edit Task" : "Add Task"}</SheetTitle>
          <SheetDescription>
            {editingTaskId
              ? "Update the details for the selected academic task."
              : "Create a new task with custom course mapping, deadline, and priority."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="task-title">Title</FieldLabel>
              <Input
                id="task-title"
                type="text"
                placeholder="e.g. Project Laporan Akhir"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="task-desc">Description</FieldLabel>
              <Input
                id="task-desc"
                type="text"
                placeholder="Details about task or requirements"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Associated Course</FieldLabel>
              <Select value={courseId} onValueChange={(value) => setCourseId(value || "none")}>
                <SelectTrigger className="w-full">
                  <span data-slot="select-value">
                    {courseId === "none"
                      ? "General Task (No Course)"
                      : courses.find((c) => c.id === courseId)?.name || "Choose a course"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="none">General Task (No Course)</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="task-deadline">Deadline</FieldLabel>
              <Input
                id="task-deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select value={status} onValueChange={(value) => setStatus(value || "PENDING")}>
                  <SelectTrigger className="w-full">
                    <span data-slot="select-value">{status.replace("_", " ")}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="PENDING">PENDING</SelectItem>
                      <SelectItem value="IN_PROGRESS">IN PROGRESS</SelectItem>
                      <SelectItem value="DONE">DONE</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Priority</FieldLabel>
                <Select value={priority} onValueChange={(value) => setPriority(value || "MEDIUM")}>
                  <SelectTrigger className="w-full">
                    <span data-slot="select-value">{priority}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="LOW">LOW</SelectItem>
                      <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                      <SelectItem value="HIGH">HIGH</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <Checkbox
                id="isGroupTask"
                checked={isGroupTask}
                onCheckedChange={(checked) => setIsGroupTask(!!checked)}
              />
              <label htmlFor="isGroupTask" className="text-xs font-semibold select-none cursor-pointer">
                Tugas Kelompok
              </label>
            </div>

            {isGroupTask && (
              <Field>
                <FieldLabel className="text-xs font-semibold">Porsi Tugas Saya</FieldLabel>
                <Input
                  value={myPart}
                  onChange={(e) => setMyPart(e.target.value)}
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
                  value={weightPercentage}
                  onChange={(e) => setWeightPercentage(e.target.value)}
                  placeholder="e.g. 15"
                  className="h-9 text-sm"
                />
              </Field>
              <Field>
                <FieldLabel className="text-xs font-semibold">Metode Pengumpulan</FieldLabel>
                <Select value={submissionMethod} onValueChange={(v) => setSubmissionMethod(v || "OFFLINE")}>
                  <SelectTrigger className="w-full h-9">
                    <span data-slot="select-value" className="text-sm">{submissionMethod}</span>
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
                value={submissionLink}
                onChange={(e) => setSubmissionLink(e.target.value)}
                placeholder="e.g. https://lms.univ.ac.id/submit"
                className="h-9 text-sm"
              />
            </Field>

            {/* Existing Attachments list (Only visible in Edit Mode) */}
            {editingTaskId && existingAttachments.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/30">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Lampiran Saat Ini
                </span>
                <div className="grid gap-2">
                  {existingAttachments.map((att: any) => {
                    const isImage = att.fileType.startsWith("image/")
                    const fileUrl = `${API_URL}/uploads/tasks/${att.filePath}`

                    return (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2 rounded-lg border bg-muted/20 text-xs gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {isImage ? (
                            <img
                              src={fileUrl}
                              alt={att.name}
                              className="h-8 w-8 rounded object-cover border border-border/80"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded border bg-background flex items-center justify-center text-muted-foreground shrink-0">
                              <HugeiconsIcon icon={File01Icon} className="h-4 w-4" />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold truncate text-[11px]" title={att.name}>
                              {att.name}
                            </span>
                            <span className="text-[9px] text-muted-foreground">
                              {(att.fileSize / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                          onClick={() => handleDeleteAttachment(att.id)}
                        >
                          <HugeiconsIcon icon={Delete02Icon} className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Upload Files Input */}
            <Field>
              <FieldLabel className="text-xs font-semibold">Tambahkan Lampiran (File/Gambar)</FieldLabel>
              <div className="flex flex-col gap-2">
                <Input
                  id="task-files"
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files) {
                      const newFiles = Array.from(e.target.files)
                      setSelectedFiles((prev) => {
                        const filtered = newFiles.filter(
                          (nf) => !prev.some((pf) => pf.name === nf.name && pf.size === nf.size)
                        )
                        return [...prev, ...filtered]
                      })
                    }
                  }}
                  className="h-10 text-xs py-1.5 file:mr-2 file:py-0.5 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
                  accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,text/plain"
                />
                {selectedFiles.length > 0 && (
                  <div className="text-[11px] text-muted-foreground mt-2 space-y-1.5 border-l-2 border-primary/50 pl-2">
                    <span className="font-bold block mb-1">File terpilih untuk diunggah:</span>
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 bg-muted/10 p-1.5 rounded pr-2">
                        <span className="truncate max-w-[200px] font-medium">• {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                        <button
                          type="button"
                          onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-destructive hover:underline font-semibold text-[10px]"
                        >
                          Batal
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onClose(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={formLoading}>
                {formLoading ? "Saving..." : editingTaskId ? "Save Changes" : "Create Task"}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
