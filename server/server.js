/* server/server.js */
require("dotenv").config();
const http = require("http"); // New Import
const { Server } = require("socket.io"); // New Import
const app = require("./app");
const logger = require("./utils/logger");
const Message = require("./models/Message"); // Import Message model
const Conversation = require("./models/Conversation"); // Import Conversation model
const PORT = process.env.PORT || 5000;
// 1. Create HTTP server wrap around Express
const server = http.createServer(app);
// 2. Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // URL of your Client/React app
    methods: ["GET", "POST"],
  },
});
// 3. Socket Logic
io.on("connection", (socket) => {
  logger.info(`User Connected: ${socket.id}`);
  // Join a conversation room
  socket.on("join_conversation", (conversationId) => {
    socket.join(conversationId);
    logger.info(`User joined room: ${conversationId}`);
  });
  // Send Message Event
  socket.on("send_message", async (data) => {
    // data = { conversationId, senderId, content }
    try {
        // Save to DB
        const newMessage = await Message.create({
            conversationId: data.conversationId,
            sender: data.senderId,
            content: data.content
        });
        // Update Conversation Last Message
        await Conversation.findByIdAndUpdate(data.conversationId, {
            lastMessage: newMessage._id,
            updatedAt: Date.now()
        });
        
        // Populate sender info for the frontend
        await newMessage.populate('sender', 'firstName lastName');
        // Emit to everyone in that room (including sender)
        io.to(data.conversationId).emit("receive_message", newMessage);
    } catch (err) {
        logger.error("Socket Message Error:", err);
    }
  });
  socket.on("disconnect", () => {
    logger.info("User Disconnected", socket.id);
  });
});
// 4. Start Server (Note: use 'server.listen', not 'app.listen')
server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});