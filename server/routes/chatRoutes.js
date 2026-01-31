/* server/routes/chatRoutes.js */
const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { authenticate } = require("../middleware/auth");

// All routes require login
router.use(authenticate);
router.post("/conversation", chatController.getOrCreateConversation);
router.get("/conversations", chatController.getMyConversations);
router.get("/:conversationId/messages", chatController.getMessages);
router.get("/available-users", chatController.getAvailableUsers);
module.exports = router;