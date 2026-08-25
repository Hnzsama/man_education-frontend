"use client"
import { API_URL } from "@/lib/config"
import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
} from "@hugeicons/core-free-icons"
import { toast } from "@/components/ui/toast"
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

export default function ResourcesPage() {
  const router = useRouter()

  // Data
  const [courses, setCourses] = React.useState<any[]>([])
  const [tasks, setTasks] = React.useState<any[]>([])
  const [resources, setResources] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  // View state
  const [selectedCourse, setSelectedCourse] = React.useState<any | null>(null)
  const [filterType, setFilterType] = React.useState<string>("ALL")

  // Add dialog
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

  const fetchAll = React.useCallback(async () => {
    const token = getCookie("token")
    if (!token) { router.push("/login"); return }
    setLoading(true)
    try {
      const [coursesRes, tasksRes, resourcesRes] = await Promise.all([
        fetch(`${API_URL}/api/courses`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/resources`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (coursesRes.ok) setCourses(await coursesRes.json())
      if (tasksRes.ok) setTasks(await tasksRes.json())
      if (resourcesRes.ok) setResources(await resourcesRes.json())
    } finally {
      setLoading(false)
    }
  }, [router])

  React.useEffect(() => { fetchAll() }, [fetchAll])

  const openAddForCourse = (course: any) => {
    setSelectedCourse(course)
    setAddOpen(true)
    setAddType("FILE")
    setAddTitle("")
    setAddDesc("")
    setAddUrl("")
    setAddTaskId("none")
    setAddFile(null)
  }

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
      toast.add({ type: "success", description: "Resource berhasil disimpan!" })
      setAddOpen(false)
      fetchAll()
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    } finally {
      setAddLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    const token = getCookie("token")
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/api/resources/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Gagal menghapus")
      toast.add({ type: "success", description: "Resource dihapus" })
      fetchAll()
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    }
  }

  const courseResources = selectedCourse
    ? resources.filter((r) => r.courseId === selectedCourse.id && (filterType === "ALL" || r.type === filterType))
    : []

  const courseTasks = selectedCourse
    ? tasks.filter((t) => t.courseId === selectedCourse.id)
    : []

  // ─── Folder view ────────────────────────────────────────────────
  if (!selectedCourse) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Materi Kuliah</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Simpan file, link, dan catatan per matakuliah
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl border bg-muted/20 animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            <HugeiconsIcon icon={Folder01Icon} className="h-16 w-16 opacity-20" />
            <p className="text-sm font-medium">Belum ada matakuliah di semester aktif</p>
            <Button variant="outline" size="sm" onClick={() => router.push("/courses")}>
              Tambah Matakuliah
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {courses.map((course, idx) => {
              const count = resources.filter((r) => r.courseId === course.id).length
              const palette = COURSE_PALETTE[idx % COURSE_PALETTE.length]
              return (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className={`group relative flex flex-col gap-3 rounded-2xl border bg-gradient-to-br ${palette} p-5 text-left transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10 active:scale-95`}
                >
                  <HugeiconsIcon
                    icon={Folder01Icon}
                    className="h-10 w-10 opacity-80 group-hover:scale-110 transition-transform"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight line-clamp-2">{course.name}</p>
                    <p className="text-[11px] font-mono opacity-70 mt-0.5">{course.code}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold opacity-60">
                      {count} item{count !== 1 ? "s" : ""}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); openAddForCourse(course) }}
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                      title="Tambah resource"
                    >
                      <HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Add Dialog — shown from folder grid "+" button */}
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

  // ─── Course folder view ───────────────────────────────────────────
  const palette = COURSE_PALETTE[courses.findIndex((c) => c.id === selectedCourse.id) % COURSE_PALETTE.length]

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => setSelectedCourse(null)}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
        </Button>
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border bg-gradient-to-r ${palette} flex-1`}>
          <HugeiconsIcon icon={Folder01Icon} className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight">{selectedCourse.name}</p>
            <p className="text-[11px] font-mono opacity-70">{selectedCourse.code}</p>
          </div>
          <Button
            size="sm"
            className="ml-auto h-8 text-xs gap-1.5 shrink-0"
            onClick={() => { setAddOpen(true); setAddType("FILE"); setAddTitle(""); setAddDesc(""); setAddUrl(""); setAddTaskId("none"); setAddFile(null) }}
          >
            <HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5" />
            Tambah
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {["ALL", "FILE", "LINK", "NOTE"].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              filterType === t
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {t === "ALL" ? "Semua" : t === "FILE" ? "📄 File" : t === "LINK" ? "🔗 Link" : "📝 Catatan"}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground font-semibold">
          {courseResources.length} item
        </span>
      </div>

      {/* Resource list */}
      {courseResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <HugeiconsIcon icon={File01Icon} className="h-12 w-12 opacity-20" />
          <p className="text-sm">Belum ada materi. Klik "Tambah" untuk upload file atau simpan link.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {courseResources.map((r) => (
            <ResourceCard key={r.id} resource={r} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Add dialog */}
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

// ─── Resource Card ────────────────────────────────────────────────────────────
function ResourceCard({ resource, onDelete }: { resource: any; onDelete: (id: string) => void }) {
  const isFile = resource.type === "FILE"
  const isLink = resource.type === "LINK"
  const fileUrl = isFile && resource.filePath ? `${API_URL}/uploads/resources/${resource.filePath}` : null

  const StatusIcon =
    resource.uploadStatus === "DONE" ? CheckmarkCircle01Icon
    : resource.uploadStatus === "FAILED" ? AlertCircleIcon
    : Clock01Icon

  const statusColor =
    resource.uploadStatus === "DONE" ? "text-green-500"
    : resource.uploadStatus === "FAILED" ? "text-destructive"
    : "text-amber-500"

  return (
    <div className="group flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border ${TYPE_COLORS[resource.type]}`}>
          <HugeiconsIcon
            icon={isFile ? File01Icon : isLink ? Link01Icon : NoteIcon}
            className="h-5 w-5"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight truncate" title={resource.title}>{resource.title}</p>
          {resource.description && (
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{resource.description}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 shrink-0 transition-all"
          onClick={() => onDelete(resource.id)}
        >
          <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap mt-1">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${TYPE_COLORS[resource.type]}`}>
          {resource.type}
        </span>
        {resource.task && (
          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-semibold truncate max-w-[140px]">
            📌 {resource.task.title}
          </span>
        )}
        {isFile && (
          <span className={`ml-auto flex items-center gap-1 text-[10px] font-semibold ${statusColor}`}>
            <HugeiconsIcon icon={StatusIcon} className="h-3 w-3" />
            {resource.uploadStatus === "DONE" ? formatBytes(resource.fileSize) : resource.uploadStatus}
          </span>
        )}
      </div>

      {/* Action */}
      {isFile && fileUrl && resource.uploadStatus === "DONE" && (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
        >
          <HugeiconsIcon icon={File01Icon} className="h-3.5 w-3.5" />
          Buka / Download
        </a>
      )}
      {isLink && resource.url && (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline truncate"
        >
          <HugeiconsIcon icon={Link01Icon} className="h-3.5 w-3.5 shrink-0" />
          {resource.url}
        </a>
      )}
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
          <SheetTitle className="text-base">Tambah Materi</SheetTitle>
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
              { value: "NOTE", label: "Catatan", icon: NoteIcon },
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
            <FieldLabel className="text-xs font-semibold">Judul *</FieldLabel>
            <Input
              value={addTitle}
              onChange={(e: any) => setAddTitle(e.target.value)}
              placeholder="e.g. Slide Pertemuan 3"
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
                  <p className="text-xs text-muted-foreground">Drag & drop atau klik pilih file<br /><span className="text-[10px] opacity-60">PDF, Word, Excel, Gambar, ZIP · Maks 10MB</span></p>
                )}
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e: any) => { if (e.target.files?.[0]) setAddFile(e.target.files[0]) }}
                  accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,text/plain"
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
            <FieldLabel className="text-xs font-semibold">Deskripsi (opsional)</FieldLabel>
            <Input
              value={addDesc}
              onChange={(e: any) => setAddDesc(e.target.value)}
              placeholder="Keterangan singkat..."
              className="h-9 text-sm"
            />
          </Field>

          <Field>
            <FieldLabel className="text-xs font-semibold">Terkait Tugas (opsional)</FieldLabel>
            <Select value={addTaskId} onValueChange={setAddTaskId}>
              <SelectTrigger className="w-full h-9">
                <span data-slot="select-value" className="text-sm truncate">
                  {addTaskId === "none" ? "Tidak terkait tugas" : tasks.find((t: any) => t.id === addTaskId)?.title || "Pilih tugas..."}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="none">Tidak terkait tugas</SelectItem>
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
              Batal
            </Button>
            <Button type="submit" className="flex-1 h-9" disabled={addLoading}>
              {addLoading ? "Menyimpan…" : "Simpan"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
