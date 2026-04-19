import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import Logo from '../components/Logo'

interface PriceData {
  bitcoin: {
    usd: number
    usd_24h_change: number
  }
  ethereum?: {
    usd: number
    usd_24h_change: number
  }
  litecoin?: {
    usd: number
    usd_24h_change: number
  }
}

export default function Home() {
  const [btcPrice, setBtcPrice] = useState<number>(0)
  const [ethPrice, setEthPrice] = useState<number>(0)
  const [ltcPrice, setLtcPrice] = useState<number>(0)
  const [btcChange, setBtcChange] = useState<number>(0)
  const [ethChange, setEthChange] = useState<number>(0)
  const [ltcChange, setLtcChange] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await axios.get<PriceData>(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,litecoin&vs_currencies=usd&include_24hr_change=true'
        )
        setBtcPrice(response.data.bitcoin.usd)
        setBtcChange(response.data.bitcoin.usd_24h_change)
        setEthPrice(response.data.ethereum?.usd || 0)
        setEthChange(response.data.ethereum?.usd_24h_change || 0)
        setLtcPrice(response.data.litecoin?.usd || 0)
        setLtcChange(response.data.litecoin?.usd_24h_change || 0)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch price:', error)
        setBtcPrice(75000)
        setEthPrice(2500)
        setLtcPrice(150)
        setLoading(false)
      }
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#eaecef] font-sans selection:bg-yellow-500/30 overflow-hidden">
      {/* Navbar */}
      <nav className="bg-[#0a0a0a] border-b border-[#2b2f36] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3 group cursor-pointer">
              <Logo size="lg" />
            </Link>
            <div className="flex items-center gap-6">
              <Link to="/login" className="text-sm font-medium text-[#eaecef] hover:text-yellow-500 transition-colors">
                Log In
              </Link>
              <Link to="/signup" className="px-6 py-2.5 bg-orange-500 text-white rounded-lg font-bold text-sm hover:bg-orange-400 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20">
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with 3D Mining Visualization */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            {/* Main Heading */}
            <h1 className="text-7xl lg:text-8xl font-black text-white mb-4 tracking-tighter">
              DIGGING <span className="text-yellow-400">POOL</span>
            </h1>
            <p className="text-2xl font-bold text-yellow-400 mb-8">Mine. Invest. Profit.</p>
            <p className="text-xl text-[#848e9c] mb-12 max-w-3xl mx-auto leading-relaxed">
              Start Earning Crypto Today
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link to="/signup" className="px-12 py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl font-black text-lg hover:shadow-2xl hover:shadow-orange-500/50 transition-all transform hover:scale-105">
                Start Mining
              </Link>
              <Link to="/markets" className="px-12 py-4 bg-[#1e2329] text-white rounded-xl font-bold text-lg border-2 border-[#2b2f36] hover:border-orange-500/50 transition-all">
                View Markets
              </Link>
            </div>
          </div>

          {/* 3D Mining Visualization Card */}
          <div className="relative mb-20">
            <div className="bg-gradient-to-br from-[#1e2329] to-[#0b0e11] border border-[#2b2f36] rounded-3xl p-12 shadow-2xl relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

              <div className="relative z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <p className="text-xs font-bold text-[#848e9c] uppercase tracking-widest mb-2">CURRENT PRICE</p>
                    <h2 className="text-5xl font-black text-white">
                      ${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#848e9c] uppercase mb-2">24H CHANGE</p>
                    <p className={`text-3xl font-black ${btcChange >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* Animated Chart */}
                <div className="h-56 flex items-end gap-1 mb-12">
                  {[...Array(40)].map((_, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-gradient-to-t from-[#f6465d] to-[#f6465d]/40 rounded-t-sm transition-all duration-500 hover:from-[#f6465d] hover:to-[#f6465d]"
                      style={{ height: `${Math.random() * 100}%` }}
                    ></div>
                  ))}
                </div>

                {/* Market Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#0b0e11] rounded-xl p-4 border border-[#2b2f36]">
                    <p className="text-xs font-bold text-[#848e9c] uppercase mb-2">HIGH</p>
                    <p className="text-2xl font-black text-[#0ecb81]">$78,938</p>
                  </div>
                  <div className="bg-[#0b0e11] rounded-xl p-4 border border-[#2b2f36]">
                    <p className="text-xs font-bold text-[#848e9c] uppercase mb-2">LOW</p>
                    <p className="text-2xl font-black text-[#f6465d]">$71,420</p>
                  </div>
                  <div className="bg-[#0b0e11] rounded-xl p-4 border border-[#2b2f36]">
                    <p className="text-xs font-bold text-[#848e9c] uppercase mb-2">VOLUME</p>
                    <p className="text-2xl font-black text-orange-500">$28.5B</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Market Stats Section */}
      <div className="bg-[#0a0a0a] py-20 border-t border-[#2b2f36]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-2">Live Market Stats</h2>
            <p className="text-[#848e9c]">Real-time cryptocurrency prices and market trends</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Bitcoin Card */}
            <div className="bg-gradient-to-br from-[#1e2329] to-[#0b0e11] border border-[#2b2f36] rounded-3xl p-8 hover:border-orange-500/50 transition-all group">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-xs font-bold text-[#848e9c] uppercase mb-2">Bitcoin [BTC]</p>
                  <p className="text-3xl font-black text-white">${btcPrice.toLocaleString()}</p>
                </div>
                <span className={`text-lg font-black px-3 py-1 rounded-lg ${btcChange >= 0 ? 'bg-[#0ecb81]/20 text-[#0ecb81]' : 'bg-[#f6465d]/20 text-[#f6465d]'}`}>
                  {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
                </span>
              </div>
              <div className="h-16 flex items-end gap-1">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-sm opacity-60"
                    style={{ height: `${Math.random() * 100}%` }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Ethereum Card */}
            <div className="bg-gradient-to-br from-[#1e2329] to-[#0b0e11] border border-[#2b2f36] rounded-3xl p-8 hover:border-purple-500/50 transition-all group">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-xs font-bold text-[#848e9c] uppercase mb-2">Ethereum [ETH]</p>
                  <p className="text-3xl font-black text-white">${ethPrice.toLocaleString()}</p>
                </div>
                <span className={`text-lg font-black px-3 py-1 rounded-lg ${ethChange >= 0 ? 'bg-[#0ecb81]/20 text-[#0ecb81]' : 'bg-[#f6465d]/20 text-[#f6465d]'}`}>
                  {ethChange >= 0 ? '+' : ''}{ethChange.toFixed(2)}%
                </span>
              </div>
              <div className="h-16 flex items-end gap-1">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-sm opacity-60"
                    style={{ height: `${Math.random() * 100}%` }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Litecoin Card */}
            <div className="bg-gradient-to-br from-[#1e2329] to-[#0b0e11] border border-[#2b2f36] rounded-3xl p-8 hover:border-blue-500/50 transition-all group">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-xs font-bold text-[#848e9c] uppercase mb-2">Litecoin [LTC]</p>
                  <p className="text-3xl font-black text-white">${ltcPrice.toLocaleString()}</p>
                </div>
                <span className={`text-lg font-black px-3 py-1 rounded-lg ${ltcChange >= 0 ? 'bg-[#0ecb81]/20 text-[#0ecb81]' : 'bg-[#f6465d]/20 text-[#f6465d]'}`}>
                  {ltcChange >= 0 ? '+' : ''}{ltcChange.toFixed(2)}%
                </span>
              </div>
              <div className="h-16 flex items-end gap-1">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm opacity-60"
                    style={{ height: `${Math.random() * 100}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Market Overview Stats */}
          <div className="grid grid-cols-3 gap-4 mt-12">
            <div className="bg-[#0b0e11] rounded-2xl p-6 border border-[#2b2f36]">
              <p className="text-xs font-bold text-[#848e9c] uppercase mb-2">Market Cap</p>
              <p className="text-2xl font-black text-white">$2.1T</p>
            </div>
            <div className="bg-[#0b0e11] rounded-2xl p-6 border border-[#2b2f36]">
              <p className="text-xs font-bold text-[#848e9c] uppercase mb-2">24h Volume</p>
              <p className="text-2xl font-black text-orange-500">$45.3B</p>
            </div>
            <div className="bg-[#0b0e11] rounded-2xl p-6 border border-[#2b2f36]">
              <p className="text-xs font-bold text-[#848e9c] uppercase mb-2">BTC Dominance</p>
              <p className="text-2xl font-black text-[#0ecb81]">42.5%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Levels Section */}
      <div className="bg-[#0a0a0a] py-20 border-t border-[#2b2f36]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-2">Investment Levels</h2>
            <p className="text-[#848e9c]">Choose Your Plan</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Silver Plan */}
            <div className="bg-gradient-to-br from-slate-600/20 to-slate-700/5 border border-slate-600/30 rounded-3xl p-8 relative overflow-hidden group hover:scale-105 transition-transform">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-white mb-4">Silver Plan</h3>
                <p className="text-5xl font-black text-white mb-2">5%</p>
                <p className="text-[#848e9c] mb-8">Daily Return</p>
                
                <div className="space-y-3 mb-8 pb-8 border-b border-slate-600/20">
                  <div className="flex items-center gap-3">
                    <span className="text-[#0ecb81]">✓</span>
                    <span className="text-[#848e9c]">Minimum Deposit $500</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#0ecb81]">✓</span>
                    <span className="text-[#848e9c]">24/7 Support</span>
                  </div>
                </div>

                <Link to="/signup" className="w-full py-4 bg-slate-600/20 hover:bg-slate-600/30 text-white rounded-2xl font-black transition-colors text-center border border-slate-600/30">
                  Get Started
                </Link>
              </div>
            </div>

            {/* Gold Plan (Featured) */}
            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/5 border border-yellow-600/50 rounded-3xl p-8 relative overflow-hidden group hover:scale-105 transition-transform md:scale-110 md:z-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="absolute top-4 right-4 px-4 py-2 bg-orange-500 text-white rounded-full text-xs font-black">POPULAR</div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-white mb-4">Gold Plan</h3>
                <p className="text-5xl font-black text-yellow-400 mb-2">7%</p>
                <p className="text-[#848e9c] mb-8">Daily Return</p>
                
                <div className="space-y-3 mb-8 pb-8 border-b border-yellow-600/20">
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400">✓</span>
                    <span className="text-[#848e9c]">Minimum Deposit $2,500</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-400">✓</span>
                    <span className="text-[#848e9c]">Priority Support</span>
                  </div>
                </div>

                <Link to="/signup" className="w-full py-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-2xl font-black transition-all hover:shadow-lg hover:shadow-orange-500/50 text-center">
                  Get Started
                </Link>
              </div>
            </div>

            {/* Diamond Plan */}
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/5 border border-blue-600/30 rounded-3xl p-8 relative overflow-hidden group hover:scale-105 transition-transform">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-white mb-4">Diamond Plan</h3>
                <p className="text-5xl font-black text-blue-400 mb-2">10%</p>
                <p className="text-[#848e9c] mb-8">Daily Return</p>
                
                <div className="space-y-3 mb-8 pb-8 border-b border-blue-600/20">
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400">✓</span>
                    <span className="text-[#848e9c]">Minimum Deposit $10,000</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400">✓</span>
                    <span className="text-[#848e9c]">VIP Support</span>
                  </div>
                </div>

                <Link to="/signup" className="w-full py-4 bg-blue-600/20 hover:bg-blue-600/30 text-white rounded-2xl font-black transition-colors text-center border border-blue-600/30">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] border-t border-[#2b2f36] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <Logo size="md" />
            <div className="flex gap-8 text-sm text-[#848e9c]">
              <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer transition-colors">Cookie Policy</span>
            </div>
            <p className="text-sm text-[#474d57]">© 2026 DiggingPool.com. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
