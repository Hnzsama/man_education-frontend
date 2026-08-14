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
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Add01Icon, 
  PencilEdit01Icon, 
  Book02Icon, 
  Database01Icon, 
  TeacherIcon, 
  SchoolIcon,
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

export default function CoursesPage() {
  const router = useRouter()
  const [semesters, setSemesters] = React.useState<any[]>([])
  const [currentUser, setCurrentUser] = React.useState<any | null>(null)
  const [selectedSemesterId, setSelectedSemesterId] = React.useState("")
  const [courses, setCourses] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [coursesLoading, setCoursesLoading] = React.useState(false)

  // Form states
  const [code, setCode] = React.useState("")
  const [name, setName] = React.useState("")
  const [credits, setCredits] = React.useState("3")
  const [lecturer, setLecturer] = React.useState("")
  const [formLoading, setFormLoading] = React.useState(false)

  // Sheet State
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [editingCourseId, setEditingCourseId] = React.useState<string | null>(null)

  // Confirmation Modal State
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [idToDelete, setIdToDelete] = React.useState<string | null>(null)

  // Fetch Semesters on Mount
  React.useEffect(() => {
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
        // Select active semester by default if available
        const activeSem = data.find((s: any) => s.isActive)
        if (activeSem) {
          setSelectedSemesterId(activeSem.id)
        } else if (data.length > 0) {
          setSelectedSemesterId(data[0].id)
        }
        setLoading(false)
      })
      .catch((err) => {
        toast.add({ type: "error", description: err.message || "Failed to load semesters" })
        setLoading(false)
      })
  }, [router])

  // Fetch Courses when selectedSemesterId changes
  const fetchCourses = React.useCallback((semesterId: string) => {
    if (!semesterId) {
      setCourses([])
      return
    }

    setCoursesLoading(true)
    const token = getCookie("token")
    if (!token) return

    fetch(`${API_URL}/api/semesters/${semesterId}/courses`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load courses")
        return res.json()
      })
      .then((data) => {
        setCourses(data)
        setCoursesLoading(false)
      })
      .catch((err) => {
        toast.add({ type: "error", description: err.message || "Failed to load courses" })
        setCoursesLoading(false)
      })
  }, [])

  React.useEffect(() => {
    fetchCourses(selectedSemesterId)
  }, [selectedSemesterId, fetchCourses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSemesterId) {
      toast.add({ type: "error", description: "Please select a semester first" })
      return
    }

    setFormLoading(true)
    const token = getCookie("token")
    if (!token) return

    try {
      const url = editingCourseId
        ? `${API_URL}/api/semesters/${selectedSemesterId}/courses/${editingCourseId}`
        : `${API_URL}/api/semesters/${selectedSemesterId}/courses`
      const method = editingCourseId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code,
          name,
          credits: parseInt(credits, 10),
          lecturer: lecturer || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || "Failed to save course")
      }

      setCode("")
      setName("")
      setCredits("3")
      setLecturer("")
      setEditingCourseId(null)
      setSheetOpen(false)
      toast.add({ 
        type: "success", 
        description: editingCourseId ? "Course updated successfully" : "Course added successfully" 
      })
      fetchCourses(selectedSemesterId)
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to save course" })
    } finally {
      setFormLoading(false)
    }
  }

  const handleAddClick = () => {
    if (!selectedSemesterId) {
      toast.add({ type: "warning", description: "Please select a semester first" })
      return
    }
    setEditingCourseId(null)
    setCode("")
    setName("")
    setCredits("3")
    setLecturer("")
    setSheetOpen(true)
  }

  const handleEditClick = (course: any) => {
    setEditingCourseId(course.id)
    setCode(course.code)
    setName(course.name)
    setCredits(course.credits.toString())
    setLecturer(course.lecturer || "")
    setSheetOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!idToDelete || !selectedSemesterId) return
    const token = getCookie("token")
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/semesters/${selectedSemesterId}/courses/${idToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Failed to delete course")
      toast.add({ type: "success", description: "Course deleted successfully" })
      fetchCourses(selectedSemesterId)
    } catch (err: any) {
      toast.add({ type: "error", description: err.message || "Failed to delete course" })
    } finally {
      setConfirmOpen(false)
      setIdToDelete(null)
    }
  }

  const handleDeleteClick = (id: string) => {
    setIdToDelete(id)
    setConfirmOpen(true)
  }

  const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="text-muted-foreground text-sm">Loading academic data...</span>
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
            <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
            <p className="text-sm text-muted-foreground">
              Manage your college courses and credit hours by semester.
            </p>
          </div>
          <Button 
            onClick={handleAddClick} 
            disabled={!selectedSemesterId || (currentUser?.role === "CLASS" && !currentUser?.whatsappGroupId)} 
            className="w-fit"
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2.5} className="mr-2 h-4 w-4" />
            Add Course
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

        {/* Semester Select Dropdown */}
        <div className="max-w-xs space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            Select Semester
          </span>
          {semesters.length > 0 ? (
            <Select
              value={selectedSemesterId}
              onValueChange={(value) => setSelectedSemesterId(value || "")}
            >
              <SelectTrigger className="w-full">
                <span data-slot="select-value">
                  {semesters.find((s) => s.id === selectedSemesterId)?.name || "Select a semester"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {semesters.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} {s.isActive ? "(Active)" : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-muted-foreground border rounded-md p-2.5 bg-muted/50 font-sans">
              No semesters available. Create a semester first.
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="space-y-6">
          {selectedSemesterId && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="bg-linear-to-tr from-primary/5 to-card border border-border/60 shadow-xs">
                <CardContent className="py-4 flex items-center justify-between font-sans">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-primary/10 text-primary">
                      <HugeiconsIcon icon={Book02Icon} className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Total Courses</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{courses.length}</span>
                </CardContent>
              </Card>

              <Card className="bg-linear-to-tr from-primary/5 to-card border border-border/60 shadow-xs">
                <CardContent className="py-4 flex items-center justify-between font-sans">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-primary/10 text-primary">
                      <HugeiconsIcon icon={Database01Icon} className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Total Credits (SKS)</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{totalCredits} SKS</span>
                </CardContent>
              </Card>
            </div>
          )}

          {coursesLoading ? (
            <div className="text-center py-12 text-sm text-muted-foreground font-sans">Loading courses...</div>
          ) : courses.length === 0 ? (
            <Card className="text-center py-20 border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-3">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <HugeiconsIcon icon={SchoolIcon} className="h-6 w-6" />
                </div>
                <span className="text-base font-semibold text-muted-foreground">No Courses Found</span>
                <span className="text-sm text-muted-foreground max-w-xs">
                  {selectedSemesterId 
                    ? "No courses have been added to this semester yet. Click the 'Add Course' button above to get started." 
                    : "Please create a semester first to start adding courses."}
                </span>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden border border-border/60 shadow-xs">
              <CardContent className="p-0 font-sans">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4 w-32">Code</TableHead>
                      <TableHead>Course Name</TableHead>
                      <TableHead className="w-32">Credits (SKS)</TableHead>
                      <TableHead>Lecturer</TableHead>
                      <TableHead className="text-right px-4 w-28">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="px-4">
                          <span className="inline-block px-2.5 py-1 text-xs font-semibold font-mono rounded bg-primary/10 text-primary">
                            {course.code}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">{course.name}</TableCell>
                        <TableCell className="font-medium">{course.credits} SKS</TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <HugeiconsIcon icon={TeacherIcon} strokeWidth={2} className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <span>{course.lecturer || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-4">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => handleEditClick(course)}
                            >
                              <HugeiconsIcon icon={PencilEdit01Icon} className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeleteClick(course.id)}
                            >
                              <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Side Sheet Form for Add/Edit */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingCourseId ? "Edit Course" : "Add Course"}
            </SheetTitle>
            <SheetDescription>
              {editingCourseId 
                ? "Update the details for the selected course." 
                : "Create a new course under the current semester."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 py-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field>
                <FieldLabel htmlFor="course-code">Course Code</FieldLabel>
                <Input
                  id="course-code"
                  type="text"
                  placeholder="e.g. SNR301"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="course-name">Course Name</FieldLabel>
                <Input
                  id="course-name"
                  type="text"
                  placeholder="e.g. Manajemen Jaringan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="course-credits">Credit Hours (SKS)</FieldLabel>
                <Input
                  id="course-credits"
                  type="number"
                  min="1"
                  max="6"
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="course-lecturer">Lecturer Name</FieldLabel>
                <Input
                  id="course-lecturer"
                  type="text"
                  placeholder="e.g. Dr. Ahmad (Optional)"
                  value={lecturer}
                  onChange={(e) => setLecturer(e.target.value)}
                />
              </Field>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="w-1/2" onClick={() => setSheetOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="w-1/2" disabled={formLoading || !selectedSemesterId}>
                  <HugeiconsIcon icon={editingCourseId ? PencilEdit01Icon : Add01Icon} strokeWidth={2} className="mr-2 h-4 w-4" />
                  {formLoading ? "Saving..." : editingCourseId ? "Save" : "Add"}
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
        title="Delete Course"
        description="Are you sure you want to delete this course? This action cannot be undone."
      />
    </div>
  )
}
