import { toast as sonnerToast } from "sonner"

export const toast = {
  add: (options: {
    type?: "success" | "info" | "warning" | "error" | "default"
    description: string
    priority?: "low" | "high"
  }) => {
    const message = options.description
    switch (options.type) {
      case "success":
        sonnerToast.success(message)
        break
      case "error":
        sonnerToast.error(message)
        break
      case "warning":
        sonnerToast.warning(message)
        break
      case "info":
        sonnerToast.info(message)
        break
      default:
        sonnerToast(message)
    }
  }
}
