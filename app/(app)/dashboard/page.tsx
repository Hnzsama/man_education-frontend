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
  GraduationCapIcon
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
        // Fetch current user details
        const meRes = await fetch(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (meRes.ok) {
          const meData = await meRes.json()
          setCurrentUser(meData)
        }

        // 1. Fetch semesters to find active one
        const semRes = await fetch(`${API_URL}/api/semesters`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!semRes.ok) throw new Error("Failed to load semesters")
        const semesters = await semRes.json()
        const activeSem = semesters.find((s: any) => s.isActive) || semesters[0]
        setActiveSemester(activeSem)

        if (activeSem) {
          // 2. Fetch courses under the active semester
          const coursesRes = await fetch(`${API_URL}/api/semesters/${activeSem.id}/courses`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (coursesRes.ok) {
            const coursesData = await coursesRes.json()
            setCourses(coursesData)

            // Extract today's schedules
            const todayNum = getTodayDayOfWeek()
            const todayScheds: any[] = []
            coursesData.forEach((course: any) => {
              if (course.schedules && Array.isArray(course.schedules)) {
                course.schedules.forEach((s: any) => {
                  if (s.dayOfWeek === todayNum) {
                    todayScheds.push({ ...s, courseName: course.name, courseCode: course.code })
                  }
                })
              }
            })
            // Sort schedules by start time
            todayScheds.sort((a, b) => a.startTime.localeCompare(b.startTime))
            setTodaySchedules(todayScheds)
          }
        }

        // 3. Fetch all tasks to filter pending ones
        const tasksRes = await fetch(`${API_URL}/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          // Sort by deadline, only pending/in progress tasks
          const pending = tasksData
            .filter((t: any) => t.status !== "DONE")
            .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
          setPendingTasks(pending)
        }

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
      <div className="flex min-h-screen items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="text-muted-foreground text-sm">Loading dashboard details...</span>
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
                      className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-sm text-foreground block">{s.courseName}</span>
                        <span className="text-[10px] text-primary font-semibold font-mono block">{s.courseCode}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1.5 justify-end text-xs text-foreground font-semibold">
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
      </div>
    </div>
  )
}
