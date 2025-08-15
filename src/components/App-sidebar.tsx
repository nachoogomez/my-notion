import { useLocation, useNavigate } from "react-router-dom"
import { Calendar, CheckSquare, Focus, StickyNote, User } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserMenu } from "./UserMenu"

const mainItems = [
  {
    title: "My Focus",
    icon: Focus,
    path: "/my-focus",
  },
  {
    title: "Tasks",
    icon: CheckSquare,
    path: "/tasks",
  },
  {
    title: "Calendar",
    icon: Calendar,
    path: "/calendar",
  },
  {
    title: "Notes",
    icon: StickyNote,
    path: "/notes",
  },
]

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Sidebar className="border-r border-[#1f1f1f] bg-black">
      <SidebarHeader className="p-4 border-b border-[#1f1f1f] bg-black">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" />
            <AvatarFallback className="bg-[#2563eb] text-white">
              <User className="h-4 w-4" />
              <UserMenu />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm text-white">My Workspace</div>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-4 bg-black">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={location.pathname === item.path}
                    className="text-[#888888] hover:text-white hover:bg-[#1f1f1f] data-[active=true]:bg-[#2563eb] data-[active=true]:text-white rounded-md"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
