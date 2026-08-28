"use client"
import * as React from "react"
import { API_URL } from "@/lib/config"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/toast"
import { CourseFolderGrid } from "./_components/CourseFolderGrid"
import { CourseFolderDetails } from "./_components/CourseFolderDetails"
import { TaskFolderDetails } from "./_components/TaskFolderDetails"

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
  const [taskSubmission, setTaskSubmission] = React.useState<any | null>(null)
  const [submissionLinkInput, setSubmissionLinkInput] = React.useState("")
  const [savingLink, setSavingLink] = React.useState(false)

  // Task Attachments (Materials)
  const [attUploading, setAttUploading] = React.useState(false)
  const attFileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [dragOverAtt, setDragOverAtt] = React.useState(false)

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

  React.useEffect(() => {
    if (!selectedTask) {
      setTaskSubmission(null)
      setSubmissionLinkInput("")
      return
    }
    
    const fetchSubmission = async () => {
      const token = getCookie("token")
      if (!token) return
      try {
        const res = await fetch(`${API_URL}/api/tasks/${selectedTask.id}/submission`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setTaskSubmission(data)
          setSubmissionLinkInput(data?.submissionLink || "")
        }
      } catch (err) {
        console.error("Failed to load submission:", err)
      }
    }
    fetchSubmission()
  }, [selectedTask])

  // Custom Upload submissions per task (menyimpan ke TaskSubmission)
  const uploadSubFiles = async (files: File[]) => {
    if (!selectedTask) return
    const token = getCookie("token")
    if (!token) return
    setSubUploading(true)
    try {
      const formData = new FormData()
      files.forEach((f) => formData.append("files", f))
      const res = await fetch(`${API_URL}/api/tasks/${selectedTask.id}/submission`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
      const newSubmission = await res.json()
      setTaskSubmission(newSubmission)
      toast.add({ type: "success", description: `${files.length} files uploaded successfully` })
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    } finally {
      setSubUploading(false)
    }
  }

  const handleDeleteSub = async (fileId: string) => {
    if (!selectedTask) return
    const token = getCookie("token")
    try {
      const res = await fetch(`${API_URL}/api/tasks/${selectedTask.id}/submission/files/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to delete")
      setTaskSubmission((prev: any) => {
        if (!prev) return null
        return {
          ...prev,
          files: (prev.files || []).filter((f: any) => f.id !== fileId)
        }
      })
      toast.add({ type: "success", description: "File deleted successfully" })
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    }
  }

  const uploadAttFiles = async (files: File[]) => {
    if (!selectedTask) return
    const token = getCookie("token")
    if (!token) return
    setAttUploading(true)
    try {
      const formData = new FormData()
      files.forEach((f) => formData.append("files", f))
      const res = await fetch(`${API_URL}/api/tasks/${selectedTask.id}/attachments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
      const newAttachments = await res.json()
      
      setSelectedTask((prev: any) => {
        if (!prev) return null
        return {
          ...prev,
          attachments: [...(prev.attachments || []), ...newAttachments]
        }
      })
      setTasks((prevTasks) => prevTasks.map(t => t.id === selectedTask.id ? {
        ...t,
        attachments: [...(t.attachments || []), ...newAttachments]
      } : t))
      toast.add({ type: "success", description: `${files.length} materials uploaded successfully` })
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    } finally {
      setAttUploading(false)
    }
  }

  const handleDeleteAtt = async (attId: string) => {
    if (!selectedTask) return
    const token = getCookie("token")
    try {
      const res = await fetch(`${API_URL}/api/tasks/${selectedTask.id}/attachments/${attId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to delete")
      setSelectedTask((prev: any) => {
        if (!prev) return null
        return {
          ...prev,
          attachments: (prev.attachments || []).filter((f: any) => f.id !== attId)
        }
      })
      setTasks((prevTasks) => prevTasks.map(t => t.id === selectedTask.id ? {
        ...t,
        attachments: (t.attachments || []).filter((f: any) => f.id !== attId)
      } : t))
      toast.add({ type: "success", description: "Material deleted successfully" })
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    }
  }

  const handleSaveSubmissionLink = async () => {
    if (!selectedTask) return
    const token = getCookie("token")
    if (!token) return
    setSavingLink(true)
    try {
      const res = await fetch(`${API_URL}/api/tasks/${selectedTask.id}/submission`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ submissionLink: submissionLinkInput }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
      const newSubmission = await res.json()
      setTaskSubmission(newSubmission)
      toast.add({ type: "success", description: "Submission link saved successfully" })
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    } finally {
      setSavingLink(false)
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


  const taskResources = selectedCourse && selectedTask
    ? resources.filter((r) => r.courseId === selectedCourse.id && r.taskId === selectedTask.id)
    : []

  // Render LEVEL 1: Course Folders Grid
  if (!selectedCourse) {
    return (
      <CourseFolderGrid
        loading={loading}
        courses={courses}
        tasks={tasks}
        resources={resources}
        coursePalette={COURSE_PALETTE}
        onSelectCourse={setSelectedCourse}
      />
    )
  }

  // Render LEVEL 3: Inside a Specific Task Folder (Materi Tugas + File Pengumpulan)
  if (selectedTask) {
    return (
      <TaskFolderDetails
        selectedCourse={selectedCourse}
        selectedTask={selectedTask}
        taskSubmission={taskSubmission}
        submissionLinkInput={submissionLinkInput}
        setSubmissionLinkInput={setSubmissionLinkInput}
        savingLink={savingLink}
        subUploading={subUploading}
        subFileInputRef={subFileInputRef}
        attUploading={attUploading}
        attFileInputRef={attFileInputRef}
        taskResources={taskResources}
        apiUrl={API_URL}
        onBack={() => setSelectedTask(null)}
        onUploadSubFiles={uploadSubFiles}
        onDeleteSub={handleDeleteSub}
        onSaveSubmissionLink={handleSaveSubmissionLink}
        onUploadAttFiles={uploadAttFiles}
        onDeleteAtt={handleDeleteAtt}
      />
    )
  }

  // Render LEVEL 2: Inside Course Folder (Tasks Folders + General Course Materials)
  return (
    <CourseFolderDetails
      selectedCourse={selectedCourse}
      courses={courses}
      courseTasks={courseTasks}
      courseResources={courseResources}
      coursePalette={COURSE_PALETTE}
      typeColors={TYPE_COLORS}
      apiUrl={API_URL}
      onBack={() => setSelectedCourse(null)}
      onSelectTask={setSelectedTask}
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
