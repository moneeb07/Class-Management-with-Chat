import { createContext, useContext, useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "../hooks/auth/useAuth";

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const socketCreated = useRef(false); // Track if socket exists

  useEffect(() => {
    if (isAuthenticated && user && !socketCreated.current) {
      socketCreated.current = true;
      const newSocket = io("http://localhost:5000");
      setSocket(newSocket);

      return () => {
        newSocket.close();
        socketCreated.current = false;
      };
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};