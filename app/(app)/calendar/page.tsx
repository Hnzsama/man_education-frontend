"use client"
import { API_URL } from "@/lib/config"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Clock01Icon,
  CircleCheckIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar02Icon,
  File01Icon,
  Add01Icon,
  Delete02Icon,
  PencilEdit01Icon,
  Location01Icon,
  Link01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "@/components/ui/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"

// Import modular local components
import { CalendarEventSheet } from "./components/calendar-event-sheet"
import { HolidaySheet } from "./components/holiday-sheet"
import { AgendaSidebar } from "./components/agenda-sidebar"

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const DAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]

const COURSE_COLORS = [
  { bg:"bg-violet-500/15", text:"text-violet-700 dark:text-violet-400", border:"border-violet-500/30", dot:"bg-violet-500" },
  { bg:"bg-sky-500/15",    text:"text-sky-700 dark:text-sky-400",       border:"border-sky-500/30",    dot:"bg-sky-500"    },
  { bg:"bg-emerald-500/15",text:"text-emerald-700 dark:text-emerald-400",border:"border-emerald-500/30",dot:"bg-emerald-500"},
  { bg:"bg-orange-500/15", text:"text-orange-700 dark:text-orange-400", border:"border-orange-500/30", dot:"bg-orange-500" },
  { bg:"bg-pink-500/15",   text:"text-pink-700 dark:text-pink-400",     border:"border-pink-500/30",   dot:"bg-pink-500"   },
  { bg:"bg-teal-500/15",   text:"text-teal-700 dark:text-teal-400",     border:"border-teal-500/30",   dot:"bg-teal-500"   },
  { bg:"bg-indigo-500/15", text:"text-indigo-700 dark:text-indigo-400", border:"border-indigo-500/30", dot:"bg-indigo-500" },
  { bg:"bg-rose-500/15",   text:"text-rose-700 dark:text-rose-400",     border:"border-rose-500/30",   dot:"bg-rose-500"   },
]

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`

export default function CalendarPage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
  const [semesters, setSemesters] = React.useState<any[]>([])
  const [allCourses, setAllCourses] = React.useState<any[]>([])
  const [tasks, setTasks]   = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [courseColorMap, setCourseColorMap] = React.useState<Record<string,number>>({})
  const [holidays, setHolidays] = React.useState<any[]>([])
  const [customHolidays, setCustomHolidays] = React.useState<any[]>([])

  // DnD state
  const [draggingTaskId, setDraggingTaskId] = React.useState<string|null>(null)
  const [dropTargetDate,  setDropTargetDate]  = React.useState<string|null>(null)

  // Sheet / form state
  const [sheetOpen,      setSheetOpen]      = React.useState(false)
  const [editingTask,    setEditingTask]    = React.useState<any|null>(null)
  const [prefillDate,    setPrefillDate]    = React.useState("")

  const [quickAddTaskText, setQuickAddTaskText] = React.useState("")
  const [quickAddLoading, setQuickAddLoading] = React.useState(false)

  // Confirm delete
  const [confirmOpen,  setConfirmOpen]  = React.useState(false)
  const [deleteId,     setDeleteId]     = React.useState<string|null>(null)

  // Profile & Custom Holidays state
  const [userProfile, setUserProfile] = React.useState<any|null>(null)
  const [holidaySheetOpen, setHolidaySheetOpen] = React.useState(false)

  // Schedule Exceptions state
  const [exceptionSheetOpen, setExceptionSheetOpen] = React.useState(false)
  const [selectedSchedule, setSelectedSchedule] = React.useState<any|null>(null)
  const [excType, setExcType] = React.useState<'CANCELLED' | 'MOVED' | 'NOTE'>('CANCELLED')
  const [excNewStartTime, setExcNewStartTime] = React.useState("")
  const [excNewEndTime, setExcNewEndTime] = React.useState("")
  const [excNewRoom, setExcNewRoom] = React.useState("")
  const [excNewLink, setExcNewLink] = React.useState("")
  const [excNote, setExcNote] = React.useState("")
  const [excDate, setExcDate] = React.useState("")
  const [excLoading, setExcLoading] = React.useState(false)

  // ─── Data Fetch ─────────────────────────────────────────────
  const fetchData = React.useCallback(async () => {
    const token = getCookie("token")
    if (!token) { router.push("/login"); return }
    try {
      const [semRes, tasksRes, customHolidaysRes, profileRes] = await Promise.all([
        fetch(`${API_URL}/api/semesters`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/tasks`,     { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/custom-holidays`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (!semRes.ok || !tasksRes.ok || !customHolidaysRes.ok || !profileRes.ok) throw new Error("Failed to load data")
      const semsData  = await semRes.json()
      const tasksData = await tasksRes.json()
      const customHolidaysData = await customHolidaysRes.json()
      const profileData = await profileRes.json()
      setSemesters(semsData)
      setTasks(tasksData)
      setCustomHolidays(customHolidaysData)
      setUserProfile(profileData)

      const courses: any[] = []
      const colorMap: Record<string,number> = {}
      let idx = 0
      semsData.forEach((sem: any) => {
        sem.courses?.forEach((c: any) => {
          courses.push({ ...c, semesterId: sem.id })
          if (!(c.id in colorMap)) colorMap[c.id] = idx++ % COURSE_COLORS.length
        })
      })
      setAllCourses(courses)
      setCourseColorMap(colorMap)
      setLoading(false)
    } catch (err: any) {
      toast.add({ type:"error", description: err.message || "Failed to load data" })
      setLoading(false)
    }
  }, [router])

  // ─── Calendar Math ───────────────────────────────────────────
  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  React.useEffect(() => { fetchData() }, [fetchData])

  React.useEffect(() => {
    const token = getCookie("token")
    if (!token) return
    fetch(`${API_URL}/api/semesters/holidays?year=${year}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => { if (res.ok) return res.json() })
      .then(data => {
        if (Array.isArray(data)) setHolidays(data)
        else if (data && Array.isArray(data.data)) setHolidays(data.data)
        else if (data && Array.isArray(data.holidays)) setHolidays(data.holidays)
        else setHolidays([])
      })
      .catch(() => setHolidays([]))
  }, [year])

  const startOffset = React.useMemo(() => {
    const d = new Date(year, month, 1).getDay()
    return d === 0 ? 6 : d - 1
  }, [year, month])

  const daysInMonth     = new Date(year, month+1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells = React.useMemo(() => {
    const arr: { date: Date; current: boolean }[] = []
    for (let i = startOffset-1; i >= 0; i--)
      arr.push({ date: new Date(year, month-1, daysInPrevMonth-i), current: false })
    for (let i = 1; i <= daysInMonth; i++)
      arr.push({ date: new Date(year, month, i), current: true })
    while (arr.length < 42)
      arr.push({ date: new Date(year, month+1, arr.length-startOffset-daysInMonth+1), current: false })
    return arr
  }, [year, month, startOffset, daysInMonth, daysInPrevMonth])

  // ─── Items per Date ──────────────────────────────────────────
  // Only the active semester's schedules are shown within its date range
  const activeSemester = React.useMemo(
    () => semesters.find(s => s.isActive) ?? semesters[0] ?? null,
    [semesters]
  )

  const getItems = React.useCallback((date: Date) => {
    const dow = date.getDay() === 0 ? 7 : date.getDay()
    const ds  = toDateStr(date)

    const schedules: any[] = []
    if (activeSemester) {
      const semStart = new Date(activeSemester.academicStartDate || activeSemester.startDate); semStart.setHours(0,0,0,0)
      const semEnd   = new Date(activeSemester.endDate);   semEnd.setHours(23,59,59,999)
      
      let isHoliday = false
      if (activeSemester.holidayStartDate) {
        const holidayStart = new Date(activeSemester.holidayStartDate); holidayStart.setHours(0,0,0,0)
        if (date >= holidayStart) {
          isHoliday = true
        }
      }

      // Skip class schedules if date is a public holiday
      const holidayInfo = holidays.find((h: any) => h.date === ds)
      if (holidayInfo) {
        isHoliday = true
      }

      // Skip class schedules if date falls within a custom holiday
      const customHolidayInfo = customHolidays.find((ch: any) => {
        return ds >= ch.startDate && ds <= ch.endDate
      })
      if (customHolidayInfo) {
        isHoliday = true
      }

      // Render class pills within the active semester's date range, passing isHoliday state and exceptions
      if (date >= semStart && date <= semEnd) {
        activeSemester.courses?.forEach((c: any) => {
          c.schedules?.forEach((sc: any) => {
            if (sc.dayOfWeek === dow) {
              const exception = sc.exceptions?.find((e: any) => e.date === ds)
              
              let isCancelled = false
              let targetTime = sc.startTime
              let targetRoom = sc.room
              let targetLink = sc.link
              let exceptionInfo = null

              if (exception) {
                exceptionInfo = exception
                if (exception.type === 'CANCELLED') {
                  isCancelled = true
                } else if (exception.type === 'MOVED') {
                  if (exception.newStartTime) targetTime = exception.newStartTime
                  if (exception.newRoom) targetRoom = exception.newRoom
                  if (exception.newLink) targetLink = exception.newLink
                }
              }

              schedules.push({
                id: `${sc.id}-${ds}`,
                type: "schedule",
                title: c.name,
                code: c.code,
                time: targetTime,
                endTime: sc.endTime,
                room: targetRoom,
                link: targetLink,
                courseId: c.id,
                isHoliday: isHoliday || isCancelled,
                isCancelled,
                exception: exceptionInfo,
                rawSchedule: sc,
              })
            }
          })
        })
      }
    }
    schedules.sort((a,b) => a.time.localeCompare(b.time))

    const dayTasks: any[] = []
    tasks.forEach((t) => {
      const td = toDateStr(new Date(t.deadline))
      if (td === ds) dayTasks.push({ id:t.id, type:"task", title:t.title, status:t.status, priority:t.priority, raw:t })
    })

    return [...schedules, ...dayTasks]
  }, [semesters, tasks, holidays, customHolidays])

  // ─── Form Helpers ────────────────────────────────────────────
  const openAddSheet = (date?: Date) => {
    setEditingTask(null)
    const dl = date ? `${toDateStr(date)}T23:59` : ""
    setPrefillDate(dl)
    setSheetOpen(true)
  }

  const openEditSheet = (task: any) => {
    setEditingTask(task)
    setSheetOpen(true)
  }

  const handleDeleteRequest = (id: string) => {
    setDeleteId(id)
    setSheetOpen(false)
    setConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    const token = getCookie("token")
    if (!token) return
    try {
      await fetch(`${API_URL}/api/tasks/${deleteId}`, {
        method:"DELETE", headers:{ Authorization:`Bearer ${token}` },
      })
      toast.add({ type:"success", description:"Task deleted" })
      fetchData()
    } catch { toast.add({ type:"error", description:"Failed to delete task" }) }
    finally { setDeleteId(null); setConfirmOpen(false) }
  }

  const handleQuickAddSubmit = async () => {
    if (!quickAddTaskText.trim()) return
    setQuickAddLoading(true)
    const token = getCookie("token")
    if (!token) return
    try {
      const res = await fetch(`${API_URL}/api/tasks/quick-add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: quickAddTaskText }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || "Failed to parse task")
      }
      toast.add({ type: "success", description: "Task successfully added via AI!" })
      setQuickAddTaskText("")
      fetchData()
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    } finally {
      setQuickAddLoading(false)
    }
  }

  const handleExceptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSchedule) return
    setExcLoading(true)
    const token = getCookie("token")
    if (!token) return

    const { courseId, rawSchedule } = selectedSchedule
    const scheduleId = rawSchedule.id

    try {
      const res = await fetch(`${API_URL}/api/courses/${courseId}/schedules/${scheduleId}/exceptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          date: excDate || toDateStr(selectedDate),
          type: excType,
          newStartTime: excType === "MOVED" ? excNewStartTime : undefined,
          newEndTime: excType === "MOVED" ? excNewEndTime : undefined,
          newRoom: excType === "MOVED" ? excNewRoom : undefined,
          newLink: excType === "MOVED" ? excNewLink : undefined,
          note: excNote || undefined,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      toast.add({ type: "success", description: "Schedule changes saved!" })
      setExceptionSheetOpen(false)
      fetchData()
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to save changes" })
    } finally { setExcLoading(false) }
  }

  const handleExceptionDelete = async (exceptionId: string) => {
    if (!selectedSchedule) return
    const token = getCookie("token")
    if (!token) return
    
    const { courseId, rawSchedule } = selectedSchedule
    const scheduleId = rawSchedule.id

    try {
      const res = await fetch(`${API_URL}/api/courses/${courseId}/schedules/${scheduleId}/exceptions/${exceptionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
      toast.add({ type: "success", description: "Schedule changes reverted!" })
      setExceptionSheetOpen(false)
      fetchData()
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to delete changes" })
    }
  }

  // ─── DnD Handlers ────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggingTaskId(taskId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDropTargetDate(dateStr)
  }

  const handleDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    setDropTargetDate(null)
    if (!draggingTaskId) return
    const token = getCookie("token")
    if (!token) return

    // Keep original time, update only date
    const task = tasks.find(t => t.id === draggingTaskId)
    if (!task) return

    const origTime = new Date(task.deadline)
    const newDeadline = new Date(date)
    newDeadline.setHours(origTime.getHours(), origTime.getMinutes(), 0, 0)

    try {
      const res = await fetch(`${API_URL}/api/tasks/${draggingTaskId}`, {
        method:"PUT",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ deadline: newDeadline.toISOString() }),
      })
      if (!res.ok) throw new Error("Failed to reschedule task")
      toast.add({ type:"success", description:`Task moved to ${date.toLocaleDateString("id-ID",{day:"numeric",month:"short"})}` })
      fetchData()
    } catch (err: any) {
      toast.add({ type:"error", description: err.message })
    } finally { setDraggingTaskId(null) }
  }

  const handleDragEnd = () => { setDraggingTaskId(null); setDropTargetDate(null) }

  // ─── Sidebar Data ────────────────────────────────────────────
  const [overviewScope, setOverviewScope] = React.useState<"month"|"semester"|"all">("month")

  const upcomingTasks = React.useMemo(() =>
    tasks.filter(t => t.status !== "DONE" && new Date(t.deadline) >= new Date())
         .sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
         .slice(0, 6)
  , [tasks])

  const filteredTasksForOverview = React.useMemo(() => {
    if (overviewScope === "all") return tasks

    if (overviewScope === "month") {
      const start = new Date(year, month, 1)
      const end   = new Date(year, month + 1, 0, 23, 59, 59)
      return tasks.filter(t => {
        const d = new Date(t.deadline)
        return d >= start && d <= end
      })
    }

    // semester scope: find active semester
    const activeSem = semesters.find(s => s.isActive) || semesters[0]
    if (!activeSem) return tasks
    const semStart = new Date(activeSem.startDate)
    const semEnd   = new Date(activeSem.endDate)
    semStart.setHours(0, 0, 0, 0)
    semEnd.setHours(23, 59, 59, 999)
    return tasks.filter(t => {
      const d = new Date(t.deadline)
      return d >= semStart && d <= semEnd
    })
  }, [tasks, overviewScope, year, month, semesters])

  const pendingCount   = filteredTasksForOverview.filter(t => t.status !== "DONE").length
  const completedCount = filteredTasksForOverview.filter(t => t.status === "DONE").length

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 py-4 md:py-6 px-4 lg:px-6 font-sans animate-pulse">
        {/* Topbar Skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4 border-border/40">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56 rounded-lg" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>

        {/* Layout: Calendar Grid & Sidebar */}
        <div className="grid gap-6 lg:grid-cols-4 items-start">
          {/* Calendar Table (Left 3 columns) */}
          <Card className="lg:col-span-3 border border-border/60 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
              <Skeleton className="h-6 w-48 rounded-lg" />
              <div className="flex gap-1">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Day Headers (Mon, Tue...) */}
              <div className="grid grid-cols-7 gap-2 border-b pb-2 border-border/20 text-center">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-10 rounded-lg mx-auto" />
                ))}
              </div>
              {/* Calendar Grid (6 rows of 7 days) */}
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="min-h-[90px] border border-border/40 rounded-xl p-2 flex flex-col justify-between">
                    <Skeleton className="h-4 w-4 rounded-lg" />
                    {i % 7 === 2 && <Skeleton className="h-4 w-5/6 rounded-lg mt-2" />}
                    {i % 7 === 5 && <Skeleton className="h-4 w-2/3 rounded-lg mt-2" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Agenda Sidebar (Right 1 column) */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <Card className="border border-border/60 shadow-xs">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-40 rounded-lg" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-xl border border-border/50 space-y-2">
                    <Skeleton className="h-4 w-full rounded-lg" />
                    <Skeleton className="h-3 w-2/3 rounded-lg" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 py-4 md:py-6 px-4 lg:px-6 font-sans">

      {/* ── Topbar ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4 border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Drag tasks to reschedule · Click a date to add · Click a task to edit.
          </p>
        </div>
        <div className="flex flex-col gap-2.5 items-stretch sm:items-end w-full lg:w-auto">
          {/* Row 1: Date Navigation */}
          <div className="flex items-center gap-2 justify-between sm:justify-end w-full">
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-semibold"
              onClick={() => setCurrentDate(new Date())}>Today</Button>
            <div className="flex items-center rounded-xl border bg-card shadow-xs overflow-hidden">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none"
                onClick={() => setCurrentDate(new Date(year, month-1, 1))}>
                <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
              </Button>
              <span className="select-none px-4 text-sm font-bold text-foreground min-w-[140px] text-center">
                {MONTHS[month]} {year}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none"
                onClick={() => setCurrentDate(new Date(year, month+1, 1))}>
                <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Row 2: Action Buttons & Quick Add */}
          <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end w-full">
            <div className="flex items-center gap-1.5 border rounded-xl bg-card px-2.5 h-8 shadow-xs max-w-[280px] overflow-hidden">
              <input
                value={quickAddTaskText}
                onChange={(e) => setQuickAddTaskText(e.target.value)}
                placeholder="Quick Add: Tugas Statistika besok 8 malam"
                className="border-0 bg-transparent h-full text-xs p-0 focus-visible:ring-0 focus-visible:outline-none min-w-[180px] w-full"
              />
              <button
                onClick={handleQuickAddSubmit}
                disabled={quickAddLoading}
                className="h-6 w-6 rounded-lg hover:bg-muted flex items-center justify-center shrink-0"
              >
                <HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 text-xs font-semibold" onClick={() => setHolidaySheetOpen(true)}>
              <HugeiconsIcon icon={Calendar02Icon} className="h-3.5 w-3.5" />
              Manage Holidays
            </Button>
            <Button size="sm" className="h-8 px-3 gap-1.5 text-xs font-semibold" onClick={() => openAddSheet()}>
              <HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5" />
              New Task
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-5 items-start w-full">

        {/* ── Calendar Grid ──────────────────────────────── */}
        <div className="flex-1 min-w-0 rounded-2xl border border-border/50 bg-card shadow-xs overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-border/40">
            {DAYS_SHORT.map((d, i) => (
              <div key={d} className={`py-3 text-center text-xs font-bold uppercase tracking-wide
                ${i >= 5 ? "text-muted-foreground/40" : "text-muted-foreground"}`}>{d}</div>
            ))}
          </div>

          {/* Grid Rows */}
          <div className="grid grid-cols-7 divide-x divide-y divide-border/30">
            {cells.map((cell, i) => {
              const items   = getItems(cell.date)
              const isToday = cell.date.toDateString() === new Date().toDateString()
              const ds      = toDateStr(cell.date)
              const isSelected = selectedDate ? toDateStr(selectedDate) === ds : false
              const isDrop  = dropTargetDate === ds && draggingTaskId !== null
              const isWeekend = i % 7 >= 5
              const holiday = holidays.find((h: any) => h.date === ds)
              const customHoliday = customHolidays.find((ch: any) => {
                return ds >= ch.startDate && ds <= ch.endDate
              })
              const hasHoliday = holiday || customHoliday

              return (
                <div
                  key={i}
                  onClick={() => cell.current && setSelectedDate(cell.date)}
                  className={`min-h-[130px] flex flex-col p-1.5 gap-1 transition-all group relative cursor-pointer
                    ${!cell.current ? "bg-muted/10 opacity-40 pointer-events-none" : isWeekend ? "bg-muted/5 hover:bg-muted/10" : "bg-card hover:bg-muted/5"}
                    ${hasHoliday ? "!bg-muted/20 opacity-80" : ""}
                    ${isToday ? "!bg-primary/5 ring-[1.5px] ring-inset ring-primary/40" : ""}
                    ${isSelected ? "ring-[1.5px] ring-inset ring-primary/50 z-10" : ""}
                    ${isDrop ? "!bg-primary/10 ring-[1.5px] ring-inset ring-primary/60 scale-[1.01]" : ""}
                  `}
                  onDragOver={(e) => cell.current && handleDragOver(e, ds)}
                  onDragLeave={() => setDropTargetDate(null)}
                  onDrop={(e) => cell.current && handleDrop(e, cell.date)}
                >
                  {/* Day Number + add button on hover */}
                  <div className="flex justify-between items-center pb-0.5">
                    {holiday ? (
                      <span className="text-[9px] font-semibold text-rose-500 max-w-[70%] truncate" title={holiday.description}>
                        [Holiday] {holiday.description}
                      </span>
                    ) : customHoliday ? (
                      <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 max-w-[70%] truncate" title={customHoliday.name}>
                        [Holiday] {customHoliday.name}
                      </span>
                    ) : (
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary h-5 w-5 flex items-center justify-center rounded"
                        title={`Add task on ${cell.date.toLocaleDateString()}`}
                        onClick={() => openAddSheet(cell.date)}
                      >
                        <HugeiconsIcon icon={Add01Icon} className="h-3 w-3" />
                      </button>
                    )}
                    <span className={`text-xs font-bold flex h-6 w-6 items-center justify-center rounded-full
                      ${isToday ? "bg-primary text-primary-foreground shadow" : hasHoliday ? "text-rose-500 bg-rose-500/10" : "text-foreground/60"}`}>
                      {cell.date.getDate()}
                    </span>
                  </div>

                  {/* Events */}
                  <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
                    {items.slice(0, 3).map((item) => {
                      const isTask = item.type === "task"
                      const isDone = item.status === "DONE"
                      const isHigh = item.priority === "HIGH"
                      const isDraggingThis = draggingTaskId === item.id

                      if (!isTask) {
                        const c = COURSE_COLORS[courseColorMap[item.courseId] ?? 0]
                        return (
                          <div key={item.id}
                            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold border cursor-default leading-tight
                              ${item.isHoliday 
                                ? "bg-muted text-muted-foreground/50 border-muted-foreground/10 opacity-50 line-through" 
                                : `${c.bg} ${c.text} ${c.border}`
                              }`}
                          >
                            <HugeiconsIcon icon={Clock01Icon} className="h-2.5 w-2.5 shrink-0 opacity-70" />
                            <span className="truncate">{item.title}</span>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={item.id}
                          draggable={!isDone}
                          onDragStart={(e) => !isDone && handleDragStart(e, item.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => openEditSheet(item.raw)}
                          className={`group/task flex items-start justify-between gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold border leading-tight cursor-pointer select-none
                            transition-all duration-150
                            ${isDraggingThis ? "opacity-30 scale-95" : ""}
                            ${isDone
                              ? "bg-muted/60 text-muted-foreground line-through border-muted-foreground/10"
                              : isHigh
                              ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-400/30 hover:bg-amber-500/20"}
                          `}
                        >
                          <span className="truncate flex-1">{item.title}</span>
                          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/task:opacity-100 transition-opacity">
                            {!isDone && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); setConfirmOpen(true) }}
                                className="cursor-pointer hover:text-destructive"
                                title="Delete">
                                <HugeiconsIcon icon={Delete02Icon} className="h-3 w-3" />
                              </button>
                            )}
                            {!isDone && (
                              <button
                                onClick={(e) => { e.stopPropagation(); openEditSheet(item.raw) }}
                                className="cursor-pointer hover:text-primary"
                                title="Edit">
                                <HugeiconsIcon icon={PencilEdit01Icon} className="h-3 w-3" />
                              </button>
                            )}
                            {!isDone && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleComplete(item.id) }}
                                className="cursor-pointer hover:text-green-600"
                                title="Complete">
                                <HugeiconsIcon icon={CircleCheckIcon} className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {items.length > 3 && (
                      <span className="text-[9px] font-bold text-muted-foreground/60 pl-1">
                        +{items.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Sidebar (responsive) ─────────────────────────── */}
        <AgendaSidebar
          selectedDate={selectedDate}
          holidays={holidays}
          customHolidays={customHolidays}
          pendingCount={pendingCount}
          completedCount={completedCount}
          upcomingTasks={upcomingTasks}
          filteredTasksForOverview={filteredTasksForOverview}
          overviewScope={overviewScope}
          setOverviewScope={setOverviewScope}
          month={month}
          MONTHS={MONTHS}
          openAddSheet={openAddSheet}
          openEditSheet={openEditSheet}
          courseColorMap={courseColorMap}
          COURSE_COLORS={COURSE_COLORS}
          getItems={getItems}
          setSelectedSchedule={setSelectedSchedule}
          setExcType={(type: any) => setExcType(type)}
          setExcNewStartTime={setExcNewStartTime}
          setExcNewEndTime={setExcNewEndTime}
          setExcNewRoom={setExcNewRoom}
          setExcNewLink={setExcNewLink}
          setExcNote={setExcNote}
          setExceptionSheetOpen={setExceptionSheetOpen}
          setExcDate={setExcDate}
        />
      </div>

      {/* ── Task Sheet ────────────────────────────────────── */}
      <CalendarEventSheet
        isOpen={sheetOpen}
        onClose={setSheetOpen}
        editingTask={editingTask}
        prefillDate={prefillDate}
        allCourses={allCourses}
        onSaveSuccess={fetchData}
        onDeleteRequest={handleDeleteRequest}
      />

      {/* ── Confirm Delete ────────────────────────────────── */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete Task"
        description="Are you sure you want to delete this task? This cannot be undone."
        onConfirm={handleDeleteConfirm}
        onClose={() => { setConfirmOpen(false); setDeleteId(null) }}
      />

      {/* ── Custom Holiday Sheet ─────────────────────────── */}
      <HolidaySheet
        isOpen={holidaySheetOpen}
        onClose={setHolidaySheetOpen}
        customHolidays={customHolidays}
        userProfile={userProfile}
        onSaveSuccess={fetchData}
      />


      {/* ── Schedule Exception Sheet ──────────────────────── */}
      <Sheet open={exceptionSheetOpen} onOpenChange={setExceptionSheetOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[440px] overflow-y-auto font-sans flex flex-col">
          <SheetHeader className="pb-4 border-b border-border/40">
            <SheetTitle className="text-base">Ad-hoc Schedule Adjustments</SheetTitle>
            <SheetDescription className="text-xs">
              Make custom adjustments (Cancel/Reschedule) for today's class schedule.
            </SheetDescription>
          </SheetHeader>

          {selectedSchedule && (
            <form onSubmit={handleExceptionSubmit} className="flex flex-col gap-4 pt-4 px-6 pb-6 flex-1">
              <div className="p-3 rounded-xl border bg-primary/5 text-xs">
                <p className="font-bold text-primary">{selectedSchedule.title}</p>
                <p className="text-muted-foreground mt-0.5">Original Schedule: {selectedSchedule.rawSchedule.startTime} WIB @ {selectedSchedule.rawSchedule.room || "-"}</p>
              </div>

              <Field>
                <FieldLabel className="text-xs font-semibold">Date of Change *</FieldLabel>
                <DatePicker
                  value={excDate}
                  onChange={setExcDate}
                  placeholder="Select date of change"
                />
              </Field>

              <Field>
                <FieldLabel className="text-xs font-semibold">Schedule Change Status *</FieldLabel>
                <Select value={excType} onValueChange={(v: any) => setExcType(v)}>
                  <SelectTrigger className="w-full h-9">
                    <span data-slot="select-value" className="text-sm flex items-center gap-1.5">
                      {excType === "CANCELLED" && (
                        <span className="flex items-center gap-1.5 text-rose-500">
                          <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
                          <span>Cancelled (Off)</span>
                        </span>
                      )}
                      {excType === "MOVED" && (
                        <span className="flex items-center gap-1.5 text-blue-500">
                          <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
                          <span>Rescheduled</span>
                        </span>
                      )}
                      {excType === "NOTE" && (
                        <span className="flex items-center gap-1.5 text-amber-500">
                          <HugeiconsIcon icon={File01Icon} className="h-4 w-4" />
                          <span>Info Note</span>
                        </span>
                      )}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="CANCELLED">
                        <span className="flex items-center gap-1.5 text-rose-500">
                          <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
                          <span>Cancelled (Off)</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="MOVED">
                        <span className="flex items-center gap-1.5 text-blue-500">
                          <HugeiconsIcon icon={ArrowRight01Icon} className="h-4 w-4" />
                          <span>Rescheduled</span>
                        </span>
                      </SelectItem>
                      <SelectItem value="NOTE">
                        <span className="flex items-center gap-1.5 text-amber-500">
                          <HugeiconsIcon icon={File01Icon} className="h-4 w-4" />
                          <span>Info Note</span>
                        </span>
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              {excType === "MOVED" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel className="text-xs font-semibold">New Start Time *</FieldLabel>
                      <Input
                        type="time"
                        value={excNewStartTime}
                        onChange={(e: any) => setExcNewStartTime(e.target.value)}
                        className="h-9 text-sm"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-xs font-semibold">New End Time</FieldLabel>
                      <Input
                        type="time"
                        value={excNewEndTime}
                        onChange={(e: any) => setExcNewEndTime(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel className="text-xs font-semibold">New Room</FieldLabel>
                    <Input
                      value={excNewRoom}
                      onChange={(e: any) => setExcNewRoom(e.target.value)}
                      placeholder="e.g. Lab Komputer 3"
                      className="h-9 text-sm"
                    />
                  </Field>
                  <Field>
                    <FieldLabel className="text-xs font-semibold">New Class Link (Online)</FieldLabel>
                    <Input
                      value={excNewLink}
                      onChange={(e: any) => setExcNewLink(e.target.value)}
                      placeholder="e.g. https://zoom.us/..."
                      className="h-9 text-sm"
                    />
                  </Field>
                </>
              )}

              <Field>
                <FieldLabel className="text-xs font-semibold">Notes / Reason for Change</FieldLabel>
                <Input
                  value={excNote}
                  onChange={(e: any) => setExcNote(e.target.value)}
                  placeholder="e.g. Lecturer unavailable, makeup class at 10"
                  className="h-9 text-sm"
                />
              </Field>

              <div className="flex gap-2 mt-2 pt-4 border-t border-border/40">
                <Button type="submit" className="flex-1 h-9 text-sm" disabled={excLoading}>
                  {excLoading ? "Saving…" : "Save Changes"}
                </Button>
                {selectedSchedule.exception && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9 shrink-0 animate-in fade-in"
                    title="Cancel Schedule Adjustments"
                    onClick={() => handleExceptionDelete(selectedSchedule.exception.id)}
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// Quick-complete helper used inside cells
function handleComplete(taskId: string) {
  const token = getCookie("token")
  if (!token) return
  fetch(`${API_URL}/api/tasks/${taskId}`, {
    method:"PUT",
    headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
    body: JSON.stringify({ status:"DONE" }),
  })
}
