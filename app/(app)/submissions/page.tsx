"use client"
import * as React from "react"
import { API_URL } from "@/lib/config"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  File01Icon,
  Attachment01Icon,
  CircleCheckIcon,
  Clock01Icon,
  Delete02Icon,
  Upload01Icon,
  Link01Icon,
  AlertCircleIcon,
  Search01Icon,
  FilterIcon,
  Image01Icon,
} from "@hugeicons/core-free-icons"
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

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  IN_PROGRESS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  DONE: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Belum Mulai",
  IN_PROGRESS: "Dikerjakan",
  DONE: "Selesai",
}

export default function SubmissionsPage() {
  const router = useRouter()
  const [tasks, setTasks] = React.useState<any[]>([])
  const [courses, setCourses] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  // Sheet state
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [activeTask, setActiveTask] = React.useState<any | null>(null)
  const [localAttachments, setLocalAttachments] = React.useState<any[]>([])
  const [uploading, setUploading] = React.useState(false)
  const [dragOver, setDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Filters
  const [search, setSearch] = React.useState("")
  const [filterCourse, setFilterCourse] = React.useState("ALL")
  const [filterHasFile, setFilterHasFile] = React.useState("ALL")

  const fetchAll = React.useCallback(async () => {
    const token = getCookie("token")
    if (!token) { router.push("/login"); return }
    setLoading(true)
    try {
      const [tasksRes, coursesRes] = await Promise.all([
        fetch(`${API_URL}/api/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/courses`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (tasksRes.ok) setTasks(await tasksRes.json())
      if (coursesRes.ok) setCourses(await coursesRes.json())
    } finally {
      setLoading(false)
    }
  }, [router])

  React.useEffect(() => { fetchAll() }, [fetchAll])

  const openSheet = (task: any) => {
    setActiveTask(task)
    setLocalAttachments(task.attachments || [])
    setSheetOpen(true)
  }

  const uploadFiles = async (files: File[]) => {
    if (!activeTask) return
    const token = getCookie("token")
    if (!token) return
    setUploading(true)
    try {
      const formData = new FormData()
      files.forEach((f) => formData.append("files", f))
      const res = await fetch(`${API_URL}/api/tasks/${activeTask.id}/attachments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
      const newAtts = await res.json()  // backend returns array of new attachments
      const appended = [...localAttachments, ...(Array.isArray(newAtts) ? newAtts : [])]
      setLocalAttachments(appended)
      // update in tasks list too
      setTasks((prev) => prev.map((t) => t.id === activeTask.id ? { ...t, attachments: appended } : t))
      toast.add({ type: "success", description: `${files.length} file berhasil diupload` })
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDelete = async (attId: string) => {
    if (!activeTask) return
    const token = getCookie("token")
    try {
      const res = await fetch(`${API_URL}/api/tasks/${activeTask.id}/attachments/${attId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Gagal menghapus")
      const newAtts = localAttachments.filter((a) => a.id !== attId)
      setLocalAttachments(newAtts)
      setTasks((prev) => prev.map((t) => t.id === activeTask.id ? { ...t, attachments: newAtts } : t))
      toast.add({ type: "success", description: "File dihapus" })
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    }
  }

  // Filter logic
  const filtered = tasks.filter((t) => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase())
    const matchCourse = filterCourse === "ALL" || t.courseId === filterCourse
    const matchFile =
      filterHasFile === "ALL" ||
      (filterHasFile === "YES" && t.attachments?.length > 0) ||
      (filterHasFile === "NO" && (!t.attachments || t.attachments.length === 0))
    return matchSearch && matchCourse && matchFile
  })

  const totalWithFile = tasks.filter((t) => t.attachments?.length > 0).length
  const totalWithout = tasks.filter((t) => !t.attachments || t.attachments.length === 0).length

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <HugeiconsIcon icon={Attachment01Icon} className="h-6 w-6 text-primary" />
            Pengumpulan File
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Lihat & kelola bukti pengumpulan tugas per matakuliah
          </p>
        </div>
        {/* Stats */}
        <div className="flex gap-3">
          <div className="flex flex-col items-center px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 min-w-[80px]">
            <span className="text-xl font-bold text-emerald-600">{totalWithFile}</span>
            <span className="text-[10px] text-muted-foreground font-semibold">Ada File</span>
          </div>
          <div className="flex flex-col items-center px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/5 min-w-[80px]">
            <span className="text-xl font-bold text-amber-600">{totalWithout}</span>
            <span className="text-[10px] text-muted-foreground font-semibold">Belum Ada</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari tugas..."
            className="pl-9 h-9 text-sm"
          />
        </div>
        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm text-foreground"
        >
          <option value="ALL">Semua Matakuliah</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="flex gap-1.5">
          {[
            { v: "ALL", label: "Semua" },
            { v: "YES", label: "✅ Ada File" },
            { v: "NO", label: "⚠️ Belum Upload" },
          ].map(({ v, label }) => (
            <button
              key={v}
              onClick={() => setFilterHasFile(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filterHasFile === v
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border/60 text-muted-foreground hover:border-primary/50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <HugeiconsIcon icon={Attachment01Icon} className="h-16 w-16 opacity-20" />
          <p className="text-sm font-medium">Tidak ada tugas ditemukan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const course = courses.find((c) => c.id === task.courseId)
            const attCount = task.attachments?.length || 0
            const hasFile = attCount > 0
            const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "DONE"

            return (
              <div
                key={task.id}
                className={`group flex items-center gap-4 rounded-xl border p-4 transition-all cursor-pointer hover:shadow-sm ${
                  hasFile
                    ? "border-border/50 hover:border-primary/30 bg-card"
                    : "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40"
                }`}
                onClick={() => openSheet(task)}
              >
                {/* Status indicator */}
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  hasFile ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-amber-500/10 border border-amber-500/20"
                }`}>
                  <HugeiconsIcon
                    icon={hasFile ? CircleCheckIcon : AlertCircleIcon}
                    className={`h-5 w-5 ${hasFile ? "text-emerald-500" : "text-amber-500"}`}
                  />
                </div>

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{task.title}</p>
                    {isOverdue && (
                      <span className="text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                        LEWAT DEADLINE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {course && (
                      <span className="text-[11px] text-muted-foreground font-medium">📚 {course.name}</span>
                    )}
                    {task.deadline && (
                      <span className={`text-[11px] font-medium ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
                        🗓 {formatDate(task.deadline)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Attachments preview */}
                <div className="flex items-center gap-2 shrink-0">
                  {hasFile ? (
                    <div className="flex items-center gap-1.5">
                      {/* Preview first 3 files */}
                      <div className="flex -space-x-2">
                        {task.attachments.slice(0, 3).map((att: any) => {
                          const isImage = att.fileType?.startsWith("image/")
                          const fileUrl = `${API_URL}/uploads/tasks/${att.filePath}`
                          return isImage ? (
                            <img
                              key={att.id}
                              src={fileUrl}
                              alt={att.name}
                              className="h-8 w-8 rounded-lg object-cover border-2 border-background"
                            />
                          ) : (
                            <div key={att.id} className="h-8 w-8 rounded-lg bg-primary/10 border-2 border-background flex items-center justify-center">
                              <HugeiconsIcon icon={File01Icon} className="h-4 w-4 text-primary" />
                            </div>
                          )
                        })}
                      </div>
                      <span className="text-xs font-bold text-emerald-600">
                        {attCount} file
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-amber-600 font-semibold">Belum ada file</span>
                  )}

                  <Badge className={`text-[10px] font-bold border ${STATUS_STYLES[task.status]}`}>
                    {STATUS_LABEL[task.status]}
                  </Badge>

                  <div className="h-8 w-8 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <HugeiconsIcon icon={Upload01Icon} className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Attachment Sheet */}
      {activeTask && (
        <Sheet open={sheetOpen} onOpenChange={(v: boolean) => { if (!v) setSheetOpen(false) }}>
          <SheetContent side="right" className="w-[520px] sm:w-[520px] gap-0 p-0 flex flex-col overflow-hidden">
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40 shrink-0">
              <SheetTitle className="text-base flex items-center gap-2">
                <HugeiconsIcon icon={Attachment01Icon} className="h-4 w-4 text-primary" />
                File Pengumpulan
              </SheetTitle>
              <SheetDescription className="text-xs line-clamp-2">
                {activeTask.title}
                {courses.find((c) => c.id === activeTask.courseId) && (
                  <span className="text-muted-foreground/60"> · {courses.find((c) => c.id === activeTask.courseId)?.name}</span>
                )}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto flex flex-col gap-0">
              {/* Upload zone */}
              <div className="px-6 py-4 border-b border-border/30">
                <div
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all select-none
                    ${dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/50 hover:border-primary/50 hover:bg-muted/20"}
                    ${uploading ? "opacity-60 pointer-events-none" : ""}
                  `}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault(); setDragOver(false)
                    if (e.dataTransfer.files.length > 0) uploadFiles(Array.from(e.dataTransfer.files))
                  }}
                >
                  <HugeiconsIcon icon={Upload01Icon} className={`h-8 w-8 transition-colors ${dragOver ? "text-primary" : "text-muted-foreground/40"}`} />
                  <div>
                    <p className="text-sm font-semibold">{uploading ? "Mengupload…" : "Upload Bukti Pengumpulan"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Drag & drop atau klik · PDF, Word, Gambar, ZIP · Maks 10MB</p>
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.length) uploadFiles(Array.from(e.target.files)) }}
                    accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,text/plain"
                  />
                </div>
              </div>

              {/* File list */}
              <div className="px-6 py-4">
                {localAttachments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                    <HugeiconsIcon icon={File01Icon} className="h-10 w-10 opacity-20" />
                    <p className="text-xs text-center">Belum ada file yang dikumpulkan.<br />Upload file di atas sebagai bukti pengumpulan.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      {localAttachments.length} file dikumpulkan
                    </p>
                    {localAttachments.map((att: any) => {
                      const isImage = att.fileType?.startsWith("image/")
                      const fileUrl = `${API_URL}/uploads/tasks/${att.filePath}`
                      return (
                        <div key={att.id} className="group flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-3 hover:bg-muted/20 transition-all">
                          {isImage ? (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                              <img src={fileUrl} alt={att.name} className="h-10 w-10 rounded-lg object-cover border border-border/70 hover:scale-105 transition-transform" />
                            </a>
                          ) : (
                            <div className="h-10 w-10 rounded-lg border border-border/70 bg-primary/5 flex items-center justify-center shrink-0">
                              <HugeiconsIcon icon={File01Icon} className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                              className="font-semibold text-sm hover:text-primary transition-colors truncate block" title={att.name}>
                              {att.name}
                            </a>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">{formatBytes(att.fileSize)}</span>
                              <span className="text-[10px] text-muted-foreground">·</span>
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                                <HugeiconsIcon icon={Link01Icon} className="h-3 w-3" />
                                Buka
                              </a>
                            </div>
                          </div>
                          <Button
                            variant="ghost" size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition-all shrink-0"
                            onClick={() => handleDelete(att.id)}
                          >
                            <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-border/30 bg-muted/10 flex items-center justify-between shrink-0">
              <p className="text-[11px] text-muted-foreground">File disimpan aman di server</p>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setSheetOpen(false)}>Tutup</Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
