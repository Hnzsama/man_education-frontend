"use client"
import * as React from "react"
import { API_URL } from "@/lib/config"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar02Icon,
  CircleCheckIcon,
  PencilEdit01Icon,
  Delete02Icon,
  UserGroupIcon,
  File01Icon,
  Link01Icon,
  NoteIcon,
} from "@hugeicons/core-free-icons"

interface TaskDetailSheetProps {
  task: any | null
  courses: any[]
  isOpen: boolean
  onClose: () => void
  formatDate: (date: string) => string
  onEditClick: (task: any) => void
  onDeleteClick: (id: string) => void
  onQuickComplete: (task: any) => void
}

export function TaskDetailSheet({
  task,
  courses,
  isOpen,
  onClose,
  formatDate,
  onEditClick,
  onDeleteClick,
  onQuickComplete,
}: TaskDetailSheetProps) {
  if (!task) return null

  const matchedCourse = courses.find((c: any) => c.id === task.courseId)
  const isDone = task.status === "DONE"
  const isProgress = task.status === "IN_PROGRESS"

  const allMaterials = [
    ...(task.attachments || []).map((a: any) => ({ ...a, _isLegacy: true })),
    ...((task.resources || []).filter((r: any) => r.type === "FILE")).map((r: any) => ({
      ...r,
      _isLegacy: false,
      name: r.fileName || r.title,
      fileType: r.mimeType || "application/octet-stream",
    })),
  ]

  const submission = (task.submissions || [])[0] ?? null

  const statusColor = isDone
    ? "text-green-500 bg-green-500/10 border-green-500/30"
    : isProgress
    ? "text-blue-500 bg-blue-500/10 border-blue-500/30"
    : "text-amber-500 bg-amber-500/10 border-amber-500/30"

  const priorityColor =
    task.priority === "HIGH"
      ? "text-red-500 bg-red-500/10 border-red-500/30"
      : task.priority === "MEDIUM"
      ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/30"
      : "text-slate-500 bg-slate-500/10 border-slate-500/30"

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg flex flex-col h-full overflow-hidden p-0">
        {/* Header */}
        <SheetHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <SheetTitle
                className={`text-lg font-bold leading-tight ${isDone ? "line-through text-muted-foreground" : ""}`}
              >
                {task.title}
              </SheetTitle>
              {matchedCourse && (
                <span className="text-xs text-primary font-semibold font-mono">
                  {matchedCourse.name} ({matchedCourse.code})
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5 items-end shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${statusColor}`}>
                {task.status.replace("_", " ")}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${priorityColor}`}>
                {task.priority}
              </span>
            </div>
          </div>
          <SheetDescription className="sr-only">Detail informasi task</SheetDescription>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Deadline */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={Calendar02Icon} className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Deadline</span>
              <span className="text-sm font-semibold">{formatDate(task.deadline)}</span>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div className="flex gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={NoteIcon} className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-1 pt-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Deskripsi</span>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{task.description}</p>
              </div>
            </div>
          )}

          {/* Task Type & Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-muted/20 p-3 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tipe Tugas</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <HugeiconsIcon
                  icon={task.isGroupTask ? UserGroupIcon : File01Icon}
                  className={`h-4 w-4 ${task.isGroupTask ? "text-indigo-500" : "text-muted-foreground"}`}
                />
                <span className="text-sm font-semibold">{task.isGroupTask ? "Kelompok" : "Individu"}</span>
              </div>
              {task.isGroupTask && task.myPart && (
                <span className="text-[11px] text-muted-foreground italic mt-0.5">Bagian saya: {task.myPart}</span>
              )}
            </div>
            {task.weightPercentage != null && (
              <div className="rounded-xl border bg-amber-500/5 border-amber-500/20 p-3 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Bobot Nilai</span>
                <span className="text-2xl font-black text-amber-500">{task.weightPercentage}%</span>
              </div>
            )}
          </div>

          {/* Submission Method */}
          <div className="rounded-xl border bg-muted/20 p-3 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Metode Pengumpulan</span>
            <div className="flex items-center justify-between gap-2 mt-1">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Link01Icon} className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-bold">{task.submissionMethod}</span>
              </div>
              {task.submissionLink && (
                <a
                  href={task.submissionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Buka Link →
                </a>
              )}
            </div>
          </div>

          {/* Attachments / Materials */}
          {allMaterials.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Attachments / Material ({allMaterials.length})
              </span>
              <div className="flex flex-col gap-2">
                {allMaterials.map((att: any) => {
                  const isLink = att.fileType === "link"
                  const fileType = att.fileType || att.mimeType || ""
                  const isImage = !isLink && fileType.startsWith("image/")
                  const fileUrl = isLink
                    ? att.filePath
                    : att._isLegacy
                    ? `${API_URL}/uploads/tasks/${att.filePath}`
                    : `${API_URL}/uploads/resources/${att.filePath}`
                  const displayName = att.name || att.title || "File"
                  const sizeKb = !isLink && att.fileSize ? (att.fileSize / 1024).toFixed(1) : null

                  return (
                    <a
                      key={att.id}
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-2.5 hover:bg-muted/40 transition-colors"
                    >
                      {isLink ? (
                        <div className="h-10 w-10 rounded-lg border border-sky-500/30 bg-sky-500/10 flex items-center justify-center text-sky-500 shrink-0">
                          <HugeiconsIcon icon={Link01Icon} className="h-5 w-5" />
                        </div>
                      ) : isImage ? (
                        <img src={fileUrl} alt={displayName} className="h-10 w-10 rounded-lg object-cover border border-border/70 shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg border border-border/70 bg-muted/65 flex items-center justify-center text-primary shrink-0">
                          <HugeiconsIcon icon={File01Icon} className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate" title={displayName}>{displayName}</span>
                        {isLink ? (
                          <span className="text-[10px] text-sky-500 truncate max-w-[280px]">{att.filePath}</span>
                        ) : (
                          sizeKb && <span className="text-[10px] text-muted-foreground">{sizeKb} KB</span>
                        )}
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* Submissions */}
          {submission && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">Submissions</span>
              {submission.submissionLink && (
                <a
                  href={submission.submissionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2.5 hover:bg-emerald-500/10 transition-colors"
                >
                  <div className="h-8 w-8 rounded-lg border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={Link01Icon} className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Submission Link</span>
                    <span className="text-sm font-medium truncate" title={submission.submissionLink}>{submission.submissionLink}</span>
                  </div>
                </a>
              )}
              {(submission.files || []).map((file: any) => {
                const isImage = file.fileType?.startsWith("image/")
                const fileUrl = `${API_URL}/uploads/submissions/${file.filePath}`
                return (
                  <a
                    key={file.id}
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-sky-500/30 bg-sky-500/5 p-2.5 hover:bg-sky-500/10 transition-colors"
                  >
                    {isImage ? (
                      <img src={fileUrl} alt={file.name} className="h-10 w-10 rounded-lg object-cover border border-sky-500/30 shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg border border-sky-500/40 bg-sky-500/10 flex items-center justify-center text-sky-500 shrink-0">
                        <HugeiconsIcon icon={File01Icon} className="h-5 w-5" />
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate" title={file.name}>{file.name}</span>
                      {file.fileSize && <span className="text-[10px] text-muted-foreground">{(file.fileSize / 1024).toFixed(1)} KB</span>}
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 px-6 py-4 border-t flex items-center justify-between gap-3 bg-muted/10">
          {!isDone ? (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 px-3 text-primary border-primary/40 hover:bg-primary/10 font-medium gap-1.5"
              onClick={() => { onQuickComplete(task); onClose() }}
            >
              <HugeiconsIcon icon={CircleCheckIcon} className="h-3.5 w-3.5" />
              Mark Done
            </Button>
          ) : (
            <span className="text-[11px] text-green-500 font-semibold flex items-center gap-1.5">
              <HugeiconsIcon icon={CircleCheckIcon} className="h-4 w-4" />
              Completed
            </span>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => { onEditClick(task); onClose() }}
            >
              <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 gap-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => { onDeleteClick(task.id); onClose() }}
            >
              <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
              Hapus
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
