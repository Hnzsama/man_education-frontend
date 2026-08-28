"use client"
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Folder01Icon } from "@hugeicons/core-free-icons"

interface CourseFolderGridProps {
  loading: boolean
  courses: any[]
  tasks: any[]
  resources: any[]
  coursePalette: string[]
  onSelectCourse: (course: any) => void
}

export function CourseFolderGrid({
  loading,
  courses,
  tasks,
  resources,
  coursePalette,
  onSelectCourse,
}: CourseFolderGridProps) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <HugeiconsIcon icon={Folder01Icon} className="h-6 w-6 text-primary" />
          Files & Materials
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All lecture materials and assignment submissions in one place.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl border bg-muted/20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {courses.map((course, idx) => {
            const resCount = resources.filter((r) => r.courseId === course.id && !r.taskId).length
            const taskCount = tasks.filter((t) => t.courseId === course.id).length
            const palette = coursePalette[idx % coursePalette.length]
            return (
              <button
                key={course.id}
                onClick={() => onSelectCourse(course)}
                className={`group relative flex flex-col gap-3 rounded-2xl border bg-gradient-to-br ${palette} p-5 text-left transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/10 active:scale-95`}
              >
                <HugeiconsIcon icon={Folder01Icon} className="h-10 w-10 opacity-80 group-hover:scale-110 transition-transform" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm leading-tight line-clamp-2">{course.name}</p>
                  <p className="text-[11px] font-mono opacity-70 mt-0.5">{course.code}</p>
                </div>
                <div className="text-[10px] font-semibold opacity-60 flex justify-between">
                  <span>{resCount} materials</span>
                  <span>{taskCount} tasks</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
