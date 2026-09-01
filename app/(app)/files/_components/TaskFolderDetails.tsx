"use client"
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Folder01Icon,
  ArrowLeft01Icon,
  Attachment01Icon,
  Upload01Icon,
  BookOpen01Icon,
  File01Icon,
  Link01Icon,
  NoteIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function formatBytes(bytes?: number | null) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface TaskFolderDetailsProps {
  selectedCourse: any
  selectedTask: any
  taskSubmission: any
  submissionLinkInput: string
  setSubmissionLinkInput: (link: string) => void
  savingLink: boolean
  subUploading: boolean
  subFileInputRef: React.RefObject<HTMLInputElement | null>
  attUploading: boolean
  attFileInputRef: React.RefObject<HTMLInputElement | null>
  taskResources: any[]
  apiUrl: string
  onBack: () => void
  onUploadSubFiles: (files: File[]) => void
  onDeleteSub: (fileId: string) => void
  onSaveSubmissionLink: () => void
  onUploadAttFiles: (files: File[]) => void
  onDeleteAtt: (attId: string) => void
}

export function TaskFolderDetails({
  selectedCourse,
  selectedTask,
  taskSubmission,
  submissionLinkInput,
  setSubmissionLinkInput,
  savingLink,
  subUploading,
  subFileInputRef,
  attUploading,
  attFileInputRef,
  taskResources,
  apiUrl,
  onBack,
  onUploadSubFiles,
  onDeleteSub,
  onSaveSubmissionLink,
  onUploadAttFiles,
  onDeleteAtt,
}: TaskFolderDetailsProps) {
  const [dragOverSub, setDragOverSub] = React.useState(false)
  const [dragOverAtt, setDragOverAtt] = React.useState(false)

  const isOverdue = selectedTask.deadline && new Date(selectedTask.deadline) < new Date() && selectedTask.status !== "DONE"

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onBack}>
          <HugeiconsIcon icon={ArrowLeft01Icon} className="h-4 w-4" />
        </Button>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{selectedCourse.name}</span>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-1.5">
            <HugeiconsIcon icon={Folder01Icon} className="h-5 w-5 text-amber-500 shrink-0" />
            <span>{selectedTask.title}</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sisi Kiri: File Pengumpulan (Tugas) */}
        <div className="flex flex-col gap-4 rounded-xl border bg-muted/5 p-5">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <HugeiconsIcon icon={Attachment01Icon} className="h-4 w-4 text-emerald-500" />
              Task Submissions
            </h2>
            {isOverdue && (
              <span className="text-[10px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                PAST DEADLINE
              </span>
            )}
          </div>

          <div
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all bg-background
              ${dragOverSub ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/50 hover:border-primary/50 hover:bg-muted/10"}
              ${subUploading ? "opacity-60 pointer-events-none" : ""}`}
            onClick={() => subFileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOverSub(true) }}
            onDragLeave={() => setDragOverSub(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragOverSub(false)
              if (e.dataTransfer.files.length > 0) onUploadSubFiles(Array.from(e.dataTransfer.files))
            }}
          >
            <HugeiconsIcon icon={Upload01Icon} className="h-7 w-7 text-muted-foreground/50" />
            <p className="text-xs font-semibold">{subUploading ? "Uploading…" : "Upload submission files"}</p>
            <p className="text-[10px] text-muted-foreground/60">PDF, Word, Image, ZIP · Max 10MB</p>
            <Input
              ref={subFileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files?.length) onUploadSubFiles(Array.from(e.target.files)) }}
            />
          </div>

          {/* Submission Link input */}
          <div className="flex flex-col gap-2 rounded-lg border bg-background p-3">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Submission Link (e.g. Google Drive/GitHub)</span>
            <div className="flex gap-2">
              <Input
                value={submissionLinkInput}
                onChange={(e) => setSubmissionLinkInput(e.target.value)}
                placeholder="https://..."
                className="h-8 text-xs flex-1"
              />
              <Button
                onClick={onSaveSubmissionLink}
                disabled={savingLink}
                size="sm"
                className="h-8 text-xs font-semibold"
              >
                {savingLink ? "Saving..." : "Save Link"}
              </Button>
            </div>
          </div>

          <div className="space-y-2 mt-2">
            {(!taskSubmission || (taskSubmission.files || []).length === 0) ? (
              <p className="text-xs text-muted-foreground text-center py-6">No submission files uploaded yet.</p>
            ) : (
              (taskSubmission.files || []).map((att: any) => {
                const isImage = att.fileType?.startsWith("image/")
                const fileUrl = `${apiUrl}/uploads/submissions/${att.filePath}`
                return (
                  <div key={att.id} className="group flex items-center gap-3 rounded-lg border bg-background p-2.5 hover:bg-muted/10 transition-all">
                    {isImage ? (
                      <img src={fileUrl} className="h-8 w-8 rounded object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-primary/5 border flex items-center justify-center shrink-0">
                        <HugeiconsIcon icon={File01Icon} className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-xs truncate block hover:text-primary">{att.name}</a>
                      <span className="text-[10px] text-muted-foreground">{formatBytes(att.fileSize)}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-all" onClick={() => onDeleteSub(att.id)}>
                      <HugeiconsIcon icon={Delete02Icon} className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Sisi Kanan: Referensi / Catatan Tambahan Terkait Tugas */}
        <div className="flex flex-col gap-4 rounded-xl border bg-muted/5 p-5">
          <h2 className="font-bold text-sm flex items-center gap-2">
            <HugeiconsIcon icon={BookOpen01Icon} className="h-4 w-4 text-primary" />
            Materials Related to this Task
          </h2>

          <div
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all bg-background
              ${dragOverAtt ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/50 hover:border-primary/50 hover:bg-muted/10"}
              ${attUploading ? "opacity-60 pointer-events-none" : ""}`}
            onClick={() => attFileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOverAtt(true) }}
            onDragLeave={() => setDragOverAtt(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragOverAtt(false)
              if (e.dataTransfer.files.length > 0) onUploadAttFiles(Array.from(e.dataTransfer.files))
            }}
          >
            <HugeiconsIcon icon={Upload01Icon} className="h-7 w-7 text-muted-foreground/50" />
            <p className="text-xs font-semibold">{attUploading ? "Uploading…" : "Upload task materials"}</p>
            <p className="text-[10px] text-muted-foreground/60">PDF, Word, Image, ZIP · Max 10MB</p>
            <Input
              ref={attFileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files?.length) onUploadAttFiles(Array.from(e.target.files)) }}
            />
          </div>

          <div className="space-y-2">
            {((selectedTask?.attachments || []).length === 0 && taskResources.length === 0) ? (
              <p className="text-xs text-muted-foreground text-center py-6">No materials attached to this task.</p>
            ) : (
              <>
                {/* Task Attachments (from teacher/creator) */}
                {(selectedTask?.attachments || []).map((att: any) => {
                  const isLink = att.fileType === "link"
                  const isImage = !isLink && att.fileType?.startsWith("image/")
                  const fileUrl = isLink ? att.filePath : `${apiUrl}/uploads/tasks/${att.filePath}`
                  return (
                    <div key={att.id} className="group flex items-center gap-3 rounded-lg border bg-background p-2.5 hover:bg-muted/10 transition-all">
                      {isLink ? (
                        <div className="h-8 w-8 rounded border border-sky-500/30 bg-sky-500/10 flex items-center justify-center shrink-0">
                          <HugeiconsIcon icon={Link01Icon} className="h-4 w-4 text-sky-500" />
                        </div>
                      ) : isImage ? (
                        <img src={fileUrl} className="h-8 w-8 rounded object-cover shrink-0" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-primary/5 border flex items-center justify-center shrink-0">
                          <HugeiconsIcon icon={File01Icon} className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-xs truncate block hover:text-primary hover:underline">{att.name}</a>
                        <span className="text-[9px] text-muted-foreground truncate block">{isLink ? att.filePath : formatBytes(att.fileSize)}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-all" onClick={() => onDeleteAtt(att.id)}>
                        <HugeiconsIcon icon={Delete02Icon} className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )
                })}

                {/* Course Resources linked to this task */}
                {taskResources.map((r: any) => (
                  <div key={r.id} className="group flex items-center gap-3 rounded-lg border bg-background p-2.5">
                    <HugeiconsIcon icon={r.type === "LINK" ? Link01Icon : r.type === "FILE" ? File01Icon : NoteIcon} className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs truncate">{r.title}</p>
                      {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary truncate block hover:underline">{r.url}</a>}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
