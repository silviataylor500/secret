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

  useEffect(() => {
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
        setUser(profileRes.data)

        const settingsRes = await axios.get('/api/settings/all', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setSettings(settingsRes.data)

        const btcRes = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
        setBtcPrice(btcRes.data.bitcoin.usd)

        setLoading(false)
      } catch (err: any) {
        console.error('Data fetch error:', err)
        setError(err.response?.data?.message || 'Failed to fetch dashboard data')
        setLoading(false)
      }
    }

    fetchData()
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
          <h2 className="text-2xl font-bold text-white mb-2">Fetch Error</h2>
          <p className="text-[#848e9c] mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-[#2b2f36] hover:bg-[#363a45] text-white rounded-xl font-bold transition-colors"
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
              <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center">
                <span className="text-black font-black text-sm">₿</span>
              </div>
              <span className="text-xl font-black tracking-tighter text-white">BINANCE <span className="text-orange-500">x</span> AMAZON</span>
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
          <div className="bg-[#1e2329] border border-[#2b2f36] rounded-2xl p-6 hover:border-yellow-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[#848e9c] text-xs font-bold uppercase tracking-wider">Total Invested</p>
              <span className="text-xl group-hover:scale-110 transition-transform">💵</span>
            </div>
            <p className="text-3xl font-black text-white">${formatUSD(user?.investmentAmount)}</p>
          </div>

          <div className="bg-[#1e2329] border border-[#2b2f36] rounded-2xl p-6 hover:border-orange-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[#848e9c] text-xs font-bold uppercase tracking-wider">Trading Income</p>
              <span className="text-xl group-hover:scale-110 transition-transform">📈</span>
            </div>
            <p className="text-3xl font-black text-orange-500">${formatUSD(user?.tradingIncome)}</p>
            <div className="mt-2 flex items-center gap-1">
              <span className="text-[10px] text-[#848e9c]">VIP Profit</span>
            </div>
          </div>

          <div className="bg-[#1e2329] border border-[#2b2f36] rounded-2xl p-6 hover:border-[#0ecb81]/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[#848e9c] text-xs font-bold uppercase tracking-wider">Daily Earnings</p>
              <span className="text-xl group-hover:scale-110 transition-transform">💰</span>
            </div>
            <p className="text-3xl font-black text-[#0ecb81]">${formatUSD(totalDailyEarnings)}</p>
            <div className="mt-2 flex items-center gap-1">
              <span className="text-[10px] text-[#848e9c]">Across all active levels</span>
            </div>
          </div>

          <div className="bg-[#1e2329] border border-[#2b2f36] rounded-2xl p-6 hover:border-blue-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[#848e9c] text-xs font-bold uppercase tracking-wider">BTC Allocated</p>
              <span className="text-xl group-hover:scale-110 transition-transform">🪙</span>
            </div>
            <p className="text-2xl font-black text-white">{formatBTC(user?.btcAllocated)} BTC</p>
            <div className="mt-2 flex items-center gap-1">
              <span className="text-[10px] text-[#848e9c]">Secured in Cold Storage</span>
            </div>
          </div>
        </div>

        {/* Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {/* VIP Trading Box */}
          <div 
            onClick={() => user?.vipUnlocked && navigate('/trading')}
            className={`relative overflow-hidden rounded-2xl border-2 transition-all p-6 cursor-pointer group ${
              user?.vipUnlocked 
                ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/5 border-orange-500/50 hover:border-orange-500' 
                : 'bg-[#1e2329] border-[#2b2f36] opacity-75 grayscale'
            }`}
          >
            {!user?.vipUnlocked && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-[#2b2f36] rounded-full flex items-center justify-center mb-2 border border-[#474d57]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="text-white font-black text-sm tracking-widest">LOCKED</span>
                <span className="text-[10px] text-[#848e9c] mt-1">Contact Admin to Unlock</span>
              </div>
            )}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">VIP</h3>
                <p className="text-orange-500 text-xs font-bold uppercase tracking-widest">Option Trading</p>
              </div>
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <span className="text-orange-500 text-xl">💎</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[#848e9c] text-[10px] font-bold uppercase">Potential Profit</p>
                  <p className="text-xl font-black text-white">20% - 80%</p>
                </div>
                <div className="text-right">
                  <p className="text-[#848e9c] text-[10px] font-bold uppercase">Duration</p>
                  <p className="text-sm font-bold text-white">30 Seconds</p>
                </div>
              </div>
              <button className={`w-full py-3 rounded-xl font-black text-sm transition-all ${
                user?.vipUnlocked 
                  ? 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20' 
                  : 'bg-[#2b2f36] text-[#474d57]'
              }`}>
                {user?.vipUnlocked ? 'START TRADING' : 'LOCKED'}
              </button>
            </div>
          </div>

          {levels.map((l) => (
            <div 
              key={l.level}
              className={`relative overflow-hidden rounded-2xl border-2 transition-all p-6 ${
                isLevelUnlocked(l.level) 
                  ? `bg-gradient-to-br ${l.color} ${l.border} hover:scale-[1.02]` 
                  : 'bg-[#1e2329] border-[#2b2f36] opacity-75 grayscale'
              }`}
            >
              {!isLevelUnlocked(l.level) && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 bg-[#2b2f36] rounded-full flex items-center justify-center mb-2 border border-[#474d57]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#848e9c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <span className="text-white font-black text-xs tracking-widest">LOCKED</span>
                </div>
              )}
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">{l.name}</h3>
                  <p className="text-[#848e9c] text-[10px] font-bold uppercase tracking-widest">Automated Digging</p>
                </div>
                <div className="text-right">
                  <p className="text-[#0ecb81] text-lg font-black">{formatPercent(l.rate)}%</p>
                  <p className="text-[#848e9c] text-[10px] font-bold uppercase">Daily Rate</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase text-[#848e9c] mb-1">
                    <span>Allocation</span>
                    <span className="text-white">${formatUSD((user as any)[`level${l.level}_amount` as keyof UserProfile] || 0)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#2b2f36] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 transition-all duration-1000" 
                      style={{ width: isLevelUnlocked(l.level) ? '100%' : '0%' }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div>
                    <p className="text-[#848e9c] text-[10px] font-bold uppercase">Daily Profit</p>
                    <p className="text-sm font-bold text-white">
                      ${formatUSD((parseFloat((user as any)[`level${l.level}_amount` as keyof UserProfile] || 0) * l.rate) / 100)}
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-[#2b2f36] rounded-lg border border-[#474d57]">
                    <span className="text-[10px] font-bold text-[#0ecb81]">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Market Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#1e2329] border border-[#2b2f36] rounded-2xl p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-white">Profit Projections</h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold rounded-lg border border-yellow-500/20">ESTIMATED</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="p-6 bg-[#0b0e11] rounded-2xl border border-[#2b2f36] hover:border-yellow-500/30 transition-all">
                <p className="text-[#848e9c] text-xs font-bold uppercase mb-2">Weekly Profit</p>
                <p className="text-2xl font-black text-white">${formatUSD(totalDailyEarnings * 7)}</p>
                <p className="text-[10px] text-[#0ecb81] mt-1 font-bold">+700% Efficiency</p>
              </div>
              <div className="p-6 bg-[#0b0e11] rounded-2xl border border-[#2b2f36] hover:border-yellow-500/30 transition-all">
                <p className="text-[#848e9c] text-xs font-bold uppercase mb-2">Monthly Profit</p>
                <p className="text-2xl font-black text-white">${formatUSD(totalDailyEarnings * 30)}</p>
                <p className="text-[10px] text-[#0ecb81] mt-1 font-bold">+3000% Efficiency</p>
              </div>
              <div className="p-6 bg-[#0b0e11] rounded-2xl border border-[#2b2f36] hover:border-yellow-500/30 transition-all">
                <p className="text-[#848e9c] text-xs font-bold uppercase mb-2">Yearly Profit</p>
                <p className="text-2xl font-black text-white">${formatUSD(totalDailyEarnings * 365)}</p>
                <p className="text-[10px] text-[#0ecb81] mt-1 font-bold">+36500% Efficiency</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black text-black mb-2">Need Help?</h3>
              <p className="text-black/70 text-sm font-medium mb-6">Our 24/7 support team is here to assist you with your investments.</p>
              <button 
                onClick={() => navigate('/chat')}
                className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-black/80 transition-all"
              >
                Contact Support
              </button>
            </div>
            <div className="relative z-10 mt-8 pt-8 border-t border-black/10">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-yellow-500 bg-[#2b2f36] flex items-center justify-center text-[10px] font-bold text-white">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-xs font-bold text-black/60">Advisors Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-[#181a20] border-t border-[#2b2f36] py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center">
                <span className="text-black font-black text-[10px]">₿</span>
              </div>
              <span className="text-lg font-black tracking-tighter text-white">BINANCE <span className="text-orange-500">x</span> AMAZON</span>
            </div>
            <div className="flex gap-8 text-[#848e9c] text-xs font-bold uppercase tracking-widest">
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Security</a>
              <a href="#" className="hover:text-white transition-colors">SAFU</a>
            </div>
            <p className="text-[#848e9c] text-[10px] font-medium">© 2026 Binance x Amazon. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
