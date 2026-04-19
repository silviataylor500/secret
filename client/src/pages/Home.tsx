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

  const PriceChart = () => (
    <div className="h-24 flex items-end gap-1">
      {[...Array(40)].map((_, i) => (
        <div 
          key={i} 
          className="flex-1 bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-sm opacity-60 hover:opacity-100 transition-opacity"
          style={{ height: `${Math.random() * 100}%` }}
        ></div>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] font-sans selection:bg-yellow-500/30">
      {/* Navbar */}
      <nav className="bg-[#181a20] border-b border-[#2b2f36] sticky top-0 z-50">
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
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center lg:text-left lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] mb-6">
                DIGGING <span className="text-orange-500">POOL</span>
              </h1>
              <p className="text-2xl font-bold text-[#848e9c] mb-4">Mine. Invest. Profit.</p>
              <p className="text-lg text-[#848e9c] mb-10 max-w-2xl mx-auto lg:mx-0">
                Join thousands of crypto investors earning daily passive income through our advanced automated mining and trading technology.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/signup" className="px-10 py-4 bg-orange-500 text-white rounded-xl font-bold text-lg hover:bg-orange-400 transition-all shadow-xl shadow-orange-500/30 text-center">
                  Start Mining
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
                  <p className="text-xs uppercase tracking-wider">Cryptos</p>
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
                  <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                    <span className="text-orange-500 text-xl">📈</span>
                  </div>
                </div>
                
                <h3 className="text-[#848e9c] font-medium mb-2">LIVE MARKET STATS</h3>
                <div className="flex items-end gap-3 mb-8">
                  <span className="text-4xl font-bold text-white">BTC/USD</span>
                  {loading ? (
                    <div className="h-8 w-24 bg-[#2b2f36] animate-pulse rounded"></div>
                  ) : (
                    <span className={`text-lg font-bold ${btcChange >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      {btcChange >= 0 ? '▲' : '▼'} {Math.abs(btcChange).toFixed(2)}%
                    </span>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center p-4 bg-[#0b0e11] rounded-2xl border border-[#2b2f36] group-hover:border-orange-500/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">₿</div>
                      <div>
                        <p className="font-bold text-white">Bitcoin</p>
                        <p className="text-xs text-[#848e9c]">BTC</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">${btcPrice.toLocaleString()}</p>
                      <p className="text-xs text-[#848e9c]">Real-time</p>
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
                
                <Link to="/signup" className="mt-8 block w-full py-4 bg-orange-500 hover:bg-orange-400 text-white text-center rounded-xl font-bold transition-colors">
                  Start Earning Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Market Stats Section */}
      <div className="bg-[#181a20] border-t border-[#2b2f36] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">LIVE MARKET STATS</h2>
            <p className="text-[#848e9c]">Real-time cryptocurrency prices and market trends</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Bitcoin Card */}
            <div className="bg-[#1e2329] border border-[#2b2f36] rounded-3xl p-8 hover:border-orange-500/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🪙</span>
                    <h3 className="text-xl font-bold text-white">Bitcoin</h3>
                  </div>
                  <p className="text-sm text-[#848e9c]">BTC</p>
                </div>
                <span className={`text-sm font-bold px-3 py-1 rounded-lg ${btcChange >= 0 ? 'bg-[#0ecb81]/20 text-[#0ecb81]' : 'bg-[#f6465d]/20 text-[#f6465d]'}`}>
                  {btcChange >= 0 ? '+' : ''}{btcChange.toFixed(2)}%
                </span>
              </div>
              <p className="text-3xl font-black text-white mb-6">${btcPrice.toLocaleString()}</p>
              <PriceChart />
            </div>

            {/* Ethereum Card */}
            <div className="bg-[#1e2329] border border-[#2b2f36] rounded-3xl p-8 hover:border-purple-500/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">Ξ</span>
                    <h3 className="text-xl font-bold text-white">Ethereum</h3>
                  </div>
                  <p className="text-sm text-[#848e9c]">ETH</p>
                </div>
                <span className={`text-sm font-bold px-3 py-1 rounded-lg ${ethChange >= 0 ? 'bg-[#0ecb81]/20 text-[#0ecb81]' : 'bg-[#f6465d]/20 text-[#f6465d]'}`}>
                  {ethChange >= 0 ? '+' : ''}{ethChange.toFixed(2)}%
                </span>
              </div>
              <p className="text-3xl font-black text-white mb-6">${ethPrice.toLocaleString()}</p>
              <PriceChart />
            </div>

            {/* Litecoin Card */}
            <div className="bg-[#1e2329] border border-[#2b2f36] rounded-3xl p-8 hover:border-blue-500/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">Ł</span>
                    <h3 className="text-xl font-bold text-white">Litecoin</h3>
                  </div>
                  <p className="text-sm text-[#848e9c]">LTC</p>
                </div>
                <span className={`text-sm font-bold px-3 py-1 rounded-lg ${ltcChange >= 0 ? 'bg-[#0ecb81]/20 text-[#0ecb81]' : 'bg-[#f6465d]/20 text-[#f6465d]'}`}>
                  {ltcChange >= 0 ? '+' : ''}{ltcChange.toFixed(2)}%
                </span>
              </div>
              <p className="text-3xl font-black text-white mb-6">${ltcPrice.toLocaleString()}</p>
              <PriceChart />
            </div>
          </div>

          {/* Market Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
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
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">INVESTMENT LEVELS</h2>
            <p className="text-[#848e9c] max-w-2xl mx-auto">Choose your plan and start earning daily passive income. Upgrade anytime to unlock higher returns.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Silver Plan */}
            <div className="bg-gradient-to-br from-slate-500/20 to-slate-600/5 border border-slate-500/30 rounded-3xl p-8 relative overflow-hidden group hover:scale-105 transition-transform">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-slate-500/20 transition-all"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl">🥈</span>
                  <h3 className="text-2xl font-black text-white">Silver Plan</h3>
                </div>
                <p className="text-5xl font-black text-white mb-2">5%</p>
                <p className="text-[#848e9c] mb-8">Daily Return Rate</p>
                
                <div className="space-y-4 mb-8 pb-8 border-b border-slate-500/20">
                  <div className="flex items-center gap-3">
                    <span className="text-[#0ecb81]">✓</span>
                    <span className="text-[#848e9c]">Minimum Deposit: $500</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#0ecb81]">✓</span>
                    <span className="text-[#848e9c]">24/7 Support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#0ecb81]">✓</span>
                    <span className="text-[#848e9c]">Auto Reinvestment</span>
                  </div>
                </div>

                <Link to="/signup" className="w-full py-4 bg-slate-500/20 hover:bg-slate-500/30 text-white rounded-xl font-bold transition-colors text-center border border-slate-500/30">
                  Get Started
                </Link>
              </div>
            </div>

            {/* Gold Plan (Featured) */}
            <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/50 rounded-3xl p-8 relative overflow-hidden group hover:scale-105 transition-transform md:scale-110 md:z-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-orange-500/30 transition-all"></div>
              <div className="absolute top-4 right-4 px-4 py-2 bg-orange-500 text-white rounded-full text-xs font-bold">POPULAR</div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl">🏆</span>
                  <h3 className="text-2xl font-black text-white">Gold Plan</h3>
                </div>
                <p className="text-5xl font-black text-orange-500 mb-2">7%</p>
                <p className="text-[#848e9c] mb-8">Daily Return Rate</p>
                
                <div className="space-y-4 mb-8 pb-8 border-b border-orange-500/20">
                  <div className="flex items-center gap-3">
                    <span className="text-orange-500">✓</span>
                    <span className="text-[#848e9c]">Minimum Deposit: $2,500</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-orange-500">✓</span>
                    <span className="text-[#848e9c]">Priority Support</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-orange-500">✓</span>
                    <span className="text-[#848e9c]">VIP Trading Access</span>
                  </div>
                </div>

                <Link to="/signup" className="w-full py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold transition-colors text-center">
                  Get Started
                </Link>
              </div>
            </div>

            {/* Diamond Plan */}
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/30 rounded-3xl p-8 relative overflow-hidden group hover:scale-105 transition-transform">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl">💎</span>
                  <h3 className="text-2xl font-black text-white">Diamond Plan</h3>
                </div>
                <p className="text-5xl font-black text-blue-500 mb-2">10%</p>
                <p className="text-[#848e9c] mb-8">Daily Return Rate</p>
                
                <div className="space-y-4 mb-8 pb-8 border-b border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <span className="text-blue-500">✓</span>
                    <span className="text-[#848e9c]">Minimum Deposit: $10,000</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-500">✓</span>
                    <span className="text-[#848e9c]">Dedicated Account Manager</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-500">✓</span>
                    <span className="text-[#848e9c]">VIP + Advanced Trading</span>
                  </div>
                </div>

                <Link to="/signup" className="w-full py-4 bg-blue-500/20 hover:bg-blue-500/30 text-white rounded-xl font-bold transition-colors text-center border border-blue-500/30">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-[#181a20] py-24 border-t border-[#2b2f36]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Why Choose DIGGING POOL?</h2>
            <p className="text-[#848e9c] max-w-2xl mx-auto">Experience the next generation of crypto wealth management with our secure and automated platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Secure Storage', desc: 'Your funds are protected by our Secure Asset Fund for Users (SAFU) with military-grade encryption.', icon: '🛡️' },
              { title: 'Daily Payouts', desc: 'Earnings are calculated and distributed to your account every 24 hours automatically.', icon: '💰' },
              { title: 'Multi-Chain Support', desc: 'Access our platform across 10 different specialized blockchain networks.', icon: '🔗' }
            ].map((feature, i) => (
              <div key={i} className="p-8 bg-[#1e2329] rounded-3xl border border-[#2b2f36] hover:border-orange-500/50 transition-all group">
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-[#848e9c] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-yellow-500/10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl font-black text-white mb-6">Ready to Start Mining?</h2>
          <p className="text-xl text-[#848e9c] mb-10">Join thousands of investors earning passive income daily. Sign up in less than 2 minutes.</p>
          <Link to="/signup" className="inline-block px-12 py-5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-black text-lg transition-all shadow-xl shadow-orange-500/30 transform hover:scale-105">
            Start Your Journey Today
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0b0e11] border-t border-[#2b2f36] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
            <Logo size="md" />
            <div className="flex gap-8 text-sm text-[#848e9c]">
              <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer transition-colors">Cookie Policy</span>
            </div>
            <p className="text-sm text-[#474d57]">© 2026 DiggingPool.com. All rights reserved.</p>
          </div>
          <div className="pt-8 border-t border-[#2b2f36]">
            <p className="text-[10px] text-[#474d57] leading-relaxed text-center">
              Disclaimer: Cryptocurrency investment is subject to high market risk. Digging Pool is not responsible for any of your trading losses. Please do your own research and invest wisely. The "Passive Income" simulator is for educational purposes and demonstrates potential returns based on historical data.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
