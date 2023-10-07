import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
    type : {type:String,required: true},
    statement : {type:String},
    instructions : [],
    hints: [],
    variations:[],
    wrenches:{type:String},
    sollutions:[],
    test_cases:[],
    skill:{type:String},
    difficulty:{type:String},
    topic:{type:String},
    description:{type:String},
    question:{type:String},
    options:[],
    answer:{type:String},
    test_cases:[],
    counter: { type: Number, default: 0 }
})

const Questions = mongoose.model('Questions',questionSchema)
export default Questions