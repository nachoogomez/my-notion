import './App.css'
import {Layout} from './components/Layout'
import Routes from './routes/Routes'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './routes/ProtectedRoutes'

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <Layout>
          <Routes />
        </Layout>
      </ProtectedRoute>
    </AuthProvider>
  )
}

export default App
