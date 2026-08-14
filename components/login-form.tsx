"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { HugeiconsIcon } from "@hugeicons/react"
import { LayoutBottomIcon } from "@hugeicons/core-free-icons"
import { API_URL } from "@/lib/config"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<"INDIVIDUAL" | "CLASS">("INDIVIDUAL")
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role, name }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Invalid credentials")
      }

      if (data.requiresVerification) {
        setShowOtpInput(true)
        setLoading(false)
        return
      }

      // Store JWT in cookie
      document.cookie = `token=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "An error occurred during login")
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code: otpCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Invalid verification code")
      }

      // Store JWT in cookie
      document.cookie = `token=${data.accessToken}; path=/; max-age=604800; SameSite=Lax`

      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Invalid verification code")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google?role=${role}&name=${encodeURIComponent(name)}`
  }

  if (showOtpInput) {
    return (
      <div suppressHydrationWarning className={cn("flex flex-col gap-6", className)} {...props}>
        <form onSubmit={handleVerifyOtp}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex size-8 items-center justify-center rounded-md">
                <HugeiconsIcon icon={LayoutBottomIcon} strokeWidth={2} className="size-6" />
              </div>
              <h1 className="text-xl font-bold">Email Verification</h1>
              <FieldDescription>
                We have sent a 6-digit verification code to <span className="font-semibold text-foreground">{email}</span>.
              </FieldDescription>
            </div>

            {error && (
              <div className="text-sm font-medium text-destructive text-center">
                {error}
              </div>
            )}

            <Field>
              <FieldLabel htmlFor="otp">Verification Code</FieldLabel>
              <Input
                id="otp"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                required
                className="text-center tracking-[10px] font-mono text-lg font-bold"
              />
            </Field>

            <Field>
              <Button type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify Code"}
              </Button>
            </Field>

            <Field className="text-center">
              <Button 
                type="button" 
                variant="ghost" 
                className="text-xs w-full" 
                onClick={() => setShowOtpInput(false)}
              >
                Back to Login
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    )
  }

  return (
    <div suppressHydrationWarning className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-8 items-center justify-center rounded-md">
              <HugeiconsIcon icon={LayoutBottomIcon} strokeWidth={2} className="size-6" />
            </div>
            <h1 className="text-xl font-bold">Welcome to Man Education</h1>
            <FieldDescription>
              Don&apos;t have an account? <a href="#">Sign up</a>
            </FieldDescription>
          </div>

          {error && (
            <div className="text-sm font-medium text-destructive text-center">
              {error}
            </div>
          )}

          <Field>
            <FieldLabel>Account Type</FieldLabel>
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/20 border border-border/40 rounded-lg">
              <Button
                type="button"
                variant={role === "INDIVIDUAL" ? "default" : "ghost"}
                onClick={() => setRole("INDIVIDUAL")}
                className="w-full text-xs py-1"
              >
                Individual
              </Button>
              <Button
                type="button"
                variant={role === "CLASS" ? "default" : "ghost"}
                onClick={() => setRole("CLASS")}
                className="w-full text-xs py-1"
              >
                Class (Manage Assignments)
              </Button>
            </div>
          </Field>

          {role === "CLASS" && (
            <Field>
              <FieldLabel htmlFor="name">Class Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="e.g. XII RPL 1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          <Field>
            <Button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </Field>

          <FieldSeparator>Or</FieldSeparator>

          <Field className="grid gap-4">
            <Button variant="outline" type="button" onClick={handleGoogleLogin}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Continue with Google
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
