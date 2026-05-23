import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    userId: String,
    action: String,
    data: Object
  },
  { timestamps: true }
);

export default mongoose.model("History", historySchema);