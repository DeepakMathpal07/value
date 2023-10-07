import mongoose from "mongoose";
import User from "../models/userSchema.js";
import IndividualProfile from "../models/individualProfileSchema.js";
import axios from "axios";

const psycurl = process.env.PSYC_URL;

export const createPsychProfile =async(request,response) =>{
    let query = request?.query?.linkedInProfileUrl;
    if(query){
        let linkedinurlkey = await axios.post(
            psycurl + "?linkedInProfileUrl=" + query    ).catch((error)=>{
                console.log(error);
            });
        return response.send({linkedinurlkey:linkedinurlkey,}).status(200);
    }
  }

export const getPsychDetails = async (request, response) => {
    let id = request?.body?.id;
    let psycdetails ="";
    if(id){
        const user = await User.findById(id).exec();
        if (user) {
            if (user?.linkedinurl) {
                const profile = await IndividualProfile.find({ profileURL: user?.linkedinurl }).exec();
                return response.status(200).json({ message: "Success", data: profile[0] });
            } else {
                return response.status(400).json({ message: "User ID: " + id + " linkedin url is empty or null" });
            }
        } else {
            console.log("User ID:", id, "is invalid");
            return response.status(400).json({ message: "User ID: " + id + " is invalid" });
        }
    }else{
        return response.status(400).json({ message: "Something went wrong"});
    }
};


// Company Psych Controller

export const getAllCompanyPsych = async (request, response) => {
    try {
        let companyPsych = await axios.get("http://dev.valuematrix.ai/platform/api/psychometric/tribe/peers/")
        response.status(200).json({ message: "Success", data: companyPsych.data });
    } catch (error) {
        response.status(500).json({ message: error.message });
    }
}

export const getCompanyPsych = async (request, response) => {
    try {
        let query = request?.query?.id;
        console.log("id", request.query.id);
        // let query = request?.query?.id;
        let companyPsych = await axios.get("http://dev.valuematrix.ai/platform/api/psychometric/tribe/peers/"  + query)
        response.status(200).json({ message: "Success", data: companyPsych.data });
    } catch (error) {
        response.status(500).json({ message: error.message });
    }
}