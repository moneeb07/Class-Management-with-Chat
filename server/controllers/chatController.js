/* server/controllers/chatController.js */
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const Class = require("../models/Class");
const ClassEnrollment = require("../models/ClassEnrollment");
// Get or Create a conversation with a specific user
exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;
    // Check if conversation exists
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }
    // Populate data for frontend
    await conversation.populate("participants", "firstName lastName email role");
    await conversation.populate("lastMessage");
    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};
// Get all conversations for current user
exports.getMyConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "firstName lastName email role")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });
    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};
// Get messages for a specific conversation
exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId })
      .populate("sender", "firstName lastName")
      .sort({ createdAt: 1 }); // Oldest first
    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};
// Get available users (Teachers for Students, Enrolled Students for Teachers)
exports.getAvailableUsers = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    let users = [];
    if (role === "student") {
      // Find classes student is enrolled in
      const enrollments = await ClassEnrollment.find({ student: userId }).populate({
        path: "class",
        populate: { path: "teacher", select: "firstName lastName email" },
      });
      // Extract teachers
      const teacherMap = new Map();
      enrollments.forEach((enrollment) => {
        const teacher = enrollment.class.teacher;
        const className = enrollment.class.className;
        if (teacher) {
            // Save unique teacher + one of their classes as context
            if(!teacherMap.has(teacher._id.toString())) {
                 teacherMap.set(teacher._id.toString(), {
                    _id: teacher._id,
                    firstName: teacher.firstName,
                    lastName: teacher.lastName,
                    role: "teacher",
                    courseContext: className
                 });
            }
        }
      });
      users = Array.from(teacherMap.values());
    } else if (role === "teacher") {
      // Find classes taught by teacher
      const classes = await Class.find({ teacher: userId });
      const classIds = classes.map((c) => c._id);
      // Find students in those classes
      const enrollments = await ClassEnrollment.find({
        class: { $in: classIds },
      }).populate("student", "firstName lastName email");
       // Extract students
       const studentMap = new Map();
       enrollments.forEach((enrollment) => {
         const student = enrollment.student;
         const className = enrollment.class ? enrollment.class.className : "Your Class"; // Need to populate class if we want name, but optimized query above didn't
         
         if (student) {
             if(!studentMap.has(student._id.toString())) {
                 studentMap.set(student._id.toString(), {
                     _id: student._id,
                     firstName: student.firstName,
                     lastName: student.lastName,
                     role: "student",
                     courseContext: "Your Enrolled Student"
                 });
             }
         }
       });
       users = Array.from(studentMap.values());
    }
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};