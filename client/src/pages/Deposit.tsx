import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Logo from '../components/Logo'

export default function Deposit() {
  const navigate = useNavigate()
  const [trc20Address, setTrc20Address] = useState<string>('')
  const [levelRates, setLevelRates] = useState<number[]>([0.05, 0.1, 0.15, 0.2, 0.25, 0.3])
  const [transactionId, setTransactionId] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [selectedLevel, setSelectedLevel] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetchSettings()
  }, [navigate])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/settings/all', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setTrc20Address(response.data.trc20_address || '')
      setLevelRates([
        0.05, // Basic level default
        response.data.level1_rate,
        response.data.level2_rate,
        response.data.level3_rate,
        response.data.level4_rate,
        response.data.level5_rate
      ])
      setLoading(false)
    } catch (err: any) {
      console.error('Failed to fetch settings:', err)
      setError('Failed to load deposit settings. Please try again.')
      setLoading(false)
    }
  }

  const isValidTransactionId = (id: string) => {
    if (id.length < 5 || id.length > 30) return false
    if (!/^[a-zA-Z0-9]+$/.test(id)) return false
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Critical: Ensure amount is provided
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid deposit amount')
      return
    }

    if (!transactionId.trim()) {
      setError('Please enter a transaction ID')
      return
    }

    if (!isValidTransactionId(transactionId)) {
      if (transactionId.length < 5 || transactionId.length > 30) {
        setError('Transaction ID must be between 5 and 30 characters')
      } else {
        setError('Transaction ID must contain only letters and numbers')
      }
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      // Ensure we send exactly what the backend expects: amount, transactionId, level
      await axios.post('/api/deposits/submit', {
        amount: parseFloat(amount),
        transactionId: transactionId,
        level: selectedLevel,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      setSuccess('Deposit submitted successfully! Awaiting admin approval.')
      setTransactionId('')
      setAmount('')
      
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit deposit')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const levels = [
    { value: 0, label: `BASIC (${levelRates[0]}%)` },
    { value: 1, label: `Level 1 (${levelRates[1]}%)` },
    { value: 2, label: `Level 2 (${levelRates[2]}%)` },
    { value: 3, label: `Level 3 (${levelRates[3]}%)` },
    { value: 4, label: `Level 4 (${levelRates[4]}%)` },
    { value: 5, label: `Level 5 (${levelRates[5]}%)` },
    { value: 6, label: 'VIP Trading (80%)' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <nav className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="md" />
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-white mb-2">Make a Deposit</h1>
          <p className="text-slate-400 mb-8">Send USDT and enter your transaction details below</p>

          {error && (
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4 mb-6">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* TRC20 Address Display */}
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6 mb-8">
            <p className="text-slate-400 text-sm mb-3">Send USDT (TRC20) to this address:</p>
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 mb-4">
              <p className="text-white font-mono text-sm break-all">{trc20Address || 'No address configured'}</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(trc20Address)
                alert('Address copied to clipboard!')
              }}
              className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold rounded-lg transition"
            >
              Copy Address
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* AMOUNT FIELD - MOVED TO TOP FOR MAXIMUM VISIBILITY */}
            <div className="bg-slate-900/50 p-4 rounded-lg border border-yellow-500/30">
              <label className="block text-yellow-500 text-sm font-bold mb-3 uppercase tracking-wider">Deposit Amount (USDT)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
                className="w-full bg-slate-900 border-2 border-slate-600 rounded-lg px-4 py-4 text-white text-xl placeholder-slate-600 focus:outline-none focus:border-yellow-500"
              />
              <p className="text-slate-500 text-xs mt-2">Enter the exact amount of USDT you sent to the address above.</p>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">Select Level</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
              >
                {levels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">Transaction ID</label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter Transaction ID"
                maxLength={30}
                required
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-yellow-500 font-mono"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-slate-500 text-xs">Characters: {transactionId.length}/30</p>
                {transactionId.length > 0 && (
                  <p className={isValidTransactionId(transactionId) ? "text-green-400 text-xs" : "text-red-400 text-xs"}>
                    {isValidTransactionId(transactionId) ? "✓ Valid format" : "✗ Invalid format"}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !amount || parseFloat(amount) <= 0 || !isValidTransactionId(transactionId)}
              className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold py-4 rounded-lg transition text-lg shadow-lg shadow-yellow-500/10"
            >
              {submitting ? 'Processing...' : 'Submit Deposit Request'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-700">
            <h3 className="text-white font-semibold mb-4">Steps to deposit:</h3>
            <ol className="text-slate-400 text-sm space-y-3">
              <li className="flex gap-3"><span className="text-yellow-500 font-bold">1.</span> <span>Copy the wallet address and send USDT (TRC20).</span></li>
              <li className="flex gap-3"><span className="text-yellow-500 font-bold">2.</span> <span>Enter the **Amount** you sent in the box above.</span></li>
              <li className="flex gap-3"><span className="text-yellow-500 font-bold">3.</span> <span>Enter the **Transaction ID** from your wallet.</span></li>
              <li className="flex gap-3"><span className="text-yellow-500 font-bold">4.</span> <span>Click **Submit** and wait for admin approval.</span></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
