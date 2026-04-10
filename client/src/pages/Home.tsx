import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

interface PriceData {
  bitcoin: {
    usd: number
    usd_24h_change: number
  }
}

export default function Home() {
  const [btcPrice, setBtcPrice] = useState<number>(0)
  const [priceChange, setPriceChange] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await axios.get<PriceData>(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true'
        )
        setBtcPrice(response.data.bitcoin.usd)
        setPriceChange(response.data.bitcoin.usd_24h_change)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch price:', error)
        setLoading(false)
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navbar */}
      <nav className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-full"></div>
              <span className="text-xl font-bold text-white">BINANCE</span>
            </div>
            <div className="flex gap-4">
              <Link to="/login" className="px-4 py-2 text-slate-300 hover:text-white">
                Log In
              </Link>
              <Link to="/signup" className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-600">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert Banner */}
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-8">
          <p className="text-yellow-400 text-sm">
            👋 Welcome! You're viewing as a guest with zero investment. <Link to="/signup" className="underline font-semibold">Sign up</Link> to set your investment amount.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Price Display */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold">₿</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">BTC / USD</h3>
                  <p className="text-slate-400 text-sm">Bitcoin Price</p>
                </div>
              </div>

              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 bg-slate-700 rounded"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    ${btcPrice.toLocaleString()}
                  </div>
                  <div className={`text-sm font-semibold ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% (24h)
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Investment Summary */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-6">Investment Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">USD Invested</p>
                  <p className="text-2xl font-bold text-white">$0</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Daily Return Rate</p>
                  <p className="text-2xl font-bold text-green-400">0%</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">BTC Allocated</p>
                  <p className="text-2xl font-bold text-white">0 BTC</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-2">Daily Earnings</p>
                  <p className="text-2xl font-bold text-green-400">$0</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-12 bg-slate-800 border border-slate-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-black">1</div>
              <div>
                <p className="text-white font-semibold mb-2">Sign Up</p>
                <p className="text-slate-400 text-sm">Create an account with your email and mobile number.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-black">2</div>
              <div>
                <p className="text-white font-semibold mb-2">Get Investment</p>
                <p className="text-slate-400 text-sm">Admin sets your investment amount in your dashboard.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-black">3</div>
              <div>
                <p className="text-white font-semibold mb-2">Earn Daily</p>
                <p className="text-slate-400 text-sm">Earn fixed daily returns on your investment automatically.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-6">
          <p className="text-yellow-400 text-sm">
            <strong>Disclaimer:</strong> This is a simulation for educational purposes only. Not financial advice or a guarantee of returns.
          </p>
        </div>
      </div>
    </div>
  )
}
