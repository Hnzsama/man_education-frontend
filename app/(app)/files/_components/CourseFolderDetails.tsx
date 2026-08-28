"use client"
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Folder01Icon,
  ArrowLeft01Icon,
  Add01Icon,
  Attachment01Icon,
  BookOpen01Icon,
  File01Icon,
  Link01Icon,
  NoteIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { AddResourceDialog } from "./AddResourceDialog"

function formatBytes(bytes?: number | null) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface CourseFolderDetailsProps {
  selectedCourse: any
  courses: any[]
  courseTasks: any[]
  courseResources: any[]
  coursePalette: string[]
  typeColors: Record<string, string>
  apiUrl: string
  onBack: () => void
  onSelectTask: (task: any) => void
  onDeleteResource: (id: string) => void

  // Dialog State & Handlers
  addOpen: boolean
  setAddOpen: (open: boolean) => void
  addType: string
  setAddType: (type: string) => void
  addTitle: string
  setAddTitle: (title: string) => void
  addDesc: string
  setAddDesc: (desc: string) => void
  addUrl: string
  setAddUrl: (url: string) => void
  addTaskId: string
  setAddTaskId: (id: string) => void
  addFile: File | null
  setAddFile: (file: File | null) => void
  dragOver: boolean
  setDragOver: (dragOver: boolean) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  addLoading: boolean
  onAddSubmit: (e: React.FormEvent) => void
}

export function CourseFolderDetails({
  selectedCourse,
  courses,
  courseTasks,
  courseResources,
  coursePalette,
  typeColors,
  apiUrl,
  onBack,
  onSelectTask,
  onDeleteResource,
  addOpen,
  setAddOpen,
  addType,
  setAddType,
  addTitle,
  setAddTitle,
  addDesc,
  setAddDesc,
  addUrl,
  setAddUrl,
  addTaskId,
  setAddTaskId,
  addFile,
  setAddFile,
  dragOver,
  setDragOver,
  fileInputRef,
  addLoading,
  onAddSubmit,
}: CourseFolderDetailsProps) {
  const palette = coursePalette[courses.findIndex((c) => c.id === selectedCourse.id) % coursePalette.length]

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Course Header Banner */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={onBack}>
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
        </Button>
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-gradient-to-r ${palette} flex-1`}>
          <HugeiconsIcon icon={Folder01Icon} className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight">{selectedCourse.name}</p>
            <p className="text-[11px] font-mono opacity-70">{selectedCourse.code}</p>
          </div>
          <Button
            size="sm"
            className="ml-auto h-8 text-xs gap-1.5 shrink-0"
            onClick={() => {
              setAddOpen(true)
              setAddType("FILE")
              setAddTitle("")
              setAddDesc("")
              setAddUrl("")
              setAddTaskId("none")
              setAddFile(null)
            }}
          >
            <HugeiconsIcon icon={Add01Icon} className="h-3.5 w-3.5" />
            Add Material
          </Button>
        </div>
      </div>

      {/* SECTION A: TASK FOLDERS */}
      <div className="flex flex-col gap-3">
        <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <HugeiconsIcon icon={Attachment01Icon} className="h-4 w-4" />
          Task Submission Folders
        </h2>
        {courseTasks.length === 0 ? (
          <p className="text-xs text-muted-foreground bg-muted/10 border rounded-xl p-4 text-center">No tasks in this course.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courseTasks.map((task) => {
              const attCount = task.attachments?.length || 0
              return (
                <button
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 hover:border-primary/40 hover:shadow-sm text-left transition-all"
                >
                  <HugeiconsIcon icon={Folder01Icon} className="h-9 w-9 text-amber-500 shrink-0 group-hover:scale-105 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate">{task.title}</p>
                    <span className="text-[10px] text-muted-foreground">{attCount} files submitted</span>
                  </div>
                  {attCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* SECTION B: GENERAL MATERIALS */}
      <div className="flex flex-col gap-3">
        <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <HugeiconsIcon icon={BookOpen01Icon} className="h-4 w-4" />
          Lecture Materials (General)
        </h2>
        {courseResources.length === 0 ? (
          <p className="text-xs text-muted-foreground bg-muted/10 border rounded-xl p-4 text-center">No materials available. Add a new material above.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courseResources.map((r) => {
              const isFile = r.type === "FILE"
              const isLink = r.type === "LINK"
              const fileUrl = isFile && r.filePath ? `${apiUrl}/uploads/resources/${r.filePath}` : null

              return (
                <div key={r.id} className="group flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all">
                  <div className="flex items-start gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${typeColors[r.type]}`}>
                      <HugeiconsIcon icon={isFile ? File01Icon : isLink ? Link01Icon : NoteIcon} className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs truncate" title={r.title}>{r.title}</p>
                      {r.description && <p className="text-[10px] text-muted-foreground line-clamp-1">{r.description}</p>}
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-all shrink-0" onClick={() => onDeleteResource(r.id)}>
                      <HugeiconsIcon icon={Delete02Icon} className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-semibold mt-1">
                    {isFile && fileUrl ? (
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Download ({formatBytes(r.fileSize)})</a>
                    ) : isLink && r.url ? (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-[150px]">{r.url}</a>
                    ) : (
                      <span className="text-muted-foreground">Note</span>
                    )}
                    <span className="text-muted-foreground/60">{r.uploadStatus}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <AddResourceDialog
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        course={selectedCourse}
        tasks={courseTasks}
        addType={addType} setAddType={setAddType}
        addTitle={addTitle} setAddTitle={setAddTitle}
        addDesc={addDesc} setAddDesc={setAddDesc}
        addUrl={addUrl} setAddUrl={setAddUrl}
        addTaskId={addTaskId} setAddTaskId={setAddTaskId}
        addFile={addFile} setAddFile={setAddFile}
        dragOver={dragOver} setDragOver={setDragOver}
        fileInputRef={fileInputRef}
        addLoading={addLoading}
        onSubmit={onAddSubmit}
      />
    </div>
  )
}
