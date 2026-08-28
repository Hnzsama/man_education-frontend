"use client"
import * as React from "react"
import { API_URL } from "@/lib/config"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/toast"
import { CourseFolderGrid } from "./_components/CourseFolderGrid"

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
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

  const fetchAll = React.useCallback(async () => {
    const token = getCookie("token")
    if (!token) { router.push("/login"); return }
    setLoading(true)
    try {
      const semestersRes = await fetch(`${API_URL}/api/semesters`, { headers: { Authorization: `Bearer ${token}` } })
      if (!semestersRes.ok) throw new Error("Failed to load semesters")
      const semesters = await semestersRes.json()
      const activeSem = semesters.find((s: any) => s.isActive) || semesters[0]

      if (activeSem) {
        const [coursesRes, tasksRes, resourcesRes] = await Promise.all([
          fetch(`${API_URL}/api/semesters/${activeSem.id}/courses`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/tasks`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/resources`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (coursesRes.ok) setCourses(await coursesRes.json())
        if (tasksRes.ok) setTasks(await tasksRes.json())
        if (resourcesRes.ok) setResources(await resourcesRes.json())
      } else {
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

  return (
    <CourseFolderGrid
      loading={loading}
      courses={courses}
      tasks={tasks}
      resources={resources}
      coursePalette={COURSE_PALETTE}
      onSelectCourse={(course) => router.push(`/files/${course.id}`)}
    />
  )
}
