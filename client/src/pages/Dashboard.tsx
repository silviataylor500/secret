import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

interface UserProfile {
  id: string
  name: string
  email: string
  investmentAmount: number
  dailyReturnRate: number
  btcAllocated: number
  dailyEarnings: number
  totalEarnings: number
  role: string
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        setUser(response.data)
        setLoading(false)
      } catch (err: any) {
        console.error('Profile fetch error:', err)
        setError(err.response?.data?.message || 'Failed to fetch profile')
        setLoading(false)
      }
    }

    fetchProfile()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    )
  }

  // Helper to safely format numbers
  const formatUSD = (val: any) => {
    const num = parseFloat(val)
    return isNaN(num) ? '0.00' : num.toFixed(2)
  }

  const formatBTC = (val: any) => {
    const num = parseFloat(val)
    return isNaN(num) ? '0.00000000' : num.toFixed(8)
  }

  const formatPercent = (val: any) => {
    const num = parseFloat(val)
    return isNaN(num) ? '0.00' : num.toFixed(2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navbar */}
      <nav className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-xs">₿</span>
              </div>
              <span className="text-xl font-bold text-white">BINANCE</span>
            </div>
            <div className="flex items-center gap-4">
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-900 rounded-lg font-bold text-sm"
                >
                  Admin Panel
                </button>
              )}
              <span className="text-slate-300 text-sm">Welcome, {user?.name || 'User'}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Investment Dashboard</h1>

        {/* Investment Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm mb-2">USD Invested</p>
            <p className="text-3xl font-bold text-white">${formatUSD(user?.investmentAmount)}</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm mb-2">Daily Return Rate</p>
            <p className="text-3xl font-bold text-green-400">{formatPercent(user?.dailyReturnRate)}%</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm mb-2">BTC Allocated</p>
            <p className="text-3xl font-bold text-white">{formatBTC(user?.btcAllocated)} BTC</p>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <p className="text-slate-400 text-sm mb-2">Daily Earnings</p>
            <p className="text-3xl font-bold text-green-400">${formatUSD(user?.dailyEarnings)}</p>
          </div>
        </div>

        {/* Earnings Projection */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Earnings Projection</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-2">7 Days</p>
              <p className="text-2xl font-bold text-green-400">
                ${formatUSD(user ? (parseFloat(user.dailyEarnings as any) || 0) * 7 : 0)}
              </p>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-2">30 Days</p>
              <p className="text-2xl font-bold text-green-400">
                ${formatUSD(user ? (parseFloat(user.dailyEarnings as any) || 0) * 30 : 0)}
              </p>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm mb-2">1 Year</p>
              <p className="text-2xl font-bold text-green-400">
                ${formatUSD(user ? (parseFloat(user.dailyEarnings as any) || 0) * 365 : 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Name:</span>
              <span className="text-white font-semibold">{user?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Email:</span>
              <span className="text-white font-semibold">{user?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Earnings:</span>
              <span className="text-green-400 font-semibold">${formatUSD(user?.totalEarnings)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
