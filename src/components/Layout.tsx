import type { ReactNode } from "react"
import { AppSidebar } from "./App-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "./ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"

interface AppLayoutProps {
  children: ReactNode
}

export function Layout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-black text-white w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 bg-black w-full flex flex-col">
          {/* Mobile Header with Hamburger Menu */}
          <MobileHeader />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

function MobileHeader() {
  const isMobile = useIsMobile()
  
  if (!isMobile) return null
  
  return (
    <div className="md:hidden flex items-center justify-between p-4 border-b border-[#1f1f1f] bg-black">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-white hover:bg-[#1f1f1f]" />
        <h1 className="text-lg font-semibold text-white">My Workspace</h1>
      </div>
    </div>
  )
}