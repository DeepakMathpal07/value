import mongoose from "mongoose";

const xiPanelsSchema = new mongoose.Schema({
  panelName: {
    type: String,
    required: true,
  },
  skills: {
    type: Array, 
    required: true,
  },
  xiIds: {
    type: Array,
    required: true,
    // unique:true,
  },
  permissions: {
    type: Array,
    required: true,
 },
 isDeleted:{
   type:Boolean,
   default:false,
 }
 
});

const XIPanels = mongoose.model(
  "xiPanelsSchema",
  xiPanelsSchema
);
export default XIPanels;