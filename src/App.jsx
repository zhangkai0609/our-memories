import { Component } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import NewRecord from './pages/NewRecord'
import Map from './pages/Map'
import Gallery from './pages/Gallery'
import My from './pages/My'
import DiaryDetail from './pages/DiaryDetail'
import Welcome from './pages/Welcome'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
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

// 简单路由守卫：有 room_code 才能进内部页面
function RoomGuard({ children }) {
  const code = localStorage.getItem('room_code')
  if (!code) return <Navigate to="/welcome" />
  return children
}

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RoomGuard><Home /></RoomGuard>} />
          <Route path="/new" element={<RoomGuard><NewRecord /></RoomGuard>} />
          <Route path="/map" element={<RoomGuard><Map /></RoomGuard>} />
          <Route path="/gallery" element={<RoomGuard><Gallery /></RoomGuard>} />
          <Route path="/my" element={<RoomGuard><My /></RoomGuard>} />
          <Route path="/diary/:id" element={<RoomGuard><DiaryDetail /></RoomGuard>} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}
