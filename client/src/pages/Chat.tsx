import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Logo from '../components/Logo'

interface Message {
  id: string
  userId: string
  message: string
  imagePath?: string
  senderRole: 'user' | 'co-admin'
  createdAt: string
}

export default function Chat() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState<string>('')
  const [newImage, setNewImage] = useState<File | null>(null)
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
    
    if (!newMessage.trim() && !newImage) {
      setError('Message or image is required')
      return
    }

    setSending(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('message', newMessage)
      if (newImage) {
        formData.append('image', newImage)
      }

      await axios.post('/api/chat/send', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      })
      setNewMessage('')
      setNewImage(null)
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
                    className={`max-w-lg px-4 py-2 rounded-lg ${
                      msg.senderRole === 'user'
                        ? 'bg-yellow-500 text-slate-900'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    {msg.message && <p className="text-sm">{msg.message}</p>}
                    {msg.imagePath && (
                      <div className="mt-2">
                        <a href={msg.imagePath} target="_blank" rel="noreferrer" className="inline-block">
                          <img src={msg.imagePath} alt="attachment" className="max-w-sm max-h-64 rounded border border-slate-400 hover:border-yellow-300 transition" />
                        </a>
                      </div>
                    )}
                    {!msg.message && !msg.imagePath && <p className="text-xs italic opacity-70">No content</p>}
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
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500"
                />
                <button
                  type="submit"
                  disabled={sending || (!newMessage.trim() && !newImage)}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-700 text-slate-900 font-bold rounded-lg transition"
                >
                  Send
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-slate-400 text-xs">Attach JPEG:</label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg"
                  onChange={(e) => setNewImage(e.target.files?.[0] || null)}
                  className="text-xs text-slate-400"
                />
                {newImage && <span className="text-xs text-green-400">{newImage.name}</span>}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
