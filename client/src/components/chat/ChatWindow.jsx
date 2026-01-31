import { useEffect, useState, useRef } from "react";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { useSocket } from "../../context/SocketContext";
import { api } from "../../api/axiosConfig";
import { useAuth } from "../../hooks/auth/useAuth";

const ChatWindow = ({ receiver, onBack }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Initialize conversation
  useEffect(() => {
    const initChat = async () => {
      try {
        setLoading(true);
        // Get or create conversation
        const { data } = await api.post("/chat/conversation", {
          receiverId: receiver._id,
        });
        const conv = data.data;
        setConversationId(conv._id);

        // Load message history
        const msgRes = await api.get(`/chat/${conv._id}/messages`);
        setMessages(msgRes.data.data);

        // Join socket room
        if (socket) {
          socket.emit("join_conversation", conv._id);
        }
      } catch (err) {
        console.error("Failed to load chat:", err);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [receiver._id, socket]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (newMessage) => {
      if (newMessage.conversationId === conversationId) {
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    socket.on("receive_message", handleMessage);
    return () => socket.off("receive_message", handleMessage);
  }, [socket, conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSend = () => {
    if (!inputText.trim() || !socket || !conversationId) return;

    socket.emit("send_message", {
      conversationId,
      senderId: user._id,
      content: inputText,
    });

    setInputText("");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-gray-50 p-3">
        <button
          onClick={onBack}
          className="rounded-full p-1 transition-colors hover:bg-gray-200"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-600">
          {receiver.firstName?.[0]}
          {receiver.lastName?.[0]}
        </div>
        <div>
          <h4 className="font-medium text-gray-900">
            {receiver.firstName} {receiver.lastName}
          </h4>
          <p className="text-xs text-gray-500">{receiver.courseContext}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe =
              msg.sender._id === user._id || msg.sender === user._id;
            return (
              <div
                key={index}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isMe
                      ? "rounded-br-sm bg-emerald-600 text-white"
                      : "rounded-bl-sm bg-gray-100 text-gray-800"
                  }`}
                >
                  <p>{msg.content}</p>
                  <span
                    className={`mt-1 block text-[10px] ${
                      isMe ? "text-emerald-100" : "text-gray-400"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-gray-50 p-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
