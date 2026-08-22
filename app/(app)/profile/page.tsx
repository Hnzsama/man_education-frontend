"use client"
import { API_URL } from "@/lib/config"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const [whatsappNumber, setWhatsappNumber] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

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
        setWhatsappNumber(data.whatsappNumber || "")
        setLoading(false)
      })
      .catch(() => {
        router.push("/login")
      })
  }, [router])

  const handleSaveWhatsapp = async () => {
    setSaving(true)
    setMessage(null)
    const token = getCookie("token")
    try {
      const res = await fetch(`${API_URL}/api/users/me/reminders`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          whatsappNumber,
        }),
      })
      if (!res.ok) throw new Error()
      setMessage({ type: "success", text: "Nomor WhatsApp berhasil disimpan! 🎉" })
    } catch (err) {
      setMessage({ type: "error", text: "Gagal menyimpan nomor WhatsApp." })
    } finally {
      setSaving(false)
    }
  }

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

        {/* WhatsApp Settings Card */}
        {user?.role === "INDIVIDUAL" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <svg className="size-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                </svg>
                WhatsApp Notification Settings
              </CardTitle>
              <CardDescription>
                Configure your WhatsApp number to receive study reminder notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp" className="text-sm font-semibold">Nomor WhatsApp Pribadi</Label>
                <Input
                  id="whatsapp"
                  type="text"
                  placeholder="Contoh: 628123456789"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="max-w-md h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Masukkan nomor telepon diawali kode negara (misal: 62 untuk Indonesia) tanpa spasi atau tanda +.
                </p>
              </div>
              {message && (
                <div className={`p-3 rounded-lg text-sm text-center max-w-md ${message.type === "success" ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
                  {message.text}
                </div>
              )}
              <Button onClick={handleSaveWhatsapp} disabled={saving} className="h-10 px-6 font-semibold">
                {saving ? "Saving..." : "Save WhatsApp Number"}
              </Button>
            </CardContent>
          </Card>
        )}

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
