"use client"
import { API_URL } from "@/lib/config"
import { RemindersSettings } from "@/components/reminders-settings"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Book02Icon,
  Database01Icon,
  Calendar02Icon,
  Clock01Icon,
  CircleCheckIcon,
  AlertCircleIcon,
  ArrowRight01Icon,
  SchoolIcon,
  GraduationCapIcon,
  Download01Icon,
  Upload01Icon
} from "@hugeicons/core-free-icons"
import { toast } from "@/components/ui/toast"

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

export default function DashboardPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = React.useState<any | null>(null)
  const [activeSemester, setActiveSemester] = React.useState<any | null>(null)
  const [courses, setCourses] = React.useState<any[]>([])
  const [todaySchedules, setTodaySchedules] = React.useState<any[]>([])
  const [pendingTasks, setPendingTasks] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [backupLoading, setBackupLoading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [customHolidays, setCustomHolidays] = React.useState<any[]>([])
  const [nationalHolidays, setNationalHolidays] = React.useState<any[]>([])
  const [todayHolidayName, setTodayHolidayName] = React.useState<string | null>(null)

  const handleExportData = async () => {
    setBackupLoading(true)
    const token = getCookie("token")
    try {
      const res = await fetch(`${API_URL}/api/users/me/export`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to export data")
      
      const data = await res.json()
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2))
      const downloadAnchor = document.createElement("a")
      downloadAnchor.setAttribute("href", dataStr)
      downloadAnchor.setAttribute("download", `man-education-backup-${new Date().toISOString().slice(0, 10)}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      
      toast.add({ type: "success", description: "Data exported successfully! 🎉" })
    } catch (err: any) {
      console.error(err)
      toast.add({ type: "error", description: err.message || "Failed to export data." })
    } finally {
      setBackupLoading(false)
    }
  }

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setBackupLoading(true)
    const token = getCookie("token")
    const reader = new FileReader()
    
    reader.onload = async (event) => {
      try {
        const jsonContent = JSON.parse(event.target?.result as string)
        
        const res = await fetch(`${API_URL}/api/users/me/import`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(jsonContent)
        })

        if (!res.ok) throw new Error("Failed to import data")

        toast.add({ type: "success", description: "Data imported successfully! The page will reload..." })
        
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } catch (err: any) {
        console.error(err)
        toast.add({ type: "error", description: err.message || "Invalid backup file format." })
      } finally {
        setBackupLoading(false)
        e.target.value = ""
      }
    }

    reader.readAsText(file)
  }

  const getTodayDayOfWeek = () => {
    const day = new Date().getDay()
    return day === 0 ? 7 : day // Map Sunday (0) to 7
  }

  React.useEffect(() => {
    const token = getCookie("token")
    if (!token) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      try {
        const currentYear = new Date().getFullYear()

        // Parallel asynchronous fetches
        const mePromise = fetch(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.ok ? res.json() : null)

        const customHolidaysPromise = fetch(`${API_URL}/api/custom-holidays`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.ok ? res.json() : [])

        const natHolidaysPromise = fetch(`${API_URL}/api/semesters/holidays?year=${currentYear}`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(async res => {
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data)) return data
            if (data && Array.isArray(data.data)) return data.data
            if (data && Array.isArray(data.holidays)) return data.holidays
          }
          return []
        })

        const tasksPromise = fetch(`${API_URL}/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.ok ? res.json() : [])

        const semPromise = fetch(`${API_URL}/api/semesters`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(async res => {
          if (!res.ok) throw new Error("Failed to load semesters")
          const semestersData = await res.json()
          const activeSem = semestersData.find((s: any) => s.isActive) || semestersData[0]
          
          let coursesData: any[] = []
          if (activeSem) {
            const coursesRes = await fetch(`${API_URL}/api/semesters/${activeSem.id}/courses`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (coursesRes.ok) {
              coursesData = await coursesRes.json()
            }
          }
          return { semestersData, activeSem, coursesData }
        })

        const [userData, cHolidays, nHolidays, tasksData, semResult] = await Promise.all([
          mePromise,
          customHolidaysPromise,
          natHolidaysPromise,
          tasksPromise,
          semPromise
        ])

        if (userData) setCurrentUser(userData)
        setCustomHolidays(cHolidays)
        setNationalHolidays(nHolidays)

        const now = new Date()
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
        
        // Find custom holiday for today
        const activeCustomHoliday = cHolidays.find((h: any) => todayStr >= h.startDate && todayStr <= h.endDate)
        
        // Find national holiday for today
        const activeNationalHoliday = nHolidays.find((h: any) => h.holiday_date === todayStr)

        const holidayName = activeCustomHoliday?.name || activeNationalHoliday?.holiday_name || null
        setTodayHolidayName(holidayName)

        const { semestersData, activeSem, coursesData } = semResult
        setActiveSemester(activeSem)
        setCourses(coursesData)

        if (activeSem && coursesData.length > 0) {
          // Extract today's schedules
          const todayNum = getTodayDayOfWeek()
          const todayScheds: any[] = []

          coursesData.forEach((course: any) => {
            if (course.schedules && Array.isArray(course.schedules)) {
              course.schedules.forEach((s: any) => {
                if (s.dayOfWeek === todayNum) {
                  const exception = s.exceptions?.find((e: any) => e.date === todayStr)
                  let isCancelled = false
                  let isMoved = false
                  let targetStartTime = s.startTime
                  let targetEndTime = s.endTime
                  let targetRoom = s.room
                  let targetLink = s.link
                  let note = ""

                  if (exception) {
                    if (exception.type === "CANCELLED") {
                      isCancelled = true
                    } else if (exception.type === "MOVED") {
                      isMoved = true
                      if (exception.newStartTime) targetStartTime = exception.newStartTime
                      if (exception.newEndTime) targetEndTime = exception.newEndTime
                      if (exception.newRoom) targetRoom = exception.newRoom
                      if (exception.newLink) targetLink = exception.newLink
                    }
                    note = exception.note || ""
                  }

                  todayScheds.push({ 
                    ...s, 
                    startTime: targetStartTime,
                    endTime: targetEndTime,
                    room: targetRoom,
                    link: targetLink,
                    courseName: course.name, 
                    courseCode: course.code,
                    isCancelled,
                    isMoved,
                    note,
                    isHoliday: !!holidayName
                  })
                }
              })
            }
          })
          // Sort schedules by start time
          todayScheds.sort((a, b) => a.startTime.localeCompare(b.startTime))
          setTodaySchedules(todayScheds)
        }

        // Sort by deadline, only pending/in progress tasks
        const pending = tasksData
          .filter((t: any) => t.status !== "DONE")
          .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        setPendingTasks(pending)

        setLoading(false)
      } catch (err: any) {
        toast.add({ type: "error", description: err.message || "Failed to load dashboard data" })
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0)
  const todayLabel = DAYS_OF_WEEK.find((d) => d.value === getTodayDayOfWeek())?.label || "Today"

  // Format date helper
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6 animate-pulse">
        <div className="flex flex-col gap-6 px-4 lg:px-6">
          {/* Header Skeleton */}
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-64 rounded-lg" />
            <Skeleton className="h-4 w-96 rounded-lg" />
          </div>

          {/* Metrics Grid Skeleton */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border border-border/60 shadow-xs">
                <CardContent className="py-5 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24 rounded-lg" />
                    <Skeleton className="h-6 w-32 rounded-lg" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Schedule & Tasks Grid Skeleton */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Today's Schedule Card Skeleton */}
            <Card className="border border-border/60 shadow-xs flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-48 rounded-lg" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-64 rounded-lg mt-1" />
              </CardHeader>
              <CardContent className="pt-4 flex-1 space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex gap-4 items-start p-3 rounded-xl border border-border/50">
                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4 rounded-lg" />
                      <Skeleton className="h-3 w-1/2 rounded-lg" />
                      <div className="flex gap-2 mt-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Tasks Card Skeleton */}
            <Card className="border border-border/60 shadow-xs flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-48 rounded-lg" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-64 rounded-lg mt-1" />
              </CardHeader>
              <CardContent className="pt-4 flex-1 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-4 items-start p-3 rounded-xl border border-border/50">
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <Skeleton className="h-4 w-1/2 rounded-lg" />
                        <Skeleton className="h-5 w-12 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-2/3 rounded-lg" />
                      <Skeleton className="h-3 w-1/3 rounded-lg" />
                    </div>
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
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        {/* Header Section */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Academic Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {activeSemester 
              ? `Currently tracking ${activeSemester.name} (Active)` 
              : "Create a semester to start tracking your academic progress."}
          </p>
        </div>

        {/* WhatsApp Connection Alert for Class role */}
        {currentUser?.role === "CLASS" && !currentUser?.whatsappGroupId && (
          <Card className="border-warning/60 bg-warning/5 border shadow-sm font-sans">
            <CardHeader className="pb-2">
              <CardTitle className="text-warning text-base font-bold flex items-center gap-2">
                <HugeiconsIcon icon={AlertCircleIcon} className="h-5 w-5 text-warning" />
                WhatsApp Group Connection Required
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                To start managing semesters, schedules, and tasks for your class, you must connect this account to a WhatsApp group.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="text-xs space-y-2 border-l-2 border-primary/40 pl-3 py-1 text-muted-foreground">
                <p><strong>Step 1:</strong> Add our WhatsApp Bot to your WhatsApp class group chat.</p>
                <p><strong>Step 2:</strong> Type the command <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-primary font-semibold">/classid</code> inside that group.</p>
                <p><strong>Step 3:</strong> The bot will reply with the Group ID. Copy it and paste it below.</p>
              </div>

              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="e.g. 12036321234567@g.us"
                  id="wa-group-id-input"
                  className="bg-background border border-border/80 rounded-lg px-3 py-2 text-xs w-full focus:outline-none focus:border-primary/60 font-mono"
                />
                <Button
                  size="sm"
                  onClick={async () => {
                    const inputEl = document.getElementById("wa-group-id-input") as HTMLInputElement;
                    const jid = inputEl?.value?.trim();
                    if (!jid) return;
                    
                    const token = getCookie("token");
                    try {
                      const res = await fetch(`${API_URL}/api/users/whatsapp-group`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ whatsappGroupId: jid }),
                      });
                      if (!res.ok) throw new Error("Failed to connect");
                      const updated = await res.json();
                      setCurrentUser(updated);
                      window.location.reload();
                    } catch (err: any) {
                      alert(err.message || "Failed to link WhatsApp group");
                    }
                  }}
                >
                  Connect Group
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metrics Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-sans">
          <Card className="bg-linear-to-tr from-primary/5 to-card border border-border/60 shadow-xs">
            <CardContent className="py-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground block">Active Semester</span>
                <span className="text-lg font-bold text-foreground block">{activeSemester ? activeSemester.name : "-"}</span>
              </div>
              <div className="rounded-lg p-2.5 bg-primary/10 text-primary">
                <HugeiconsIcon icon={Calendar02Icon} className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-tr from-primary/5 to-card border border-border/60 shadow-xs">
            <CardContent className="py-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground block">Courses Enrolled</span>
                <span className="text-2xl font-bold text-foreground block">{courses.length}</span>
              </div>
              <div className="rounded-lg p-2.5 bg-primary/10 text-primary">
                <HugeiconsIcon icon={Book02Icon} className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-tr from-primary/5 to-card border border-border/60 shadow-xs">
            <CardContent className="py-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground block">Total SKS (Credits)</span>
                <span className="text-2xl font-bold text-foreground block">{totalCredits} SKS</span>
              </div>
              <div className="rounded-lg p-2.5 bg-primary/10 text-primary">
                <HugeiconsIcon icon={Database01Icon} className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-tr from-primary/5 to-card border border-border/60 shadow-xs">
            <CardContent className="py-5 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground block">Pending Tasks</span>
                <span className="text-2xl font-bold text-foreground block">{pendingTasks.length}</span>
              </div>
              <div className="rounded-lg p-2.5 bg-primary/10 text-primary">
                <HugeiconsIcon icon={AlertCircleIcon} className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic content sections */}
        <div className="grid gap-6 md:grid-cols-2 font-sans">
          {/* Today's Schedule Card */}
          <Card className="border border-border/60 shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-bold">Today's Class Schedule</CardTitle>
                <Badge variant="secondary" className="font-semibold text-xs">
                  {todayLabel}
                </Badge>
              </div>
              <CardDescription>Your classes scheduled for today.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-1">
              {todayHolidayName && (
                <div className="mb-4 p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 font-sans">
                  <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>Holiday: {todayHolidayName} (Classes cancelled)</span>
                </div>
              )}
              {todaySchedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <HugeiconsIcon icon={SchoolIcon} className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold">No classes today</span>
                  <span className="text-xs max-w-xs">Enjoy your free time or use this day to catch up on assignments.</span>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {todaySchedules.map((s) => (
                    <div 
                      key={s.id} 
                      className={`flex flex-col gap-1.5 p-3.5 rounded-xl border transition-all ${
                        s.isCancelled || s.isHoliday
                          ? "border-destructive/20 bg-destructive/5 opacity-70" 
                          : s.isMoved
                            ? "border-amber-500/40 bg-amber-500/5"
                            : "border-border/60 bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-bold text-sm text-foreground block ${s.isCancelled || s.isHoliday ? "line-through text-muted-foreground" : ""}`}>
                              {s.courseName}
                            </span>
                            {s.isCancelled && (
                              <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4 font-semibold">
                                Cancelled
                              </Badge>
                            )}
                            {s.isHoliday && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30">
                                Holiday
                              </Badge>
                            )}
                            {s.isMoved && !s.isHoliday && (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                                Rescheduled
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-primary font-semibold font-mono block">{s.courseCode}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`flex items-center gap-1.5 justify-end text-xs font-semibold ${s.isCancelled || s.isHoliday ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            <HugeiconsIcon icon={Clock01Icon} className="h-3.5 w-3.5 text-primary" />
                            <span>{s.startTime} - {s.endTime}</span>
                          </div>
                          {s.room && (
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                              {s.room.toLowerCase().includes("room") || s.room.toLowerCase().includes("lab") ? s.room : `Room ${s.room}`}
                            </span>
                          )}
                        </div>
                      </div>
                      {s.note && (
                        <div className="text-[10px] text-muted-foreground border-t border-border/30 pt-1.5 mt-0.5 italic flex items-start gap-1">
                          <span className="font-semibold shrink-0">Note:</span>
                          <span>{s.note}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t border-border/40 bg-muted/10">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs font-semibold text-primary hover:text-primary hover:bg-primary/5"
                onClick={() => router.push("/schedules")}
              >
                View Full Weekly Timetable
                <HugeiconsIcon icon={ArrowRight01Icon} className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Upcoming Tasks Card */}
          <Card className="border border-border/60 shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-lg font-bold">Upcoming Assignments</CardTitle>
              <CardDescription>Pending tasks sorted by closest deadline.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-1">
              {pendingTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <HugeiconsIcon icon={CircleCheckIcon} className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold">All caught up!</span>
                  <span className="text-xs max-w-xs">You have no pending assignments. Great job!</span>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {pendingTasks.slice(0, 3).map((task) => {
                    const matchedCourse = courses.find((c) => c.id === task.courseId)
                    const isHigh = task.priority === "HIGH"
                    return (
                      <div 
                        key={task.id} 
                        className={`p-3.5 rounded-xl border flex flex-col gap-2 bg-card ${
                          isHigh ? "border-destructive/40 bg-destructive/5" : "border-border/60"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-sm text-foreground block">{task.title}</span>
                            {matchedCourse && (
                              <span className="text-[10px] text-primary font-semibold font-mono block">
                                {matchedCourse.name}
                              </span>
                            )}
                          </div>
                          <Badge 
                            variant={isHigh ? "destructive" : "outline"} 
                            className="font-bold text-[9px] uppercase shrink-0"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 border-t pt-2 border-border/40">
                          <div className="flex items-center gap-1.5">
                            <HugeiconsIcon icon={Calendar02Icon} className="h-3.5 w-3.5 text-primary/70" />
                            <span>Due: {formatDate(task.deadline)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
            <div className="p-4 border-t border-border/40 bg-muted/10">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs font-semibold text-primary hover:text-primary hover:bg-primary/5"
                onClick={() => router.push("/tasks")}
              >
                Manage All Tasks & Goals
                <HugeiconsIcon icon={ArrowRight01Icon} className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Reminders Settings Card */}
        {currentUser && (
          <RemindersSettings
            initialData={{
              remindersEnabled: currentUser.remindersEnabled,
              semesterTransitionEnabled: currentUser.semesterTransitionEnabled,
              scheduleReminderOffsets: currentUser.scheduleReminderOffsets || [360, 180, 60],
              taskReminderOffsets: currentUser.taskReminderOffsets || [1440, 720],
              notificationChannel: currentUser.notificationChannel || "EMAIL",
              whatsappNumber: currentUser.whatsappNumber || "",
              whatsappJid: currentUser.whatsappJid || "",
              userRole: currentUser.role
            }}
            onSaveSuccess={async () => {
              const token = getCookie("token");
              const res = await fetch(`${API_URL}/api/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (res.ok) {
                const updated = await res.json();
                setCurrentUser(updated);
              }
            }}
          />
        )}

        {/* Backup & Data Portability Card */}
        {currentUser && (
          <Card className="border-border/60 font-sans shadow-xs mt-6">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <HugeiconsIcon icon={Database01Icon} className="h-5 w-5 text-primary" />
                Data Backup & Portability
              </CardTitle>
              <CardDescription>
                Export all your academic semesters, courses, schedules, and tasks into a backup JSON file, or restore them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-normal">
                Export your data as a backup that can be securely imported back into this account or another Man Education account. Relationships between semesters, courses, schedules, and tasks will be maintained automatically.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {/* Export Button */}
                <Button
                  onClick={handleExportData}
                  disabled={backupLoading}
                  className="flex-1 font-semibold"
                >
                  <HugeiconsIcon icon={Download01Icon} className="mr-2 h-4 w-4" />
                  {backupLoading ? "Exporting..." : "Export Data (JSON)"}
                </Button>
 
                {/* Import Button / File Input */}
                <div className="flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full font-semibold border-dashed hover:bg-muted/50"
                    disabled={backupLoading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <HugeiconsIcon icon={Upload01Icon} className="mr-2 h-4 w-4" />
                    {backupLoading ? "Importing..." : "Import Data (JSON)"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
