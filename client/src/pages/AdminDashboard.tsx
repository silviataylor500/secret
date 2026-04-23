import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Logo from '../components/Logo'

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
  tradingIncome: number
  vipUnlocked: boolean
  createdAt: string
}

interface Deposit {
  id: string
  userId: string
  name: string
  email: string
  amount: number
  transactionId: string
  imagePath?: string
  level: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  chain?: number
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
  chain?: number
}

interface Message {
  id: string
  userId: string
  name: string
  email: string
  message: string
  imagePath?: string
  senderRole: 'user' | 'co-admin'
  createdAt: string
  chain?: number
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
    level0: 0.05,
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
  const [replyImage, setReplyImage] = useState<File | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [vipProfitRate, setVipProfitRate] = useState<number>(20)
  
  // Filter states
  const [userChainFilter, setUserChainFilter] = useState<string>('all')
  const [depositChainFilter, setDepositChainFilter] = useState<string>('all')
  const [withdrawalChainFilter, setWithdrawalChainFilter] = useState<string>('all')
  const [chatChainFilter, setChatChainFilter] = useState<string>('all')
  
  // Mass message state
  const [massMessage, setMassMessage] = useState<string>('')
  const [massMessageChain, setMassMessageChain] = useState<number>(1)

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
          level0: response.data.level0_rate || 0.05,
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
        
        // Fetch VIP rate from settings
        const settingsRes = await axios.get('/api/settings/all', {
          headers: { Authorization: `Bearer ${token}` },
          params: decoded.chain ? { chain: decoded.chain } : undefined
        })
        if (settingsRes.data && settingsRes.data.vip_profit_rate) {
          setVipProfitRate(settingsRes.data.vip_profit_rate)
        }
      } catch (err) {
        console.error('Initialization error:', err)
        setError('Failed to initialize dashboard')
      } finally {
        setLoading(false)
      }
    }

    initializeDashboard()

    // Set up auto-refresh intervals
    const depositInterval = setInterval(fetchDeposits, 5000) // Refresh every 5 seconds
    const withdrawalInterval = setInterval(fetchWithdrawals, 5000) // Refresh every 5 seconds
    const messageInterval = setInterval(fetchMessages, 3000) // Refresh every 3 seconds

    return () => {
      clearInterval(depositInterval)
      clearInterval(withdrawalInterval)
      clearInterval(messageInterval)
    }
  }, [navigate])

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      const token = localStorage.getItem('token')
      // Update basic user info
      await axios.put(`/api/admin/users/${editingUser.id}`, {
        investmentAmount: editingUser.investmentAmount,
        dailyReturnRate: editingUser.dailyReturnRate,
        btcAllocated: editingUser.btcAllocated,
        role: editingUser.role,
        chain: adminRole === 'master-admin' ? editingUser.chain : undefined,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })

      // Update VIP settings specifically
      await axios.put(`/api/admin/users/${editingUser.id}/vip`, {
        vipUnlocked: editingUser.vipUnlocked,
        vipProfitRate: (editingUser as any).vipProfitRate
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
      
      // 1. Update basic settings
      const settingsPromise = axios.post('/api/admin/settings/update', {
        trc20_address: newTrc20Address || trc20Address,
        level0_rate: levelRates.level0,
        level1_rate: levelRates.level1,
        level2_rate: levelRates.level2,
        level3_rate: levelRates.level3,
        level4_rate: levelRates.level4,
        level5_rate: levelRates.level5,
        chain: adminRole === 'master-admin' ? settingsChain : undefined
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // 2. Update VIP rate
      const vipPromise = axios.post('/api/admin/settings/vip-rate', {
        chain: adminRole === 'master-admin' ? settingsChain : adminChain,
        profitRate: vipProfitRate
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await Promise.all([settingsPromise, vipPromise]);

      if (newTrc20Address) {
        setTrc20Address(newTrc20Address)
        setNewTrc20Address('')
      }
      alert('Settings updated successfully!')
    } catch (err: any) {
      console.error('Update settings error:', err);
      alert(err.response?.data?.message || 'Update failed. Please check your connection and try again.');
    }
  }

  const handleToggleVip = async (userId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`/api/admin/users/${userId}/vip`, {
        vipUnlocked: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchUsers()
      alert('VIP status updated!')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update VIP status')
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
    if (!selectedUserId || (!replyMessage.trim() && !replyImage)) return

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('userId', selectedUserId)
      formData.append('message', replyMessage)
      if (replyImage) {
        formData.append('image', replyImage)
      }

      await axios.post('/api/admin/chat/reply', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      })
      setReplyMessage('')
      setReplyImage(null)
      fetchMessages()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send reply')
    }
  }

  const handleEndChat = async () => {
    if (!selectedUserId || !window.confirm('Are you sure you want to end this chat? All history and images will be deleted.')) return

    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/admin/chat/end', {
        userId: selectedUserId
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSelectedUserId(null)
      fetchMessages()
      alert('Chat ended and history deleted.')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to end chat')
    }
  }

  const handleSendMassMessage = async () => {
    if (!massMessage) return

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('/api/admin/chat/mass-message', {
        chain: massMessageChain,
        message: massMessage
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMassMessage('')
      fetchMessages()
      alert(response.data.message)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send mass message')
    }
  }

  const getLevelName = (level: number) => {
    if (level === 0) return 'BASIC'
    if (level === 6) return 'VIP LEVEL'
    return `LEVEL ${level}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-yellow-500 text-xl font-bold animate-pulse">Loading Admin Dashboard...</div>
      </div>
    )
  }

  // Filtered data
  const filteredUsers = users.filter(u => userChainFilter === 'all' || u.chain === parseInt(userChainFilter))
  const filteredDeposits = deposits.filter(d => depositChainFilter === 'all' || d.chain === parseInt(depositChainFilter))
  const filteredWithdrawals = withdrawals.filter(w => withdrawalChainFilter === 'all' || w.chain === parseInt(withdrawalChainFilter))
  const filteredMessages = messages.filter(m => chatChainFilter === 'all' || m.chain === parseInt(chatChainFilter))

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 p-6">
        <div className="mb-10"><Logo size="md" /></div>
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeTab === 'users' ? 'bg-yellow-500 text-slate-900 font-bold' : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            Users Management
          </button>
          <button
            onClick={() => setActiveTab('deposits')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeTab === 'deposits' ? 'bg-yellow-500 text-slate-900 font-bold' : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            Deposits
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeTab === 'withdrawals' ? 'bg-yellow-500 text-slate-900 font-bold' : 'text-slate-400 hover:bg-slate-700'
            }`}
          >
            Withdrawals
          </button>
          {(adminRole === 'co-admin' || adminRole === 'master-admin') && (
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full text-left px-4 py-3 rounded-lg transition ${
                activeTab === 'chat' ? 'bg-yellow-500 text-slate-900 font-bold' : 'text-slate-400 hover:bg-slate-700'
              }`}
            >
              Customer Support
            </button>
          )}
          {(adminRole === 'admin' || adminRole === 'master-admin') && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-4 py-3 rounded-lg transition ${
                activeTab === 'settings' ? 'bg-yellow-500 text-slate-900 font-bold' : 'text-slate-400 hover:bg-slate-700'
              }`}
            >
              Settings
            </button>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full text-left px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-700 mt-10"
          >
            Back to Dashboard
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-10">
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-white">Users Management</h1>
              <div className="flex items-center gap-4">
                <label className="text-slate-400 text-sm font-semibold">Filter by Chain:</label>
                <select
                  value={userChainFilter}
                  onChange={(e) => setUserChainFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-1 focus:outline-none focus:border-yellow-500"
                >
                  <option value="all">All Chains</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Chain {i + 1}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Chain</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Investment</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Levels (1-5)</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">BTC Allocated</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Registered Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">VIP Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4 text-white">{user.name}</td>
                      <td className="px-6 py-4 text-slate-400">{user.email}</td>
                      <td className="px-6 py-4 text-yellow-500 font-bold">Chain {user.chain}</td>
                      <td className="px-6 py-4 text-green-400 font-semibold">
                        <div>Inv: ${safeFormatUSD(user.investmentAmount)}</div>
                        <div className="text-orange-500 text-[10px]">Trade: ${safeFormatUSD(user.tradingIncome)}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        <div className="grid grid-cols-2 gap-x-4">
                          <span>B: ${safeFormatUSD(user.level0_amount)}</span>
                          <span>L1: ${safeFormatUSD(user.level1_amount)}</span>
                          <span>L2: ${safeFormatUSD(user.level2_amount)}</span>
                          <span>L3: ${safeFormatUSD(user.level3_amount)}</span>
                          <span>L4: ${safeFormatUSD(user.level4_amount)}</span>
                          <span>L5: ${safeFormatUSD(user.level5_amount)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-yellow-400 font-mono text-sm">{safeFormatBTC(user.btcAllocated)} BTC</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleVip(user.id, user.vipUnlocked)}
                          className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                            user.vipUnlocked ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {user.vipUnlocked ? 'VIP ACTIVE' : 'UNLOCK VIP'}
                        </button>
                      </td>
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
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-white">Deposits Management</h1>
              <div className="flex items-center gap-4">
                <label className="text-slate-400 text-sm font-semibold">Filter by Chain:</label>
                <select
                  value={depositChainFilter}
                  onChange={(e) => setDepositChainFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-1 focus:outline-none focus:border-yellow-500"
                >
                  <option value="all">All Chains</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Chain {i + 1}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">User</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Chain</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Level</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Transaction ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Receipt</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredDeposits.map(deposit => (
                    <tr key={deposit.id} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4 text-white">{deposit.name}</td>
                      <td className="px-6 py-4 text-yellow-500 font-bold">Chain {deposit.chain}</td>
                      <td className="px-6 py-4 text-green-400 font-semibold">${safeFormatUSD(deposit.amount)}</td>
                      <td className="px-6 py-4 text-yellow-400 font-semibold">{getLevelName(deposit.level)}</td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-sm">{deposit.transactionId}</td>
                      <td className="px-6 py-4">
                        {deposit.imagePath ? (
                          <a href={deposit.imagePath} target="_blank" rel="noreferrer" className="text-yellow-500 hover:underline text-xs">
                            View Image
                          </a>
                        ) : (
                          <span className="text-slate-600 text-xs">No Image</span>
                        )}
                      </td>
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
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-white">Withdrawals Management</h1>
              <div className="flex items-center gap-4">
                <label className="text-slate-400 text-sm font-semibold">Filter by Chain:</label>
                <select
                  value={withdrawalChainFilter}
                  onChange={(e) => setWithdrawalChainFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-1 focus:outline-none focus:border-yellow-500"
                >
                  <option value="all">All Chains</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Chain {i + 1}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">User</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Chain</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">TRC20 Address</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredWithdrawals.map(withdrawal => (
                    <tr key={withdrawal.id} className="hover:bg-slate-700/50">
                      <td className="px-6 py-4 text-white">{withdrawal.name}</td>
                      <td className="px-6 py-4 text-yellow-500 font-bold">Chain {withdrawal.chain}</td>
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
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-white">Customer Support Chat</h1>
              <div className="flex items-center gap-4">
                <label className="text-slate-400 text-sm font-semibold">Filter by Chain:</label>
                <select
                  value={chatChainFilter}
                  onChange={(e) => setChatChainFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded px-3 py-1 focus:outline-none focus:border-yellow-500"
                >
                  <option value="all">All Chains</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Chain {i + 1}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div id="chat-container" className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {filteredMessages.filter(msg => !selectedUserId || msg.userId === selectedUserId).map(msg => (
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
                          <p className="text-yellow-500 text-xs font-bold">Chain {msg.chain}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          msg.senderRole === 'user' ? 'bg-blue-900/30 text-blue-400' : 'bg-green-900/30 text-green-400'
                        }`}>
                          {msg.senderRole}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm">{msg.message}</p>
                      {msg.imagePath && (
                        <div className="mt-2">
                          <img src={msg.imagePath} alt="attachment" className="max-w-xs rounded border border-slate-600" />
                        </div>
                      )}
                      <p className="text-slate-500 text-xs mt-2">{new Date(msg.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
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
                      <div>
                        <label className="block text-slate-400 text-xs mb-1">Attach Image (JPEG):</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg"
                          onChange={(e) => setReplyImage(e.target.files?.[0] || null)}
                          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <button
                            onClick={handleSendReply}
                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-2 rounded-lg transition"
                          >
                            Send Reply
                          </button>
                          <button
                            onClick={() => setSelectedUserId(null)}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg transition"
                          >
                            Back
                          </button>
                        </div>
                        <button
                          onClick={handleEndChat}
                          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition"
                        >
                          End Chat & Delete History
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">Select a message to reply</p>
                  )}
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <h3 className="text-white font-semibold mb-4">Send Mass Message</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-slate-400 text-xs block mb-1">Target Chain:</label>
                      <select
                        value={massMessageChain}
                        onChange={(e) => setMassMessageChain(parseInt(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500"
                      >
                        {[...Array(10)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>Chain {i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <textarea
                      value={massMessage}
                      onChange={(e) => setMassMessage(e.target.value)}
                      placeholder="Type mass message for all users in chain..."
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 resize-none h-32"
                    />
                    <button
                      onClick={handleSendMassMessage}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition"
                    >
                      Send Mass Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {(activeTab === 'settings' && (adminRole === 'admin' || adminRole === 'master-admin')) && (
          <div>
            <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
            <div className="max-w-2xl bg-slate-800 border border-slate-700 rounded-lg p-8">
              {adminRole === 'master-admin' && (
                <div className="mb-8 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <label className="block text-slate-400 text-sm font-semibold mb-2">Select Chain to Manage Settings:</label>
                  <select
                    value={settingsChain}
                    onChange={(e) => {
                      const chain = parseInt(e.target.value)
                      setSettingsChain(chain)
                      fetchSettings(chain)
                    }}
                    className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-yellow-500"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>Chain {i + 1}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-slate-400 text-sm font-semibold mb-2">Current TRC20 Address (Chain {adminRole === 'master-admin' ? settingsChain : adminChain})</label>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-300 font-mono break-all">
                    {trc20Address || 'Not set'}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-sm font-semibold mb-2">Update TRC20 Address</label>
                  <input
                    type="text"
                    value={newTrc20Address}
                    onChange={(e) => setNewTrc20Address(e.target.value)}
                    placeholder="Enter new TRC20 address"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(levelRates).map(([level, rate]) => (
                    <div key={level}>
                      <label className="block text-slate-400 text-sm mb-1 uppercase">{level} Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={rate}
                        onChange={(e) => setLevelRates({ ...levelRates, [level]: parseFloat(e.target.value) })}
                        className="w-full bg-slate-700 border border-slate-600 text-white rounded px-4 py-2 focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                  ))}

                  <div className="col-span-2 mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <label className="block text-orange-500 text-sm font-bold mb-2 uppercase tracking-wider">Global VIP Profit Rate (%)</label>
                    <select
                      value={vipProfitRate}
                      onChange={(e) => setVipProfitRate(parseInt(e.target.value))}
                      className="w-full bg-slate-900 border border-orange-500/30 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-orange-500"
                    >
                      {[20, 30, 50, 75, 80].map(rate => (
                        <option key={rate} value={rate}>{rate}%</option>
                      ))}
                    </select>
                    <p className="text-slate-500 text-[10px] mt-2 uppercase font-bold">This sets the default profit rate for all VIP trades on this chain.</p>
                  </div>
                </div>

                <button
                  onClick={handleUpdateSettings}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-3 rounded-lg transition"
                >
                  Update Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-white mb-6">Edit User: {editingUser.name}</h2>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-sm font-semibold mb-2">Investment Amount ($)</label>
                  <input
                    type="number"
                    value={editingUser.investmentAmount}
                    onChange={(e) => handleInvestmentChange(parseFloat(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm font-semibold mb-2">Daily Return Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingUser.dailyReturnRate}
                    onChange={(e) => setEditingUser({ ...editingUser, dailyReturnRate: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm font-semibold mb-2">BTC Allocated</label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={editingUser.btcAllocated}
                    onChange={(e) => setEditingUser({ ...editingUser, btcAllocated: parseFloat(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm font-semibold mb-2">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="co-admin">Co-Admin</option>
                    {adminRole === 'master-admin' && <option value="master-admin">Master Admin</option>}
                  </select>
                </div>
                {adminRole === 'master-admin' && (
                  <div>
                    <label className="block text-slate-400 text-sm font-semibold mb-2">Chain</label>
                    <select
                      value={editingUser.chain}
                      onChange={(e) => setEditingUser({ ...editingUser, chain: parseInt(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>Chain {i + 1}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-orange-500 text-sm font-semibold mb-2 uppercase">VIP Profit Rate (%)</label>
                  <select
                    value={(editingUser as any).vipProfitRate || 20}
                    onChange={(e) => setEditingUser({ ...editingUser, vipProfitRate: parseInt(e.target.value) } as any)}
                    className="w-full bg-slate-900 border border-orange-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                  >
                    {[20, 30, 50, 75, 80].map(rate => (
                      <option key={rate} value={rate}>{rate}%</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-4 mt-8">
                  <button
                    type="submit"
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-3 rounded-lg transition"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
