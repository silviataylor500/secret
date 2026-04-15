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
  chain: number
  unlockedLevel: number
  createdAt: string
}

interface Deposit {
  id: string
  userId: string
  name: string
  email: string
  transactionId: string
  level: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface Withdrawal {
  id: string
  userId: string
  name: string
  email: string
  amount: number
  trc20_address: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  createdAt: string
}

interface Message {
  id: string
  userId: string
  name: string
  email: string
  message: string
  senderRole: 'user' | 'co-admin'
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
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const chatEndRef = useEffect(() => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages, selectedUserId]);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [btcPrice, setBtcPrice] = useState<number>(0)
  const [trc20Address, setTrc20Address] = useState<string>('')
  const [newTrc20Address, setNewTrc20Address] = useState<string>('')
  const [settingsChain, setSettingsChain] = useState<number>(1)
  const [activeTab, setActiveTab] = useState<'users' | 'deposits' | 'withdrawals' | 'chat' | 'settings'>('users')
  const [adminRole, setAdminRole] = useState<string>('admin')
  const [adminChain, setAdminChain] = useState<number>(1)
  const [replyMessage, setReplyMessage] = useState<string>('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const decoded = JSON.parse(atob(token))
    setAdminRole(decoded.role)
    setAdminChain(decoded.chain)

    if (decoded.role !== 'admin' && decoded.role !== 'co-admin' && decoded.role !== 'master-admin') {
      navigate('/dashboard')
      return
    }

    fetchUsers()
    fetchBtcPrice()
    setSettingsChain(decoded.chain)
    fetchTrc20Address(decoded.chain)
    fetchDeposits()
    fetchWithdrawals()
    fetchMessages()
    setLoading(false)
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
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUsers(response.data)
    } catch (err: any) {
      console.error('Fetch users error:', err)
    }
  }

  const fetchTrc20Address = async (chain?: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/settings/trc20', {
        headers: { Authorization: `Bearer ${token}` },
        params: chain ? { chain } : undefined
      })
      setTrc20Address(response.data.trc20_address || '')
    } catch (err: any) {
      console.error('Fetch TRC20 error:', err)
    }
  }

  const fetchDeposits = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/admin/deposits', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDeposits(response.data)
    } catch (err: any) {
      console.error('Fetch deposits error:', err)
    }
  }

  const fetchWithdrawals = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/admin/withdrawals', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setWithdrawals(response.data)
    } catch (err: any) {
      console.error('Fetch withdrawals error:', err)
    }
  }

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/admin/chat', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMessages(response.data)
    } catch (err: any) {
      console.error('Fetch messages error:', err)
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
        role: editingUser.role,
        chain: adminRole === 'master-admin' ? editingUser.chain : undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEditingUser(null)
      fetchUsers()
      alert('User updated successfully!')
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
      alert('User deleted successfully!')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleInvestmentChange = (amount: number) => {
    if (!editingUser) return
    const btcAmount = amount / btcPrice
    setEditingUser({
      ...editingUser,
      investmentAmount: amount,
      btcAllocated: btcAmount,
    })
  }

  const handleUpdateTrc20 = async () => {
    if (!newTrc20Address.trim()) {
      alert('Please enter a TRC20 address')
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/admin/settings/trc20', {
        trc20_address: newTrc20Address,
        chain: adminRole === 'master-admin' ? settingsChain : undefined
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setTrc20Address(newTrc20Address)
      setNewTrc20Address('')
      alert('TRC20 address updated successfully!')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Update failed')
    }
  }

  const handleApproveDeposit = async (depositId: string) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`/api/admin/deposits/${depositId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchDeposits()
      fetchUsers()
      alert('Deposit approved!')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Approval failed')
    }
  }

  const handleRejectDeposit = async (depositId: string) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`/api/admin/deposits/${depositId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchDeposits()
      alert('Deposit rejected!')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Rejection failed')
    }
  }

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`/api/admin/withdrawals/${withdrawalId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchWithdrawals()
      alert('Withdrawal approved!')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Approval failed')
    }
  }

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`/api/admin/withdrawals/${withdrawalId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchWithdrawals()
      alert('Withdrawal rejected!')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Rejection failed')
    }
  }

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedUserId) {
      alert('Please enter a message')
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/admin/chat/reply', {
        userId: selectedUserId,
        message: replyMessage,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setReplyMessage('')
      fetchMessages()
      alert('Reply sent!')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send reply')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const formatUSD = (val: any) => {
    const num = parseFloat(val)
    return isNaN(num) ? '0.00' : num.toFixed(2)
  }

  const getLevelName = (level: number) => {
    return level === 0 ? 'BASIC' : `Level ${level}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navbar */}
      <nav className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-xs">₿</span>
              </div>
              <span className="text-xl font-bold text-white">Admin Panel</span>
              <span className="text-slate-400 text-sm">Role: {adminRole}</span>
              {adminRole !== 'master-admin' && <span className="text-slate-400 text-sm">Chain: {adminChain}</span>}
              <span className="text-yellow-400 text-sm font-semibold">BTC: ${btcPrice.toLocaleString()}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-3 font-semibold border-b-2 transition ${
                activeTab === 'users'
                  ? 'border-yellow-500 text-yellow-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('deposits')}
              className={`px-4 py-3 font-semibold border-b-2 transition ${
                activeTab === 'deposits'
                  ? 'border-yellow-500 text-yellow-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Deposits
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`px-4 py-3 font-semibold border-b-2 transition ${
                activeTab === 'withdrawals'
                  ? 'border-yellow-500 text-yellow-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Withdrawals
            </button>
            {(adminRole === 'co-admin' || adminRole === 'master-admin') && (
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-3 font-semibold border-b-2 transition ${
                  activeTab === 'chat'
                    ? 'border-yellow-500 text-yellow-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Chat
              </button>
            )}
            {(adminRole === 'admin' || adminRole === 'master-admin') && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-3 font-semibold border-b-2 transition ${
                  activeTab === 'settings'
                    ? 'border-yellow-500 text-yellow-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Settings
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">Users Management</h1>
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Chain</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Level</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Investment</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                      <td className="px-6 py-4 text-white">{user.name}</td>
                      <td className="px-6 py-4 text-slate-300">{user.email}</td>
                      <td className="px-6 py-4 text-slate-300">{user.chain}</td>
                      <td className="px-6 py-4 text-yellow-400 font-semibold">{getLevelName(user.unlockedLevel)}</td>
                      <td className="px-6 py-4 text-green-400">${formatUSD(user.investmentAmount)}</td>
                      <td className="px-6 py-4 text-slate-300">{user.role}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-slate-900 rounded text-sm font-semibold mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Deposits Tab */}
        {activeTab === 'deposits' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">Deposits Management</h1>
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">User</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Level</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Transaction ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map(deposit => (
                    <tr key={deposit.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                      <td className="px-6 py-4 text-white">{deposit.name}</td>
                      <td className="px-6 py-4 text-yellow-400 font-semibold">{getLevelName(deposit.level)}</td>
                      <td className="px-6 py-4 text-slate-300 font-mono text-sm">{deposit.transactionId}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          deposit.status === 'approved' ? 'bg-green-900/30 text-green-400' :
                          deposit.status === 'rejected' ? 'bg-red-900/30 text-red-400' :
                          'bg-yellow-900/30 text-yellow-400'
                        }`}>
                          {deposit.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{new Date(deposit.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        {deposit.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveDeposit(deposit.id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold mr-2"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectDeposit(deposit.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">Withdrawals Management</h1>
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">User</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">TRC20 Address</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map(withdrawal => (
                    <tr key={withdrawal.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                      <td className="px-6 py-4 text-white">{withdrawal.name}</td>
                      <td className="px-6 py-4 text-green-400 font-semibold">${formatUSD(withdrawal.amount)}</td>
                      <td className="px-6 py-4 text-slate-300 font-mono text-sm break-all">{withdrawal.trc20_address}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          withdrawal.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                          withdrawal.status === 'approved' ? 'bg-blue-900/30 text-blue-400' :
                          withdrawal.status === 'rejected' ? 'bg-red-900/30 text-red-400' :
                          'bg-yellow-900/30 text-yellow-400'
                        }`}>
                          {withdrawal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{new Date(withdrawal.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        {withdrawal.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveWithdrawal(withdrawal.id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold mr-2"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(withdrawal.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {(activeTab === 'chat' && (adminRole === 'co-admin' || adminRole === 'master-admin')) && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">Customer Support Chat</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Messages List */}
              <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div id="chat-container" className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {messages.filter(msg => !selectedUserId || msg.userId === selectedUserId).map(msg => (
                    <div
                      key={msg.id}
                      onClick={() => setSelectedUserId(msg.userId)}
                      className={`p-4 rounded-lg cursor-pointer transition ${
                        selectedUserId === msg.userId
                          ? 'bg-yellow-500/20 border border-yellow-500'
                          : 'bg-slate-700/50 border border-slate-600 hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-white font-semibold">{msg.name}</p>
                          <p className="text-slate-400 text-sm">{msg.email}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          msg.senderRole === 'user' ? 'bg-blue-900/30 text-blue-400' : 'bg-green-900/30 text-green-400'
                        }`}>
                          {msg.senderRole}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm">{msg.message}</p>
                      <p className="text-slate-500 text-xs mt-2">{new Date(msg.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Section */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-4">Send Reply</h3>
                {selectedUserId ? (
                  <div className="space-y-4">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your reply..."
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 resize-none h-32"
                    />
                    <button
                      onClick={handleSendReply}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-2 rounded-lg transition"
                    >
                      Send Reply
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">Select a message to reply</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {(activeTab === 'settings' && (adminRole === 'admin' || adminRole === 'master-admin')) && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">TRC20 Deposit Address</h2>
              <div className="space-y-4">
                {adminRole === 'master-admin' && (
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Select Chain</label>
                    <select
                      value={settingsChain}
                      onChange={(e) => {
                        const chain = parseInt(e.target.value);
                        setSettingsChain(chain);
                        fetchTrc20Address(chain);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map(chain => (
                        <option key={chain} value={chain}>Chain {chain}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Current Address (Chain {adminRole === 'master-admin' ? settingsChain : adminChain})</label>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                    <p className="text-white font-mono break-all">{trc20Address || 'No address set'}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">New Address</label>
                  <input
                    type="text"
                    value={newTrc20Address}
                    onChange={(e) => setNewTrc20Address(e.target.value)}
                    placeholder="Enter new TRC20 address"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <button
                  onClick={handleUpdateTrc20}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-2 rounded-lg transition"
                >
                  Update Address
                </button>
              </div>
            </div>
          </div>
        )}
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">BTC Allocated</label>
                <input
                  type="number"
                  step="0.00000001"
                  value={editingUser.btcAllocated}
                  onChange={(e) => setEditingUser({ ...editingUser, btcAllocated: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">User Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  disabled={adminRole === 'co-admin'}
                  className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 ${adminRole === 'co-admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="user">User</option>
                  <option value="co-admin">Co-Admin</option>
                  <option value="admin">Admin</option>
                  {adminRole === 'master-admin' && <option value="master-admin">Master Admin</option>}
                </select>
                <p className="text-[10px] text-slate-500 mt-1 italic">
                  {adminRole === 'co-admin' ? '* Co-Admins cannot change roles' : '* Change user role'}
                </p>
              </div>
              {adminRole === 'master-admin' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Chain</label>
                  <select
                    value={editingUser.chain}
                    onChange={(e) => setEditingUser({ ...editingUser, chain: parseInt(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(chain => (
                      <option key={chain} value={chain}>
                        Chain {chain}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1 italic">* Master Admin can reassign users to different chains</p>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-2 rounded-lg">Save Changes</button>
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
