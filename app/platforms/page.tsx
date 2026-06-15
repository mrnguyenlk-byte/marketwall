import { redirect } from "next/navigation"

/** Legacy alias — canonical route is /brokers. */
export default function PlatformsPage() {
  redirect("/brokers")
}
