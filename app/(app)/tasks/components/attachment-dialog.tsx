"use client"
import * as React from "react"
import { API_URL } from "@/lib/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  File01Icon,
  Delete02Icon,
  Upload01Icon,
  Link01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "@/components/ui/toast"

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface AttachmentDialogProps {
  taskId: string
  taskTitle: string
  initialAttachments: any[]
  isOpen: boolean
  onClose: () => void
  onChanged: () => void
}

export function AttachmentDialog({
  taskId,
  taskTitle,
  initialAttachments,
  isOpen,
  onClose,
  onChanged,
}: AttachmentDialogProps) {
  const [attachments, setAttachments] = React.useState<any[]>(initialAttachments)
  const [uploading, setUploading] = React.useState(false)
  const [addingLink, setAddingLink] = React.useState(false)
  const [linkUrl, setLinkUrl] = React.useState("")
  const [linkName, setLinkName] = React.useState("")
  const [activeMode, setActiveMode] = React.useState<"file" | "link">("file")
  const [dragOver, setDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      setAttachments(initialAttachments)
      setLinkUrl("")
      setLinkName("")
      setActiveMode("file")
    }
  }, [isOpen, initialAttachments])

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return
    const token = getCookie("token")
    if (!token) return
    setUploading(true)
    try {
      const formData = new FormData()
      files.forEach((f) => formData.append("files", f))
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/attachments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Upload failed")
      }
      const newAtts = await res.json()  // backend returns array of new attachments
      setAttachments((prev) => [...prev, ...(Array.isArray(newAtts) ? newAtts : [])])
      onChanged()
      toast.add({ type: "success", description: `${files.length} files uploaded successfully` })
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkUrl.trim()) {
      toast.add({ type: "error", description: "URL is required" })
      return
    }
    const token = getCookie("token")
    if (!token) return
    setAddingLink(true)
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/attachments/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: linkUrl.trim(),
          name: linkName.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to add link attachment")
      }
      const newLinkAtt = await res.json()
      setAttachments((prev) => [...prev, newLinkAtt])
      setLinkUrl("")
      setLinkName("")
      onChanged()
      toast.add({ type: "success", description: "Link attachment saved" })
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    } finally {
      setAddingLink(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleDelete = async (attId: string) => {
    const token = getCookie("token")
    try {
      const res = await fetch(`${API_URL}/api/tasks/${taskId}/attachments/${attId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to delete attachment")
      setAttachments((prev) => prev.filter((a) => a.id !== attId))
      onChanged()
      toast.add({ type: "success", description: "Attachment deleted" })
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(v: boolean) => { if (!v) onClose() }}>
      <SheetContent side="right" className="w-[520px] sm:w-[520px] gap-0 p-0 overflow-hidden flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40 shrink-0">
          <SheetTitle className="text-base flex items-center gap-2">
            <HugeiconsIcon icon={File01Icon} className="h-4 w-4 text-primary" />
            Task Attachments & Links
          </SheetTitle>
          <SheetDescription className="text-xs line-clamp-1">{taskTitle}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col max-h-[70vh] overflow-y-auto">
          {/* Mode Selector */}
          <div className="px-6 pt-4 shrink-0">
            <div className="flex rounded-lg bg-muted p-1 gap-1">
              <button
                type="button"
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeMode === "file"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveMode("file")}
              >
                <HugeiconsIcon icon={Upload01Icon} className="h-3.5 w-3.5" />
                Upload File
              </button>
              <button
                type="button"
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                  activeMode === "link"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveMode("link")}
              >
                <HugeiconsIcon icon={Link01Icon} className="h-3.5 w-3.5" />
                Add Web Link
              </button>
            </div>
          </div>

          {/* Action Zone */}
          <div className="px-6 py-4 border-b border-border/30">
            {activeMode === "file" ? (
              <div
                className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer select-none
                  ${dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/50 hover:border-primary/50 hover:bg-muted/30"}
                  ${uploading ? "opacity-60 pointer-events-none" : ""}
                `}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <HugeiconsIcon
                  icon={Upload01Icon}
                  className={`h-8 w-8 transition-colors ${dragOver ? "text-primary" : "text-muted-foreground/40"}`}
                />
                <div>
                  <p className="text-sm font-semibold">
                    {uploading ? "Uploading…" : "Upload attachment file"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Drag & drop or click to select file</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">PDF, Word, Excel, Image, ZIP · Max 10MB</p>
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,text/plain"
                />
              </div>
            ) : (
              <form onSubmit={handleAddLink} className="flex flex-col gap-3 rounded-xl border border-border/50 bg-background/50 p-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Web Link URL *</label>
                  <Input
                    type="text"
                    placeholder="https://docs.google.com/... or https://github.com/..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Link Title / Label (Optional)</label>
                  <Input
                    type="text"
                    placeholder="e.g. Google Docs Draft / Figma Design"
                    value={linkName}
                    onChange={(e) => setLinkName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <Button type="submit" size="sm" disabled={addingLink || !linkUrl.trim()} className="mt-1 h-8 text-xs font-semibold gap-1.5">
                  <HugeiconsIcon icon={Link01Icon} className="h-3.5 w-3.5" />
                  {addingLink ? "Saving Link..." : "Save Link Attachment"}
                </Button>
              </form>
            )}
          </div>

          {/* Attachment List */}
          <div className="px-6 py-4">
            {attachments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <HugeiconsIcon icon={File01Icon} className="h-10 w-10 opacity-20" />
                <p className="text-xs text-center">No attachments or links yet.<br />Upload files or add web links above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  {attachments.length} attachments & links saved
                </p>
                {attachments.map((att: any) => {
                  const isLink = att.fileType === "link"
                  const isImage = !isLink && att.fileType?.startsWith("image/")
                  const targetUrl = isLink ? att.filePath : `${API_URL}/uploads/tasks/${att.filePath}`

                  return (
                    <div
                      key={att.id}
                      className="group flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-3 hover:bg-muted/20 transition-all"
                    >
                      {isLink ? (
                        <div className="h-10 w-10 rounded-lg border border-sky-500/30 bg-sky-500/10 flex items-center justify-center shrink-0">
                          <HugeiconsIcon icon={Link01Icon} className="h-5 w-5 text-sky-500" />
                        </div>
                      ) : isImage ? (
                        <a href={targetUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                          <img
                            src={targetUrl}
                            alt={att.name}
                            className="h-10 w-10 rounded-lg object-cover border border-border/70 hover:scale-105 transition-transform"
                          />
                        </a>
                      ) : (
                        <div className="h-10 w-10 rounded-lg border border-border/70 bg-primary/5 flex items-center justify-center shrink-0">
                          <HugeiconsIcon icon={File01Icon} className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate block"
                          title={att.name}
                        >
                          {att.name}
                        </a>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground truncate max-w-[220px]">
                            {isLink ? att.filePath : formatBytes(att.fileSize)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline flex items-center gap-0.5 shrink-0"
                          >
                            <HugeiconsIcon icon={Link01Icon} className="h-3 w-3" />
                            Open
                          </a>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 shrink-0 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
                        onClick={() => handleDelete(att.id)}
                        title="Delete attachment"
                      >
                        <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-border/30 bg-muted/10 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-muted-foreground">Files and links stored securely</p>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>Close</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

