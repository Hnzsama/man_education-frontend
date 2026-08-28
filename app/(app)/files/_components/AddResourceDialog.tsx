"use client"
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Folder01Icon, File01Icon, Link01Icon, NoteIcon, Upload01Icon } from "@hugeicons/core-free-icons"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Button } from "@/components/ui/button"

function formatBytes(bytes?: number | null) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface AddResourceDialogProps {
  isOpen: boolean
  onClose: () => void
  course: any
  tasks: any[]
  addType: string
  setAddType: (type: string) => void
  addTitle: string
  setAddTitle: (title: string) => void
  addDesc: string
  setAddDesc: (desc: string) => void
  addUrl: string
  setAddUrl: (url: string) => void
  addTaskId: string
  setAddTaskId: (taskId: string) => void
  addFile: File | null
  setAddFile: (file: File | null) => void
  dragOver: boolean
  setDragOver: (dragOver: boolean) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  addLoading: boolean
  onSubmit: (e: React.FormEvent) => void
}

export function AddResourceDialog({
  isOpen,
  onClose,
  course,
  tasks,
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
  onSubmit,
}: AddResourceDialogProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(v: boolean) => { if (!v) onClose() }}>
      <SheetContent side="right" className="w-[480px] sm:w-[480px] gap-0 p-0 overflow-hidden flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <SheetTitle className="text-base">Add Lecture Material</SheetTitle>
          {course && (
            <SheetDescription className="text-xs flex items-center gap-1.5 mt-1">
              <HugeiconsIcon icon={Folder01Icon} className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>{course.name} ({course.code})</span>
            </SheetDescription>
          )}
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 px-6 py-5 max-h-[70vh] overflow-y-auto">
          {/* Type selector */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "FILE", label: "File", icon: File01Icon },
              { value: "LINK", label: "Link", icon: Link01Icon },
              { value: "NOTE", label: "Note", icon: NoteIcon },
            ].map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setAddType(value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all ${
                  addType === value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border/60 text-muted-foreground hover:border-primary/40"
                }`}
              >
                <HugeiconsIcon icon={icon} className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>

          <Field>
            <FieldLabel className="text-xs font-semibold">Title *</FieldLabel>
            <Input
              value={addTitle}
              onChange={(e: any) => setAddTitle(e.target.value)}
              placeholder="e.g. Slide Meeting 3"
              className="h-9 text-sm"
              required
            />
          </Field>

          {addType === "FILE" && (
            <Field>
              <FieldLabel className="text-xs font-semibold">Upload File *</FieldLabel>
              <div
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-all
                  ${dragOver ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50 hover:bg-muted/20"}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e: any) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e: any) => {
                  e.preventDefault(); setDragOver(false)
                  if (e.dataTransfer.files[0]) setAddFile(e.dataTransfer.files[0])
                }}
              >
                <HugeiconsIcon icon={Upload01Icon} className={`h-6 w-6 ${dragOver ? "text-primary" : "text-muted-foreground/40"}`} />
                {addFile ? (
                  <p className="text-xs font-semibold text-primary">{addFile.name} ({formatBytes(addFile.size)})</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Drag & drop or click to select file<br /><span className="text-[10px] opacity-60">PDF, Word, Excel, Image, ZIP · Max 10MB</span></p>
                )}
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e: any) => { if (e.target.files?.[0]) setAddFile(e.target.files[0]) }}
                />
              </div>
            </Field>
          )}

          {addType === "LINK" && (
            <Field>
              <FieldLabel className="text-xs font-semibold">URL *</FieldLabel>
              <Input
                value={addUrl}
                onChange={(e: any) => setAddUrl(e.target.value)}
                placeholder="https://..."
                className="h-9 text-sm"
                required
              />
            </Field>
          )}

          <Field>
            <FieldLabel className="text-xs font-semibold">Description (optional)</FieldLabel>
            <Input
              value={addDesc}
              onChange={(e: any) => setAddDesc(e.target.value)}
              placeholder="Brief description..."
              className="h-9 text-sm"
            />
          </Field>

          <Field>
            <FieldLabel className="text-xs font-semibold">Link to Task (optional)</FieldLabel>
            <Select value={addTaskId} onValueChange={(val) => setAddTaskId(val || "none")}>
              <SelectTrigger className="w-full h-9">
                <span data-slot="select-value" className="text-sm truncate">
                  {addTaskId === "none" ? "General (Not linked to any task)" : tasks.find((t: any) => t.id === addTaskId)?.title || "Select task..."}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="none">General (Not linked to any task)</SelectItem>
                  {tasks.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="truncate max-w-[300px] block">{t.title}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <div className="flex gap-3 pt-2 border-t border-border/30">
            <Button type="button" variant="outline" className="flex-1 h-9" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-9" disabled={addLoading}>
              {addLoading ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
