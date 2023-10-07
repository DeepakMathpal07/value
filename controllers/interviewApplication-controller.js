import mongoose from "mongoose";
import Job from "../models/jobSchema.js";
import User from "../models/userSchema.js";
import Notification from "../models/notificationSchema.js";
import InterviewApplication from "../models/interviewApplicationSchema.js";
import {} from "dotenv/config.js";
import fs from "fs";
import passwordHash from "password-hash";
import json2xls from "json2xls";
import v4 from "uuid/v4.js";
import axios from "axios";
import AWS from "aws-sdk";
import IndividualProfile from "../models/individualProfileSchema.js";

AWS.config.update({
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
});
let s3 = new AWS.S3();

const url = process.env.BACKEND_URL;
const frontendUrl = process.env.FRONTEND_URL;
const psycurl = process.env.PSYC_URL;
const recordingsURL=process.env.AWS_S3_RECORDINGS_URL;



// Get List of User Applications
export const getcandidatesevaluations = async (request, response) => {
  try {
    let id = request?.body?.id;
    if (!id) {
      return response.status(400).send({ message: "Job ID cannot be empty or null" });
    }

    const jobData = await job.findOne({ _id: mongoose.Types.ObjectId(id) });

    if (!jobData) {
      return response.status(400).send({ message: "Job data cannot be found for: " + id });
    }

    let temp = []; // Initialize temp as an empty array

    for (const applicant of jobData.applicants) {
      try {
        const intvapp = await InterviewApplication.findOne({
          applicant: applicant,
          job: id,
        });
        if (intvapp) {
          temp.push(intvapp);
        } else {
          temp.push({ status: "nf" });
        }
      } catch (err) {
        // Handle error if necessary
      }
    }
    return response.status(200).json({ message: "Success", data: temp });
  } catch (err) {
    return response.status(500).json({ Error: err.message });
  }
};

export const getUserInterviewApplications = async (request, response) => {
  try {
    let u_id = request.body.user_id;
    await InterviewApplication.find({ applicant: u_id })
      .sort({ updateTime: -1 })
      .exec(async function (err, res) {
        if (err) {
          return response.status(500).json({ message: "Error Occured" });
        } else {
          // let job = await Job.findOne({ _id: res.job }).select({ jobTitle: 1, hiringOrgainzation: 1, });
          // return response.status(200).json({ message: "Success", data: res, job: job });
          let data = [];
          for (let i = 0; i < res.length; i++) {
            let job = await Job.findOne(
              { _id: res[i].job },
              function (err, res1) {
                data.push({ ...res1, ...res[i] });
              }
            ).clone();
          }
          return response.status(200).json({ message: "Success", data: data });
        }
      });
  } catch (err) {
    return response.status(500).json({ Error: err.message });
  }
};

export const getXIEvaluationList = async (request, response) => {
  try {
    // console.log(request);


    let u_id = request.body.user_id;
    let jobs = [];
    let data = await InterviewApplication.aggregate([
      { $match: { interviewers: { $in: [u_id] } } },
      {
        $lookup: {
          from: "jobs",
          localField: "job",
          foreignField: "_id",
          as: "job",
        },
      },
      {
        $lookup: {
          from: "slots",
          localField: "_id",
          foreignField: "interviewId",
          as: "slots",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "applicant",
          foreignField: "_id",
          as: "applicant",
        },
      },
     
      
    ]);
console.log(data)
    response.send(data)
   
  } catch (err) {
    return response.status(500).json({ Error: err.message });
  }
};
export const getXIInterviewList = async (request, response) => {
  try {
    // console.log(request);
    let u_id = request.body.user_id;
    console.log(u_id);
    let jobs = [];
    let data = await xiInterviewApplication.aggregate([
      { $match: { interviewer: mongoose.Types.ObjectId(u_id) } },
      
      {
        $lookup: {
          from: "slots",
          localField: "slotId",
          foreignField: "_id",
          as: "slots",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "applicant",
          foreignField: "_id",
          as: "applicant",
        },
      },
     
      
    ]);
console.log(data)
    response.send(data)
   
  } catch (err) {
    return response.status(500).json({ Error: err.message });
  }
};

export const getXIEvaluatedReports = async (request, response) => {
  try {
    // console.log(request);
    let u_id = request.body.user_id;
    // console.log(typeof(u_id));

    let jobs = [];

    await InterviewApplication.find({
      interviewers: { $in: mongoose.Types.ObjectId(u_id) },
    }).exec(async function (err, res) {
      if (err) {
        // console.log(err);
        return response.status(500).json({ message: "Error Occured" });
      } else {
        await res.forEach(async (item, index) => {
          if (item.evaluations[u_id]) {
            let r = { application: item };
            await Job.findOne({ _id: item.job }, async function (err, result) {
              r.job = {
                _id: result._id,
                jobTitle: result.jobTitle,
                hiringOrganization: result.hiringOrganization,
                jobLocation: result.jobLocation,
                jobDescription: result.jobDescription,
                jobType: result.jobType,
              };

              await User.findOne(
                { _id: item.applicant },
                async function (err, result) {
                  r.applicant = {
                    _id: result._id,
                    firstName: result.firstName,
                    lastname: result.lastname,
                    contact: result.contact,
                    email: result.email,
                    username: result.username,
                  };
                }
              ).clone();
            }).clone();

            jobs.push(r);
            // console.log(jobs);
            //   }
          }
        });

        if (jobs) {
          setTimeout(() => {
            return response.status(200).json({ jobs });
          }, 2000);
        }
      }
    });
  } catch (err) {
    return response.status(500).json({ Error: err.message });
  }
};

export const sendFeedBackInvitation = async(request,response) =>{
  try {
    let id = request.body.id;
     await InterviewApplication.updateOne({_id : id},{$set:{hasReport : true }}).then((result)=>{
      if (result) {
        return response.status(200).json({ message: 'Report successfully shared', success : true });
      }
    })
  } catch (error) {
    return response.status(500).json({ Error: error.message });
  }
};

export const  getFeedBackInvitation = async(request,response) =>{
  try {
    let id = request.body.id;
    const application = await InterviewApplication.findOne({_id : id});
      if (application) {
        const hasReport = application.hasReport;
        return response.status(200).json({ hasReport: hasReport });
      }
      else {
        return response.status(404).json({message: 'Application not found'});
      }
  } catch (error) {
    return response.status(500).json({ Error: error.message });
  }
};

export const getInterviewApplication = async (request, response) => {
  try {
    let id = request?.body?.id;
    InterviewApplication.findOne({ _id: mongoose.Types.ObjectId(id) }).exec(async function (
      err,
      res
    ) {
      if (err) {
        console.log(err);
        return response.status(500).json({ message: "Error Occured" });
      } else {
        let meetingID = res?.meetingID;
        let data = { application: res };
        await Job.findOne({ _id: res.job }, function (err, result) {
          data.job = {
            _id: result._id,
            jobTitle: result.jobTitle,
            hiringOrganization: result.hiringOrganization,
            location: result.location,
            Description: result.jobDescription,
            jobType: result.jobType,
            salary: result.salary,
            questions: result.questions,
            skills: result.skills
          };
        }).clone();
       
        //while (data.applicant == undefined) {
          const user1 = await User.findById({ _id: res.applicant }).exec();
          if (user1) {
            if (user1?.linkedinurl) {
                const profile = await IndividualProfile.find({ profileURL: user1?.linkedinurl }).exec();
                data.applicant = {
                  _id: profile[0]._id,
                  firstName: user1.firstName,
                  lastname: user1.lastname,
                  contact: user1.contact,
                  email: user1.email,
                  username: user1.username,
                  profileImg: user1.profileImg,
                  linkedinurlkey: user1.linkedinurlkey,
                  skills: user1.tools,
                  psycdata: profile[0]
                };
            } 
          }
          // await User.findOne({ _id: res.applicant }, async function (err, result) {
          //   let psycdetails;
          //   // console.log("result.linkedinurlkey");
          //   // console.log(result.linkedinurlkey);
          //   if(result.linkedinurlkey!=undefined){
          //     try{
          //       psycdetails = await axios.get(psycurl+"/"+result.linkedinurlkey);
          //     }catch(err){
          //         console.log(err);
          //         psycdetails = "";
          //     }
          //   }else{
          //     psycdetails="";
          //   }
          //   //console.log("psy ",psycdetails)
          //   data.applicant = {
          //     _id: result._id,
          //     firstName: result.firstName,
          //     lastname: result.lastname,
          //     contact: result.contact,
          //     email: result.email,
          //     username: result.username,
          //     profileImg: result.profileImg,
          //     linkedinurlkey: result.linkedinurlkey,
          //     skills: result.tools,
          //     psycdata: psycdetails?.data
          //   };
          // }).clone();
          // console.log(data);

        //}
        // Get the recording urls from storage
        let params ={
          Bucket: process.env.AWS_S3_BUCKET_NAME, /* required */
          Prefix:process.env.AWS_S3_PROFILE_RECORDINGS_BUCKET_FOLDER+"/"+meetingID
        }
        let savedURLs = [];
        s3.listObjectsV2(params, function(err, values) {
          if (err){ 
            console.log(err);
          } // an error occurred
          else{
            values?.Contents?.map((value)=>{
              savedURLs.push({
                url:recordingsURL+"/"+value.Key,
                size:value.Size
              });
            });
          }    
          return response.status(200).json({ message: "Success", recordingsURL:savedURLs,data: data});
        });
      }
    });
  } catch (error) {
    return response.status(500).json(error.message);
  }
};
export const getCandidateEvaluation = async (request, response) => {
  try {
    let id = request.body.id;
    await InterviewApplication.findOne({ applicant: id }).exec(async function (
      err,
      res
    ) {
      if (err) {
        return response.status(500).json({ message: "Error Occured" });
      } else {
        // let data = { application: res };

        let j = res.evaluations;
        let data = [];
        if (j) {
          // console.log(Object.entries(j));

          let eva = Object.entries(j);
          for (var i = 0; i < eva.length; i++) {
            await User.findOne({ _id: eva[i][0] }, function (err, result) {
              let applicant = {
                _id: result._id,
                firstName: result.firstName,
                lastname: result.lastname,
                contact: result.contact,
                email: result.email,
                username: result.username,
                evaluations: eva[i] ? eva[i][1] : null,
                job: res._id,
              };
              // console.log(applicant);
              data.push(applicant);
            }).clone();
          }
        }

        return response.status(200).json({ message: "Success", data: data });
      }
    });
  } catch (error) {
    return response.status(500).json(error.message);
  }
};


export const updateEvalSkills = async  (request, response) => {
	try {
		let skills= request?.body?.updates?.skills;
		let xi_id = request?.body?.user_id;
    let evaluations = new Map ([
      [xi_id,{skills:skills}]
    ]);
    await InterviewApplication.updateOne(
      { _id: request.body.application_id },
      {$set:{ evaluations:evaluations}}
    );
    return response.status(200).json({ message: "Success"});
  }catch(err){
    console.log(err);
  }
}


export const updateCandidateFeedback = async (request,response) =>{
  try{
		let updates = request.body.updates;
		let xi_id = request.body.user_id;
    let appID = request.body.application_id;
    let r = {};
    if (updates.candidate_rating) {
      r.candidate_rating = updates.candidate_rating;
    }
    if (updates.feedback) {
      r.feedback = updates.feedback;
    }
    await InterviewApplication.updateOne(
      { _id: request.body.application_id },
      {$set:{ candidateFeedback:r}}
    );
    return response.status(200).json({ message: "Success"});
  }catch(err){
    console.log(err);
    return response.status(500).json({ message: "Error"});
  }

}

export const updateEvaluation = async (request, response) => {
	try {
		let updates = request.body.updates;
		let xi_id = request.body.user_id;
		await InterviewApplication.findOne(
			{ _id: request.body.application_id },
			async function (err, res) {
        let r = {};
        if (updates.feedback) {
          r.feedback = updates.feedback;
        }else{
          r.feedback = "";
        }
        if (updates.positives) {
          r.positives = updates.positives;
        }else{
          r.positives = "";
        }
        
        if (updates.lowlights) {
          r.lowlights = updates.lowlights;
        }else{
          r.lowlights = "";
        }
        if (updates.concern) {
          r.concern = updates.concern;
        }else{
          r.concern = "";
        }
        if (updates.status) {
          r.status = updates.status;
        }else{
          r.status = "";
        }
        if (updates.questions) {
          r.questions = updates.questions;
        }else{
          r.questions = "";
        }
        if (updates.skills) {
          r.skills = updates.skills;
        }else if(res.evaluations[xi_id].skills){
          r.skills = res.evaluations[xi_id].skills;
        }else{
          r.skills ="";
        }

        if (updates.hasHeadPhone) {
          r.earTest = updates.hasHeadPhone;
        }else{
          r.earTest = "";
        }
        if (updates.imageMatched) {
          r.faceTest = updates.imageMatched;
        }else{
          r.faceTest = "";
        }
        if (updates.facedCamera) {
          r.facedCamera = updates.facedCamera;
        }else{
          r.facedCamera = "";
        }
        if (updates.othersExistsInroom) {
          r.personTest = updates.othersExistsInroom;
        }else{
          r.personTest = "";
        }
        if (updates.demeanorOfCandidate) {
          r.demeanorOfCandidate = updates.demeanorOfCandidate;
        }else{
          r.demeanorOfCandidate = "";
        }

        if (updates.anotherPerson) {
          r.anotherPerson = updates.anotherPerson;
        }else{
          r.anotherPerson = "";
        }
        let evaluations = new Map ([
          [xi_id,r]
        ]);
        await InterviewApplication.updateOne(
        { _id: request.body.application_id },
        {$set:{ evaluations:evaluations, interviewState:4}}
       );
        let tempEv = res.evaluations;
        tempEv[xi_id] = r;
        let tempSkills = [];
        User.findById(res.applicant, async function (err, user) {
          tempSkills = user.tools;
          r.skills.map((item) => {
            let status = false;
            user.tools.map((skills, index) => {		
              if (skills._id == item._id) {
                user.tools[index].lastEvaluated = item.proficiency;
                status = true;
              }
            });

            if (status === false) {
              user.tools.push(item);
            }
          });

          user.markModified("tools");
          await user.save();
        });
        return response.status(200).json({ message: "Success", evaluations: r });
			}
		).clone();
	} catch (error) {
		response.status(500).json({ message: error.message });
	}
};


export const updateInterviewApplication = async (req, res) => {
  try {
    let id = req.query.id;
    let data = await InterviewApplication.findOneAndUpdate(
      { _id: mongoose.Types.ObjectId(id) },
      req.body
    );
    if (data) {
      res.send().status(200);
    } else {
      res.send({ data: "Updatation failed" }).status(400);
    }
  } catch (err) {
    console.log("error in updateInterviewApplication", err);
    res.send(err).status(400);
  }
};
export const updateXIInterviewApplication = async (req, res) => {
  try {
    let id = req.query.id;

    let data = await xiInterviewApplication.findOneAndUpdate(
      { _id: mongoose.Types.ObjectId(id) },
      req.body
    );
    if (data) {
      res.send().status(200);
    } else {
      res.send({ data: "Updatation failed" }).status(400);
    }
  } catch (err) {
    console.log("error in updateInterviewApplication", err);
    res.send(err).status(400);
  }
};

export const XIPerformance = async (req, res) => {
  try {
    let id = req.query.id;
console.log(id)
    let data = await InterviewApplication.find(
      { interviewers: { $in: id }, status:"Interviewed" ,rating:{$gt :0} },
     
    ).clone()
    let xidata = await xiInterviewApplication.find(
      { interviewer:  mongoose.Types.ObjectId(id), status:"Interviewed",rating:{$gt :0} },
     
    ).clone()

  let merge =[...data , ...xidata]
  merge.sort(function(a, b){return  b.rating - a.rating });

let rating =0;
let count = merge.length;
  if(merge.length >=40){
    for(let i=0 ; i<40;i++){
      rating =rating + merge[i].rating ;
    }
  }else{
    for(let i=0 ; i<merge.length;i++){
      rating =rating + merge[i].rating ;
    }
    }
    rating  = rating*2  + count*10;
let level =0;
    await Level.find({min: { $lte:count} , max:{$gt :count}},  async(err, res) =>{
      console.log(res)
     level = res[0].level;
      
  }).clone()

  let multiplier =0 ;
    await PerformanceMultiplier.find({min: { $lte:rating} , max:{$gt :rating}},  async(err, res) =>{
      console.log(res)
       multiplier = res[0].multiplier;
       let user1 = await xi_info.findOneAndUpdate(
        { candidate_id: mongoose.Types.ObjectId(id) },
        {rating : rating , count : merge.length , multiplier: multiplier , level:level},
        
    
    );
  }).clone()

    if (data) {
      res.send().status(200);
    } else {
      res.send({ data: "Updatation failed" }).status(400);
    }
  } catch (err) {
    console.log("error in updateInterviewApplication", err);
    res.send(err).status(400);
  }
};

import job from "../models/jobSchema.js";
import interviewApplication from "../models/interviewApplicationSchema.js";
import xiInterviewApplication from "../models/xiInterviewApplication.js";
import Level from "../models/levelSchema.js";
import PerformanceMultiplier from "../models/performanceMultiplierSchema.js";
import xi_info from "../models/xi_infoSchema.js";

var ObjectId = mongoose.Types.ObjectId;

export const interviewApplicationStatusChange = async (req, res) => {
  try {
    if (
      (req.body.status === "On Hold" ||
        req.body.status === "Assigned" ||
        req.body.status === "Rejected") &&
      !req.body.isCompany
    ) {
      return res.status(400).send("Only company can update given status");
    }

    if (req.body.status === "Assigned") {
      const data = await interviewApplication.aggregate([
        { $match: { _id: ObjectId(req.body._id) } },
        {
          $lookup: {
            from: "jobs",
            localField: "job",
            foreignField: "_id",
            as: "jobs",
          },
        },
      ]);
      console.log(data[0].jobs[0].status);

      if (
        data[0].jobs[0].status === "Closed" ||
        data[0].jobs[0].status === "Archieved" ||
        data[0].jobs[0].status === "Not Accepting"
      ) {
        return res
          .status(400)
          .send("This job is no longer accepting applications");
      }else{
        console.log("Checking flow");
      }
    }

    const data = await interviewApplication.findByIdAndUpdate(
      { _id: ObjectId(req.body._id) },
      { $set: { status: req.body.status } },
      { new: true }
    );
    res.status(200).send("updated successfully");
  } catch (err) {
    res.status(400).send("something went wrong");
  }
};
// export const updateSkills = async (request,response)=>{
//   try {
//   console.log(request.body);
//     let user1 = await InterviewApplication.findOne(
//       { applicant: request.body.user_id },async function(err,user){

//       user.tools = request.body.updates.tools;
//         await user.save();
//         console.log(user);
//       }
//     );
//     response.status(200).json({user: user1});
//   } catch (error) {
//     console.log(error);
//   }
// }

export const pushQuestion = async(req,res)=>{
  try {
    delete req.body.currentQuestion?.__v;
    let questionObj = {
      codequestion : req.body.currentQuestion?.question
    }
    let check = await interviewApplication.findOne({_id :req.body.interviewID })
    await interviewApplication.updateOne(
      { _id: req.body.interviewID },
      { $set: { livestats: questionObj } }
    ).then((result)=>{
      if (result) {
        res.send().status(200);
      }
    })
  } catch (error) {
    console.log('Error while push question : ', error)
  }
}