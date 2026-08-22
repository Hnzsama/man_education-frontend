"use client"
import { API_URL } from "@/lib/config"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
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
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Clock01Icon,
  CircleCheckIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar02Icon,
  File01Icon,
  CheckmarkCircle01Icon,
  Add01Icon,
  Delete02Icon,
  PencilEdit01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "@/components/ui/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

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

  // DnD state
  const [draggingTaskId, setDraggingTaskId] = React.useState<string|null>(null)
  const [dropTargetDate,  setDropTargetDate]  = React.useState<string|null>(null)

  // Sheet / form state
  const [sheetOpen,      setSheetOpen]      = React.useState(false)
  const [editingTask,    setEditingTask]    = React.useState<any|null>(null)
  const [prefillDate,    setPrefillDate]    = React.useState("")
  const [formLoading,    setFormLoading]    = React.useState(false)

  const [fTitle,       setFTitle]       = React.useState("")
  const [fDesc,        setFDesc]        = React.useState("")
  const [fCourseId,    setFCourseId]    = React.useState("none")
  const [fDeadline,    setFDeadline]    = React.useState("")
  const [fStatus,      setFStatus]      = React.useState("PENDING")
  const [fPriority,    setFPriority]    = React.useState("MEDIUM")

  // Confirm delete
  const [confirmOpen,  setConfirmOpen]  = React.useState(false)
  const [deleteId,     setDeleteId]     = React.useState<string|null>(null)

  // ─── Data Fetch ─────────────────────────────────────────────
  const fetchData = React.useCallback(async () => {
    const token = getCookie("token")
    if (!token) { router.push("/login"); return }
    try {
      const [semRes, tasksRes] = await Promise.all([
        fetch(`${API_URL}/api/semesters`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/tasks`,     { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (!semRes.ok || !tasksRes.ok) throw new Error("Failed to load data")
      const semsData  = await semRes.json()
      const tasksData = await tasksRes.json()
      setSemesters(semsData)
      setTasks(tasksData)

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

      // Render class pills within the active semester's date range, passing isHoliday state
      if (date >= semStart && date <= semEnd) {
        activeSemester.courses?.forEach((c: any) => {
          c.schedules?.forEach((sc: any) => {
            if (sc.dayOfWeek === dow)
              schedules.push({ id:`${sc.id}-${ds}`, type:"schedule", title:c.name, code:c.code, time:sc.startTime, courseId:c.id, isHoliday })
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
  }, [semesters, tasks])

  // ─── Form Helpers ────────────────────────────────────────────
  const openAddSheet = (date?: Date) => {
    setEditingTask(null)
    setFTitle(""); setFDesc(""); setFCourseId("none")
    setFStatus("PENDING"); setFPriority("MEDIUM")
    const dl = date ? `${toDateStr(date)}T23:59` : ""
    setFDeadline(dl); setPrefillDate(dl)
    setSheetOpen(true)
  }

  const openEditSheet = (task: any) => {
    setEditingTask(task)
    setFTitle(task.title)
    setFDesc(task.description || "")
    setFCourseId(task.courseId || "none")
    setFDeadline(new Date(task.deadline).toISOString().slice(0,16))
    setFStatus(task.status)
    setFPriority(task.priority)
    setSheetOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    const token = getCookie("token")
    if (!token) return

    try {
      const url    = editingTask ? `${API_URL}/api/tasks/${editingTask.id}` : `${API_URL}/api/tasks`
      const method = editingTask ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({
          title: fTitle,
          description: fDesc || undefined,
          courseId: fCourseId === "none" ? undefined : fCourseId,
          deadline: new Date(fDeadline).toISOString(),
          status: fStatus,
          priority: fPriority,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message) }

      toast.add({ type:"success", description: editingTask ? "Task updated!" : "Task added to calendar!" })
      setSheetOpen(false)
      fetchData()
    } catch (err: any) {
      toast.add({ type:"error", description: err.message || "Failed to save task" })
    } finally { setFormLoading(false) }
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading calendar…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 py-4 md:py-6 px-4 lg:px-6 font-sans">

      {/* ── Topbar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Drag tasks to reschedule · Click a date to add · Click a task to edit.
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button size="sm" className="h-8 px-3 gap-1.5 text-xs font-semibold" onClick={() => openAddSheet()}>
            <HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5" />
            New Task
          </Button>
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

              return (
                <div
                  key={i}
                  onClick={() => cell.current && setSelectedDate(cell.date)}
                  className={`min-h-[130px] flex flex-col p-1.5 gap-1 transition-all group relative cursor-pointer
                    ${!cell.current ? "bg-muted/10 opacity-40 pointer-events-none" : isWeekend ? "bg-muted/5 hover:bg-muted/10" : "bg-card hover:bg-muted/5"}
                    ${holiday ? "!bg-muted/20 opacity-80" : ""}
                    ${isToday ? "!bg-primary/5 ring-[1.5px] ring-inset ring-primary/40" : ""}
                    ${isSelected ? "ring-[1.5px] ring-inset ring-primary z-10" : ""}
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
                        🎈 {holiday.description}
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
                      ${isToday ? "bg-primary text-primary-foreground shadow" : holiday ? "text-rose-500 bg-rose-500/10" : "text-foreground/60"}`}>
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
                                ? "bg-muted text-muted-foreground border-muted-foreground/15 opacity-65" 
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
        <div className="flex flex-col gap-4 w-full xl:w-72 shrink-0">
          {/* Selected Date Agenda / Daily Overview */}
          <div className="rounded-2xl border border-border/50 bg-card shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <HugeiconsIcon icon={Calendar02Icon} className="h-4 w-4 text-primary" />
                Agenda: {selectedDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </h3>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => openAddSheet(selectedDate)}
                title="Add task for this day"
              >
                <HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Holiday Notice */}
            {(() => {
              const ds = toDateStr(selectedDate);
              const holiday = holidays.find((h: any) => h.date === ds);
              if (holiday) {
                return (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-start gap-1.5 animate-in fade-in duration-200">
                    <span className="text-sm">🎈</span>
                    <div>
                      <p className="font-bold">Hari Libur</p>
                      <p className="text-[11px] font-normal leading-normal">{holiday.description}</p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Items list */}
            {(() => {
              const items = getItems(selectedDate);
              if (items.length === 0) {
                return (
                  <p className="text-xs text-muted-foreground text-center py-4">Tidak ada agenda hari ini 🎉</p>
                );
              }

              return (
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {items.map((item) => {
                    const isTask = item.type === "task";
                    if (!isTask) {
                      const c = COURSE_COLORS[courseColorMap[item.courseId] ?? 0];
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}
                        >
                          <HugeiconsIcon icon={Clock01Icon} className="h-3.5 w-3.5 shrink-0 opacity-70" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-bold">{item.title}</p>
                            <p className="text-[10px] opacity-70">{item.time} WIB</p>
                          </div>
                        </div>
                      );
                    }

                    const isDone = item.status === "DONE";
                    const isHigh = item.priority === "HIGH";
                    return (
                      <div
                        key={item.id}
                        onClick={() => openEditSheet(item.raw)}
                        className={`flex items-start justify-between gap-2 rounded-xl p-2.5 text-xs font-semibold border cursor-pointer transition-all
                          ${isDone
                            ? "bg-muted/40 text-muted-foreground line-through border-muted-foreground/15"
                            : isHigh
                            ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-400/20 hover:bg-amber-500/15"
                          }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-bold">{item.title}</p>
                          {item.raw.description && (
                            <p className="text-[10px] opacity-70 truncate mt-0.5">{item.raw.description}</p>
                          )}
                        </div>
                        <Badge variant={isHigh ? "destructive" : "outline"} className="text-[9px] font-bold uppercase shrink-0">
                          {item.priority}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Stats */}
          <div className="rounded-2xl border border-border/50 bg-card shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Task Overview</h3>
            </div>
            {/* Scope Toggle */}
            <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5 border border-border/40">
              {(["month", "semester", "all"] as const).map((scope) => (
                <button
                  key={scope}
                  onClick={() => setOverviewScope(scope)}
                  className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all capitalize
                    ${overviewScope === scope
                      ? "bg-card text-foreground shadow-xs border border-border/40"
                      : "text-muted-foreground hover:text-foreground"}`}
                >
                  {scope === "month" ? MONTHS[month].slice(0,3) : scope === "semester" ? "Sem." : "All"}
                </button>
              ))}
            </div>

            {/* Completion Rate Ring + Big Numbers */}
            {(() => {
              const total = pendingCount + completedCount
              const pct = total === 0 ? 0 : Math.round((completedCount / total) * 100)
              const highPriority = filteredTasksForOverview.filter(t => t.priority === "HIGH" && t.status !== "DONE").length
              return (
                <div className="space-y-3">
                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                      <span>Completion</span>
                      <span className="text-foreground font-bold">{pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* 3 stat tiles */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-amber-500/10 border border-amber-400/20 p-2.5 flex flex-col gap-0.5 items-center text-center">
                      <span className="text-lg font-black text-amber-600 dark:text-amber-400 leading-none">{pendingCount}</span>
                      <span className="text-[9px] font-semibold text-muted-foreground">Pending</span>
                    </div>
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/20 p-2.5 flex flex-col gap-0.5 items-center text-center">
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">{completedCount}</span>
                      <span className="text-[9px] font-semibold text-muted-foreground">Done</span>
                    </div>
                    <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-2.5 flex flex-col gap-0.5 items-center text-center">
                      <span className="text-lg font-black text-destructive leading-none">{highPriority}</span>
                      <span className="text-[9px] font-semibold text-muted-foreground">Urgent</span>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Upcoming */}
          <div className="rounded-2xl border border-border/50 bg-card shadow-xs p-4 space-y-3">
            <h3 className="text-sm font-bold">Upcoming Deadlines</h3>
            {upcomingTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No upcoming tasks 🎉</p>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map((t) => {
                  const d = new Date(t.deadline)
                  const isHigh = t.priority === "HIGH"
                  return (
                    <div key={t.id}
                      className={`rounded-lg border p-2.5 space-y-1 cursor-pointer transition-colors
                        ${isHigh ? "bg-destructive/5 border-destructive/20 hover:bg-destructive/10" : "bg-muted/20 border-border/40 hover:bg-muted/40"}`}
                      onClick={() => openEditSheet(t)}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-semibold text-foreground line-clamp-2 flex-1">{t.title}</span>
                        <Badge variant={isHigh ? "destructive" : "outline"} className="text-[9px] font-bold uppercase shrink-0">{t.priority}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <HugeiconsIcon icon={Calendar02Icon} className="h-3 w-3 text-primary/60" />
                        <span>{d.toLocaleDateString("id-ID",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <Button size="sm" className="w-full h-8 text-xs gap-1.5" variant="outline" onClick={() => openAddSheet()}>
              <HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5" />
              Add New Task
            </Button>
          </div>

          {/* Legend */}
          <div className="rounded-2xl border border-border/50 bg-card shadow-xs p-4 space-y-2">
            <h3 className="text-sm font-bold">Legend & Tips</h3>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded bg-violet-500/60 shrink-0" />Class / Schedule (read-only)</div>
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded bg-amber-400/80 shrink-0" />Task (normal priority)</div>
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded bg-destructive/60 shrink-0" />Task (high priority)</div>
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded bg-muted border shrink-0" />Completed task</div>
            </div>
            <div className="mt-3 rounded-lg bg-muted/30 border border-border/40 p-2.5 text-[10px] text-muted-foreground space-y-1">
              <div>• <b>Drag</b> a task to another date to reschedule</div>
              <div>• <b>Click</b> a date cell to add a new task</div>
              <div>• <b>Click</b> a task to edit its details</div>
              <div>• <b>Hover</b> a task for quick actions</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Task Sheet ────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[440px] overflow-y-auto font-sans flex flex-col">
          <SheetHeader className="pb-4 border-b border-border/40">
            <SheetTitle className="text-base">{editingTask ? "Edit Task" : "New Task"}</SheetTitle>
            <SheetDescription className="text-xs">
              {editingTask ? "Update your task details." : "Add a new task to your calendar."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-4 px-6 pb-6 flex-1">
            <Field>
              <FieldLabel className="text-xs font-semibold">Title *</FieldLabel>
              <Input
                value={fTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFTitle(e.target.value)}
                placeholder="e.g. Complete Assignment 3"
                className="h-9 text-sm"
                required
              />
            </Field>

            <Field>
              <FieldLabel className="text-xs font-semibold">Description</FieldLabel>
              <Input
                value={fDesc}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFDesc(e.target.value)}
                placeholder="Optional notes…"
                className="h-9 text-sm"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel className="text-xs font-semibold">Deadline *</FieldLabel>
                <Input
                  type="datetime-local"
                  value={fDeadline}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFDeadline(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </Field>
              <Field>
                <FieldLabel className="text-xs font-semibold">Priority</FieldLabel>
                <Select value={fPriority} onValueChange={(v: string | null) => setFPriority(v ?? fPriority)}>
                  <SelectTrigger className="w-full h-9">
                    <span data-slot="select-value" className="text-sm">
                      {fPriority.charAt(0) + fPriority.slice(1).toLowerCase()}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel className="text-xs font-semibold">Course</FieldLabel>
              <Select value={fCourseId} onValueChange={(v: string | null) => setFCourseId(v ?? fCourseId)}>
                <SelectTrigger className="w-full h-9">
                  <span data-slot="select-value" className="text-sm">
                    {allCourses.find(c => c.id === fCourseId)?.name || "No specific course"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="none">No specific course</SelectItem>
                    {allCourses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {editingTask && (
              <Field>
                <FieldLabel className="text-xs font-semibold">Status</FieldLabel>
                <Select value={fStatus} onValueChange={(v: string | null) => setFStatus(v ?? fStatus)}>
                  <SelectTrigger className="w-full h-9">
                    <span data-slot="select-value" className="text-sm">{fStatus.replace("_"," ")}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="DONE">Done</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}

            <div className="flex gap-2 mt-2 pt-4 border-t border-border/40">
              <Button type="submit" className="flex-1 h-9 text-sm" disabled={formLoading}>
                {formLoading ? "Saving…" : editingTask ? "Update Task" : "Add to Calendar"}
              </Button>
              {editingTask && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => { setDeleteId(editingTask.id); setSheetOpen(false); setConfirmOpen(true) }}
                >
                  <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Confirm Delete ────────────────────────────────── */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete Task"
        description="Are you sure you want to delete this task? This cannot be undone."
        onConfirm={handleDeleteConfirm}
        onClose={() => { setConfirmOpen(false); setDeleteId(null) }}
      />
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
