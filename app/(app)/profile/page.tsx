"use client"
import { API_URL } from "@/lib/config"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import { Mail01Icon, Calendar01Icon, Folder01Icon, Database01Icon, File01Icon } from "@hugeicons/core-free-icons"

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const token = getCookie("token")
    if (!token) {
      router.push("/login")
      return
    }

    fetch(`${API_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => {
        setUser(data)
        setLoading(false)
      })
      .catch(() => {
        router.push("/login")
      })
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="text-muted-foreground text-sm">Loading profile data...</span>
        </div>
      </div>
    )
  }

  const creationDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }) : "Unknown"

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        {/* Standard Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">User Profile</h1>
          <p className="text-sm text-muted-foreground">
            View your academic identity and system credentials.
          </p>
        </div>

        {/* Standard Theme Card for Profile */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <Avatar className="h-20 w-20 border rounded-full bg-muted">
                <AvatarImage src={user?.avatar || ""} alt={user?.name || "User"} />
                <AvatarFallback className="rounded-full bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 text-2xl font-bold">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1.5 text-center sm:text-left">
                <CardTitle className="text-xl font-semibold">{user?.name}</CardTitle>
                <CardDescription className="text-primary font-medium text-xs">
                  Student Account Active
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 py-6 font-sans">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="h-4 w-4" />
                <span className="text-foreground">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="h-4 w-4" />
                <span className="text-foreground">Joined {creationDate}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Dashboard Grid matching the Dashboard theme */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="bg-linear-to-t from-primary/5 to-card shadow-xs dark:bg-card">
            <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
              <div className="rounded-lg p-2 bg-primary/10 text-primary">
                <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-medium">Semesters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground mt-1">Total academic semesters</p>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-t from-primary/5 to-card shadow-xs dark:bg-card">
            <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
              <div className="rounded-lg p-2 bg-primary/10 text-primary">
                <HugeiconsIcon icon={Database01Icon} strokeWidth={2} className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-medium">Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground mt-1">Total enrolled courses</p>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-t from-primary/5 to-card shadow-xs dark:bg-card">
            <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
              <div className="rounded-lg p-2 bg-primary/10 text-primary">
                <HugeiconsIcon icon={File01Icon} strokeWidth={2} className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground mt-1">Tasks needing completion</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
