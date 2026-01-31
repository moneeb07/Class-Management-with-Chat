/* server/models/Conversation.js */
const mongoose = require("mongoose");
const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);
// Index for faster lookups based on participants
conversationSchema.index({ participants: 1 });
module.exports = mongoose.model("Conversation", conversationSchema);