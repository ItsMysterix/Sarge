import { clerkMiddleware } from "@clerk/nextjs/server"

export default clerkMiddleware()

export const config = {
  matcher: [
    "/((?!_next|.*\\..*|api/webhooks|sign-in|sign-up|landing).*)", // protected routes
    "/(api|trpc)(.*)", // always protect APIs
  ],
}
