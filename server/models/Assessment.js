const mongoose = require("mongoose");

const AssessmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    projectName: { type: String, required: true },
    githubUrl: { type: String, required: true },
    summary: { type: String },
    skills: [
      {
        skill: { type: String, required: true },
        score: { type: Number, required: true },
        category: { type: String, required: true },
        note: { type: String }
      }
    ],
    weakest: {
      skill: { type: String },
      score: { type: Number },
      reason: { type: String }
    },
    challengeSolved: { type: Boolean, default: false },
    reassessedScore: { type: Number }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assessment", AssessmentSchema);
