import React from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import PropTypes from "prop-types";
import { SocketProvider } from "../../../context/SocketContext";
import ChatWidget from "../../chat/ChatWidget";

export default function Layout({ children }) {
  return (
    <SocketProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
        <ChatWidget />
      </div>
    </SocketProvider>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};
