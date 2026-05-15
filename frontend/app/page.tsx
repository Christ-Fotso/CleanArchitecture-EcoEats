import { redirect } from "next/navigation";

// La page racine redirige vers le dashboard (où les restaurants sont visibles)
// Si non connecté, le dashboard redirige vers login uniquement au moment de commander
export default function Home() {
  redirect("/dashboard");
}
