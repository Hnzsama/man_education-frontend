"use client"
import * as React from "react"
import { API_URL } from "@/lib/config"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Folder01Icon,
  File01Icon,
  Link01Icon,
  PencilEdit01Icon,
  Delete02Icon,
  Add01Icon,
  ArrowLeft01Icon,
  Upload01Icon,
  BookOpen01Icon,
  NoteIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  AlertCircleIcon,
  Attachment01Icon,
} from "@hugeicons/core-free-icons"
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

function formatBytes(bytes?: number | null) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const TYPE_COLORS: Record<string, string> = {
  FILE: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  LINK: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  NOTE: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
}

const COURSE_PALETTE = [
  "from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-700 dark:text-violet-300",
  "from-sky-500/20 to-sky-600/10 border-sky-500/30 text-sky-700 dark:text-sky-300",
  "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
  "from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-700 dark:text-orange-300",
  "from-pink-500/20 to-pink-600/10 border-pink-500/30 text-pink-700 dark:text-pink-300",
  "from-teal-500/20 to-teal-600/10 border-teal-500/30 text-teal-700 dark:text-teal-300",
  "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300",
  "from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-700 dark:text-rose-300",
]

export default function FilesPage() {
  const router = useRouter()

  const [courses, setCourses] = React.useState<any[]>([])
  const [tasks, setTasks] = React.useState<any[]>([])
  const [resources, setResources] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  // Navigation states
  const [selectedCourse, setSelectedCourse] = React.useState<any | null>(null)
  const [selectedTask, setSelectedTask] = React.useState<any | null>(null)

  // Dialog states
  const [addOpen, setAddOpen] = React.useState(false)
  const [addType, setAddType] = React.useState("FILE")
  const [addTitle, setAddTitle] = React.useState("")
  const [addDesc, setAddDesc] = React.useState("")
  const [addUrl, setAddUrl] = React.useState("")
  const [addTaskId, setAddTaskId] = React.useState("none")
  const [addFile, setAddFile] = React.useState<File | null>(null)
  const [addLoading, setAddLoading] = React.useState(false)
  const [dragOver, setDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Submissions Upload Sheet (untuk didalam folder task)
  const [subUploading, setSubUploading] = React.useState(false)
  const subFileInputRef = React.useRef<HTMLInputElement | null>(null)

  const fetchAll = React.useCallback(async () => {
    const token = getCookie("token")
    if (!token) { router.push("/login"); return }
    setLoading(true)
    try {
      // 1. Fetch semesters first
      const semestersRes = await fetch(`${API_URL}/api/semesters`, { headers: { Authorization: `Bearer ${token}` } })
      if (!semestersRes.ok) throw new Error("Failed to load semesters")
      const semesters = await semestersRes.json()
      const activeSem = semesters.find((s: any) => s.isActive) || semesters[0]
      
      if (activeSem) {
        // 2. Fetch courses for active semester, tasks, and resources in parallel
        const [coursesRes, tasksRes, resourcesRes] = await Promise.all([
          fetch(`${API_URL}/api/semesters/${activeSem.id}/courses`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/resources`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (coursesRes.ok) setCourses(await coursesRes.json())
        if (tasksRes.ok) setTasks(await tasksRes.json())
        if (resourcesRes.ok) setResources(await resourcesRes.json())
      } else {
        // Fallback parallel fetch if no semester found
        const [tasksRes, resourcesRes] = await Promise.all([
          fetch(`${API_URL}/api/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/resources`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (tasksRes.ok) setTasks(await tasksRes.json())
        if (resourcesRes.ok) setResources(await resourcesRes.json())
      }
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to load data" })
    } finally {
      setLoading(false)
    }
  }, [router])

  React.useEffect(() => { fetchAll() }, [fetchAll])

  // Custom Upload submissions per task (menyimpan ke TaskAttachment)
  const uploadSubFiles = async (files: File[]) => {
    if (!selectedTask) return
    const token = getCookie("token")
    if (!token) return
    setSubUploading(true)
    try {
      const formData = new FormData()
      files.forEach((f) => formData.append("files", f))
      const res = await fetch(`${API_URL}/api/tasks/${selectedTask.id}/attachments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
      const newAtts = await res.json()
      // Update local task state
      const updatedTask = { ...selectedTask, attachments: [...(selectedTask.attachments || []), ...(Array.isArray(newAtts) ? newAtts : [])] }
      setSelectedTask(updatedTask)
      setTasks((prev) => prev.map((t) => t.id === selectedTask.id ? updatedTask : t))
      toast.add({ type: "success", description: `${files.length} files uploaded successfully` })
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    } finally {
      setSubUploading(false)
    }
  }

  const handleDeleteSub = async (attId: string) => {
    if (!selectedTask) return
    const token = getCookie("token")
    try {
      const res = await fetch(`${API_URL}/api/tasks/${selectedTask.id}/attachments/${attId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to delete")
      const updatedTask = { ...selectedTask, attachments: (selectedTask.attachments || []).filter((a: any) => a.id !== attId) }
      setSelectedTask(updatedTask)
      setTasks((prev) => prev.map((t) => t.id === selectedTask.id ? updatedTask : t))
      toast.add({ type: "success", description: "File deleted successfully" })
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    }
  }

  // Handle Add Resource
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = getCookie("token")
    if (!token || !selectedCourse) return
    setAddLoading(true)
    try {
      const formData = new FormData()
      formData.append("courseId", selectedCourse.id)
      formData.append("type", addType)
      formData.append("title", addTitle)
      if (addDesc) formData.append("description", addDesc)
      if (addUrl) formData.append("url", addUrl)
      if (addTaskId !== "none") formData.append("taskId", addTaskId)
      if (addFile) formData.append("file", addFile)

      const res = await fetch(`${API_URL}/api/resources`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      toast.add({ type: "success", description: "Material saved successfully!" })
      setAddOpen(false)
      fetchAll()
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    } finally {
      setAddLoading(false)
    }
  }

  const handleDeleteResource = async (id: string) => {
    const token = getCookie("token")
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/api/resources/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to delete")
      toast.add({ type: "success", description: "Material deleted successfully" })
      fetchAll()
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    }
  }

  // Filter Tasks and Resources per Course
  const courseTasks = selectedCourse
    ? tasks.filter((t) => t.courseId === selectedCourse.id)
    : []

  const courseResources = selectedCourse
    ? resources.filter((r) => r.courseId === selectedCourse.id && !r.taskId)
    : []

  // Filter attachments per task inside task folder
  const taskSubmissions = selectedTask
    ? selectedTask.attachments || []
    : []

  const taskResources = selectedCourse && selectedTask
    ? resources.filter((r) => r.courseId === selectedCourse.id && r.taskId === selectedTask.id)
    : []

  // Render LEVEL 1: Course Folders Grid
  if (!selectedCourse) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <HugeiconsIcon icon={Folder01Icon} className="h-6 w-6 text-primary" />
            Files & Materials
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All lecture materials and assignment submissions in one place.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl border bg-muted/20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {courses.map((course, idx) => {
              const resCount = resources.filter((r) => r.courseId === course.id && !r.taskId).length
              const taskCount = tasks.filter((t) => t.courseId === course.id).length
              const palette = COURSE_PALETTE[idx % COURSE_PALETTE.length]
              return (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className={`group relative flex flex-col gap-3 rounded-2xl border bg-gradient-to-br ${palette} p-5 text-left transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10 active:scale-95`}
                >
                  <HugeiconsIcon icon={Folder01Icon} className="h-10 w-10 opacity-80 group-hover:scale-110 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight line-clamp-2">{course.name}</p>
                    <p className="text-[11px] font-mono opacity-70 mt-0.5">{course.code}</p>
                  </div>
                  <div className="text-[10px] font-semibold opacity-60 flex justify-between">
                    <span>{resCount} materials</span>
                    <span>{taskCount} tasks</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Render LEVEL 3: Inside a Specific Task Folder (Materi Tugas + File Pengumpulan)
  if (selectedTask) {
    const isOverdue = selectedTask.deadline && new Date(selectedTask.deadline) < new Date() && selectedTask.status !== "DONE"
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSelectedTask(null)}>
            <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{selectedCourse.name}</span>
            <h1 className="text-xl font-bold tracking-tight">📁 {selectedTask.title}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sisi Kiri: File Pengumpulan (Tugas) */}
          <div className="flex flex-col gap-4 rounded-xl border bg-muted/5 p-5">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-sm flex items-center gap-2">
                <HugeiconsIcon icon={Attachment01Icon} className="h-4 w-4 text-emerald-500" />
                Task Submissions
              </h2>
              {isOverdue && (
                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                  PAST DEADLINE
                </span>
              )}
            </div>

            <div
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all bg-background
                ${dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/50 hover:border-primary/50 hover:bg-muted/10"}
                ${subUploading ? "opacity-60 pointer-events-none" : ""}`}
              onClick={() => subFileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false)
                if (e.dataTransfer.files.length > 0) uploadSubFiles(Array.from(e.dataTransfer.files))
              }}
            >
              <HugeiconsIcon icon={Upload01Icon} className="h-7 w-7 text-muted-foreground/50" />
              <p className="text-xs font-semibold">{subUploading ? "Uploading…" : "Upload submission files"}</p>
              <p className="text-[10px] text-muted-foreground/60">PDF, Word, Image, ZIP · Max 10MB</p>
              <Input
                ref={subFileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => { if (e.target.files?.length) uploadSubFiles(Array.from(e.target.files)) }}
              />
            </div>

            <div className="space-y-2 mt-2">
              {taskSubmissions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No submission files uploaded yet.</p>
              ) : (
                taskSubmissions.map((att: any) => {
                  const isImage = att.fileType?.startsWith("image/")
                  const fileUrl = `${API_URL}/uploads/tasks/${att.filePath}`
                  return (
                    <div key={att.id} className="group flex items-center gap-3 rounded-lg border bg-background p-2.5 hover:bg-muted/10 transition-all">
                      {isImage ? (
                        <img src={fileUrl} className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-primary/5 border flex items-center justify-center shrink-0">
                          <HugeiconsIcon icon={File01Icon} className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-xs truncate block hover:text-primary">{att.name}</a>
                        <span className="text-[10px] text-muted-foreground">{formatBytes(att.fileSize)}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-all" onClick={() => handleDeleteSub(att.id)}>
                        <HugeiconsIcon icon={Delete02Icon} className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Sisi Kanan: Referensi / Catatan Tambahan Terkait Tugas */}
          <div className="flex flex-col gap-4 rounded-xl border bg-muted/5 p-5">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <HugeiconsIcon icon={BookOpen01Icon} className="h-4 w-4 text-primary" />
              Materials Related to this Task
            </h2>
            <div className="space-y-2">
              {taskResources.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No materials attached to this task.</p>
              ) : (
                taskResources.map((r: any) => (
                  <div key={r.id} className="group flex items-center gap-3 rounded-lg border bg-background p-2.5">
                    <HugeiconsIcon icon={r.type === "LINK" ? Link01Icon : r.type === "FILE" ? File01Icon : NoteIcon} className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs truncate">{r.title}</p>
                      {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary truncate block hover:underline">{r.url}</a>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render LEVEL 2: Inside Course Folder (Tasks Folders + General Course Materials)
  const palette = COURSE_PALETTE[courses.findIndex((c) => c.id === selectedCourse.id) % COURSE_PALETTE.length]
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Course Header Banner */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setSelectedCourse(null)}>
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
        </Button>
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-gradient-to-r ${palette} flex-1`}>
          <HugeiconsIcon icon={Folder01Icon} className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight">{selectedCourse.name}</p>
            <p className="text-[11px] font-mono opacity-70">{selectedCourse.code}</p>
          </div>
          <Button
            size="sm"
            className="ml-auto h-8 text-xs gap-1.5 shrink-0"
            onClick={() => {
              setAddOpen(true)
              setAddType("FILE")
              setAddTitle("")
              setAddDesc("")
              setAddUrl("")
              setAddTaskId("none")
              setAddFile(null)
            }}
          >
            <HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5" />
            Add Material
          </Button>
        </div>
      </div>

      {/* SECTION A: TASK FOLDERS */}
      <div className="flex flex-col gap-3">
        <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <HugeiconsIcon icon={Attachment01Icon} className="h-4 w-4" />
          Task Submission Folders
        </h2>
        {courseTasks.length === 0 ? (
          <p className="text-xs text-muted-foreground bg-muted/10 border rounded-xl p-4 text-center">No tasks in this course.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courseTasks.map((task) => {
              const attCount = task.attachments?.length || 0
              return (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 hover:border-primary/40 hover:shadow-sm text-left transition-all"
                >
                  <HugeiconsIcon icon={Folder01Icon} className="h-9 w-9 text-amber-500 shrink-0 group-hover:scale-105 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate">{task.title}</p>
                    <span className="text-[10px] text-muted-foreground">{attCount} files submitted</span>
                  </div>
                  {attCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* SECTION B: GENERAL MATERIALS */}
      <div className="flex flex-col gap-3">
        <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <HugeiconsIcon icon={BookOpen01Icon} className="h-4 w-4" />
          Lecture Materials (General)
        </h2>
        {courseResources.length === 0 ? (
          <p className="text-xs text-muted-foreground bg-muted/10 border rounded-xl p-4 text-center">No materials available. Add a new material above.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courseResources.map((r) => {
              const isFile = r.type === "FILE"
              const isLink = r.type === "LINK"
              const fileUrl = isFile && r.filePath ? `${API_URL}/uploads/resources/${r.filePath}` : null

              return (
                <div key={r.id} className="group flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${TYPE_COLORS[r.type]}`}>
                      <HugeiconsIcon icon={isFile ? File01Icon : isLink ? Link01Icon : NoteIcon} className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs truncate" title={r.title}>{r.title}</p>
                      {r.description && <p className="text-[10px] text-muted-foreground line-clamp-1">{r.description}</p>}
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-all shrink-0" onClick={() => handleDeleteResource(r.id)}>
                      <HugeiconsIcon icon={Delete02Icon} className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-semibold mt-1">
                    {isFile && fileUrl ? (
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Download ({formatBytes(r.fileSize)})</a>
                    ) : isLink && r.url ? (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[150px]">{r.url}</a>
                    ) : (
                      <span className="text-muted-foreground">Note</span>
                    )}
                    <span className="text-muted-foreground/60">{r.uploadStatus}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <AddResourceDialog
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        course={selectedCourse}
        tasks={courseTasks}
        addType={addType} setAddType={setAddType}
        addTitle={addTitle} setAddTitle={setAddTitle}
        addDesc={addDesc} setAddDesc={setAddDesc}
        addUrl={addUrl} setAddUrl={setAddUrl}
        addTaskId={addTaskId} setAddTaskId={setAddTaskId}
        addFile={addFile} setAddFile={setAddFile}
        dragOver={dragOver} setDragOver={setDragOver}
        fileInputRef={fileInputRef}
        addLoading={addLoading}
        onSubmit={handleAddSubmit}
      />
    </div>
  )
}

// ─── Add Resource Dialog ──────────────────────────────────────────────────────
function AddResourceDialog({
  isOpen, onClose, course, tasks,
  addType, setAddType, addTitle, setAddTitle, addDesc, setAddDesc,
  addUrl, setAddUrl, addTaskId, setAddTaskId, addFile, setAddFile,
  dragOver, setDragOver, fileInputRef, addLoading, onSubmit,
}: any) {
  return (
    <Sheet open={isOpen} onOpenChange={(v: boolean) => { if (!v) onClose() }}>
      <SheetContent side="right" className="w-[480px] sm:w-[480px] gap-0 p-0 overflow-hidden flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <SheetTitle className="text-base">Add Lecture Material</SheetTitle>
          {course && (
            <SheetDescription className="text-xs">
              📁 {course.name} ({course.code})
            </SheetDescription>
          )}
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 px-6 py-5 max-h-[70vh] overflow-y-auto">
          {/* Type selector */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "FILE", label: "File", icon: File01Icon },
              { value: "LINK", label: "Link", icon: Link01Icon },
              { value: "NOTE", label: "Note", icon: NoteIcon },
            ].map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setAddType(value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all ${
                  addType === value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border/60 text-muted-foreground hover:border-primary/40"
                }`}
              >
                <HugeiconsIcon icon={icon} className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>

          <Field>
            <FieldLabel className="text-xs font-semibold">Title *</FieldLabel>
            <Input
              value={addTitle}
              onChange={(e: any) => setAddTitle(e.target.value)}
              placeholder="e.g. Slide Meeting 3"
              className="h-9 text-sm"
              required
            />
          </Field>

          {addType === "FILE" && (
            <Field>
              <FieldLabel className="text-xs font-semibold">Upload File *</FieldLabel>
              <div
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-all
                  ${dragOver ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50 hover:bg-muted/20"}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e: any) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e: any) => {
                  e.preventDefault(); setDragOver(false)
                  if (e.dataTransfer.files[0]) setAddFile(e.dataTransfer.files[0])
                }}
              >
                <HugeiconsIcon icon={Upload01Icon} className={`h-6 w-6 ${dragOver ? "text-primary" : "text-muted-foreground/40"}`} />
                {addFile ? (
                  <p className="text-xs font-semibold text-primary">{addFile.name} ({formatBytes(addFile.size)})</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Drag & drop or click to select file<br /><span className="text-[10px] opacity-60">PDF, Word, Excel, Image, ZIP · Max 10MB</span></p>
                )}
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e: any) => { if (e.target.files?.[0]) setAddFile(e.target.files[0]) }}
                />
              </div>
            </Field>
          )}

          {addType === "LINK" && (
            <Field>
              <FieldLabel className="text-xs font-semibold">URL *</FieldLabel>
              <Input
                value={addUrl}
                onChange={(e: any) => setAddUrl(e.target.value)}
                placeholder="https://..."
                className="h-9 text-sm"
                required
              />
            </Field>
          )}

          <Field>
            <FieldLabel className="text-xs font-semibold">Description (optional)</FieldLabel>
            <Input
              value={addDesc}
              onChange={(e: any) => setAddDesc(e.target.value)}
              placeholder="Brief description..."
              className="h-9 text-sm"
            />
          </Field>

          <Field>
            <FieldLabel className="text-xs font-semibold">Link to Task (optional)</FieldLabel>
            <Select value={addTaskId} onValueChange={setAddTaskId}>
              <SelectTrigger className="w-full h-9">
                <span data-slot="select-value" className="text-sm truncate">
                  {addTaskId === "none" ? "General (Not linked to any task)" : tasks.find((t: any) => t.id === addTaskId)?.title || "Select task..."}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="none">General (Not linked to any task)</SelectItem>
                  {tasks.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="truncate max-w-[300px] block">{t.title}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <div className="flex gap-3 pt-2 border-t border-border/30">
            <Button type="button" variant="outline" className="flex-1 h-9" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-9" disabled={addLoading}>
              {addLoading ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
