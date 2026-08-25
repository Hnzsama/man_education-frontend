"use client"
import * as React from "react"
import { API_URL } from "@/lib/config"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar02Icon,
  CircleCheckIcon,
  PencilEdit01Icon,
  Delete02Icon,
  UserGroupIcon,
  File01Icon,
  Link01Icon
} from "@hugeicons/core-free-icons"

interface TaskCardProps {
  task: any
  courses: any[]
  formatDate: (date: string) => string
  handleQuickComplete: (task: any) => void
  handleEditClick: (task: any) => void
  handleDeleteClick: (id: string) => void
}

export function TaskCard({
  task,
  courses,
  formatDate,
  handleQuickComplete,
  handleEditClick,
  handleDeleteClick,
}: TaskCardProps) {
  const matchedCourse = courses.find((c) => c.id === task.courseId)
  const isDone = task.status === "DONE"
  const isHigh = task.priority === "HIGH"
  const isProgress = task.status === "IN_PROGRESS"

  return (
    <Card
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

        {/* Extra Details */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border/30">
          {/* Group vs Individual Task */}
          <div className="flex items-center gap-2 text-xs">
            <HugeiconsIcon
              icon={task.isGroupTask ? UserGroupIcon : File01Icon}
              className={`h-3.5 w-3.5 ${task.isGroupTask ? "text-indigo-500" : "text-muted-foreground/75"}`}
            />
            <span className="font-semibold text-muted-foreground">
              {task.isGroupTask ? "Tugas Kelompok" : "Tugas Individu"}
            </span>
            {task.weightPercentage && (
              <span className="ml-auto text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md">
                Bobot: {task.weightPercentage}%
              </span>
            )}
          </div>

          {/* My Part (if Group Task) */}
          {task.isGroupTask && task.myPart && (
            <div className="pl-[22px] text-[11px] text-muted-foreground italic leading-tight">
              Bagian saya: {task.myPart}
            </div>
          )}

          {/* Submission Info */}
          <div className="flex items-center gap-2 text-xs">
            <HugeiconsIcon icon={Link01Icon} className="h-3.5 w-3.5 text-muted-foreground/75" />
            <span className="text-muted-foreground">
              Metode: <strong className="font-bold">{task.submissionMethod}</strong>
            </span>
            {task.submissionLink && (
              <a
                href={task.submissionLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
              >
                Buka Link →
              </a>
            )}
          </div>

          {/* Attachments Display */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="pt-2.5 border-t border-border/30 space-y-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Attachments ({task.attachments.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {task.attachments.map((att: any) => {
                  const isImage = att.fileType.startsWith("image/")
                  const fileUrl = `${API_URL}/uploads/tasks/${att.filePath}`

                  return (
                    <div
                      key={att.id}
                      className="group relative flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 p-1.5 pr-2.5 text-xs hover:bg-muted/40 transition-colors max-w-full"
                    >
                      {isImage ? (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-8 w-8 rounded overflow-hidden border border-border/70 flex-shrink-0 cursor-zoom-in"
                        >
                          <img
                            src={fileUrl}
                            alt={att.name}
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-200"
                          />
                        </a>
                      ) : (
                        <div className="h-8 w-8 rounded border border-border/70 bg-muted/65 flex items-center justify-center text-primary flex-shrink-0 font-sans">
                          <HugeiconsIcon icon={File01Icon} className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0 pr-1">
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[11px] text-foreground hover:text-primary transition-colors truncate max-w-[120px] block"
                          title={att.name}
                        >
                          {att.name}
                        </a>
                        <span className="text-[9px] text-muted-foreground">
                          {(att.fileSize / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
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
}
