"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { DashboardSquare01Icon, Menu01Icon, ChartHistogramIcon, Folder01Icon, Calendar02Icon, UserGroupIcon, Camera01Icon, File01Icon, Settings05Icon, HelpCircleIcon, SearchIcon, Database01Icon, Analytics01Icon, CommandIcon, UserCircle02Icon, CheckmarkCircle01Icon, Attachment01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { API_URL } from "@/lib/config"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: (
        <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Semesters",
      url: "/semesters",
      icon: (
        <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Courses",
      url: "/courses",
      icon: (
        <HugeiconsIcon icon={Database01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Schedules",
      url: "/schedules",
      icon: (
        <HugeiconsIcon icon={ChartHistogramIcon} strokeWidth={2} />
      ),
    },
    {
      title: "Tasks",
      url: "/tasks",
      icon: (
        <HugeiconsIcon icon={File01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Files",
      url: "/files",
      icon: (
        <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Calendar",
      url: "/calendar",
      icon: (
        <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} />
      ),
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: (
        <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />
      ),
    },
    {
      title: "Get Help",
      url: "#",
      icon: (
        <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} />
      ),
    },
    {
      title: "Search",
      url: "#",
      icon: (
        <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
      ),
    },
  ],
}

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift()
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [currentUser, setCurrentUser] = React.useState({
    name: "User",
    email: "...",
    avatar: "",
    role: "INDIVIDUAL",
    classCode: null as string | null,
    joinedClassId: null as string | null,
    joinedClass: null as any,
  })

  const [classCodeInput, setClassCodeInput] = React.useState("")
  const [joining, setJoining] = React.useState(false)

  React.useEffect(() => {
    const token = getCookie("token")
    if (token) {
      fetch(`${API_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error()
          return res.json()
        })
        .then((user) => {
          setCurrentUser({
            name: user.name || "User",
            email: user.email,
            avatar: user.avatar || "",
            role: user.role,
            classCode: user.classCode,
            joinedClassId: user.joinedClassId,
            joinedClass: user.joinedClass,
          })
        })
        .catch(() => {
          // Keep default state on error
        })
    }
  }, [])

  const handleJoinClass = async () => {
    if (!classCodeInput) return
    setJoining(true)
    const token = getCookie("token")
    try {
      const res = await fetch(`${API_URL}/api/users/join-class`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ classCode: classCodeInput }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to join class")
      
      setCurrentUser({
        ...currentUser,
        joinedClassId: data.joinedClassId,
        joinedClass: data.joinedClass,
      })
      setClassCodeInput("")
      window.location.reload()
    } catch (err: any) {
      alert(err.message || "Failed to join class")
    } finally {
      setJoining(false)
    }
  }

  const handleLeaveClass = async () => {
    const token = getCookie("token")
    try {
      const res = await fetch(`${API_URL}/api/users/leave-class`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to leave class")
      
      setCurrentUser({
        ...currentUser,
        joinedClassId: null,
        joinedClass: null,
      })
      window.location.reload()
    } catch (err: any) {
      alert(err.message || "Failed to leave class")
    }
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <img src="/logo.svg" alt="Logo" className="size-5 object-contain" />
              <span className="text-base font-semibold">Man Education</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={[
          {
            title: "Dashboard",
            url: "/dashboard",
            icon: (
              <HugeiconsIcon icon={DashboardSquare01Icon} strokeWidth={2} />
            ),
          },
          ...(currentUser.role === "CLASS"
            ? [
                {
                  title: "Students",
                  url: "/students",
                  icon: (
                    <HugeiconsIcon icon={UserCircle02Icon} strokeWidth={2} />
                  ),
                },
              ]
            : []),
          {
            title: "Semesters",
            url: "/semesters",
            icon: (
              <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} />
            ),
          },
          {
            title: "Courses",
            url: "/courses",
            icon: (
              <HugeiconsIcon icon={Database01Icon} strokeWidth={2} />
            ),
          },
          {
            title: "Schedules",
            url: "/schedules",
            icon: (
              <HugeiconsIcon icon={ChartHistogramIcon} strokeWidth={2} />
            ),
          },
          {
            title: "Tasks",
            url: "/tasks",
            icon: (
              <HugeiconsIcon icon={File01Icon} strokeWidth={2} />
            ),
          },
          {
            title: "Files",
            url: "/files",
            icon: (
              <HugeiconsIcon icon={Folder01Icon} strokeWidth={2} />
            ),
          },
          {
            title: "Calendar",
            url: "/calendar",
            icon: (
              <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} />
            ),
          },
          {
            title: "Man Finance",
            url: process.env.NEXT_PUBLIC_MAN_FINANCE_URL || "https://pension-minus-newer-insight.trycloudflare.com",
            icon: (
              <HugeiconsIcon icon={Analytics01Icon} strokeWidth={2} />
            ),
          },
        ]} />

        {/* Class Section */}
        <div className="px-4 py-4 mt-2 border-t border-border/40">
          {currentUser.role === "CLASS" ? (
            <div className="p-3 bg-muted/30 border border-border/40 rounded-lg text-xs flex flex-col gap-2">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Your Class Code</span>
              <div className="flex items-center justify-between gap-1">
                <span className="font-mono text-sm text-primary font-bold">{currentUser.classCode}</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 px-2 text-[10px]"
                  onClick={() => {
                    navigator.clipboard.writeText(currentUser.classCode || "");
                    alert("Class code copied to clipboard!");
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">Share this code with your students to sync schedules and tasks.</p>
            </div>
          ) : (
            <div className="p-3 bg-muted/30 border border-border/40 rounded-lg text-xs flex flex-col gap-2">
              {currentUser.joinedClassId ? (
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Joined Class</span>
                  <div className="font-medium text-foreground text-xs truncate">
                    {currentUser.joinedClass?.name || "Connected Class"}
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="h-7 w-full text-[10px] mt-1"
                    onClick={handleLeaveClass}
                  >
                    Leave Class
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">Join a Class</span>
                  <div className="flex gap-1.5">
                    <input 
                      type="text" 
                      placeholder="CLASS-XXXXXX" 
                      value={classCodeInput}
                      onChange={(e) => setClassCodeInput(e.target.value.toUpperCase())}
                      className="bg-background border border-border/60 rounded px-2 py-1 text-xs w-full focus:outline-none focus:border-primary/60 font-mono"
                    />
                    <Button 
                      size="sm" 
                      className="h-7 px-2.5 text-[10px]" 
                      onClick={handleJoinClass}
                      disabled={joining || !classCodeInput}
                    >
                      {joining ? "..." : "Join"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
