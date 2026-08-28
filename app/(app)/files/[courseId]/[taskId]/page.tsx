"use client"
import * as React from "react"
import { API_URL } from "@/lib/config"
import { useRouter, useParams } from "next/navigation"
import { toast } from "@/components/ui/toast"
import { TaskFolderDetails } from "../../_components/TaskFolderDetails"

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
}

export default function TaskFilesPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const taskId = params.taskId as string

  const [course, setCourse] = React.useState<any | null>(null)
  const [task, setTask] = React.useState<any | null>(null)
  const [taskSubmission, setTaskSubmission] = React.useState<any | null>(null)
  const [taskResources, setTaskResources] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const [submissionLinkInput, setSubmissionLinkInput] = React.useState("")
  const [savingLink, setSavingLink] = React.useState(false)
  const [subUploading, setSubUploading] = React.useState(false)
  const [attUploading, setAttUploading] = React.useState(false)

  const subFileInputRef = React.useRef<HTMLInputElement | null>(null)
  const attFileInputRef = React.useRef<HTMLInputElement | null>(null)

  const fetchAll = React.useCallback(async () => {
    const token = getCookie("token")
    if (!token) { router.push("/login"); return }
    setLoading(true)
    try {
      const [courseRes, taskRes, submissionRes, resourcesRes] = await Promise.all([
        fetch(`${API_URL}/api/courses/${courseId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/tasks/${taskId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/tasks/${taskId}/submission`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/resources?taskId=${taskId}`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (courseRes.ok) setCourse(await courseRes.json())
      if (taskRes.ok) setTask(await taskRes.json())
      if (submissionRes.ok) {
        const text = await submissionRes.text()
        const subData = text ? JSON.parse(text) : null
        setTaskSubmission(subData)
        setSubmissionLinkInput(subData?.submissionLink || "")
      }
      if (resourcesRes.ok) setTaskResources(await resourcesRes.json())
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to load data" })
    } finally {
      setLoading(false)
    }
  }, [courseId, taskId, router])

  React.useEffect(() => { fetchAll() }, [fetchAll])

  const uploadSubFiles = async (files: File[]) => {
    const token = getCookie("token")
    if (!token) return
    setSubUploading(true)
    try {
      const formData = new FormData()
      files.forEach((f) => formData.append("files", f))
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/submission`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
      const newSub = await res.json()
      setTaskSubmission(newSub)
      toast.add({ type: "success", description: `${files.length} files uploaded successfully` })
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    } finally {
      setSubUploading(false)
    }
  }

  const handleDeleteSub = async (fileId: string) => {
    const token = getCookie("token")
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/submission/files/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to delete")
      setTaskSubmission((prev: any) => {
        if (!prev) return null
        return { ...prev, files: (prev.files || []).filter((f: any) => f.id !== fileId) }
      })
      toast.add({ type: "success", description: "File deleted successfully" })
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    }
  }

  const uploadAttFiles = async (files: File[]) => {
    const token = getCookie("token")
    if (!token) return
    setAttUploading(true)
    try {
      const formData = new FormData()
      files.forEach((f) => formData.append("files", f))
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/attachments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
      const newAttachments = await res.json()
      setTask((prev: any) => {
        if (!prev) return null
        return { ...prev, attachments: [...(prev.attachments || []), ...newAttachments] }
      })
      toast.add({ type: "success", description: `${files.length} materials uploaded successfully` })
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    } finally {
      setAttUploading(false)
    }
  }

  const handleDeleteAtt = async (attId: string) => {
    const token = getCookie("token")
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/attachments/${attId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to delete")
      setTask((prev: any) => {
        if (!prev) return null
        return { ...prev, attachments: (prev.attachments || []).filter((f: any) => f.id !== attId) }
      })
      toast.add({ type: "success", description: "Material deleted successfully" })
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    }
  }

  const handleSaveSubmissionLink = async () => {
    const token = getCookie("token")
    if (!token) return
    setSavingLink(true)
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/submission`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ submissionLink: submissionLinkInput }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.message) }
      const newSub = await res.json()
      setTaskSubmission(newSub)
      toast.add({ type: "success", description: "Submission link saved successfully" })
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    } finally {
      setSavingLink(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="h-10 w-1/2 rounded-xl bg-muted/20 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-xl border bg-muted/20 animate-pulse" />
          <div className="h-64 rounded-xl border bg-muted/20 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!task || !course) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <p className="text-sm text-muted-foreground">Task not found.</p>
      </div>
    )
  }

  return (
    <TaskFolderDetails
      selectedCourse={course}
      selectedTask={task}
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
      onBack={() => router.push(`/files/${courseId}`)}
      onUploadSubFiles={uploadSubFiles}
      onDeleteSub={handleDeleteSub}
      onSaveSubmissionLink={handleSaveSubmissionLink}
      onUploadAttFiles={uploadAttFiles}
      onDeleteAtt={handleDeleteAtt}
    />
  )
}
