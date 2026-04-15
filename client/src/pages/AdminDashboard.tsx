import React, { useState, useEffect } from 'react'
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
  level0_amount: number
  level1_amount: number
  level2_amount: number
  level3_amount: number
  level4_amount: number
  level5_amount: number
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
  amount: number
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [btcPrice, setBtcPrice] = useState<number>(0)
  const [trc20Address, setTrc20Address] = useState<string>('')
  const [newTrc20Address, setNewTrc20Address] = useState<string>('')
  const [levelRates, setLevelRates] = useState<Record<string, number>>({
    level1: 0.05,
    level2: 0.10,
    level3: 0.15,
    level4: 0.20,
    level5: 0.25
  })
  const [settingsChain, setSettingsChain] = useState<number>(1)
  const [activeTab, setActiveTab] = useState<'users' | 'deposits' | 'withdrawals' | 'chat' | 'settings'>('users')
  const [adminRole, setAdminRole] = useState<string>('admin')
  const [adminChain, setAdminChain] = useState<number>(1)
  const [replyMessage, setReplyMessage] = useState<string>('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // GLOBAL SAFETY WRAPPER FOR toLocaleString
  const safeFormatUSD = (amount: any) => {
    try {
      const val = parseFloat(amount);
      if (isNaN(val)) return '0.00';
      return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (e) {
      return '0.00';
    }
  }

  const safeFormatBTC = (amount: any) => {
    try {
      const val = parseFloat(amount);
      if (isNaN(val)) return '0.00000000';
      return val.toFixed(8);
    } catch (e) {
      return '0.00000000';
    }
  }

  useEffect(() => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages, selectedUserId]);

  const fetchBtcPrice = async () => {
    try {
      const response = await axios.get<PriceData>(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      )
      if (response.data && response.data.bitcoin && response.data.bitcoin.usd) {
        setBtcPrice(response.data.bitcoin.usd)
      }
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
      setUsers(Array.isArray(response.data) ? response.data : [])
    } catch (err: any) {
      console.error('Fetch users error:', err)
    }
  }

  const fetchSettings = async (chain?: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/settings/all', {
        headers: { Authorization: `Bearer ${token}` },
        params: chain ? { chain } : undefined
      })
      if (response.data) {
        setTrc20Address(response.data.trc20_address || '')
        setLevelRates({
          level1: response.data.level1_rate || 0.05,
          level2: response.data.level2_rate || 0.10,
          level3: response.data.level3_rate || 0.15,
          level4: response.data.level4_rate || 0.20,
          level5: response.data.level5_rate || 0.25
        })
      }
    } catch (err: any) {
      console.error('Fetch settings error:', err)
    }
  }

  const fetchDeposits = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/admin/deposits', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDeposits(Array.isArray(response.data) ? response.data : [])
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
      setWithdrawals(Array.isArray(response.data) ? response.data : [])
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
      setMessages(Array.isArray(response.data) ? response.data : [])
    } catch (err: any) {
      console.error('Fetch messages error:', err)
    }
  }

  useEffect(() => {
    const initializeDashboard = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      try {
        const decoded = JSON.parse(atob(token))
        setAdminRole(decoded.role || 'admin')
        setAdminChain(decoded.chain || 1)

        if (decoded.role !== 'admin' && decoded.role !== 'co-admin' && decoded.role !== 'master-admin') {
          navigate('/dashboard')
          return
        }

        setSettingsChain(decoded.chain || 1)
        
        await Promise.all([
          fetchUsers(),
          fetchBtcPrice(),
          fetchSettings(decoded.chain),
          fetchDeposits(),
          fetchWithdrawals(),
          fetchMessages()
        ])
      } catch (err) {
        console.error('Initialization error:', err)
        setError('Failed to initialize dashboard')
      } finally {
        setLoading(false)
      }
    }

    initializeDashboard()
  }, [navigate])

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
    const btcAmount = btcPrice > 0 ? amount / btcPrice : 0
    setEditingUser({
      ...editingUser,
      investmentAmount: amount,
      btcAllocated: btcAmount,
    })
  }

  const handleUpdateSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/admin/settings/update', {
        trc20_address: newTrc20Address || trc20Address,
        level1_rate: levelRates.level1,
        level2_rate: levelRates.level2,
        level3_rate: levelRates.level3,
        level4_rate: levelRates.level4,
        level5_rate: levelRates.level5,
        chain: adminRole === 'master-admin' ? settingsChain : undefined
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (newTrc20Address) {
        setTrc20Address(newTrc20Address)
        setNewTrc20Address('')
      }
      alert('Settings updated successfully!')
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
    if (!replyMessage.trim() || !selectedUserId) return

    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/admin/chat/reply', {
        userId: selectedUserId,
        message: replyMessage
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setReplyMessage('')
      fetchMessages()
    } catch (err: any) {
      alert('Failed to send reply')
    }
  }

  const getLevelName = (level: any) => {
    const val = parseInt(level) || 0
    return val === 0 ? 'BASIC' : `LEVEL ${val}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl font-bold">Loading Admin Dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-red-500 text-xl font-bold">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300">
      {/* Sidebar */}
      <div className="fixed w-64 h-full bg-slate-800 border-r border-slate-700 p-6 z-10">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-xs">₿</span>
          </div>
          <span className="text-xl font-bold text-white uppercase tracking-tight">Admin Panel</span>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
              activeTab === 'users' ? 'bg-yellow-500 text-slate-900' : 'hover:bg-slate-700'
            }`}
          >
            Users Management
          </button>
          <button
            onClick={() => setActiveTab('deposits')}
            className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
              activeTab === 'deposits' ? 'bg-yellow-500 text-slate-900' : 'hover:bg-slate-700'
            }`}
          >
            Deposits
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
              activeTab === 'withdrawals' ? 'bg-yellow-500 text-slate-900' : 'hover:bg-slate-700'
            }`}
          >
            Withdrawals
          </button>
          {(adminRole === 'co-admin' || adminRole === 'master-admin') && (
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'chat' ? 'bg-yellow-500 text-slate-900' : 'hover:bg-slate-700'
              }`}
            >
              Support Chat
            </button>
          )}
          {(adminRole === 'admin' || adminRole === 'master-admin') && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition ${
                activeTab === 'settings' ? 'bg-yellow-500 text-slate-900' : 'hover:bg-slate-700'
              }`}
            >
              System Settings
            </button>
          )}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold text-sm transition"
          >
            User Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
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
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Investment</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Levels (1-5)</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">BTC Allocated</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4 text-white font-medium">{user.name}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{user.email}</td>
                      <td className="px-6 py-4 text-green-400 font-semibold">${safeFormatUSD(user.investmentAmount)}</td>
                      <td className="px-6 py-4 text-slate-300 text-xs">
                        <div className="grid grid-cols-1 gap-0.5">
                          <span>B: ${safeFormatUSD(user.level0_amount)}</span>
                          <span>L1: ${safeFormatUSD(user.level1_amount)}</span>
                          <span>L2: ${safeFormatUSD(user.level2_amount)}</span>
                          <span>L3: ${safeFormatUSD(user.level3_amount)}</span>
                          <span>L4: ${safeFormatUSD(user.level4_amount)}</span>
                          <span>L5: ${safeFormatUSD(user.level5_amount)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-yellow-400 font-mono text-sm">{safeFormatBTC(user.btcAllocated)} BTC</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-slate-900 rounded text-sm font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                          >
                            Delete
                          </button>
                        </div>
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
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Level</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Transaction ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {deposits.map(deposit => (
                    <tr key={deposit.id} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4 text-white">{deposit.name}</td>
                      <td className="px-6 py-4 text-green-400 font-semibold">${safeFormatUSD(deposit.amount)}</td>
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveDeposit(deposit.id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectDeposit(deposit.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                            >
                              Reject
                            </button>
                          </div>
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
                <tbody className="divide-y divide-slate-700">
                  {withdrawals.map(withdrawal => (
                    <tr key={withdrawal.id} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4 text-white">{withdrawal.name}</td>
                      <td className="px-6 py-4 text-green-400 font-semibold">${safeFormatUSD(withdrawal.amount)}</td>
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveWithdrawal(withdrawal.id)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(withdrawal.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                            >
                              Reject
                            </button>
                          </div>
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
              <div className="space-y-8">
                {adminRole === 'master-admin' && (
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">Chain Selection</h2>
                    <label className="block text-slate-300 text-sm font-medium mb-2">Select Chain to Manage</label>
                    <select
                      value={settingsChain}
                      onChange={(e) => {
                        const chain = parseInt(e.target.value) || 1;
                        setSettingsChain(chain);
                        fetchSettings(chain);
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
                  <h2 className="text-xl font-bold text-white mb-4">TRC20 Wallet Address</h2>
                  <div className="space-y-4">
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
                  </div>
                </div>

                {adminRole === 'master-admin' && (
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">Daily Return Rates (%)</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[1, 2, 3, 4, 5].map(level => (
                        <div key={level}>
                          <label className="block text-slate-300 text-sm font-medium mb-2">Level {level} Rate (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={levelRates[`level${level}`] || 0}
                            onChange={(e) => setLevelRates({
                              ...levelRates,
                              [`level${level}`]: parseFloat(e.target.value) || 0
                            })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUpdateSettings}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-3 rounded-lg transition"
                >
                  Save All Settings
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
            <h2 className="text-xl font-bold mb-4 text-white">Edit User: {editingUser.name}</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Investment Amount ($)</label>
                <input
                  type="number"
                  value={editingUser.investmentAmount}
                  onChange={(e) => handleInvestmentChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                />
                <p className="text-[10px] text-slate-500 mt-1 italic">* BTC Allocated will auto-calculate based on live price (${btcPrice ? safeFormatUSD(btcPrice) : 'Loading...'})</p>
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
                <label className="block text-sm text-slate-400 mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  disabled={adminRole === 'co-admin'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 disabled:opacity-50"
                >
                  <option value="user">User</option>
                  <option value="co-admin">Co-Admin</option>
                  <option value="admin">Admin</option>
                  {adminRole === 'master-admin' && <option value="master-admin">Master Admin</option>}
                </select>
              </div>
              {adminRole === 'master-admin' && (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Chain</label>
                  <select
                    value={editingUser.chain}
                    onChange={(e) => setEditingUser({ ...editingUser, chain: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(chain => (
                      <option key={chain} value={chain}>Chain {chain}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-2 rounded-lg transition"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
