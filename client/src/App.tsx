import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import Deposit from './pages/Deposit'
import Withdrawal from './pages/Withdrawal'
import Chat from './pages/Chat'
import Markets from './pages/Markets'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/withdrawal" element={<Withdrawal />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/markets" element={<Markets />} />
      </Routes>
    </Router>
  )
}
