import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function Trading() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [btcPrice, setBtcPrice] = useState(0)
  const [displayPrice, setDisplayPrice] = useState(0)
  const [strikePrice, setStrikePrice] = useState(0)
  const [amount, setAmount] = useState('')
  const [isTrading, setIsTrading] = useState(false)
  const [timer, setTimer] = useState(30)
  const [tradeResult, setTradeResult] = useState<{ profit: number; rate: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const priceInterval = useRef<any>(null)
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

        if (!profileRes.data.vipUnlocked) {
          navigate('/dashboard')
          return
        }
        
        const userData = profileRes.data
        setUser(userData)
        if (userData.vip_amount) {
          setAmount(userData.vip_amount.toString())
        }
        
        // Fetch BTC price with fallback
        try {
          const btcRes = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
          const initialPrice = btcRes.data.bitcoin.usd
          if (isMounted.current) {
            setBtcPrice(initialPrice)
            setDisplayPrice(initialPrice)
            setStrikePrice(initialPrice)
          }
        } catch (btcErr) {
          console.error('BTC Price fetch error:', btcErr)
          if (isMounted.current) {
            setBtcPrice(75000) // Fallback price
            setDisplayPrice(75000)
            setStrikePrice(75000)
          }
        }
        
        if (isMounted.current) setLoading(false)
      } catch (err: any) {
        console.error('Error fetching data:', err)
        if (isMounted.current) {
          setError('Failed to load trading data. Please try again.')
          setLoading(false)
        }
      }
    }

    fetchData()

    // Price fluctuation animation
    priceInterval.current = setInterval(() => {
      if (isMounted.current) {
        setDisplayPrice(prev => {
          const fluctuation = (Math.random() - 0.5) * 20
          return Math.max(prev + fluctuation, 1000)
        })
      }
    }, 500)

    return () => {
      isMounted.current = false
      if (priceInterval.current) clearInterval(priceInterval.current)
    }
  }, [navigate])

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setIsTrading(true)
    setTimer(30)
    setTradeResult(null)
    setStrikePrice(displayPrice) // Lock the strike price when trade starts

    const countdown = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(countdown)
          executeTrade()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const executeTrade = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post('/api/trading/execute', {
        amount: parseFloat(amount)
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (isMounted.current) {
        setTradeResult({ profit: res.data.profit, rate: res.data.profitRate })
        setIsTrading(false)
        setAmount('0.00') // Reset to 0 after trade is locked
      }
    } catch (err: any) {
      if (isMounted.current) {
        alert(err.response?.data?.message || 'Trade execution failed')
        setIsTrading(false)
      }
    }
  }

  const getProfitPercentage = () => {
    return user?.vipProfitRate || 20
  }

  const calculatePotentialProfit = () => {
    if (!amount || parseFloat(amount) <= 0) return 0
    const profitRate = getProfitPercentage()
    return (parseFloat(amount) * profitRate) / 100
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#848e9c] font-semibold">Loading VIP Trading...</p>
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

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="flex items-center gap-2 text-[#848e9c] hover:text-white transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Dashboard</span>
          </button>
        </div>

        {/* Top Section: Price Chart Area */}
        <div className="bg-[#1e2329] border border-[#2b2f36] rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-xs font-bold text-[#848e9c] uppercase tracking-widest mb-2">CURRENT PRICE</p>
              <h1 className="text-5xl font-black text-white">
                ${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-[#848e9c] uppercase mb-2">24H CHANGE</p>
              <p className="text-2xl font-black text-[#0ecb81]">+5.24%</p>
            </div>
          </div>

          {/* Price Chart Visualization */}
          <div className="h-48 flex items-end gap-1 mb-8">
            {[...Array(40)].map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-t-sm transition-all duration-500 ${displayPrice >= btcPrice ? 'bg-[#f6465d]/60' : 'bg-[#f6465d]/40'}`}
                style={{ height: `${Math.random() * 100}%` }}
              ></div>
            ))}
          </div>

          {/* Market Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#0b0e11] rounded-xl p-4 border border-[#2b2f36]">
              <p className="text-xs font-bold text-[#848e9c] uppercase mb-1">HIGH</p>
              <p className="text-lg font-black text-[#0ecb81]">$78,938</p>
            </div>
            <div className="bg-[#0b0e11] rounded-xl p-4 border border-[#2b2f36]">
              <p className="text-xs font-bold text-[#848e9c] uppercase mb-1">LOW</p>
              <p className="text-lg font-black text-[#f6465d]">$71,420</p>
            </div>
            <div className="bg-[#0b0e11] rounded-xl p-4 border border-[#2b2f36]">
              <p className="text-xs font-bold text-[#848e9c] uppercase mb-1">VOLUME</p>
              <p className="text-lg font-black text-orange-500">$28.5B</p>
            </div>
          </div>

          {/* Trading Overlay */}
          {isTrading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-50">
              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-[#2b2f36]" />
                  <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377 - (377 * timer) / 30} className="text-orange-500 transition-all duration-1000" />
                </svg>
                <span className="absolute text-4xl font-black text-white">{timer}s</span>
              </div>
              <p className="text-white font-bold tracking-widest animate-pulse">EXECUTING TRADE...</p>
            </div>
          )}

          {/* Trade Result Overlay */}
          {tradeResult && (
            <div className="absolute inset-0 bg-[#0b0e11]/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-8 text-center">
              <div className="w-20 h-20 bg-[#0ecb81]/20 rounded-full flex items-center justify-center mb-6 border border-[#0ecb81]/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#0ecb81]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-white mb-2">TRADE COMPLETED</h2>
              <div className="bg-[#1e2329] border border-[#2b2f36] rounded-2xl p-6 w-full max-w-xs mb-8">
                <p className="text-xs font-bold text-[#848e9c] uppercase mb-1">Total Profit Made</p>
                <p className="text-4xl font-black text-[#0ecb81]">${tradeResult.profit.toFixed(2)}</p>
                <p className="text-[10px] font-bold text-[#848e9c] mt-2">Rate: {tradeResult.rate}%</p>
              </div>
              <button onClick={() => navigate('/dashboard')} className="px-12 py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-2xl font-black transition-all">BACK TO DASHBOARD</button>
            </div>
          )}
        </div>

        {/* Bottom Section: Two Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Trade Control */}
          <div className="bg-[#1e2329] border border-[#2b2f36] rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-white">Trade Control</h2>
            </div>

            <div className="space-y-6">
              {/* Investment Amount */}
              <div>
                <label className="text-xs font-bold text-[#848e9c] uppercase tracking-widest mb-3 block">INVESTMENT AMOUNT</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#848e9c] font-bold">$</span>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={true}
                    placeholder="0.00"
                    className="w-full bg-[#0b0e11] border border-[#2b2f36] rounded-xl py-4 pl-10 pr-4 text-white font-bold focus:outline-none opacity-70 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Strike Price */}
              <div className="bg-[#0b0e11] rounded-xl p-4 border border-[#2b2f36]">
                <p className="text-xs font-bold text-[#848e9c] uppercase tracking-widest mb-2">BTC/USD STRIKE PRICE</p>
                <p className="text-3xl font-black text-orange-500">
                  ${strikePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Potential Profit */}
              <div className="bg-[#0ecb81]/10 rounded-xl p-4 border border-[#0ecb81]/20">
                <p className="text-xs font-bold text-[#848e9c] uppercase tracking-widest mb-2">POTENTIAL PROFIT</p>
                <p className="text-2xl font-black text-[#0ecb81]">
                  ${calculatePotentialProfit().toFixed(2)}
                </p>
              </div>

              {/* Buy/Sell Buttons */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => handleTrade('buy')}
                  disabled={isTrading}
                  className="py-6 bg-[#0ecb81] hover:bg-[#0ba368] disabled:opacity-50 text-white rounded-2xl flex flex-col items-center justify-center gap-1 transition-all font-black uppercase tracking-widest"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span className="text-xs">BUY</span>
                </button>
                <button 
                  onClick={() => handleTrade('sell')}
                  disabled={isTrading}
                  className="py-6 bg-[#f6465d] hover:bg-[#d93e52] disabled:opacity-50 text-white rounded-2xl flex flex-col items-center justify-center gap-1 transition-all font-black uppercase tracking-widest"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span className="text-xs">SELL</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Account Status & Tips */}
          <div className="space-y-8">
            {/* Account Status */}
            <div className="bg-[#1e2329] border border-[#2b2f36] rounded-3xl p-8">
              <h3 className="text-xl font-black text-white mb-8">Account Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-[#0b0e11] rounded-xl border border-[#2b2f36]">
                  <span className="text-xs font-bold text-[#848e9c] uppercase">VIP STATUS</span>
                  <span className="px-3 py-1 bg-[#0ecb81]/20 text-[#0ecb81] rounded-lg text-xs font-black">UNLOCKED</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[#0b0e11] rounded-xl border border-[#2b2f36]">
                  <span className="text-xs font-bold text-[#848e9c] uppercase">PROFIT RATE</span>
                  <span className="text-lg font-black text-orange-500">{getProfitPercentage()}%</span>
                </div>
              </div>
            </div>

            {/* Trading Tips */}
            <div className="bg-[#1e2329]/50 border border-orange-500/20 rounded-3xl p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-orange-500">💡</span>
                <p className="text-xs font-bold text-orange-500 uppercase tracking-widest">TRADING TIPS</p>
              </div>
              <ul className="space-y-3 text-xs text-[#848e9c]">
                <li className="flex gap-2">
                  <span className="text-orange-500">•</span>
                  <span>Start with smaller amounts to understand market movement</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-orange-500">•</span>
                  <span>Trades execute after 30-second countdown</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
