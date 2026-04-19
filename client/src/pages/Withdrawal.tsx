import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Logo from '../components/Logo'

export default function Withdrawal() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState<string>('')
  const [trc20Address, setTrc20Address] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!amount || !trc20Address.trim()) {
      setError('Please fill in all fields')
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Amount must be a valid positive number')
      return
    }

    if (trc20Address.length < 10) {
      setError('Please enter a valid TRC20 address')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/withdrawal/submit', {
        amount: amountNum,
        trc20_address: trc20Address,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSuccess('Withdrawal request submitted successfully! Admin will review and process within 24 hours.')
      setAmount('')
      setTrc20Address('')
      
      // Redirect back to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit withdrawal request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navbar */}
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

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-white mb-2">Withdrawal Request</h1>
          <p className="text-slate-400 mb-8">Submit your withdrawal request. Admin will review and process within 24 hours.</p>

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

          {/* Withdrawal Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">Withdrawal Amount (USD)</label>
              <p className="text-slate-400 text-xs mb-2">Enter the amount you wish to withdraw</p>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount (e.g., 100.00)"
                step="0.01"
                min="0"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">TRC20 Address</label>
              <p className="text-slate-400 text-xs mb-2">Enter your TRC20 wallet address where funds will be sent</p>
              <input
                type="text"
                value={trc20Address}
                onChange={(e) => setTrc20Address(e.target.value)}
                placeholder="Enter your TRC20 address (e.g., TRxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 font-mono text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !amount || !trc20Address}
              className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-700 text-slate-900 font-bold py-3 rounded-lg transition"
            >
              {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
            </button>
          </form>

          {/* Information Box */}
          <div className="mt-8 pt-8 border-t border-slate-700">
            <h3 className="text-white font-semibold mb-4">Important Information:</h3>
            <ul className="text-slate-400 text-sm space-y-2">
              <li className="flex gap-3">
                <span className="text-yellow-500 font-bold">•</span>
                <span>Withdrawal requests are reviewed by admin within 24 hours</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-500 font-bold">•</span>
                <span>Funds will be sent to your provided TRC20 address</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-500 font-bold">•</span>
                <span>Make sure your TRC20 address is correct before submitting</span>
              </li>
              <li className="flex gap-3">
                <span className="text-yellow-500 font-bold">•</span>
                <span>Processing time may vary depending on network conditions</span>
              </li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
            <p className="text-yellow-400 text-xs">
              <strong>Important:</strong> Double-check your TRC20 address. We cannot recover funds sent to incorrect addresses. Withdrawal requests cannot be cancelled once submitted.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
