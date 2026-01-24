// models/base/BaseModel.js - Abstract base class
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

class BaseModel {
  static addCommonFields(schema) {
    schema.add({
      uuid: {
        type: String,
        default: uuidv4,
        unique: true,
        immutable: true,
      },
      isDeleted: {
        type: Boolean,
        default: false,
        index: true,
      },
      deletedAt: {
        type: Date,
        default: null,
      },
      version: {
        type: Number,
        default: 1,
      },
    });

    // Add soft delete query middleware
    schema.pre(/^find/, function () {
      if (!this.getOptions().includeDeleted) {
        this.where({ isDeleted: { $ne: true } });
      }
    });

    // Add soft delete methods
    schema.methods.softDelete = function () {
      this.isDeleted = true;
      this.deletedAt = new Date();
      return this.save();
    };

    schema.methods.restore = function () {
      this.isDeleted = false;
      this.deletedAt = null;
      return this.save();
    };

    // Optimistic concurrency control
    schema.pre("save", function () {
      if (!this.isNew) {
        this.version += 1;
      }
    });
  }

  static addAuditFields(schema) {
    schema.add({
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    });
  }
}

module.exports = BaseModel;
