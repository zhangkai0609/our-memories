import { useState, useEffect, Component } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Home from './pages/Home'
import NewRecord from './pages/NewRecord'

// 错误边界：捕获任何渲染错误
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#e53935' }}>
          <h2>页面出错了</h2>
          <pre style={{ fontSize: 12, textAlign: 'left' }}>{this.state.error.message}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession()
      .then(({ data }) => {
        if (mounted) { setSession(data.session); setLoading(false) }
      })
      .catch(() => {
        if (mounted) { setSession(null); setLoading(false) }
      })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#888', fontSize: 16 }}>加载中...</div>
  if (!session) return <Navigate to="/login" />
  return children
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/new" element={<ProtectedRoute><NewRecord /></ProtectedRoute>} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}
