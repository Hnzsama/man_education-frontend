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
  const [dragOver, setDragOver] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    if (isOpen) setAttachments(initialAttachments)
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
        throw new Error(err.message || "Upload gagal")
      }
      const newAtts = await res.json()  // backend returns array of new attachments
      setAttachments((prev) => [...prev, ...(Array.isArray(newAtts) ? newAtts : [])])
      onChanged()
      toast.add({ type: "success", description: `${files.length} file berhasil diupload` })
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
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
      if (!res.ok) throw new Error("Gagal menghapus lampiran")
      setAttachments((prev) => prev.filter((a) => a.id !== attId))
      onChanged()
      toast.add({ type: "success", description: "Lampiran dihapus" })
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
            Lampiran Tugas
          </SheetTitle>
          <SheetDescription className="text-xs line-clamp-1">{taskTitle}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col max-h-[70vh] overflow-y-auto">
          {/* Drop Zone */}
          <div className="px-6 py-4 border-b border-border/30">
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
                  {uploading ? "Sedang mengupload…" : "Upload file lampiran"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Drag & drop atau klik untuk pilih file</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">PDF, Word, Excel, Gambar, ZIP · Maks 10MB</p>
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
          </div>

          {/* Attachment List */}
          <div className="px-6 py-4">
            {attachments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <HugeiconsIcon icon={File01Icon} className="h-10 w-10 opacity-20" />
                <p className="text-xs text-center">Belum ada lampiran.<br />Upload file di atas untuk menyimpan berkas tugas.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  {attachments.length} lampiran tersimpan
                </p>
                {attachments.map((att: any) => {
                  const isImage = att.fileType?.startsWith("image/")
                  const fileUrl = `${API_URL}/uploads/tasks/${att.filePath}`
                  return (
                    <div
                      key={att.id}
                      className="group flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-3 hover:bg-muted/20 transition-all"
                    >
                      {isImage ? (
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                          <img
                            src={fileUrl}
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
                          href={fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate block"
                          title={att.name}
                        >
                          {att.name}
                        </a>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{formatBytes(att.fileSize)}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                          >
                            <HugeiconsIcon icon={Link01Icon} className="h-3 w-3" />
                            Buka
                          </a>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 shrink-0 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
                        onClick={() => handleDelete(att.id)}
                        title="Hapus lampiran"
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
          <p className="text-[11px] text-muted-foreground">File disimpan di server secara aman</p>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>Tutup</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
