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
  Calendar02Icon, 
  Clock01Icon, 
  SchoolIcon, 
  Book02Icon,
  AlertCircleIcon
} from "@hugeicons/core-free-icons"
import { toast } from "@/components/ui/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
]

export default function SchedulesPage() {
  const router = useRouter()
  const [semesters, setSemesters] = React.useState<any[]>([])
  const [currentUser, setCurrentUser] = React.useState<any | null>(null)
  const [selectedSemesterId, setSelectedSemesterId] = React.useState("")
  const [courses, setCourses] = React.useState<any[]>([])
  const [showWeekends, setShowWeekends] = React.useState(false)
  
  // Weekly schedules state
  const [schedulesByDay, setSchedulesByDay] = React.useState<{ [key: number]: any[] }>({
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: []
  })
  const [loading, setLoading] = React.useState(true)

  // Form states
  const [selectedCourseId, setSelectedCourseId] = React.useState("")
  const [dayOfWeek, setDayOfWeek] = React.useState("1")
  const [startTime, setStartTime] = React.useState("08:00")
  const [endTime, setEndTime] = React.useState("10:00")
  const [room, setRoom] = React.useState("")
  const [link, setLink] = React.useState("")
  const [formLoading, setFormLoading] = React.useState(false)

  // Sheet State
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editingScheduleId, setEditingScheduleId] = React.useState<string | null>(null)
  // Store the course ID of the editing schedule to construct the PUT/DELETE URLs
  const [editingCourseId, setEditingCourseId] = React.useState<string | null>(null)

  // Confirmation Modal State
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [idToDelete, setIdToDelete] = React.useState<string | null>(null)
  const [courseIdToDelete, setCourseIdToDelete] = React.useState<string | null>(null)

  // Filter visible days
  const visibleDays = React.useMemo(() => {
    if (showWeekends) return DAYS_OF_WEEK
    return DAYS_OF_WEEK.filter((d) => d.value <= 5)
  }, [showWeekends])

  // Fetch Semesters on Mount
  React.useEffect(() => {
    const token = getCookie("token")
    if (!token) {
      router.push("/login")
      return
    }

    // Fetch user details to verify WhatsApp connection
    fetch(`${API_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.ok) return res.json()
      })
      .then((userData) => {
        if (userData) setCurrentUser(userData)
      })
      .catch(() => {})

    fetch(`${API_URL}/api/semesters`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load semesters")
        return res.json()
      })
      .then((data) => {
        setSemesters(data)
        const activeSem = data.find((s: any) => s.isActive)
        if (activeSem) {
          setSelectedSemesterId(activeSem.id)
        } else if (data.length > 0) {
          setSelectedSemesterId(data[0].id)
        }
        setLoading(false)
      })
      .catch((err) => {
        toast.add({ type: "error", description: err.message || "Failed to load semesters" })
        setLoading(false)
      })
  }, [router])

  const fetchAllData = React.useCallback(async (semesterId: string) => {
    if (!semesterId) return
    const token = getCookie("token")
    if (!token) return

    try {
      // 1. Fetch all courses under this semester (which includes schedules)
      const coursesRes = await fetch(`${API_URL}/api/semesters/${semesterId}/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!coursesRes.ok) throw new Error("Failed to load courses")
      const coursesData = await coursesRes.json()
      setCourses(coursesData)

      // 2. Map schedules from the fetched course objects
      const tempSchedules: { [key: number]: any[] } = {
        1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: []
      }

      coursesData.forEach((course: any) => {
        if (course.schedules && Array.isArray(course.schedules)) {
          course.schedules.forEach((s: any) => {
            const day = s.dayOfWeek
            if (tempSchedules[day]) {
              tempSchedules[day].push({ ...s, courseName: course.name, courseCode: course.code })
            }
          })
        }
      })

      // Sort schedules inside each day by start time
      Object.keys(tempSchedules).forEach((dayKey: any) => {
        tempSchedules[dayKey].sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
      })

      setSchedulesByDay(tempSchedules)
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to load schedules data" })
    }
  }, [])

  React.useEffect(() => {
    fetchAllData(selectedSemesterId)
  }, [selectedSemesterId, fetchAllData])

  // AI Generate States
  const [aiSheetOpen, setAiSheetOpen] = React.useState(false)
  const [aiImage, setAiImage] = React.useState("")
  const [aiCommand, setAiCommand] = React.useState("")
  const [aiLoading, setAiLoading] = React.useState(false)

  const convertToWebP = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          let width = img.width
          let height = img.height
          
          const MAX_SIZE = 1600
          if (width > MAX_SIZE || height > MAX_SIZE) {
            if (width > height) {
              height = Math.round((height * MAX_SIZE) / width)
              width = MAX_SIZE
            } else {
              width = Math.round((width * MAX_SIZE) / height)
              height = MAX_SIZE
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)
            const webpDataUrl = canvas.toDataURL("image/webp", 0.8)
            resolve(webpDataUrl)
          } else {
            resolve(e.target?.result as string)
          }
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const handleAIImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const webpDataUrl = await convertToWebP(file)
        setAiImage(webpDataUrl)
      } catch (err) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setAiImage(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleAIGenerate = async () => {
    if (!aiImage && !aiCommand) return
    setAiLoading(true)

    const token = getCookie("token")
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/semesters/${selectedSemesterId}/schedules/ai-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: aiImage,
          command: aiCommand,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to generate schedules")
      }

      const generated = await res.json()
      toast.add({
        type: "success",
        description: `Successfully generated ${generated.length} class schedules!`,
      })
      
      setAiImage("")
      setAiCommand("")
      setAiSheetOpen(false)
      
      fetchAllData(selectedSemesterId)
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to generate schedules" })
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetCourseId = editingScheduleId ? editingCourseId : selectedCourseId
    if (!targetCourseId) {
      toast.add({ type: "error", description: "Please select a course first" })
      return
    }

    setFormLoading(true)
    const token = getCookie("token")
    if (!token) return

    try {
      const url = editingScheduleId
        ? `${API_URL}/api/courses/${targetCourseId}/schedules/${editingScheduleId}`
        : `${API_URL}/api/courses/${targetCourseId}/schedules`
      const method = editingScheduleId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dayOfWeek: parseInt(dayOfWeek, 10),
          startTime,
          endTime,
          room: room || undefined,
          link: link || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to save schedule")
      }

      setSelectedCourseId("")
      setDayOfWeek("1")
      setStartTime("08:00")
      setEndTime("10:00")
      setRoom("")
      setLink("")
      setEditingScheduleId(null)
      setEditingCourseId(null)
      setSheetOpen(false)
      toast.add({ 
        type: "success", 
        description: editingScheduleId ? "Schedule updated successfully" : "Schedule added successfully" 
      })
      fetchAllData(selectedSemesterId)
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to save schedule" })
    } finally {
      setFormLoading(false)
    }
  }

  const handleAddClick = () => {
    if (courses.length === 0) {
      toast.add({ type: "warning", description: "Please add a course first before scheduling" })
      return
    }
    setEditingScheduleId(null)
    setEditingCourseId(null)
    setSelectedCourseId(courses[0].id)
    setDayOfWeek("1")
    setStartTime("08:00")
    setEndTime("10:00")
    setRoom("")
    setLink("")
    setSheetOpen(true)
  }

  const handleEditClick = (sched: any) => {
    setEditingScheduleId(sched.id)
    setEditingCourseId(sched.courseId)
    setSelectedCourseId(sched.courseId)
    setDayOfWeek(sched.dayOfWeek.toString())
    setStartTime(sched.startTime)
    setEndTime(sched.endTime)
    setRoom(sched.room || "")
    setLink(sched.link || "")
    setSheetOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!idToDelete || !courseIdToDelete) return
    const token = getCookie("token")
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/courses/${courseIdToDelete}/schedules/${idToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Failed to delete schedule")
      toast.add({ type: "success", description: "Schedule deleted successfully" })
      fetchAllData(selectedSemesterId)
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to delete schedule" })
    } finally {
      setConfirmOpen(false)
      setIdToDelete(null)
      setCourseIdToDelete(null)
    }
  }

  const handleDeleteClick = (id: string, courseId: string) => {
    setIdToDelete(id)
    setCourseIdToDelete(courseId)
    setConfirmOpen(true)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="text-muted-foreground text-sm">Loading academic data...</span>
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
            <h1 className="text-2xl font-bold tracking-tight">Schedules</h1>
            <p className="text-sm text-muted-foreground">
              Visual weekly view of your class schedules.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setAiSheetOpen(true)}
              disabled={!selectedSemesterId || courses.length === 0} 
              variant="outline"
              className="w-fit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mr-2 h-4 w-4 text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.187.904zM18.007 7.007l-.318-2.007-2.007-.318.318-2.007 2.007.318.318 2.007-2.007.318z" />
              </svg>
              AI Generate
            </Button>
            <Button 
              onClick={handleAddClick} 
              disabled={!selectedSemesterId || courses.length === 0 || (currentUser?.role === "CLASS" && !currentUser?.whatsappGroupId)} 
              className="w-fit"
            >
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2.5} className="mr-2 h-4 w-4" />
              Add Schedule
            </Button>
          </div>
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

        {/* Semester Select Dropdown & Weekends Toggle */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xs w-full space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              Select Semester
            </span>
            {semesters.length > 0 ? (
              <Select
                value={selectedSemesterId}
                onValueChange={(value) => setSelectedSemesterId(value || "")}
              >
                <SelectTrigger className="w-full">
                  <span data-slot="select-value">
                    {semesters.find((s) => s.id === selectedSemesterId)?.name || "Select a semester"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {semesters.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.isActive ? "(Active)" : ""}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm text-muted-foreground border rounded-md p-2.5 bg-muted/50 font-sans">
                No semesters available. Create a semester first.
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-full border border-border/40 shrink-0">
            <Button
              variant={!showWeekends ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowWeekends(false)}
              className="text-xs h-7 px-3 rounded-full"
            >
              Weekdays
            </Button>
            <Button
              variant={showWeekends ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowWeekends(true)}
              className="text-xs h-7 px-3 rounded-full"
            >
              Weekends
            </Button>
          </div>
        </div>

        {/* Weekly Schedule - Vertical List */}
        {selectedSemesterId && (
          <div className="space-y-6 font-sans">
            {(() => {
              const hasAnyClasses = visibleDays.some((day) => (schedulesByDay[day.value] || []).length > 0)

              if (!hasAnyClasses) {
                return (
                  <Card className="text-center py-20 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center gap-3">
                      <div className="rounded-full bg-primary/10 p-3 text-primary">
                        <HugeiconsIcon icon={SchoolIcon} className="h-6 w-6" />
                      </div>
                      <span className="text-base font-semibold text-muted-foreground">No Classes Scheduled</span>
                      <span className="text-sm text-muted-foreground max-w-xs">
                        Use the "Add Schedule" button above to add classes to your timetable.
                      </span>
                    </CardContent>
                  </Card>
                )
              }

              return visibleDays.map((day) => {
                const daySchedules = schedulesByDay[day.value] || []
                if (daySchedules.length === 0) return null

                return (
                  <div key={day.value} className="space-y-3">
                    <div className="flex items-center gap-3 pb-1 border-b border-border/40">
                      <span className="font-bold text-base text-foreground">{day.label}</span>
                      <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
                        {daySchedules.length} Class{daySchedules.length > 1 ? "es" : ""}
                      </Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {daySchedules.map((s: any) => (
                        <div 
                          key={s.id}
                          className="group relative flex flex-col gap-1.5 p-4 rounded-xl bg-linear-to-tr from-primary/5 to-card border-l-4 border-l-primary border-y border-r border-border/50 hover:shadow-md transition-all duration-200"
                        >
                          <span className="font-bold text-sm text-foreground leading-snug line-clamp-2">{s.courseName}</span>
                          <span className="text-[10px] text-primary font-semibold font-mono">{s.courseCode}</span>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
                            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="h-3 w-3 text-primary/70" />
                            <span>{s.startTime} - {s.endTime}</span>
                          </div>
                          {s.room && (
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <HugeiconsIcon icon={SchoolIcon} strokeWidth={2} className="h-3 w-3 text-primary/70" />
                              <span>{s.room.toLowerCase().includes("room") || s.room.toLowerCase().includes("lab") ? s.room : `Room ${s.room}`}</span>
                            </div>
                          )}
                          {s.link && (
                            <a
                              href={s.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 rounded-md px-2 py-0.5 transition-colors w-fit"
                            >
                              🔗 Join Online Class
                            </a>
                          )}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-card/90 rounded-md p-0.5 border">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => handleEditClick(s)}
                            >
                              <HugeiconsIcon icon={PencilEdit01Icon} className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeleteClick(s.id, s.courseId)}
                            >
                              <HugeiconsIcon icon={Delete02Icon} className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        )}
      </div>

      {/* Side Sheet Form for Add/Edit */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingScheduleId ? "Edit Schedule" : "Add Schedule"}
            </SheetTitle>
            <SheetDescription>
              {editingScheduleId 
                ? "Update the details for the selected schedule." 
                : "Create a new schedule block for a course."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingScheduleId && (
                <Field>
                  <FieldLabel>Select Course</FieldLabel>
                  <Select
                    value={selectedCourseId}
                    onValueChange={(value) => setSelectedCourseId(value || "")}
                  >
                    <SelectTrigger className="w-full">
                      <span data-slot="select-value">
                        {courses.find((c) => c.id === selectedCourseId)?.name || "Choose a course"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {courses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.code})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <Field>
                <FieldLabel>Day of Week</FieldLabel>
                <Select
                  value={dayOfWeek}
                   onValueChange={(value) => setDayOfWeek(value || "1")}
                >
                  <SelectTrigger className="w-full">
                    <span data-slot="select-value">
                      {DAYS_OF_WEEK.find((d) => d.value.toString() === dayOfWeek)?.label || "Choose a day"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {DAYS_OF_WEEK.map((d) => (
                        <SelectItem key={d.value} value={d.value.toString()}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="start-time">Start Time</FieldLabel>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="end-time">End Time</FieldLabel>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="room">Room (optional)</FieldLabel>
                <Input
                  id="room"
                  type="text"
                  placeholder="e.g. Lab 3, Room 402"
                  value={room}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoom(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="class-link">Online Class Link (optional)</FieldLabel>
                <Input
                  id="class-link"
                  type="url"
                  placeholder="e.g. https://zoom.us/j/123456"
                  value={link}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLink(e.target.value)}
                />
              </Field>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="w-1/2" onClick={() => setSheetOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2" disabled={formLoading}>
                  <HugeiconsIcon icon={editingScheduleId ? PencilEdit01Icon : Add01Icon} strokeWidth={2} className="mr-2 h-4 w-4" />
                  {formLoading ? "Saving..." : editingScheduleId ? "Save" : "Add"}
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={aiSheetOpen} onOpenChange={setAiSheetOpen}>
        <SheetContent className="sm:max-w-[440px] font-sans overflow-y-auto">
          <SheetHeader className="pb-6">
            <SheetTitle className="text-xl font-bold">AI Schedule Generator</SheetTitle>
            <SheetDescription>
              Upload a screenshot of your class schedule or type manual commands. Gemini will automatically match the schedules with your courses.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6 px-6 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Upload Screenshot (Image)</label>
              <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-xl p-6 bg-muted/10 hover:bg-muted/20 transition-colors relative group min-h-[140px]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAIImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {aiImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={aiImage} alt="Preview" className="max-h-40 rounded-lg object-contain shadow" />
                    <span className="text-xs text-primary font-medium hover:underline">Change image</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-muted-foreground">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                    <span className="text-xs font-semibold text-muted-foreground text-center">Click or Drag Image to Upload</span>
                  </div>
                )}
              </div>
            </div>
 
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Additional Commands / Text Instructions (Optional)</label>
              <textarea
                placeholder="e.g. Hanya tambahkan jadwal untuk hari Senin dan Selasa saja..."
                value={aiCommand}
                onChange={(e) => setAiCommand(e.target.value)}
                className="w-full min-h-[90px] rounded-xl border border-input bg-input/30 p-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 placeholder:text-muted-foreground resize-none font-sans"
              />
            </div>
 
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="w-1/2" onClick={() => setAiSheetOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAIGenerate} className="w-1/2" disabled={aiLoading || (!aiImage && !aiCommand)}>
                {aiLoading ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Schedule"
        description="Are you sure you want to delete this schedule? This action cannot be undone."
      />
    </div>
  )
}
