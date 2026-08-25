"use client"
import * as React from "react"
import { API_URL } from "@/lib/config"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { toast } from "@/components/ui/toast"

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
}

interface AIScheduleSheetProps {
  isOpen: boolean
  onClose: (open: boolean) => void
  selectedSemesterId: string
  onSaveSuccess: () => void
}

export function AIScheduleSheet({
  isOpen,
  onClose,
  selectedSemesterId,
  onSaveSuccess,
}: AIScheduleSheetProps) {
  const [aiImage, setAiImage] = React.useState("")
  const [aiCommand, setAiCommand] = React.useState("")
  const [aiLoading, setAiLoading] = React.useState(false)

  React.useEffect(() => {
    if (!isOpen) return
    setAiImage("")
    setAiCommand("")
    setAiLoading(false)
  }, [isOpen])

  const handleAIImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        setAiImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAIGenerate = async () => {
    if (!selectedSemesterId) {
      toast.add({ type: "error", description: "Pilih semester terlebih dahulu" })
      return
    }

    setAiLoading(true)
    const token = getCookie("token")
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/semesters/${selectedSemesterId}/ai-schedules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: aiImage || undefined,
          command: aiCommand || undefined,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.message || "Failed to generate schedule")
      }

      toast.add({ type: "success", description: "Jadwal kuliah berhasil dibuat oleh AI!" })
      onSaveSuccess()
      onClose(false)
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Gagal mengolah jadwal oleh AI" })
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[440px] font-sans overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl font-bold">AI Schedule Generator</SheetTitle>
          <SheetDescription>
            Upload a screenshot of your class schedule or type manual commands. Gemini will automatically match the schedules with your courses.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-6 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">Upload Screenshot (Image)</label>
            <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-xl p-6 bg-muted/10 hover:bg-muted/20 transition-colors relative group min-h-[140px]">
              <input
                type="file"
                accept="image/*"
                onChange={handleAIImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {aiImage ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={aiImage} alt="Preview" className="max-h-40 rounded-lg object-contain shadow" />
                  <span className="text-xs text-primary font-medium hover:underline">Change image</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-muted-foreground">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                  <span className="text-xs font-semibold text-muted-foreground text-center">Click or Drag Image to Upload</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">Additional Commands / Text Instructions (Optional)</label>
            <textarea
              placeholder="e.g. Hanya tambahkan jadwal untuk hari Senin dan Selasa saja..."
              value={aiCommand}
              onChange={(e) => setAiCommand(e.target.value)}
              className="w-full min-h-[90px] rounded-xl border border-input bg-input/30 p-3 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 placeholder:text-muted-foreground resize-none font-sans"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="w-1/2" onClick={() => onClose(false)}>
              Cancel
            </Button>
            <Button onClick={handleAIGenerate} className="w-1/2" disabled={aiLoading || (!aiImage && !aiCommand)}>
              {aiLoading ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
