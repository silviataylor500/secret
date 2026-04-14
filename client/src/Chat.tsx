import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

interface Message {
  id: string
  userId: string
  message: string
  senderRole: 'user' | 'co-admin'
  createdAt: string
}

export default function Chat() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetchMessages()
    // Fetch messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [navigate])

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/chat/messages', {
        headers: { Authorization: `Bearer ${token}` },
      })
      setMessages(response.data)
      setLoading(false)
    } catch (err: any) {
      console.error('Failed to fetch messages:', err)
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim()) {
      setError('Message cannot be empty')
      return
    }

    setSending(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/chat/send', {
        message: newMessage,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setNewMessage('')
      fetchMessages()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navbar */}
      <nav className="bg-slate-900 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-xs">₿</span>
              </div>
              <span className="text-xl font-bold text-white">BINANCE</span>
            </div>
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden flex flex-col h-[600px]">
          {/* Header */}
          <div className="bg-slate-700 px-6 py-4 border-b border-slate-600">
            <h1 className="text-xl font-bold text-white">Customer Support Chat</h1>
            <p className="text-slate-400 text-sm">Chat with our co-admin team</p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-400 text-center">
                  No messages yet. Start a conversation with our support team!
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderRole === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.senderRole === 'user'
                        ? 'bg-yellow-500 text-slate-900'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className="bg-slate-700 border-t border-slate-600 p-4">
            {error && (
              <p className="text-red-400 text-xs mb-2">{error}</p>
            )}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-700 text-slate-900 font-bold rounded-lg transition"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
