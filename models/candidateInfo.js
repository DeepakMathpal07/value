import mongoose from "mongoose";
import user from "./userSchema.js";

const candidateSchema = new mongoose.Schema({
  candidate_id: {
    type: String,
    default: 0,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
  },
  phoneNo: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  inviteDetails:{
    type:Object
  },
  isDeleted:{type:Boolean,default:false},
  deletedDate:{type:String,default:null},
  category:{type:String}
});

const candidateInfo = new mongoose.model("CandidateInfo", candidateSchema);
export default candidateInfo;
