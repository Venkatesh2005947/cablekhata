// src/app/page.tsx
import { redirect } from "next/navigation";

// Root "/" redirects to the Areas Directory (main screen)
export default function HomePage() {
  redirect("/areas");
}
