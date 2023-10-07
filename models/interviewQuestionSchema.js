import mongoose from "mongoose";
import user from "./userSchema.js";

const interviewQuestionSchema = new mongoose.Schema({
    question: {
        type:String,
        required:true
    },
    instructions: {
        type:String,
        required:false
    },
    hints: {
        type:String,
        required:false
    },
    wrench: {
        type:Array,
        required:false
    },
    solution: {
        type:Array,
        required:false
    },
    input1: {
        type:String,
        required:false
    },
    input2: {
        type:String,
        required:false
    },
    input3: {
        type:String,
        required:false
    },
    input4: {
        type:String,
        required:false
    },
    input5: {
        type:String,
        required:false
    },
    output1: {
        type:String,
        required:false
    },
    output2: {
        type:String,
        required:false
    },
    output3: {
        type:String,
        required:false
    },
    output4: {
        type:String,
        required:false
    },
    output5: {
        type:String,
        required:false
    },
    topic: {
        type:String,
        required:false
    },
    type: {
        type:String,
        required:false
    },

    difficulty: {
        type:String,
        required:false
    },
    description: {
        type:String,
        required:false
    },
    skill: {
        type:String,
        required:false
    },
});

const interviewQuestion = mongoose.model("interviewQuestion", interviewQuestionSchema);
export default interviewQuestion;