"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LoginForm } from "@/components/login-form"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    if (token) {
      // Store JWT in cookie
      document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`
      router.push("/dashboard")
    }
  }, [token, router])

  return <LoginForm />
}

export default function LoginPage() {
  return (
    <div suppressHydrationWarning className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div suppressHydrationWarning className="w-full max-w-sm">
        <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Loading...</div>}>
          <LoginContent />
        </Suspense>
      </div>
    </div>
  )
}
