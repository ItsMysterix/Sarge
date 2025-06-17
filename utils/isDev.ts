export const isDev = process.env.NODE_ENV === "development"

export const mockDelay = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms))

export const mockUser = {
  name: "Alex Chen",
  email: "alex@company.com",
  role: "DevOps Engineer",
  avatar: "/placeholder.svg?height=32&width=32&text=AC",
}
