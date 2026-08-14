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
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  UserGroupIcon, 
  Add01Icon, 
  Mail01Icon, 
  UserCircle02Icon 
} from "@hugeicons/core-free-icons"
import { toast } from "@/components/ui/toast"

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
}

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = React.useState<any[]>([])
  const [currentUser, setCurrentUser] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [emailInput, setEmailInput] = React.useState("")
  const [adding, setAdding] = React.useState(false)

  React.useEffect(() => {
    const token = getCookie("token")
    if (!token) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      try {
        const meRes = await fetch(`${API_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!meRes.ok) throw new Error("Unauthorized")
        const meData = await meRes.json()
        setCurrentUser(meData)

        if (meData.role !== "CLASS") {
          router.push("/dashboard")
          return
        }

        const listRes = await fetch(`${API_URL}/api/users/students/list`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (listRes.ok) {
          const listData = await listRes.json()
          setStudents(listData)
        }
        setLoading(false)
      } catch (err: any) {
        toast.add({ type: "error", description: err.message || "Failed to load students data" })
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput.trim()) return

    setAdding(true)
    const token = getCookie("token")
    try {
      const res = await fetch(`${API_URL}/api/users/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: emailInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to add student")

      toast.add({ type: "success", description: `Student ${emailInput} added successfully!` })
      setEmailInput("")
      
      // Refresh students list
      const listRes = await fetch(`${API_URL}/api/users/students/list`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (listRes.ok) {
        const listData = await listRes.json()
        setStudents(listData)
      }
    } catch (err: any) {
      alert(err.message || "Failed to add student")
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="text-muted-foreground text-sm">Loading student list...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6 font-sans">
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">Class Member Management</h1>
            <p className="text-sm text-muted-foreground">
              Add and manage students joined to your class: <span className="font-mono text-primary font-bold">{currentUser?.classCode}</span>
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Add Student Card */}
          <Card className="border border-border/60 shadow-xs md:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <HugeiconsIcon icon={Add01Icon} className="h-4 w-4 text-primary" />
                Add New Student
              </CardTitle>
              <CardDescription>Manually register or link a student to your class via email.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="student-email">Email Address</FieldLabel>
                  <Input
                    id="student-email"
                    type="email"
                    placeholder="student@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                  />
                </Field>
                <Button type="submit" disabled={adding} className="w-full">
                  {adding ? "Adding..." : "Add Student"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Student List Card */}
          <Card className="border border-border/60 shadow-xs md:col-span-2">
            <CardHeader className="border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <HugeiconsIcon icon={UserGroupIcon} className="h-4 w-4 text-primary" />
                Joined Students ({students.length})
              </CardTitle>
              <CardDescription>All students currently registered in your class planner.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {students.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <HugeiconsIcon icon={UserCircle02Icon} className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold">No students joined yet</span>
                  <span className="text-xs max-w-xs">Share your Class Code or add students manually using their email address.</span>
                </div>
              ) : (
                <div className="divide-y divide-border/40 space-y-3">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <HugeiconsIcon icon={UserCircle02Icon} className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground">{student.name}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <HugeiconsIcon icon={Mail01Icon} className="h-3 w-3 text-primary/70" />
                            {student.email}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Joined: {new Date(student.createdAt).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
