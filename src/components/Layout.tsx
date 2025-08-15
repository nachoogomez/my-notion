import type { ReactNode } from "react"
import { AppSidebar } from "./app-sidebar"
import { SidebarProvider, SidebarInset } from "./ui/sidebar"

interface AppLayoutProps {
  children: ReactNode
}

export function Layout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-black text-white w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 bg-black w-full overflow-hidden">
          <main className="w-full h-full">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}