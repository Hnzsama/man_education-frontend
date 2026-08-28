"use client"
import * as React from "react"
import { API_URL } from "@/lib/config"
import { useRouter, useParams } from "next/navigation"
import { toast } from "@/components/ui/toast"
import { CourseFolderDetails } from "../_components/CourseFolderDetails"

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
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

export default function CourseFilesPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string

  const [course, setCourse] = React.useState<any | null>(null)
  const [courses, setCourses] = React.useState<any[]>([])
  const [tasks, setTasks] = React.useState<any[]>([])
  const [resources, setResources] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

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

  const fetchAll = React.useCallback(async () => {
    const token = getCookie("token")
    if (!token) { router.push("/login"); return }
    setLoading(true)
    try {
      const [courseRes, tasksRes, resourcesRes, allCoursesRes] = await Promise.all([
        fetch(`${API_URL}/api/courses/${courseId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/resources`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/courses`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (courseRes.ok) setCourse(await courseRes.json())
      if (tasksRes.ok) setTasks(await tasksRes.json())
      if (resourcesRes.ok) setResources(await resourcesRes.json())
      if (allCoursesRes.ok) setCourses(await allCoursesRes.json())
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to load data" })
    } finally {
      setLoading(false)
    }
  }, [courseId, router])

  React.useEffect(() => { fetchAll() }, [fetchAll])

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = getCookie("token")
    if (!token || !course) return
    setAddLoading(true)
    try {
      const formData = new FormData()
      formData.append("courseId", course.id)
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

  const courseTasks = tasks.filter((t) => t.courseId === courseId)
  const courseResources = resources.filter((r) => r.courseId === courseId && !r.taskId)

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="h-12 rounded-xl bg-muted/20 animate-pulse w-2/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border bg-muted/20 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <p className="text-sm text-muted-foreground">Course not found.</p>
      </div>
    )
  }

  return (
    <CourseFolderDetails
      selectedCourse={course}
      courses={courses}
      courseTasks={courseTasks}
      courseResources={courseResources}
      coursePalette={COURSE_PALETTE}
      typeColors={TYPE_COLORS}
      apiUrl={API_URL}
      onBack={() => router.push("/files")}
      onSelectTask={(task) => router.push(`/files/${courseId}/${task.id}`)}
      onDeleteResource={handleDeleteResource}
      addOpen={addOpen}
      setAddOpen={setAddOpen}
      addType={addType}
      setAddType={setAddType}
      addTitle={addTitle}
      setAddTitle={setAddTitle}
      addDesc={addDesc}
      setAddDesc={setAddDesc}
      addUrl={addUrl}
      setAddUrl={setAddUrl}
      addTaskId={addTaskId}
      setAddTaskId={setAddTaskId}
      addFile={addFile}
      setAddFile={setAddFile}
      dragOver={dragOver}
      setDragOver={setDragOver}
      fileInputRef={fileInputRef}
      addLoading={addLoading}
      onAddSubmit={handleAddSubmit}
    />
  )
}
