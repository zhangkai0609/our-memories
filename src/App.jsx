import { useState, useEffect, Component } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Home from './pages/Home'
import NewRecord from './pages/NewRecord'
import Map from './pages/Map'
import Gallery from './pages/Gallery'
import My from './pages/My'
import Welcome from './pages/Welcome'

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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#fff0f3', color: '#89726e', fontSize: 15, fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}>翻开我们的故事...</div>
  if (!session) return <Navigate to="/welcome" />
  return children
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/new" element={<ProtectedRoute><NewRecord /></ProtectedRoute>} />
          <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
          <Route path="/my" element={<ProtectedRoute><My /></ProtectedRoute>} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}
