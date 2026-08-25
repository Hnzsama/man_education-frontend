"use client"
import * as React from "react"
import { API_URL } from "@/lib/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar02Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { format } from "date-fns"
import { toast } from "@/components/ui/toast"

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
}

// Convert local Date to YYYY-MM-DD string safely
const toDateStr = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

interface HolidaySheetProps {
  isOpen: boolean
  onClose: (open: boolean) => void
  customHolidays: any[]
  userProfile: any | null
  onSaveSuccess: () => void
}

export function HolidaySheet({
  isOpen,
  onClose,
  customHolidays,
  userProfile,
  onSaveSuccess,
}: HolidaySheetProps) {
  const [hName, setHName] = React.useState("")
  const [hStart, setHStart] = React.useState("")
  const [hEnd, setHEnd] = React.useState("")
  const [hLoading, setHLoading] = React.useState(false)

  const handleHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hStart || !hEnd) {
      toast.add({ type: "error", description: "Start and end dates are required" })
      return
    }
    setHLoading(true)
    const token = getCookie("token")
    try {
      const res = await fetch(`${API_URL}/api/custom-holidays`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: hName,
          startDate: hStart,
          endDate: hEnd
        })
      })
      if (!res.ok) throw new Error("Failed to save holiday")
      toast.add({ type: "success", description: "Holiday successfully added!" })
      setHName("")
      setHStart("")
      setHEnd("")
      onSaveSuccess()
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    } finally {
      setHLoading(false)
    }
  }

  const handleHolidayDelete = async (id: string) => {
    const token = getCookie("token")
    try {
      const res = await fetch(`${API_URL}/api/custom-holidays/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to delete holiday")
      toast.add({ type: "success", description: "Holiday successfully deleted" })
      onSaveSuccess()
    } catch (err: any) {
      toast.add({ type: "error", description: err.message })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[440px] overflow-y-auto font-sans flex flex-col">
        <SheetHeader className="pb-4 border-b border-border/40">
          <SheetTitle className="text-base">Manage College Holidays</SheetTitle>
          <SheetDescription className="text-xs">
            Add custom college holidays with a date range.
          </SheetDescription>
        </SheetHeader>

        {/* Form to add custom holiday */}
        <form onSubmit={handleHolidaySubmit} className="flex flex-col gap-4 pt-4 px-6 pb-4 border-b border-border/40">
          <Field>
            <FieldLabel className="text-xs font-semibold">Holiday Name *</FieldLabel>
            <Input
              value={hName}
              onChange={(e) => setHName(e.target.value)}
              placeholder="e.g. Semester Break, Eid Break"
              className="h-9 text-sm"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field className="flex flex-col">
              <FieldLabel className="text-xs font-semibold mb-1">Start Date *</FieldLabel>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button variant="outline" className="h-9 w-full justify-start text-left font-normal text-xs px-3">
                      <HugeiconsIcon icon={Calendar02Icon} className="mr-2 h-3.5 w-3.5 shrink-0 opacity-60" />
                      {hStart ? format(new Date(hStart), "dd MMM yyyy") : <span>Select Date</span>}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={hStart ? new Date(hStart) : undefined}
                    onSelect={(date) => setHStart(date ? toDateStr(date) : "")}
                  />
                </PopoverContent>
              </Popover>
            </Field>
            <Field className="flex flex-col">
              <FieldLabel className="text-xs font-semibold mb-1">End Date *</FieldLabel>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button variant="outline" className="h-9 w-full justify-start text-left font-normal text-xs px-3">
                      <HugeiconsIcon icon={Calendar02Icon} className="mr-2 h-3.5 w-3.5 shrink-0 opacity-60" />
                      {hEnd ? format(new Date(hEnd), "dd MMM yyyy") : <span>Select Date</span>}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={hEnd ? new Date(hEnd) : undefined}
                    onSelect={(date) => setHEnd(date ? toDateStr(date) : "")}
                  />
                </PopoverContent>
              </Popover>
            </Field>
          </div>
          <Button type="submit" className="w-full h-9 text-sm" disabled={hLoading}>
            {hLoading ? "Saving…" : "Add Holiday"}
          </Button>
        </form>

        {/* List of custom holidays */}
        <div className="flex-1 p-6 flex flex-col gap-3">
          <h4 className="text-xs font-bold text-foreground/70 uppercase tracking-wider">Your Holiday List</h4>
          {customHolidays.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No custom holidays yet.</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {customHolidays.map((ch: any) => (
                <div key={ch.id} className="flex items-center justify-between p-2.5 rounded-xl border bg-card text-xs">
                  <div className="min-w-0">
                    <p className="font-bold text-amber-600 dark:text-amber-400 truncate">{ch.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(ch.startDate).toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC" })} - {new Date(ch.endDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
                    </p>
                  </div>
                  {userProfile?.id === ch.userId && (
                    <button
                      onClick={() => handleHolidayDelete(ch.id)}
                      className="text-muted-foreground hover:text-destructive cursor-pointer p-1 animate-in fade-in"
                      title="Delete"
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
