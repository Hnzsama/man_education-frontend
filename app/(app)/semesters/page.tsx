"use client"
import { API_URL } from "@/lib/config"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/date-picker"
import { Field, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  Delete02Icon, 
  CircleCheckIcon, 
  Add01Icon, 
  PencilEdit01Icon, 
  Calendar02Icon, 
  Book02Icon,
  AlertCircleIcon
} from "@hugeicons/core-free-icons"
import { toast } from "@/components/ui/toast"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
}

export default function SemestersPage() {
  const router = useRouter()
  const [semesters, setSemesters] = React.useState<any[]>([])
  const [currentUser, setCurrentUser] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)
  
  // Form states
  const [name, setName] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [academicStartDate, setAcademicStartDate] = React.useState("")
  const [holidayStartDate, setHolidayStartDate] = React.useState("")
  const [formLoading, setFormLoading] = React.useState(false)

  // Sheet (Drawer) state
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editingSemesterId, setEditingSemesterId] = React.useState<string | null>(null)

  // Confirmation Modal State
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [idToDelete, setIdToDelete] = React.useState<string | null>(null)

  const fetchSemesters = React.useCallback(() => {
    const token = getCookie("token")
    if (!token) {
      router.push("/login")
      return
    }

    // Fetch user details to verify WhatsApp connection
    fetch(`${API_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.ok) return res.json()
      })
      .then((userData) => {
        if (userData) setCurrentUser(userData)
      })
      .catch(() => {})

    fetch(`${API_URL}/api/semesters`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load semesters")
        return res.json()
      })
      .then((data) => {
        setSemesters(data)
        setLoading(false)
      })
      .catch((err) => {
        toast.add({ type: "error", description: err.message || "Failed to load semesters" })
        setLoading(false)
      })
  }, [router])

  React.useEffect(() => {
    fetchSemesters()
  }, [fetchSemesters])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    const token = getCookie("token")
    if (!token) return

    try {
      const url = editingSemesterId 
        ? `${API_URL}/api/semesters/${editingSemesterId}`
        : `${API_URL}/api/semesters`
      const method = editingSemesterId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          academicStartDate: academicStartDate ? new Date(academicStartDate).toISOString() : null,
          holidayStartDate: holidayStartDate ? new Date(holidayStartDate).toISOString() : null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to save semester")
      }

      setName("")
      setStartDate("")
      setEndDate("")
      setAcademicStartDate("")
      setHolidayStartDate("")
      setEditingSemesterId(null)
      setSheetOpen(false)
      toast.add({ 
        type: "success", 
        description: editingSemesterId ? "Semester updated successfully" : "Semester added successfully" 
      })
      fetchSemesters()
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to save semester" })
    } finally {
      setFormLoading(false)
    }
  }

  const handleAddClick = () => {
    setEditingSemesterId(null)
    setName("")
    setStartDate("")
    setEndDate("")
    setAcademicStartDate("")
    setHolidayStartDate("")
    setSheetOpen(true)
  }

  const handleEditClick = (sem: any) => {
    setEditingSemesterId(sem.id)
    setName(sem.name)
    setStartDate(new Date(sem.startDate).toISOString().split("T")[0])
    setEndDate(new Date(sem.endDate).toISOString().split("T")[0])
    setAcademicStartDate(sem.academicStartDate ? new Date(sem.academicStartDate).toISOString().split("T")[0] : "")
    setHolidayStartDate(sem.holidayStartDate ? new Date(sem.holidayStartDate).toISOString().split("T")[0] : "")
    setSheetOpen(true)
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const token = getCookie("token")
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/semesters/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      })

      if (!res.ok) throw new Error("Failed to update status")
      toast.add({ type: "success", description: "Semester status updated" })
      fetchSemesters()
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to update status" })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!idToDelete) return
    const token = getCookie("token")
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/semesters/${idToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Failed to delete semester")
      toast.add({ type: "success", description: "Semester deleted successfully" })
      fetchSemesters()
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to delete semester" })
    } finally {
      setConfirmOpen(false)
      setIdToDelete(null)
    }
  }

  const handleDeleteClick = (id: string) => {
    setIdToDelete(id)
    setConfirmOpen(true)
  }

  const formatDateRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr)
    const end = new Date(endStr)
    const options: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" }
    return `${start.toLocaleDateString("id-ID", options)} - ${end.toLocaleDateString("id-ID", options)}`
  }

  const formatDateSingle = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
    return date.toLocaleDateString("id-ID", options)
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6 animate-pulse">
        <div className="flex flex-col gap-6 px-4 lg:px-6">
          {/* Header Title and Actions Skeleton */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-48 rounded-lg" />
              <Skeleton className="h-4 w-80 rounded-lg" />
            </div>
            <Skeleton className="h-10 w-36 rounded-lg shrink-0" />
          </div>

          {/* Active Semester Alert Card Skeleton */}
          <Card className="border border-border/60 shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-48 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-96 rounded-lg" />
            </CardContent>
          </Card>

          {/* Semester Grid Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border border-border/60 shadow-xs flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-32 rounded-lg" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-40 rounded-lg mt-1" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20 rounded-lg" />
                    <Skeleton className="h-3 w-24 rounded-lg" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-24 rounded-lg" />
                    <Skeleton className="h-3 w-24 rounded-lg" />
                  </div>
                </CardContent>
                <CardFooter className="pt-3 border-t border-border/40 flex justify-end gap-2 text-right">
                  <Skeleton className="h-8 w-16 rounded-lg" />
                  <Skeleton className="h-8 w-16 rounded-lg" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        {/* Header Title and Actions */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">Semesters</h1>
            <p className="text-sm text-muted-foreground">
              Manage your academic semesters and keep track of active terms.
            </p>
          </div>
          <Button 
            onClick={handleAddClick} 
            disabled={currentUser?.role === "CLASS" && !currentUser?.whatsappGroupId} 
            className="w-fit"
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2.5} className="mr-2 h-4 w-4" />
            Add Semester
          </Button>
        </div>

        {/* WhatsApp Connection Alert for Class role */}
        {currentUser?.role === "CLASS" && !currentUser?.whatsappGroupId && (
          <Card className="border-warning/60 bg-warning/5 border shadow-sm font-sans mb-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-warning text-sm font-bold flex items-center gap-2">
                <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-warning" />
                WhatsApp Group Connection Required
              </CardTitle>
              <CardDescription className="text-muted-foreground text-xs">
                To start managing semesters, schedules, and tasks for your class, you must connect this account to a WhatsApp group. Go to the <a href="/dashboard" className="text-primary underline font-semibold">Dashboard</a> to link your WhatsApp group.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Full-width Grid of Semester Cards */}
        {semesters.length === 0 ? (
          <Card className="text-center py-20 border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <HugeiconsIcon icon={Book02Icon} className="h-6 w-6" />
              </div>
              <span className="text-base font-semibold text-muted-foreground">No Semesters Found</span>
              <span className="text-sm text-muted-foreground max-w-xs">
                Get started by creating your first semester. Click the "Add Semester" button above.
              </span>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {semesters.map((sem) => {
              const isActive = sem.isActive
              const courseCount = sem.courses?.length || 0
              return (
                <Card 
                  key={sem.id} 
                  className={`relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border ${
                    isActive 
                      ? "border-primary/40 bg-linear-to-tr from-primary/5 to-card" 
                      : "border-border/60"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-bold">{sem.name}</CardTitle>
                      <Badge 
                        variant={isActive ? "default" : "outline"}
                        className={isActive ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 space-y-3 font-sans">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} className="h-4 w-4 text-primary/70" />
                        <span>{formatDateRange(sem.startDate, sem.endDate)}</span>
                      </div>
                      {sem.academicStartDate && (
                        <div className="text-[11px] text-muted-foreground/80 pl-6 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                          <span>Kuliah: {formatDateSingle(sem.academicStartDate)}</span>
                        </div>
                      )}
                      {sem.holidayStartDate && (
                        <div className="text-[11px] text-muted-foreground/80 pl-6 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                          <span>Libur: {formatDateSingle(sem.holidayStartDate)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <HugeiconsIcon icon={Book02Icon} strokeWidth={2} className="h-4 w-4 text-primary/70" />
                      <span>{courseCount} enrolled courses</span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-3 border-t border-border/40 flex justify-between items-center gap-2 bg-muted/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`text-xs h-8 px-2.5 font-medium ${isActive ? "text-muted-foreground" : "text-primary hover:text-primary hover:bg-primary/10"}`}
                      onClick={() => handleToggleActive(sem.id, sem.isActive)}
                    >
                      <HugeiconsIcon icon={CircleCheckIcon} className="h-3.5 w-3.5 mr-1" />
                      {isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => handleEditClick(sem)}
                      >
                        <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteClick(sem.id)}
                      >
                        <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Side Sheet Form for Add/Edit */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingSemesterId ? "Edit Semester" : "Add Semester"}
            </SheetTitle>
            <SheetDescription>
              {editingSemesterId 
                ? "Update the details for the selected semester." 
                : "Create a new semester term to track your academic progress."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field>
                <FieldLabel htmlFor="semester-name">Name</FieldLabel>
                <Input
                  id="semester-name"
                  type="text"
                  placeholder="e.g. Semester 5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel>Start Date</FieldLabel>
                <DatePicker
                  value={startDate}
                  onChange={(val) => setStartDate(val)}
                  placeholder="Choose Start Date"
                />
              </Field>
              <Field>
                <FieldLabel>End Date</FieldLabel>
                <DatePicker
                  value={endDate}
                  onChange={(val) => setEndDate(val)}
                  placeholder="Choose End Date"
                />
              </Field>
              <Field>
                <FieldLabel>Academic Start Date (Optional)</FieldLabel>
                <DatePicker
                  value={academicStartDate}
                  onChange={(val) => setAcademicStartDate(val)}
                  placeholder="Choose Actual Start Date"
                />
              </Field>
              <Field>
                <FieldLabel>Holiday Start Date (Optional)</FieldLabel>
                <DatePicker
                  value={holidayStartDate}
                  onChange={(val) => setHolidayStartDate(val)}
                  placeholder="Choose Holiday Start Date"
                />
              </Field>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="w-1/2" onClick={() => setSheetOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2" disabled={formLoading}>
                  <HugeiconsIcon icon={editingSemesterId ? PencilEdit01Icon : Add01Icon} strokeWidth={2} className="mr-2 h-4 w-4" />
                  {formLoading ? "Saving..." : editingSemesterId ? "Save" : "Add"}
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Semester"
        description="Are you sure you want to delete this semester? All courses and schedules under it will be deleted permanently."
      />
    </div>
  )
}
