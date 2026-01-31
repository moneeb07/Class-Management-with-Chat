import { useQuery } from "@tanstack/react-query";
import { User, BookOpen } from "lucide-react";
import { api } from "../../api/axiosConfig";

const ContactList = ({ onSelectChat }) => {
  const { data: users, isLoading } = useQuery({
    queryKey: ["chat", "available-users"],
    queryFn: async () => {
      const response = await api.get("/chat/available-users");
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-gray-500">
        <div className="animate-pulse">Loading contacts...</div>
      </div>
    );
  }
 
  if (!users || users.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-gray-500">
        <User className="mb-2 h-10 w-10 text-gray-300" />
        <p className="font-medium">No contacts found</p>
        <p className="text-xs">Enroll in a class to start chatting!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-gray-100 overflow-y-auto">
      {users.map((user) => (
        <button
          key={user._id}
          onClick={() => onSelectChat(user)}
          className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-emerald-50"
        >
          {/* Avatar */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-600">
            {user.firstName?.[0]}
            {user.lastName?.[0]}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="truncate font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </h4>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <BookOpen size={12} />
              <span className="truncate">{user.courseContext || "Class Member"}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ContactList;
