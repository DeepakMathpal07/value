import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  log: {
    type: Object,
    required: true,
 }
});

const Logs = mongoose.model("logs",logSchema);
export default Logs;