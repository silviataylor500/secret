import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Logo from '../components/Logo'

interface UserProfile {
  id: string
  name: string
  email: string
  investmentAmount: number
  dailyReturnRate: number
  btcAllocated: number
  dailyEarnings: number
  totalEarnings: number
  level0_amount: number
  level1_amount: number
  level2_amount: number
  level3_amount: number
  level4_amount: number
  level5_amount: number
  role: string
  chain: number
  unlockedLevel: number
  tradingIncome: number
  vipUnlocked: boolean
  vipProfitRate: number
}

interface Settings {
  level1_rate: number
  level2_rate: number
  level3_rate: number
  level4_rate: number
  level5_rate: number
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [btcPrice, setBtcPrice] = useState(0)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const fetchData = async () => {
      try {
        const profileRes = await axios.get('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (!isMounted.current) return
        setUser(profileRes.data)

        try {
          const settingsRes = await axios.get('/api/settings/all', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (isMounted.current) setSettings(settingsRes.data)
        } catch (settingsErr) {
          console.error('Settings fetch error:', settingsErr)
        }

        try {
          const btcRes = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
          if (isMounted.current) setBtcPrice(btcRes.data.bitcoin.usd)
        } catch (btcErr) {
          console.error('BTC Price fetch error:', btcErr)
          if (isMounted.current) setBtcPrice(75000)
        }

        if (isMounted.current) setLoading(false)
      } catch (err: any) {
        console.error('Data fetch error:', err)
        if (isMounted.current) {
          setError(err.response?.data?.message || 'Failed to fetch dashboard data. Please check your connection.')
          setLoading(false)
        }
      }
    }

    fetchData()
    return () => { isMounted.current = false }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-orange-500 font-bold animate-pulse">Loading Dashboard...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center p-4">
        <div className="bg-[#1e2329] border border-[#f6465d]/30 p-8 rounded-2xl text-center max-w-md w-full">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-[#848e9c] mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  const formatUSD = (val: any) => {
    const num = parseFloat(val)
    return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const formatBTC = (val: any) => {
    const num = parseFloat(val)
    return isNaN(num) ? '0.00000000' : num.toFixed(8)
  }

  const safeFormatUSD = (val: any) => formatUSD(val);
  const safeFormatBTC = (val: any) => formatBTC(val);

  const isLevelUnlocked = (level: number) => {
    return user && user.unlockedLevel >= level
  }

  const levels = [
    { name: 'Level 1', level: 1, rate: settings?.level1_rate || 0.05, icon: '💚', color: 'from-green-500/20 to-green-600/5', border: 'border-green-500/30', roi: '120%' },
    { name: 'Level 2', level: 2, rate: settings?.level2_rate || 0.10, icon: '🤍', color: 'from-slate-500/20 to-slate-600/5', border: 'border-slate-500/30', roi: '150%' },
    { name: 'Level 3', level: 3, rate: settings?.level3_rate || 0.15, icon: '👑', color: 'from-yellow-500/20 to-yellow-600/5', border: 'border-yellow-500/30', roi: '180%' },
    { name: 'Level 4', level: 4, rate: settings?.level4_rate || 0.20, icon: '🔴', color: 'from-red-500/20 to-red-600/5', border: 'border-red-500/30', roi: '200%' },
  ]

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] font-sans">
      {/* Navbar */}
      <nav className="bg-[#181a20] border-b border-[#2b2f36] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Logo size="md" />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end mr-4">
                <span className="text-[10px] text-[#848e9c] uppercase tracking-widest font-bold">BTC Price</span>
                <span className="text-sm font-bold text-orange-500">${btcPrice.toLocaleString()}</span>
              </div>
              
              {(user?.role === 'admin' || user?.role === 'co-admin' || user?.role === 'master-admin') && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg font-bold text-xs transition-all"
                >
                  Admin
                </button>
              )}
              
              <div className="h-8 w-px bg-[#2b2f36] mx-1"></div>
              
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/dashboard')}>
                <div className="w-8 h-8 bg-[#2b2f36] rounded-full flex items-center justify-center border border-[#474d57] group-hover:border-orange-500 transition-colors">
                  <span className="text-xs font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
                <span className="hidden sm:inline text-sm font-medium text-[#eaecef]">{user?.name}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2 text-[#848e9c] hover:text-[#f6465d] transition-colors"
                title="Logout"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white mb-1">Portfolio Overview</h1>
          <p className="text-[#848e9c] text-sm">Welcome back, <span className="text-orange-500 font-bold">{user?.name}</span></p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#1e2329] border border-[#2b2f36] p-6 rounded-3xl">
            <p className="text-xs font-bold text-[#848e9c] uppercase tracking-widest mb-2">Total Investment</p>
            <p className="text-4xl font-black text-white">${safeFormatUSD(user?.investmentAmount)}</p>
          </div>

          <div className="bg-[#1e2329] border border-[#2b2f36] p-6 rounded-3xl">
            <p className="text-xs font-bold text-[#848e9c] uppercase tracking-widest mb-2">Trading Income</p>
            <p className="text-4xl font-black text-orange-500">${safeFormatUSD(user?.tradingIncome)}</p>
          </div>

          <div className="bg-[#1e2329] border border-[#2b2f36] p-6 rounded-3xl">
            <p className="text-xs font-bold text-[#848e9c] uppercase tracking-widest mb-2">Daily Earnings</p>
            <p className="text-4xl font-black text-[#0ecb81]">${safeFormatUSD(user?.dailyEarnings)}</p>
          </div>
        </div>

        {/* BTC Chart Section */}
        <div className="bg-[#1e2329] border border-[#2b2f36] rounded-3xl p-8 mb-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-xs font-bold text-[#848e9c] uppercase tracking-widest mb-2">BTC / USD</p>
              <h2 className="text-5xl font-black text-white">${btcPrice.toLocaleString()}</h2>
              <p className="text-sm text-[#0ecb81] font-bold mt-2">+1.58% $750.24</p>
            </div>
          </div>

          {/* Candlestick Chart Visualization */}
          <div className="h-48 flex items-end gap-1 mb-8 px-4">
            {[...Array(50)].map((_, i) => {
              const isGreen = Math.random() > 0.4;
              const height = Math.random() * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                  {/* High-Low Line */}
                  <div className="w-0.5 bg-[#2b2f36] opacity-50" style={{ height: `${height * 0.3}px` }}></div>
                  {/* Candle Body */}
                  <div 
                    className={`w-full rounded-sm ${isGreen ? 'bg-[#0ecb81]' : 'bg-[#f6465d]'}`}
                    style={{ height: `${height * 0.7}px` }}
                  ></div>
                </div>
              )
            })}
          </div>

          {/* Chart Info */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#0b0e11] rounded-xl p-4 border border-[#2b2f36]">
              <p className="text-xs font-bold text-[#848e9c] uppercase mb-1">1H</p>
              <p className="text-lg font-black text-white">-</p>
            </div>
            <div className="bg-[#0b0e11] rounded-xl p-4 border border-[#2b2f36]">
              <p className="text-xs font-bold text-[#848e9c] uppercase mb-1">24h High</p>
              <p className="text-lg font-black text-[#0ecb81]">48,950.75</p>
            </div>
            <div className="bg-[#0b0e11] rounded-xl p-4 border border-[#2b2f36]">
              <p className="text-xs font-bold text-[#848e9c] uppercase mb-1">24h Low</p>
              <p className="text-lg font-black text-[#f6465d]">47,300.12</p>
            </div>
            <div className="bg-[#0b0e11] rounded-xl p-4 border border-[#2b2f36]">
              <p className="text-xs font-bold text-[#848e9c] uppercase mb-1">Volume</p>
              <p className="text-lg font-black text-orange-500">2,480 BTC</p>
            </div>
          </div>
        </div>

        {/* Mining Levels */}
        <div className="mb-10">
          <h2 className="text-2xl font-black text-white mb-6">Mining Levels</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {levels.map((l) => (
              <div 
                key={l.level}
                className={`p-6 rounded-3xl border ${l.border} bg-gradient-to-br ${l.color} relative overflow-hidden group transition-all hover:scale-[1.02] cursor-pointer`}
              >
                {!isLevelUnlocked(l.level) && (
                  <div className="absolute inset-0 bg-[#0b0e11]/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#848e9c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                )}
                <div className="relative z-0">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-3xl">{l.icon}</span>
                    <span className="text-xs font-bold text-white/60">{l.rate}%</span>
                  </div>
                  <p className="text-sm font-bold text-white mb-1">{l.name}</p>
                  <p className="text-xs text-[#848e9c] mb-3">ROI: {l.roi}</p>
                  <p className="text-xs text-[#848e9c] mb-1">Balance</p>
                  <p className="text-xl font-black text-white">${safeFormatUSD((user as any)[`level${l.level}_amount` as keyof UserProfile] || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-10">
          <button
            onClick={() => navigate('/deposit')}
            className="flex-1 px-8 py-4 bg-[#0ecb81] hover:bg-[#0ba368] text-white rounded-xl font-bold transition-all"
          >
            Deposit
          </button>
          <button
            onClick={() => navigate('/withdrawal')}
            className="flex-1 px-8 py-4 bg-[#2b2f36] hover:bg-[#363a45] text-white rounded-xl font-bold border border-[#474d57] transition-all"
          >
            Withdraw
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="flex-1 px-8 py-4 bg-[#2b2f36] hover:bg-[#363a45] text-white rounded-xl font-bold border border-[#474d57] transition-all"
          >
            Support
          </button>
        </div>
      </div>
    </div>
  )
}
