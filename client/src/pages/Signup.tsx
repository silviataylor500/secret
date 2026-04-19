import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import Logo from '../components/Logo'

export default function Signup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    chain: 1,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'chain' ? parseInt(e.target.value) : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name || !formData.email || !formData.mobile || !formData.password) {
      setError('All fields are required')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await axios.post('/api/auth/signup', {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
        chain: formData.chain,
      })
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="xl" showText={false} />
            </div>
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-slate-400 mt-2">Join our crypto simulator</p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Mobile Number</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Select Chain</label>
              <select
                name="chain"
                value={formData.chain}
                onChange={handleChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map(chain => (
                  <option key={chain} value={chain}>
                    Chain {chain}
                  </option>
                ))}
              </select>
              <p className="text-slate-500 text-xs mt-1">Choose which chain you want to join</p>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-700 text-black font-bold py-2 rounded-lg transition"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-yellow-400 hover:text-yellow-300 font-semibold">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
