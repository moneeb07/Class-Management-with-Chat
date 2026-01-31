import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import ContactList from "./ContactList";
import ChatWindow from "./ChatWindow";
import { useAuth } from "../../hooks/auth/useAuth";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Container */}
      {isOpen && (
        <div className="mb-4 flex h-[500px] w-[360px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <h3 className="font-semibold">
                {activeChat
                  ? `${activeChat.firstName} ${activeChat.lastName}`
                  : user.role === "teacher"
                    ? "Students"
                    : "Professors"}
              </h3>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setActiveChat(null);
              }}
              className="rounded-full p-1 transition-colors hover:bg-white/20"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden bg-white">
            {activeChat ? (
              <ChatWindow
                receiver={activeChat}
                onBack={() => setActiveChat(null)}
              />
            ) : (
              <ContactList onSelectChat={setActiveChat} />
            )}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};

export default ChatWidget;
