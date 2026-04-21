import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import Logo from '../components/Logo'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

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
  const [btcPrice, setBtcPrice] = useState(75767)
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
        }

        if (isMounted.current) setLoading(false)
      } catch (err: any) {
        console.error('Data fetch error:', err)
        if (isMounted.current) {
          setError(err.response?.data?.message || 'Failed to fetch dashboard data.')
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

  const isLevelUnlocked = (level: number) => {
    return user && user.unlockedLevel >= level
  }

  const levels = [
    { name: 'Basic', level: 0, rate: 0.05, icon: '⚡', color: 'from-orange-500/20 to-orange-600/5', border: 'border-orange-500/30' },
    { name: 'Level 1', level: 1, rate: 0.05, icon: '💚', color: 'from-green-500/20 to-green-600/5', border: 'border-green-500/30' },
    { name: 'Level 2', level: 2, rate: 0.30, icon: '🤍', color: 'from-slate-500/20 to-slate-600/5', border: 'border-slate-500/30' },
    { name: 'Level 3', level: 3, rate: 1.00, icon: '👑', color: 'from-yellow-500/20 to-yellow-600/5', border: 'border-yellow-500/30' },
    { name: 'Level 4', level: 4, rate: 5.00, icon: '🔴', color: 'from-red-500/20 to-red-600/5', border: 'border-red-500/30' },
    { name: 'Level 5', level: 5, rate: 10.00, icon: '💎', color: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/30' },
  ]

  // Generate BTC price chart data with smooth line
  const generateChartData = () => {
    const labels = ['1H', '4H', '1D', '1W', '1M']
    const basePrice = btcPrice
    const priceData = [
      basePrice * 0.98,
      basePrice * 0.99,
      basePrice * 1.01,
      basePrice * 1.02,
      basePrice * 1.015,
    ]

    return {
      labels,
      datasets: [
        {
          label: 'BTC / USD',
          data: priceData,
          borderColor: '#f97316',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx
            const gradient = ctx.createLinearGradient(0, 0, 0, 300)
            gradient.addColorStop(0, 'rgba(249, 115, 22, 0.4)')
            gradient.addColorStop(1, 'rgba(249, 115, 22, 0.01)')
            return gradient
          },
          borderWidth: 3,
          fill: true,
          tension: 0.45,
          pointRadius: 5,
          pointBackgroundColor: '#f97316',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 7,
          pointHoverBorderWidth: 3,
        },
      ],
    }
  }

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#f97316',
        bodyColor: '#fff',
        borderColor: '#f97316',
        borderWidth: 2,
        padding: 16,
        displayColors: false,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: function(context: any) {
            return '$' + context.parsed.y.toLocaleString('en-US', { maximumFractionDigits: 2 })
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#848e9c',
          font: {
            size: 12,
          },
          callback: function(value: any) {
            return '$' + (value / 1000).toFixed(0) + 'k'
          }
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#848e9c',
          font: {
            size: 12,
          }
        }
      }
    }
  }

  const calculateTotalDailyEarnings = () => {
    if (!user) return 0
    let total = 0
    levels.forEach(l => {
      const amount = parseFloat((user as any)[`level${l.level}_amount` as keyof UserProfile] || 0)
      total += (amount * l.rate) / 100
    })
    return total
  }

  const totalDailyEarnings = calculateTotalDailyEarnings()

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Portfolio Overview</h1>
            <p className="text-[#848e9c] text-sm">Welcome back, <span className="text-orange-500 font-bold">{user?.name}</span>. Your assets are SAFU.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => navigate('/deposit')}
              className="flex-1 md:flex-none px-8 py-3 bg-[#0ecb81] hover:bg-[#0ba368] text-white rounded-xl font-bold text-sm transition-all"
            >
              Deposit
            </button>
            <button
              onClick={() => navigate('/withdrawal')}
              className="flex-1 md:flex-none px-8 py-3 bg-[#2b2f36] hover:bg-[#363a45] text-white rounded-xl font-bold text-sm border border-[#474d57] transition-all"
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#1e2329] border border-[#2b2f36] p-6 rounded-3xl">
            <p className="text-xs font-bold text-[#848e9c] uppercase tracking-widest mb-2">Total Investment</p>
            <p className="text-3xl font-black text-white">${formatUSD(user?.investmentAmount)}</p>
          </div>

          <div className="bg-[#1e2329] border border-[#2b2f36] p-6 rounded-3xl">
            <p className="text-xs font-bold text-[#848e9c] uppercase tracking-widest mb-2">Trading Income</p>
            <p className="text-3xl font-black text-[#0ecb81]">${formatUSD(user?.tradingIncome)}</p>
          </div>

          <div className="bg-[#1e2329] border border-[#2b2f36] p-6 rounded-3xl">
            <p className="text-xs font-bold text-[#848e9c] uppercase tracking-widest mb-2">Daily Earnings</p>
            <p className="text-3xl font-black text-yellow-500">${formatUSD(totalDailyEarnings)}</p>
          </div>
        </div>

        {/* BTC Chart Section */}
        <div className="bg-[#1e2329] border border-[#2b2f36] rounded-3xl p-8 mb-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs font-bold text-[#848e9c] uppercase tracking-widest mb-2">BTC / USD</p>
              <h2 className="text-4xl font-black text-white">${btcPrice.toLocaleString()}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-[#848e9c] uppercase mb-2">24H HIGH</p>
              <p className="text-2xl font-black text-[#0ecb81]">${(btcPrice * 1.02).toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          {/* Chart Visualization */}
          <div style={{ height: '300px', marginBottom: '24px', position: 'relative' }}>
            <Line data={generateChartData()} options={chartOptions} />
          </div>

          {/* Chart Info */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#0b0e11] rounded-xl p-4 border border-[#2b2f36]">
              <p className="text-xs font-bold text-[#848e9c] uppercase mb-1">1H</p>
              <p className="text-lg font-black text-white">+2.5%</p>
            </div>
            <div className="bg-[#0b0e11] rounded-xl p-4 border border-[#2b2f36]">
              <p className="text-xs font-bold text-[#848e9c] uppercase mb-1">24H High</p>
              <p className="text-lg font-black text-[#0ecb81]">${(btcPrice * 1.02).toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-[#0b0e11] rounded-xl p-4 border border-[#2b2f36]">
              <p className="text-xs font-bold text-[#848e9c] uppercase mb-1">24H Low</p>
              <p className="text-lg font-black text-[#f6465d]">${(btcPrice * 0.98).toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-[#0b0e11] rounded-xl p-4 border border-[#2b2f36]">
              <p className="text-xs font-bold text-[#848e9c] uppercase mb-1">Volume</p>
              <p className="text-lg font-black text-orange-500">2,480 BTC</p>
            </div>
          </div>
        </div>

        {/* Mining Levels */}
        <div className="mb-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-black text-white mb-1">Mining Levels</h2>
              <p className="text-[#848e9c] text-sm">Upgrade your level to increase your daily return rate.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {levels.map((l) => (
              <div 
                key={l.level}
                className={`p-6 rounded-3xl border ${l.border} bg-gradient-to-br ${l.color} relative overflow-hidden group transition-all hover:scale-[1.02] cursor-pointer`}
              >
                {!isLevelUnlocked(l.level) && (
                  <div className="absolute inset-0 bg-[#0b0e11]/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                    <div className="bg-[#1e2329] p-2 rounded-full border border-[#2b2f36]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#848e9c]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                )}
                <div className="relative z-0">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-2xl">{l.icon}</span>
                    <span className="text-xs font-bold text-white/60">{l.rate}%</span>
                  </div>
                  <p className="text-xs text-[#848e9c] mb-1">Level {l.level}</p>
                  <p className="text-lg font-black text-white mb-3">{l.name}</p>
                  <p className="text-xs text-[#848e9c] mb-1">Balance</p>
                  <p className="text-xl font-black text-white">${formatUSD((user as any)[`level${l.level}_amount` as keyof UserProfile] || 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VIP Trading Banner */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 relative overflow-hidden cursor-pointer" onClick={() => navigate('/trading')}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
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
              <button className="px-10 py-4 bg-white text-orange-600 rounded-xl font-black text-lg hover:bg-orange-50 transition-all">
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
