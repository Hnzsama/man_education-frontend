"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar02Icon,
  Add01Icon,
  Location01Icon,
  Clock01Icon,
  File01Icon,
  Link01Icon
} from "@hugeicons/core-free-icons"

// Convert Date to YYYY-MM-DD local string safely
const toDateStr = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

interface AgendaSidebarProps {
  selectedDate: Date
  holidays: any[]
  customHolidays: any[]
  pendingCount: number
  completedCount: number
  upcomingTasks: any[]
  filteredTasksForOverview: any[]
  overviewScope: "month" | "semester" | "all"
  setOverviewScope: (scope: "month" | "semester" | "all") => void
  month: number
  MONTHS: string[]
  openAddSheet: (date?: Date) => void
  openEditSheet: (task: any) => void
  courseColorMap: Record<string, number>
  COURSE_COLORS: Array<{ bg: string, text: string, border: string }>
  getItems: (date: Date) => any[]
  setSelectedSchedule: (item: any) => void
  setExcType: (type: string) => void
  setExcNewStartTime: (time: string) => void
  setExcNewEndTime: (time: string) => void
  setExcNewRoom: (room: string) => void
  setExcNewLink: (link: string) => void
  setExcNote: (note: string) => void
  setExcDate: (date: string) => void
  setExceptionSheetOpen: (open: boolean) => void
}

export function AgendaSidebar({
  selectedDate,
  holidays,
  customHolidays,
  pendingCount,
  completedCount,
  upcomingTasks,
  filteredTasksForOverview,
  overviewScope,
  setOverviewScope,
  month,
  MONTHS,
  openAddSheet,
  openEditSheet,
  courseColorMap,
  COURSE_COLORS,
  getItems,
  setSelectedSchedule,
  setExcType,
  setExcNewStartTime,
  setExcNewEndTime,
  setExcNewRoom,
  setExcNewLink,
  setExcNote,
  setExcDate,
  setExceptionSheetOpen,
}: AgendaSidebarProps) {
  return (
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
          const ds = toDateStr(selectedDate)
          const holiday = holidays.find((h: any) => h.date === ds)
          const customHoliday = customHolidays.find((ch: any) => {
            return ds >= ch.startDate && ds <= ch.endDate
          })

          if (holiday) {
            return (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-start gap-1.5 animate-in fade-in duration-200">
                <HugeiconsIcon icon={Calendar02Icon} className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Hari Libur</p>
                  <p className="text-[11px] font-normal leading-normal">{holiday.description}</p>
                </div>
              </div>
            )
          }

          if (customHoliday) {
            return (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-start gap-1.5 animate-in fade-in duration-200">
                <HugeiconsIcon icon={Location01Icon} className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Libur Kampus</p>
                  <p className="text-[11px] font-normal leading-normal">{customHoliday.name}</p>
                </div>
              </div>
            )
          }
          return null
        })()}

        {/* Items list */}
        {(() => {
          const items = getItems(selectedDate)
          if (items.length === 0) {
            return (
              <p className="text-xs text-muted-foreground text-center py-4">Tidak ada agenda hari ini</p>
            )
          }

          return (
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {items.map((item) => {
                const isTask = item.type === "task"
                if (!isTask) {
                  const c = COURSE_COLORS[courseColorMap[item.courseId] ?? 0]
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedSchedule(item)
                        setExcType(item.exception?.type ?? "CANCELLED")
                        setExcNewStartTime(item.exception?.newStartTime ?? item.time)
                        setExcNewEndTime(item.exception?.newEndTime ?? item.endTime ?? "")
                        setExcNewRoom(item.exception?.newRoom ?? item.room ?? "")
                        setExcNewLink(item.exception?.newLink ?? item.link ?? "")
                        setExcNote(item.exception?.note ?? "")
                        setExcDate(item.exception?.date ?? toDateStr(selectedDate))
                        setExceptionSheetOpen(true)
                      }}
                      className={`flex flex-col gap-1 rounded-xl p-2.5 text-xs font-semibold border transition-all cursor-pointer hover:ring-[1.5px] hover:ring-primary/40
                        ${item.isHoliday 
                          ? "bg-muted text-muted-foreground/50 border-muted-foreground/10 opacity-50" 
                          : `${c.bg} ${c.text} ${c.border}`
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={Clock01Icon} className="h-3.5 w-3.5 shrink-0 opacity-70" />
                        <div className="flex-1 min-w-0">
                          <p className={`truncate font-bold ${item.isCancelled ? 'line-through opacity-60' : ''}`}>
                            {item.exception?.type === 'CANCELLED' && '[Batal] '}
                            {item.exception?.type === 'MOVED' && '[Pindah] '}
                            {item.title}
                          </p>
                          <p className="text-[10px] opacity-70 flex items-center gap-1 flex-wrap">
                            <span>{item.time} WIB</span>
                            {item.isCancelled && <span>(Batal)</span>} 
                            {item.isHoliday && !item.isCancelled && <span>(Libur)</span>}
                            {item.room && (
                              <span className="flex items-center gap-0.5">
                                <span>·</span>
                                <HugeiconsIcon icon={Location01Icon} className="h-3 w-3 shrink-0 opacity-70" />
                                <span>{item.room}</span>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {item.exception?.note && (
                        <p className="text-[9.5px] text-rose-500 font-normal mt-0.5 border-t border-dashed border-rose-500/20 pt-1 flex items-center gap-1">
                          <HugeiconsIcon icon={File01Icon} className="h-3 w-3 shrink-0" />
                          <span>Catatan: {item.exception.note}</span>
                        </p>
                      )}
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[9.5px] text-blue-500 hover:underline mt-0.5 flex items-center gap-1 font-normal" onClick={(e) => e.stopPropagation()}>
                          <HugeiconsIcon icon={Link01Icon} className="h-3 w-3 shrink-0" />
                          <span>Link Kelas</span>
                        </a>
                      )}
                    </div>
                  )
                }

                const isDone = item.status === "DONE"
                const isHigh = item.priority === "HIGH"
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
                )
              })}
            </div>
          )
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
          <p className="text-xs text-muted-foreground text-center py-4">Tidak ada tugas mendatang</p>
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
  )
}
