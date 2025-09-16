import './App.css'
import {Layout} from './components/Layout'
import Routes from './routes/Routes'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ProtectedRoute } from './routes/ProtectedRoutes'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ProtectedRoute>
          <Layout>
            <Routes />
          </Layout>
        </ProtectedRoute>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
