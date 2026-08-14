"use client"
import { API_URL } from "@/lib/config"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  Delete02Icon, 
  Add01Icon, 
  PencilEdit01Icon, 
  Book02Icon, 
  Calendar02Icon, 
  CircleCheckIcon, 
  AlertCircleIcon, 
  HourglassIcon 
} from "@hugeicons/core-free-icons"
import { toast } from "@/components/ui/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

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
  const [formLoading, setFormLoading] = React.useState(false)

  // Sheet State
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editingTaskId, setEditingTaskId] = React.useState<string | null>(null)

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
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to save task")
      }

      setTitle("")
      setDescription("")
      setCourseId("none")
      setDeadline("")
      setStatus("PENDING")
      setPriority("MEDIUM")
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
    setSheetOpen(true)
  }

  const handleEditClick = (task: any) => {
    setEditingTaskId(task.id)
    setTitle(task.title)
    setDescription(task.description || "")
    setCourseId(task.courseId || "none")
    setDeadline(new Date(task.deadline).toISOString().slice(0, 16)) // Format to YYYY-MM-DDTHH:MM for datetime-local
    setStatus(task.status)
    setPriority(task.priority)
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
            disabled={currentUser?.role === "CLASS" && !currentUser?.whatsappGroupId} 
            className="w-fit"
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2.5} className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>

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
            {filteredTasks.map((task) => {
              const matchedCourse = courses.find((c) => c.id === task.courseId)
              const isDone = task.status === "DONE"
              const isHigh = task.priority === "HIGH"
              const isProgress = task.status === "IN_PROGRESS"

              return (
                <Card 
                  key={task.id} 
                  className={`relative flex flex-col justify-between overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border ${
                    isDone 
                      ? "border-muted bg-muted/20 opacity-80" 
                      : isHigh 
                      ? "border-destructive/40 bg-destructive/5" 
                      : "border-border/60"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex flex-col gap-1">
                        <CardTitle className={`text-base font-bold ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {task.title}
                        </CardTitle>
                        {matchedCourse && (
                          <span className="text-xs text-primary font-semibold font-mono">
                            {matchedCourse.name} ({matchedCourse.code})
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 items-end shrink-0">
                        <Badge 
                          variant={isDone ? "outline" : isHigh ? "destructive" : isProgress ? "default" : "secondary"}
                          className="font-bold text-[10px]"
                        >
                          {task.status.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 space-y-3">
                    {task.description && (
                      <p className={`text-xs text-muted-foreground leading-relaxed line-clamp-3 ${isDone ? "line-through" : ""}`}>
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} className="h-3.5 w-3.5 text-primary/70" />
                      <span>Due: {formatDate(task.deadline)}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-3 border-t border-border/40 flex justify-between items-center gap-2 bg-muted/10">
                    {!isDone ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-8 px-2 text-primary hover:bg-primary/10 hover:text-primary font-medium"
                        onClick={() => handleQuickComplete(task)}
                      >
                        <HugeiconsIcon icon={CircleCheckIcon} className="h-3.5 w-3.5 mr-1" />
                        Mark Done
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                        <HugeiconsIcon icon={CircleCheckIcon} className="h-3.5 w-3.5 text-green-500" />
                        Completed
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => handleEditClick(task)}
                      >
                        <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteClick(task.id)}
                      >
                        <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Side Sheet Form for Add/Edit */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingTaskId ? "Edit Task" : "Add Task"}
            </SheetTitle>
            <SheetDescription>
              {editingTaskId 
                ? "Update the details for the selected academic task." 
                : "Create a new task with custom course mapping, deadline, and priority."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 py-4">
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
                <Select
                  value={courseId}
                  onValueChange={(value) => setCourseId(value || "none")}
                >
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
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value || "PENDING")}
                  >
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
                  <Select
                    value={priority}
                    onValueChange={(value) => setPriority(value || "MEDIUM")}
                  >
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
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="w-1/2" onClick={() => setSheetOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2" disabled={formLoading}>
                  <HugeiconsIcon icon={editingTaskId ? PencilEdit01Icon : Add01Icon} strokeWidth={2} className="mr-2 h-4 w-4" />
                  {formLoading ? "Saving..." : editingTaskId ? "Save" : "Add"}
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

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
