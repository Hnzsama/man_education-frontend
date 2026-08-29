"use client"
import { API_URL } from "@/lib/config"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { AlertCircleIcon, CircleCheckIcon, Add01Icon } from "@hugeicons/core-free-icons"
import { toast } from "@/components/ui/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@/components/ui/select"
import { TaskCard } from "./components/task-card"
import { TaskSheet } from "./components/task-sheet"
import { TaskDetailSheet } from "./components/task-detail-sheet"

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
}

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = React.useState<any[]>([])
  const [currentUser, setCurrentUser] = React.useState<any | null>(null)
  const [courses, setCourses] = React.useState<any[]>([])
  const [semesters, setSemesters] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  // Filters state
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")
  const [priorityFilter, setPriorityFilter] = React.useState<string>("ALL")
  const [semesterFilter, setSemesterFilter] = React.useState<string>("ALL")
  const [courseFilter, setCourseFilter] = React.useState<string>("ALL")

  // Form states
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

  // Sheet State
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null)

  // Detail Sheet State
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [selectedTask, setSelectedTask] = React.useState<any | null>(null)

  // Confirmation Modal State
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [idToDelete, setIdToDelete] = React.useState<string | null>(null)

  // Fetch all tasks and courses
  const fetchData = React.useCallback(async () => {
    const token = getCookie("token")
    if (!token) {
      router.push("/login")
      return
    }

    try {
      // Fetch user details to verify WhatsApp connection
      const meRes = await fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (meRes.ok) {
        const userData = await meRes.json()
        setCurrentUser(userData)
      }

      // 1. Fetch semesters first to find all courses
      const semRes = await fetch(`${API_URL}/api/semesters`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!semRes.ok) throw new Error("Failed to load semesters")
      const semData = await semRes.json()
      setSemesters(semData)
      
      let allCourses: any[] = []
      await Promise.all(
        semData.map(async (sem: any) => {
          const courseRes = await fetch(`${API_URL}/api/semesters/${sem.id}/courses`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (courseRes.ok) {
            const courseData = await courseRes.json()
            allCourses = [...allCourses, ...courseData]
          }
        })
      )
      setCourses(allCourses)

      // 2. Fetch Tasks
      const tasksRes = await fetch(`${API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!tasksRes.ok) throw new Error("Failed to load tasks")
      const tasksData = await tasksRes.json()
      setTasks(tasksData)

      setLoading(false)
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to load academic tasks" })
      setLoading(false)
    }
  }, [router])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    const token = getCookie("token")
    if (!token) return

    try {
      const url = editingTaskId
        ? `${API_URL}/api/tasks/${editingTaskId}`
        : `${API_URL}/api/tasks`
      const method = editingTaskId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
          submissionLink: submissionLink || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to save task")
      }

      const savedTask = await res.json()
      const taskId = editingTaskId || savedTask.id

      // Upload files if selected
      if (selectedFiles.length > 0 && taskId) {
        const formData = new FormData()
        selectedFiles.forEach((file) => {
          formData.append("files", file)
        })

        const uploadRes = await fetch(`${API_URL}/api/tasks/${taskId}/attachments`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json()
          throw new Error(uploadErr.message || "Failed to upload attachments")
        }
      }

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
      setSelectedFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ""
      setEditingTaskId(null)
      setSheetOpen(false)
      toast.add({ 
        type: "success", 
        description: editingTaskId ? "Task updated successfully" : "Task added successfully" 
      })
      fetchData()
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to save task" })
    } finally {
      setFormLoading(false)
    }
  }

  const handleAddClick = () => {
    setEditingTaskId(null)
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
    if (fileInputRef.current) fileInputRef.current.value = ""
    setSheetOpen(true)
  }

  const toLocalDateTimeString = (dateStr: string) => {
    if (!dateStr) return ""
    const localDate = new Date(dateStr)
    const offset = localDate.getTimezoneOffset()
    const adjustedDate = new Date(localDate.getTime() - (offset * 60 * 1000))
    return adjustedDate.toISOString().slice(0, 16)
  }

  const handleEditClick = (task: any) => {
    setEditingTaskId(task.id)
    setTitle(task.title)
    setDescription(task.description || "")
    setCourseId(task.courseId || "none")
    setDeadline(toLocalDateTimeString(task.deadline))
    setStatus(task.status)
    setPriority(task.priority)
    setIsGroupTask(task.isGroupTask || false)
    setMyPart(task.myPart || "")
    setWeightPercentage(task.weightPercentage?.toString() || "")
    setSubmissionMethod(task.submissionMethod || "OFFLINE")
    setSubmissionLink(task.submissionLink || "")
    setExistingAttachments(task.attachments || [])
    setSelectedFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ""
    setSheetOpen(true)
  }

  const handleQuickComplete = async (task: any) => {
    const token = getCookie("token")
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "DONE",
        }),
      })

      if (!res.ok) throw new Error("Failed to complete task")
      toast.add({ type: "success", description: "Task marked as completed" })
      fetchData()
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to update task" })
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!editingTaskId) return
    const token = getCookie("token")
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/tasks/${editingTaskId}/attachments/${attachmentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to delete attachment")
      }

      setExistingAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
      toast.add({ type: "success", description: "Attachment deleted" })
      fetchData()
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to delete attachment" })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!idToDelete) return
    const token = getCookie("token")
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/tasks/${idToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Failed to delete task")
      toast.add({ type: "success", description: "Task deleted successfully" })
      fetchData()
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to delete task" })
    } finally {
      setConfirmOpen(false)
      setIdToDelete(null)
    }
  }

  const handleDeleteClick = (id: string) => {
    setIdToDelete(id)
    setConfirmOpen(true)
  }

  const handleCardClick = (task: any) => {
    setSelectedTask(task)
    setDetailOpen(true)
  }

  const filteredCourses = React.useMemo(() => {
    if (semesterFilter === "ALL") return courses
    return courses.filter((c) => c.semesterId === semesterFilter)
  }, [courses, semesterFilter])

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = statusFilter === "ALL" || task.status === statusFilter
    const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter
    
    let matchesSemester = true
    let matchesCourse = true

    if (courseFilter !== "ALL") {
      matchesCourse = task.courseId === courseFilter
    }

    if (semesterFilter !== "ALL") {
      if (task.courseId) {
        const courseDetails = courses.find((c) => c.id === task.courseId)
        matchesSemester = courseDetails?.semesterId === semesterFilter
      } else {
        matchesSemester = false
      }
    }

    return matchesStatus && matchesPriority && matchesSemester && matchesCourse
  })

  // Format date helper
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="text-muted-foreground text-sm">Loading tasks...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        {/* Header Title and Actions */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">Tasks & Assignments</h1>
            <p className="text-sm text-muted-foreground">
              Keep track of college projects, assignments, and study goals.
            </p>
          </div>
          <Button 
            onClick={handleAddClick} 
            disabled={(currentUser?.role === "CLASS" && !currentUser?.whatsappGroupId) || !semesters.some((s: any) => s.isActive)} 
            className="w-fit"
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2.5} className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>

        {/* Active Semester Check Alert */}
        {!semesters.some((s: any) => s.isActive) && (
          <Card className="border-warning/60 bg-warning/5 border shadow-sm font-sans mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-warning text-sm font-bold flex items-center gap-2">
                <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-warning" />
                Active Semester Required
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                You must create and activate at least one semester before you can manage tasks. Go to the <a href="/semesters" className="text-primary underline font-semibold">Semesters</a> page to manage your semesters.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* WhatsApp Connection Alert for Class role */}
        {currentUser?.role === "CLASS" && !currentUser?.whatsappGroupId && (
          <Card className="border-warning/60 bg-warning/5 border shadow-sm font-sans mb-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-warning text-sm font-bold flex items-center gap-2">
                <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-warning" />
                WhatsApp Group Connection Required
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                To start managing semesters, schedules, and tasks for your class, you must connect this account to a WhatsApp group. Go to the <a href="/dashboard" className="text-primary underline font-semibold">Dashboard</a> to link your WhatsApp group.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Filters Bar */}
        <div className="flex flex-col gap-4 border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Status:</span>
              <div className="flex gap-1">
                {["ALL", "PENDING", "IN_PROGRESS", "DONE"].map((s) => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter(s)}
                    className="text-xs h-7 py-1 px-2.5 rounded-full"
                  >
                    {s.replace("_", " ")}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Priority:</span>
              <div className="flex gap-1">
                {["ALL", "LOW", "MEDIUM", "HIGH"].map((p) => (
                  <Button
                    key={p}
                    variant={priorityFilter === p ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => setPriorityFilter(p)}
                    className={`text-xs h-7 py-1 px-2.5 rounded-full ${
                      priorityFilter === p ? "bg-muted/80" : ""
                    }`}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {/* Semester Filter */}
            <div className="flex items-center gap-2 min-w-[200px]">
              <span className="text-xs font-semibold text-muted-foreground uppercase shrink-0">Semester:</span>
              <Select
                value={semesterFilter}
                onValueChange={(value) => {
                  setSemesterFilter(value || "ALL")
                  setCourseFilter("ALL")
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <span data-slot="select-value">
                    {semesterFilter === "ALL" 
                      ? "All Semesters" 
                      : semesters.find((s) => s.id === semesterFilter)?.name || "All Semesters"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ALL">All Semesters</SelectItem>
                    {semesters.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.isActive ? "(Active)" : ""}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Course Filter */}
            <div className="flex items-center gap-2 min-w-[200px]">
              <span className="text-xs font-semibold text-muted-foreground uppercase shrink-0">Course:</span>
              <Select
                value={courseFilter}
                onValueChange={(value) => setCourseFilter(value || "ALL")}
              >
                <SelectTrigger className="h-9 text-xs">
                  <span data-slot="select-value">
                    {courseFilter === "ALL" 
                      ? "All Courses" 
                      : courses.find((c) => c.id === courseFilter)?.name || "All Courses"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="ALL">All Courses</SelectItem>
                    {filteredCourses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <Card className="text-center py-20 border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <HugeiconsIcon icon={CircleCheckIcon} className="h-6 w-6" />
              </div>
              <span className="text-base font-semibold text-muted-foreground">No Tasks Found</span>
              <span className="text-sm text-muted-foreground max-w-xs">
                Enjoy your free time, or create a new task to organize your academic flow.
              </span>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 font-sans">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                courses={courses}
                formatDate={formatDate}
                handleQuickComplete={handleQuickComplete}
                handleEditClick={handleEditClick}
                handleDeleteClick={handleDeleteClick}
                onCardClick={handleCardClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Task Detail Sheet */}
      <TaskDetailSheet
        task={selectedTask}
        courses={courses}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        formatDate={formatDate}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        onQuickComplete={handleQuickComplete}
      />

      {/* Side Sheet Form for Add/Edit */}
      <TaskSheet
        isOpen={sheetOpen}
        onClose={setSheetOpen}
        editingTaskId={editingTaskId}
        courses={courses}
        onSaveSuccess={fetchData}
      />

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
      />
    </div>
  )
}
