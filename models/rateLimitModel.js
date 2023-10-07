import mongoose from "mongoose";

const rateLimitSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const RateLimitModel = mongoose.model("rateLimit", rateLimitSchema);

export default RateLimitModel;
