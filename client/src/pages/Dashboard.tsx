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
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-yellow-500 font-bold animate-pulse">Loading Dashboard...</div>
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
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-bold transition-colors"
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

  const formatPercent = (val: any) => {
    const num = parseFloat(val)
    return isNaN(num) ? '0.000' : num.toFixed(3)
  }

  const isLevelUnlocked = (level: number) => {
    return user && user.unlockedLevel >= level
  }

  // Levels 1-5 only (Removed BASIC/Level 0)
  const levels = [
    { name: 'Level 1', level: 1, rate: settings?.level1_rate || 0.05, color: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/30' },
    { name: 'Level 2', level: 2, rate: settings?.level2_rate || 0.10, color: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/30' },
    { name: 'Level 3', level: 3, rate: settings?.level3_rate || 0.15, color: 'from-pink-500/20 to-pink-600/5', border: 'border-pink-500/30' },
    { name: 'Level 4', level: 4, rate: settings?.level4_rate || 0.20, color: 'from-orange-500/20 to-orange-600/5', border: 'border-orange-500/30' },
    { name: 'Level 5', level: 5, rate: settings?.level5_rate || 0.25, color: 'from-yellow-500/20 to-yellow-600/5', border: 'border-yellow-500/30' },
  ]

  // CALCULATE DYNAMIC RETURN RATE (Average of unlocked levels 1-5)
  const calculateAverageReturnRate = () => {
    if (!user) return 0;
    const unlockedLevels = levels.filter(l => l.level <= user.unlockedLevel);
    if (unlockedLevels.length === 0) return 0;
    const sum = unlockedLevels.reduce((acc, curr) => acc + curr.rate, 0);
    return sum / unlockedLevels.length;
  }

  // CALCULATE TOTAL DAILY EARNINGS (Sum of earnings from each level 1-5)
  const calculateTotalDailyEarnings = () => {
    if (!user) return 0;
    let total = 0;
    levels.forEach(l => {
      const amount = parseFloat((user as any)[`level${l.level}_amount` as keyof UserProfile] || 0);
      total += (amount * l.rate) / 100;
    });
    return total;
  }

  const dynamicReturnRate = calculateAverageReturnRate();
  const totalDailyEarnings = calculateTotalDailyEarnings();

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] font-sans">
      {/* Navbar */}
      <nav className="bg-[#181a20] border-b border-[#2b2f36] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Logo size="md" />
              <div className="hidden md:flex items-center gap-2 ml-6 px-3 py-1 bg-[#2b2f36] rounded-full border border-[#474d57]">
                <span className="w-2 h-2 bg-[#0ecb81] rounded-full animate-pulse"></span>
                <span className="text-xs font-bold text-[#848e9c]">Chain {user?.chain}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end mr-4">
                <span className="text-[10px] text-[#848e9c] uppercase tracking-widest font-bold">BTC Price</span>
                <span className="text-sm font-bold text-[#0ecb81]">${btcPrice.toLocaleString()}</span>
              </div>
              
              {(user?.role === 'admin' || user?.role === 'co-admin' || user?.role === 'master-admin') && (
                <button
                  onClick={() => navigate('/admin')}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-bold text-xs transition-all shadow-lg shadow-yellow-500/10"
                >
                  Admin
                </button>
              )}
              
              <div className="h-8 w-px bg-[#2b2f36] mx-1"></div>
              
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/dashboard')}>
                <div className="w-8 h-8 bg-[#2b2f36] rounded-full flex items-center justify-center border border-[#474d57] group-hover:border-yellow-500 transition-colors">
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">Portfolio Overview</h1>
            <p className="text-[#848e9c] text-sm">Welcome back, <span className="text-white font-bold">{user?.name}</span>. Your assets are SAFU.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => navigate('/deposit')}
              className="flex-1 md:flex-none px-8 py-3 bg-[#0ecb81] hover:bg-[#0ba368] text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#0ecb81]/10"
            >
              Deposit
            </button>
            <button
              onClick={() => navigate('/withdrawal')}
              className="flex-1 md:flex-none px-8 py-3 bg-[#2b2f36] hover:bg-[#363a45] text-white rounded-xl font-bold text-sm border border-[#474d57] transition-all"
            >
              Withdraw
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="p-3 bg-[#2b2f36] hover:bg-[#363a45] text-white rounded-xl border border-[#474d57] transition-all"
              title="Support Chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-[#1e2329] border border-[#2b2f36] p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs font-bold text-[#848e9c] uppercase tracking-widest mb-2">Total Investment</p>
            <p className="text-3xl font-black text-white">${safeFormatUSD(user?.investmentAmount)}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded uppercase">Active Assets</span>
            </div>
          </div>

          <div className="bg-[#1e2329] border border-[#2b2f36] p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <p className="text-xs font-bold text-[#848e9c] uppercase tracking-widest mb-2">Trading Income</p>
            <p className="text-3xl font-black text-[#0ecb81]">${safeFormatUSD(user?.tradingIncome)}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#0ecb81]/10 text-[#0ecb81] rounded uppercase">VIP Profit</span>
            </div>
          </div>

          <div className="bg-[#1e2329] border border-[#2b2f36] p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-xs font-bold text-[#848e9c] uppercase tracking-widest mb-2">BTC Allocated</p>
            <p className="text-3xl font-black text-white">{safeFormatBTC(user?.btcAllocated)}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded uppercase">Network Value</span>
            </div>
          </div>

          <div className="bg-[#1e2329] border border-[#2b2f36] p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs font-bold text-[#848e9c] uppercase tracking-widest mb-2">Daily Earnings</p>
            <p className="text-3xl font-black text-yellow-500">${safeFormatUSD(totalDailyEarnings)}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded uppercase">Est. 24h Return</span>
            </div>
          </div>
        </div>

        {/* Level Overview */}
        <div className="mb-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-black text-white mb-1">Mining Levels</h2>
              <p className="text-[#848e9c] text-sm">Upgrade your level to increase your daily return rate.</p>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-[10px] text-[#848e9c] uppercase tracking-widest font-bold mb-1">Avg. Return Rate</p>
              <p className="text-xl font-black text-[#0ecb81]">{formatPercent(dynamicReturnRate)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {levels.map((l) => (
              <div 
                key={l.level}
                className={`p-6 rounded-3xl border ${l.border} bg-gradient-to-br ${l.color} relative overflow-hidden group transition-all hover:scale-[1.02]`}
              >
                {!isLevelUnlocked(l.level) && (
                  <div className="absolute inset-0 bg-[#0b0e11]/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                    <div className="bg-[#1e2329] p-2 rounded-full border border-[#2b2f36] shadow-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#848e9c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                )}
                <div className="relative z-0">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black px-2 py-1 bg-white/10 rounded uppercase tracking-widest">{l.name}</span>
                    <span className="text-xs font-bold text-white/60">{l.rate}%</span>
                  </div>
                  <p className="text-xs text-[#848e9c] mb-1">Level Balance</p>
                  <p className="text-xl font-black text-white">${safeFormatUSD((user as any)[`level${l.level}_amount` as keyof UserProfile] || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VIP Trading Banner */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 relative overflow-hidden group cursor-pointer" onClick={() => navigate('/trading')}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/20 rounded-full mb-4">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">VIP Exclusive</span>
              </div>
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Advanced VIP Trading</h2>
              <p className="text-white/80 max-w-xl">Execute high-frequency trades with our automated system and earn up to 80% profit per trade. VIP access required.</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <button className="px-10 py-4 bg-white text-orange-600 rounded-xl font-black text-lg hover:bg-orange-50 transition-all shadow-xl shadow-black/10">
                {user?.vipUnlocked ? 'ENTER TRADING' : 'UNLOCK VIP'}
              </button>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Powered by Digging Pool AI</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-10 border-t border-[#2b2f36] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-xs text-[#474d57]">© 2026 Digging Pool. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <span className="text-xs text-[#848e9c] hover:text-white cursor-pointer transition-colors">Support</span>
            <span className="text-xs text-[#848e9c] hover:text-white cursor-pointer transition-colors">Security</span>
            <span className="text-xs text-[#848e9c] hover:text-white cursor-pointer transition-colors">Privacy</span>
          </div>
        </div>
      </div>
    </div>
  )
}
