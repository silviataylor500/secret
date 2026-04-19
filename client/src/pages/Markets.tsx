import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'

export default function Markets() {
  const navigate = useNavigate()
  const [diggingCount, setDiggingCount] = useState(0)
  const [isDigging, setIsDigging] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setDiggingCount(prev => prev + Math.random() * 0.000001)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#0b0e11] text-white flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-500/10 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full animate-pulse"></div>

      {/* Header */}
      <div className="absolute top-8 left-8">
        <Logo size="md" />
      </div>

      <button 
        onClick={() => navigate(-1)}
        className="absolute top-8 right-8 px-4 py-2 bg-[#1e2329] border border-[#2b2f36] rounded-lg text-sm font-bold hover:bg-[#2b2f36] transition-all"
      >
        Back to Home
      </button>

      {/* Main Animation Area */}
      <div className="relative z-10 text-center max-w-2xl w-full">
        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">
          DIGGING <span className="text-yellow-500">BTC</span>
        </h1>
        <p className="text-[#848e9c] mb-12 font-medium">
          Our advanced automated digging technology is processing market data...
        </p>

        {/* The Digging Machine Animation */}
        <div className="relative h-64 flex items-center justify-center mb-12">
          {/* Central BTC Coin */}
          <div className="w-32 h-32 bg-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(234,179,8,0.4)] animate-bounce z-20">
            <span className="text-black text-6xl font-black">₿</span>
          </div>

          {/* Orbiting "Diggers" */}
          <div className="absolute w-full h-full animate-spin-slow">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-orange-500 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.8)]"></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-yellow-500 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.8)]"></div>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)]"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.8)]"></div>
          </div>

          {/* Particle Effects */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-1 h-1 bg-yellow-500 rounded-full animate-ping"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random() * 2}s`
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Counter Display */}
        <div className="bg-[#1e2329] border border-[#2b2f36] rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-[#848e9c] uppercase tracking-widest mb-2">Total Digged Today</span>
            <span className="text-4xl md:text-5xl font-black text-[#0ecb81] font-mono">
              {diggingCount.toFixed(8)} <span className="text-xl">BTC</span>
            </span>
            <div className="w-full bg-[#0b0e11] h-2 rounded-full mt-6 overflow-hidden">
              <div className="bg-yellow-500 h-full animate-progress-indefinite"></div>
            </div>
            <div className="flex justify-between w-full mt-4 text-[10px] font-bold text-[#474d57] uppercase tracking-tighter">
              <span>Initializing</span>
              <span>Processing</span>
              <span>Finalizing</span>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4">
          <div className="p-4 bg-[#1e2329]/50 rounded-2xl border border-[#2b2f36]">
            <p className="text-[10px] text-[#848e9c] font-bold uppercase mb-1">Hash Rate</p>
            <p className="text-lg font-black">450.2 TH/s</p>
          </div>
          <div className="p-4 bg-[#1e2329]/50 rounded-2xl border border-[#2b2f36]">
            <p className="text-[10px] text-[#848e9c] font-bold uppercase mb-1">Nodes</p>
            <p className="text-lg font-black">12,402</p>
          </div>
          <div className="p-4 bg-[#1e2329]/50 rounded-2xl border border-[#2b2f36]">
            <p className="text-[10px] text-[#848e9c] font-bold uppercase mb-1">Efficiency</p>
            <p className="text-lg font-black text-[#0ecb81]">99.9%</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes progress-indefinite {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 100%; transform: translateX(0%); }
          100% { width: 0%; transform: translateX(100%); }
        }
        .animate-progress-indefinite {
          animation: progress-indefinite 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
