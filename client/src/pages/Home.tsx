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
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] font-sans selection:bg-yellow-500/30">
      {/* Navbar */}
      <nav className="bg-[#181a20] border-b border-[#2b2f36] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                <span className="text-black font-black text-xl">₿</span>
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">BINANCE <span className="text-orange-500">x</span> AMAZON</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to="/login" className="text-sm font-medium text-[#eaecef] hover:text-yellow-500 transition-colors">
                Log In
              </Link>
              <Link to="/signup" className="px-6 py-2.5 bg-yellow-500 text-black rounded-lg font-bold text-sm hover:bg-yellow-400 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-yellow-500/20">
                Register Now
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center lg:text-left lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] mb-6">
                Buy, Trade, and <span className="text-yellow-500">Earn</span> Crypto
              </h1>
              <p className="text-xl text-[#848e9c] mb-10 max-w-2xl mx-auto lg:mx-0">
                Join the world's largest crypto exchange. Start earning daily passive income with our advanced automated digging technology.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/signup" className="px-10 py-4 bg-yellow-500 text-black rounded-xl font-bold text-lg hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/20 text-center">
                  Get Started
                </Link>
                <Link to="/markets" className="px-10 py-4 bg-[#2b2f36] text-white rounded-xl font-bold text-lg border border-[#474d57] hover:bg-[#363a45] transition-all text-center cursor-pointer">
                  View Markets
                </Link>
              </div>
              
              <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 text-[#848e9c]">
                <div>
                  <p className="text-2xl font-bold text-white">$76B+</p>
                  <p className="text-xs uppercase tracking-wider">24h Volume</p>
                </div>
                <div className="w-px h-8 bg-[#2b2f36]"></div>
                <div>
                  <p className="text-2xl font-bold text-white">350+</p>
                  <p className="text-xs uppercase tracking-wider">Cryptos Listed</p>
                </div>
                <div className="w-px h-8 bg-[#2b2f36]"></div>
                <div>
                  <p className="text-2xl font-bold text-white">120M+</p>
                  <p className="text-xs uppercase tracking-wider">Users</p>
                </div>
              </div>
            </div>

            <div className="mt-16 lg:mt-0">
              <div className="bg-[#1e2329] border border-[#2b2f36] rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                    <span className="text-yellow-500 text-xl">📈</span>
                  </div>
                </div>
                
                <h3 className="text-[#848e9c] font-medium mb-2">Market Overview</h3>
                <div className="flex items-end gap-3 mb-8">
                  <span className="text-4xl font-bold text-white">BTC/USD</span>
                  {loading ? (
                    <div className="h-8 w-24 bg-[#2b2f36] animate-pulse rounded"></div>
                  ) : (
                    <span className={`text-lg font-bold ${priceChange >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}%
                    </span>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center p-4 bg-[#0b0e11] rounded-2xl border border-[#2b2f36] group-hover:border-yellow-500/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold">₿</div>
                      <div>
                        <p className="font-bold text-white">Bitcoin</p>
                        <p className="text-xs text-[#848e9c]">BTC</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">${btcPrice.toLocaleString()}</p>
                      <p className="text-xs text-[#848e9c]">Real-time Price</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[#0b0e11] rounded-2xl border border-[#2b2f36]">
                      <p className="text-xs text-[#848e9c] mb-1">Daily Return</p>
                      <p className="text-xl font-bold text-[#0ecb81]">Up to 25%</p>
                    </div>
                    <div className="p-4 bg-[#0b0e11] rounded-2xl border border-[#2b2f36]">
                      <p className="text-xs text-[#848e9c] mb-1">Security</p>
                      <p className="text-xl font-bold text-white">SAFU</p>
                    </div>
                  </div>
                </div>
                
                <Link to="/signup" className="mt-8 block w-full py-4 bg-[#2b2f36] hover:bg-[#363a45] text-white text-center rounded-xl font-bold transition-colors">
                  Start Earning Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-[#181a20] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose Binance x Amazon?</h2>
            <p className="text-[#848e9c] max-w-2xl mx-auto">Experience the next generation of crypto wealth management with our secure and automated platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Secure Storage', desc: 'Your funds are protected by our Secure Asset Fund for Users (SAFU).', icon: '🛡️' },
              { title: 'Daily Payouts', desc: 'Earnings are calculated and distributed to your account every 24 hours.', icon: '💰' },
              { title: 'Multi-Chain Support', desc: 'Access our platform across 10 different specialized chains.', icon: '🔗' }
            ].map((feature, i) => (
              <div key={i} className="p-8 bg-[#1e2329] rounded-3xl border border-[#2b2f36] hover:border-yellow-500/50 transition-all group">
                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-[#848e9c] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0b0e11] border-t border-[#2b2f36] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center">
                <span className="text-black font-bold text-[10px]">₿</span>
              </div>
              <span className="font-bold text-white tracking-tight">BINANCE x AMAZON</span>
            </div>
            <div className="flex gap-8 text-sm text-[#848e9c]">
              <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer transition-colors">Cookie Policy</span>
            </div>
            <p className="text-sm text-[#474d57]">© 2026 Binance.com. All rights reserved.</p>
          </div>
          <div className="mt-8 pt-8 border-t border-[#2b2f36]">
            <p className="text-[10px] text-[#474d57] leading-relaxed text-center">
              Disclaimer: Cryptocurrency investment is subject to high market risk. Binance is not responsible for any of your trading losses. Please do your own research and invest wisely. The "Passive Income" simulator is for educational purposes and demonstrates potential returns based on historical data.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
