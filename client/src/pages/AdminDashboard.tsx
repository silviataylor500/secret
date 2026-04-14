import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

interface User {
  id: string
  name: string
  email: string
  mobile: string
  investmentAmount: number
  dailyReturnRate: number
  btcAllocated: number
  dailyEarnings: number
  totalEarnings: number
  role: string
  createdAt: string
}

interface PriceData {
  bitcoin: {
    usd: number
  }
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [btcPrice, setBtcPrice] = useState<number>(0)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetchUsers()
    fetchBtcPrice()
  }, [navigate])

  const fetchBtcPrice = async () => {
    try {
      const response = await axios.get<PriceData>(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      )
      setBtcPrice(response.data.bitcoin.usd)
    } catch (error) {
      console.error('Failed to fetch BTC price:', error)
    }
  }

  const fetchUsers = async () => {
    console.log('Fetching users...');
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUsers(response.data)
      setLoading(false)
    } catch (err: any) {
      console.error('Fetch users error:', err);
      setError(err.response?.data?.message || 'Failed to fetch users')
      setLoading(false)
      if (err.response?.status === 403) {
        navigate('/dashboard')
      }
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      const token = localStorage.getItem('token')
      await axios.put(`/api/admin/users/${editingUser.id}`, {
        investmentAmount: editingUser.investmentAmount,
        dailyReturnRate: editingUser.dailyReturnRate,
        btcAllocated: editingUser.btcAllocated,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEditingUser(null)
      fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Update failed')
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return

    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed')
    }
  }

  // Auto-calculate BTC when investment amount changes
  const handleInvestmentChange = (amount: number) => {
    if (!editingUser) return
    
    let newBtcAllocated = editingUser.btcAllocated
    if (btcPrice > 0 && amount > 0) {
      newBtcAllocated = amount / btcPrice
    }
    
    setEditingUser({
      ...editingUser,
      investmentAmount: amount,
      btcAllocated: newBtcAllocated
    })
  }

  // Helper to safely format numbers
  const formatUSD = (val: any) => {
    const num = parseFloat(val)
    return isNaN(num) ? '0.00' : num.toFixed(2)
  }

  const formatBTC = (val: any) => {
    const num = parseFloat(val)
    return isNaN(num) ? '0.00000000' : num.toFixed(8)
  }

  const formatPercent = (val: any) => {
    const num = parseFloat(val)
    return isNaN(num) ? '0.00' : num.toFixed(2)
  }

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Admin Panel...</div>

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-yellow-500">Admin Control Panel</h1>
            {btcPrice > 0 && (
              <p className="text-slate-400 text-sm mt-1">
                Live BTC Price: <span className="text-green-400">${btcPrice.toLocaleString()}</span>
              </p>
            )}
          </div>
          <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Back to Dashboard</button>
        </div>

        {error && <div className="bg-red-500/20 border border-red-500 text-red-500 p-4 rounded-lg mb-6">{error}</div>}

        <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
          <table className="w-full text-left">
            <thead className="bg-slate-700 text-slate-300 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Investment</th>
                <th className="px-6 py-4">Rate</th>
                <th className="px-6 py-4">BTC</th>
                <th className="px-6 py-4">Daily Earn</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">${formatUSD(user.investmentAmount)}</td>
                  <td className="px-6 py-4 text-green-400">{formatPercent(user.dailyReturnRate)}%</td>
                  <td className="px-6 py-4 text-xs">{formatBTC(user.btcAllocated)}</td>
                  <td className="px-6 py-4 text-green-400">${formatUSD(user.dailyEarnings)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => setEditingUser(user)} className="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
                      <button onClick={() => handleDeleteUser(user.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit User: {editingUser.name}</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Investment Amount ($)</label>
                <input
                  type="number"
                  value={editingUser.investmentAmount}
                  onChange={(e) => handleInvestmentChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-yellow-500"
                />
                <p className="text-[10px] text-slate-500 mt-1 italic">* BTC Allocated will auto-calculate based on live price (${btcPrice.toLocaleString()})</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Daily Return Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingUser.dailyReturnRate}
                  onChange={(e) => setEditingUser({ ...editingUser, dailyReturnRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">BTC Allocated</label>
                <input
                  type="number"
                  step="0.00000001"
                  value={editingUser.btcAllocated}
                  onChange={(e) => setEditingUser({ ...editingUser, btcAllocated: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-2 rounded-lg">Save Changes</button>
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
