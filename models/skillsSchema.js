import mongoose from "mongoose";

const skillsSchema = new mongoose.Schema({
  primarySkill: {
    type: String,
    unique: false,
    required: false,
  },
  secondarySkill: {
    type: String,
    unique: false,
    required: false,
  },
  proficiency: {
    type: Number,
    unique: false,
    required: false,
    max: 5,
  },
  role : {
    type : String,
    required : true,
  }
});

const skill = mongoose.model("Skill", skillsSchema);
export default skill;
