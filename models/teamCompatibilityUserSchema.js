import mongoose from "mongoose";

const teamCompatibilityUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  linkedinUrlkey: { type: String },
  role: { type: String, required: true },
  companyId: { type: String, required: true },
  jobId: { type: String, required: true },
});

const compatibilityUser = mongoose.model(
  "compatibilityUser",
  teamCompatibilityUserSchema
);
export default compatibilityUser;