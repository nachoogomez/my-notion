import { useAuth } from "@/context/AuthContext";
import { LoginForm } from "@/components/LoginForm";

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <>{children}</>
}
