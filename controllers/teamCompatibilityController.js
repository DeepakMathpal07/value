
import mongoose from "mongoose";
import { } from "dotenv/config.js";
import Job from "../models/jobSchema.js";
import User from "../models/userSchema.js";
import InterviewApplication from "../models/interviewApplicationSchema.js";
import { ObjectId } from "bson";
import axios from "axios";
import {  getCompanyPsych } from "./psychController.js"
import user from "../models/userSchema.js";
import candidateInfo from "../models/candidateInfo.js";
import compatibilityUser from "../models/teamCompatibilityUserSchema.js";
const psycurl = process.env.PSYC_URL;
const companyPsyUrl = process.env.COMPANY_PSYC_URL
const compatibilityUrl = process.env.TEAMCOMPATIBILITY_API;


// Get candidates/applicants for a particular job

export const getCandidatesDetailsForJob = async (req, res) => {
    try {
        const candidatePsychId = req.body.candidatePsychId;
        // req.body.id = candidatePsychId;
        const companyPsychId = req.body.companyPsychId;
        const jobId = req.body.jobId;
        if(jobId){
            await InterviewApplication.aggregate(
                [
                    {
                      $match: {
                        'job': ObjectId(jobId)
                    }
                    }, {
                      '$lookup': {
                        'from': 'users',
                        'localField': 'applicant',
                        'foreignField': '_id',
                        'as': 'users'
                      }
                    }, {
                      '$unwind': {
                        'path': '$users'
                      }
                    }, 
                    {
                      "$lookup" : {
                        "from" : "jobs",
                        "localField" : "job",
                        "foreignField" : "_id",
                        "as" : "jobs"
                      }
                    },
                    {
                      '$unwind': {
                        'path': '$jobs'
                      } 
                    },
                    {
                      '$project': {
                        "users" : 1,
                        'evaluations': 1,
                        'interviewState': 1,
                        "jobs" : 1,
                      }
                    }
                ]
            ).then(async (values) => {
              // console.log("values", values);
                // User Details
                const userId = values[0].users._id;
                // req.id = userId;
                const firstName = values[0].users.firstName;
                const lastName = values[0].users.lastname;
                const linkedinURLKEY = values[0].users.linkedinurlkey;
                const job = values[0].jobs;
                
                // Technical Details
                const candidateSkills = values[0].users.tools;
                // console.log("candidateSkills" , candidateSkills)
                const companySkills = job.skills
                // console.log("companySkills" , companySkills)
                let ratioCandidateToCompany
                for(let i=0; i<companySkills.length; i++){
                  if(candidateSkills[i].role === companySkills[i].role){
                    // console.log("c" , candidateSkills[i].role.length , "c2" , companySkills[i].role.length);
                    ratioCandidateToCompany = candidateSkills[i].rating / companySkills[i].rating
                  }
                  // Take average of the ratio
                  // ratioCandidateToCompany = ratioCandidateToCompany*2.5
                }
                ratioCandidateToCompany = ratioCandidateToCompany / 10
                // console.log(`ratioCandidateToCompany` , ratioCandidateToCompany);
                ratioCandidateToCompany = ratioCandidateToCompany*25
                // console.log(`ratioCandidateToCompany` , ratioCandidateToCompany);
                // console.log("companySkills" , companySkills)

                // Put userId in req.body
                req.body.id = userId;

                // Candidate and Company Psych Details
                // let candidatePsych = await getPsychDetails(req , res);
                // console.log("candidatePsych", candidatePsych.data);
                // let companyPsych = await getCompanyPsych(req, res)
                // console.log("companyPsych", companyPsych.data);

                // Evaluation Details
                let evaluations = values[0].evaluations
                let stars = 0
                for (const evaluationId in evaluations) {
                    if (evaluations.hasOwnProperty(evaluationId)) {
                      const evaluation = evaluations[evaluationId];
                      const status = evaluation.status;
                      if(values[0].interviewState === 4 && status === "Recommended"){
                        stars = 2.5
                    }
                        else if(values[0].interviewState === 4 && status === "Not Recommended"){
                            stars = 1
                        }
                        else if(values[0].interviewState === 4 && status === "Pending")
                        {
                            stars = 0
                        }
                    }
                }
                stars+=ratioCandidateToCompany
                res.status(200).json({userId , firstName, lastName , linkedinURLKEY , stars });
                // res.status(200).json({values});
            }).catch((err) => {
              console.log("error", err);
                res.status(500).send(err);
            }
            );
        }
    } catch (error) {
      console.log("error", error);
        res.status(500).json({message:error.message});
    }
}

// Top Right API's
// Top Right API's
export const getAllInterviewStatus = async (req, res) => {
    try{
        const jobId = req.body.jobId;
        const interviews = await InterviewApplication.find({job:jobId});
        if(interviews.length == 0){
            res.status(200).json({count:0});
        }
        else{
            if(jobId){

                await InterviewApplication.aggregate(
                    [
                        {
                          $match: {
                            'job': ObjectId(jobId)
                        }
                        }, {
                          '$lookup': {
                            'from': 'users',
                            'localField': 'applicant',
                            'foreignField': '_id',
                            'as': 'users'
                          }
                        }, {
                          '$unwind': {
                            'path': '$users'
                          }
                        }, {
                          '$project': {
                            'job': 1,
                            'evaluations': 1,
                            'interviewState': 1,
                            'applicant': 1,
                            'users.firstName': 1,
                            'users.lastname': 1,
                            'users.email': 1,
                            'users.contact': 1
                          }
                        }
                      ]
                )
                .then((values) => {
                    let noShowCount = 0
                    let acceptedCount = 0
                    let rejectedCount = 0
                    let inProgressCount = 0
                    let evaluations = values[0].evaluations
                    // console.log("evaluations", evaluations)
                    let totalInterviewLength = 0
                    for (const evaluationId in evaluations) {
                        if (evaluations.hasOwnProperty(evaluationId)) {
                          const evaluation = evaluations[evaluationId];
                          const status = evaluation.status;
                          if(values[0].interviewState === 4 && status === "Recommended"){
                            acceptedCount++
                            totalInterviewLength++
                        }
                            else if(values[0].interviewState === 4 && status === "Not Recommended"){
                                rejectedCount++
                                totalInterviewLength++
                            }
                        }
                      }
                    if(values[0].interviewState == 3){
                        noShowCount++
                    }
                    else if(values[0].interviewState == 0 || values[0].interviewState == 1 || values[0].interviewState == 2){

                        inProgressCount++
                    }
                    res.status(200).json({noShowCount, acceptedCount, rejectedCount, inProgressCount , totalInterviewLength});
                    // res.status(200).json({values});
                }).catch((err) => {
                    res.json(err);
                })
            }
        }

    }
    catch(error){
        res.status(500).json({message:error.message});
    }
}
// Top left API's
export const getTotalCandidatesForJob = async (req, res) => {
    try{
        const jobId = req.body.jobId;
        const totalCandidates = (await Job.find({_id:jobId}))[0].applicants.length;
        const candidates = await Job.find({_id:jobId}).populate("applicants");
        res.status(200).json({totalCandidates , candidates: candidates});
    }
    catch(error){
        res.status(500).json({message:error.message});
    }
}

export const jobDetails = async (req, res) => {
    try{
        const jobId = req.body.jobId;
        const job = await Job.find({_id:jobId});
        res.status(200).json({
            jobTitle: job[0].jobTitle,
            hiringOrganization: job[0].hiringOrganization,
            jobType: job[0].jobType,
            jobLocation: job[0].jobLocation,
        });
    }
    catch(error){
        res.status(500).json({message:error.message});
    }
}

// export const hiredCandidates = async (req, res) => {
//     try{
//         const jobId = req.body.jobId;

//     }
//     catch(error){
//         res.status(500).json({message:error.message});
//     }
// }

export const getPsychDetails = async (data) => {
  // console.log("reqqq", request.body);
  let id =data;
  console.log("psy id:" + data);
  let psycdetails = "";
  if (id) {
    let test = await User.findById(mongoose.Types.ObjectId(id)) // await User.findOne({id : mongoose.Types.ObjectId(id)})
    await User.findOne({id : mongoose.Types.ObjectId(id)}, async function (err, res) {
      if (res) {
        if (res.linkedinurlkey != undefined) {
          try {
            let psycdetails = await axios.get(
              psycurl + "/" + res.linkedinurlkey
            );
            console.log(psycdetails);
            if (psycdetails && psycdetails?.data) {
              return psycdetails;
            } else {
              return psycdetailss;
            }
          } catch (err) {
            console.log(err);
          }
        } else {
          return false
        }
      } else {
        console.log('no user : ')
      }
    }).clone();
  } else {
    return response.status(400).json({ message: "Something went wrong" });
  }
};

export const getTeamCompatibility = async(req,res)=>{
  try {
    let responseObj = {}
    // For getting job details in left top
    let {jobId} = req.body
    let job = await Job.findOne({_id : jobId})
    let companyDetails;
    let candidateArr = []
    let interviewStat = null 
    if (job) {
      companyDetails = await user.findOne({ _id: job.uploadBy });
      let candidateCount = await candidateInfo.countDocuments({ 'inviteDetails.jobId': mongoose.Types.ObjectId(jobId) })
      let jobDetails = {};
      jobDetails.jobTitle = job.jobTitle;
      jobDetails.jobType = job.jobType;
      jobDetails.location = job?.location;
      jobDetails.totalCandidates = candidateCount;
      jobDetails.hiredCandidates = candidateCount
      jobDetails.company = {
        company_name: companyDetails?.firstName + " " + companyDetails?.lastname,
        company_logo : companyDetails.logo ? companyDetails.logo :  null,
        location:companyDetails.city ? companyDetails.city : null
      };
      responseObj['jobDetails'] = jobDetails;
    }
    let interviewStatus = {}
    let allCandidates = []
    let evaluations = null
    
    // Logic for graph
    const interviews = await InterviewApplication.find({ job: jobId });
    if (interviews.length < 1 ) {
      interviewStatus.totalInterview = 0;
      interviewStatus.inprogress = 0;
      interviewStatus.approved = 0;
      interviewStatus.rejected = 0;
      interviewStatus.no_show = 0;
      responseObj["interviewStatus"] = interviewStatus;
      // res.status(200).json({ count: 0 });
    } else {
      if (jobId) {
        await InterviewApplication.aggregate([
          {
            $match: {
              job: ObjectId(jobId),
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "applicant",
              foreignField: "_id",
              as: "users",
            },
          },
          {
            $unwind: {
              path: "$users", 
            },
          },
          {
            $project: {
              job: 1,
              evaluations: 1,
              interviewState: 1,
              applicant: 1,
              "users.firstName": 1,
              "users.lastname": 1,
              "users.email": 1,
              "users.contact": 1,
            },
          },
        ])
          .then((values) => {
            allCandidates = values
           
            let noShowCount = 0;
            let acceptedCount = 0;
            let rejectedCount = 0;
            let inProgressCount = 0;
            evaluations = values[0]?.evaluations;
            interviewStat = values[0]?.interviewState
            
            let totalInterviewLength = 0;
            for (const evaluationId in evaluations) {
              if (evaluations.hasOwnProperty(evaluationId)) {
                const evaluation = evaluations[evaluationId];
                const status = evaluation.status;
                if (
                  values[0].interviewState === 4 &&
                  status === "Recommended"
                ) {
                  acceptedCount++;
                  totalInterviewLength++;
                } else if (
                  values[0].interviewState === 4 &&
                  status === "Not Recommended"
                ) {
                  rejectedCount++;
                  totalInterviewLength++;
                }
              }
            }
            if (values[0].interviewState == 3) {
              noShowCount++;
            } else if (
              values[0].interviewState == 0 ||
              values[0].interviewState == 1 ||
              values[0].interviewState == 2
            ) {
              inProgressCount++;
            }
            
            interviewStatus.totalInterview = totalInterviewLength;
            interviewStatus.inprogress = inProgressCount;
            interviewStatus.approved = acceptedCount;
            interviewStatus.rejected = rejectedCount;
            interviewStatus.no_show = noShowCount;
            
            responseObj["interviewStatus"] = interviewStatus;
          })
          .catch((err) => {
            res.json(err);
          });
      }
    }
    // End logic for graph
   
    let newCandidates = await candidateInfo.find({"inviteDetails.jobId":mongoose.Types.ObjectId(jobId)})
    let candidateObj = {}
    if (newCandidates.length > 0) {
      for (let i = 0 ; i < newCandidates.length ; i++) {
        const candidate = newCandidates[i]
        let candidatePsy = await getPsychDetails(candidate?._id)
        
        candidateObj._id = candidate?._id
        candidateObj.first_name = candidate.firstName ? candidate.firstName : null;
        candidateObj.last_name = candidate.lastName ? candidate.lastName : null;
        candidateObj.email = candidate.email ? candidate.email : null;
        candidateObj.contact = candidate.phoneNo ? candidate.phoneNo : null;
        candidateObj.category = candidate.category ? candidate.category : null
        delete candidate?.evaluations;
        delete candidate?.job;
        delete candidate?.users;
        delete candidate?.applicant;
        delete candidate?.interviewState;

        let query = {
          query: {
            id : job?.uploadBy
          }
        }

        let currentCompanyPshyc = null
        // logic for get company psyc
        const PeerAggregated = mongoose.connection.collection('peerAggregated');
        
        PeerAggregated.findOne({name : req.body.company_name})
          .then(data => {
            let responseObj = {}
            if (data) {
              currentCompanyPshyc = data
            }else {
              res.status(404).json({ message: 'Company details not found.' });
              return;
            }
          })
          .catch(error => {
            // console.error(error);
          });
        // end logic
        // let currentCompanyPshyc = await getCompanyPsych(query, res)
        
      
        let companyPshcId
        let personality = 0

        let candidatePersonaDetails = candidatePsy?.data?.persona?.details;
        let companyPersonaDetails = currentCompanyPshyc?.persona ?  currentCompanyPshyc?.persona : null ;
        let sum = 0;
        if (candidatePersonaDetails) {
          for (const value in candidatePersonaDetails) {
            if (candidatePersonaDetails.hasOwnProperty(value)) {
              const score = candidatePersonaDetails[value].score;
              sum += score;
            }
          }
        }
        let avg = sum / 7
        let companyGbAvg = 0
        if (companyPersonaDetails) {
          companyGbAvg = companyPersonaDetails.gbAvg;
          personality = (companyGbAvg - avg) / 10
          
        }
        personality = 1 - personality
        if(personality < 0) {
          personality = Math.abs(personality);
        }
        candidateObj.personality = personality
        
        const userId = candidate._id;
        let user = await User.findOne({email :candidate?.email})
        const candidateSkills = user?.tools;
            
        const companySkills = job.skills;
          
        let ratioCandidateToCompany = 0;
        for (let i = 0; i < companySkills.length; i++) {
          if (candidateSkills[i]?.role === companySkills[i]?.role) {
            ratioCandidateToCompany =
            candidateSkills[i]?.rating / companySkills[i]?.rating;
          }
        }
        ratioCandidateToCompany = ratioCandidateToCompany / 10;
           
        ratioCandidateToCompany = ratioCandidateToCompany * 25;
        let interviewStat = await InterviewApplication.findOne({job : mongoose.Types.ObjectId(jobId)})
       
        interviewStat = interviewStat ? interviewStat.interviewState : 0

        let stars = 0;
      
        if (evaluations) {
          for (const evaluationId in evaluations) {
            if (evaluations.hasOwnProperty(evaluationId)) {
              const evaluation = evaluations[evaluationId];
              const status = evaluations.status;
              
              if (
                interviewStat === 4 &&
                status === "Recommended"
              ) {
                stars = 2.5;
              } else if (
                interviewStat === 4 &&
                status === "Not Recommended"
              ) {
                stars = 1;
              } else if (
                interviewStat === 4 &&
                status === "Pending"
              ) {
                stars = 0;
              }
            }
          }
        }
        
        if (ratioCandidateToCompany) {
          stars = stars +  ratioCandidateToCompany;
        } 
        candidateObj.stars = stars
        let recomentation = null
        if (stars > 3.5 && personality > 0.6) {
          recomentation = 'High'
        } if (stars > 3.5 && personality < 0.6 || stars < 3.5 || personality > 0.6) {
          recomentation = "Mild"
        } else {
          recomentation = "Low"
        }
        candidateObj.recomentation = recomentation;
        candidateArr.push(candidateObj)
      }
    }
    
    responseObj.candidates = candidateArr;

    responseObj.candidates = candidateArr;
  
    res.status(200).json(responseObj);
    
    
  } catch (error) {
    // console.log('Compatibility error : ', error)
  }
}

export const compareCandidateByTeam = async(req,res)=>{
  try {
    let { jobId, data } = req.body;
    
    let referenceUserPshy = await axios.get(
      `${psycurl}/${data?.linkedinurlkey}`
    );
   
    let referenceUserData = await User.findOne({
      linkedinurlkey: data["linkedinurlkey"],
    })
    
    
    let referencePersonaDetails = referenceUserPshy?.data?.persona?.details;
    
    let job = await Job.findOne({ _id: jobId });
    let companyDetails = await user.findOne({ _id: job.uploadBy });
   
    let companyPshcId;
    try {
      let allCompanyPshych = await axios.get(`${companyPsyUrl}`);
      
      let currentCompanyPshyc;
      
      

      if (allCompanyPshych && allCompanyPshych.data.length > 0) {
        currentCompanyPshyc = allCompanyPshych.data.find(async(x) => {
          if (x.name == companyDetails?.username) {
            companyPshcId = x._id;
          } else {
            companyPshcId = "64cec7f53e6ff9718d97fd80"; // For development testing
          }
         
          currentCompanyPshyc = await axios.get(
              `${companyPsyUrl}/${companyPshcId}`
            );
            
            referencePersonaDetails = referencePersonaDetails?.data?.persona?.details;
            let companyPersonaDetails = currentCompanyPshyc?.data?.persona;
            let sum = 0;

            for (const value in referencePersonaDetails) {
              if (referencePersonaDetails.hasOwnProperty(value)) {
                const score = referencePersonaDetails[value].score;
                sum += score;
              }
            }
            let avg = sum / 7;
            let companyGbAvg = companyPersonaDetails.gbAvg;
            let personality = (companyGbAvg - avg) / 10;
            personality = 1 - personality;
            if (personality < 0) {
              personality = Math.abs(personality);
            }
        });
      }
    } catch (error) {
      res.send({message : 'Error in getting company pshy details'})
    }

    if (jobId) {
      const headers = {
        Authorization: req.headers["authorization"],
        "Content-Type": "application/json",
      };
        let candidatePshyDetails = await axios.post(
          `${compatibilityUrl}`,
          { jobId },
          { headers }
        );
        if (candidatePshyDetails && candidatePshyDetails.data) {
          let candidates = candidatePshyDetails.data.candidates;

          let emailList = []
          if (candidates.length > 0 && referenceUserData?.tools.length > 0) {
            for (let i = 0; i < candidates.length; i++) {
              emailList.push(candidates[i]?.email)
            }
          }
         
          let candidateSkills = await User.find({ email: { $in: emailList } })
          
           const comparedSkills = referenceUserData.tools.map(
             (tool) => tool.primarySkill
           );

          let sortedCandidates = candidateSkills
            .map((user) => {
              const matchingSkills = user.tools.filter((tool) =>
                comparedSkills.includes(tool.primarySkill)
              );
              return { user, matchingSkills };
            })
            .sort((a, b) => b.matchingSkills.length - a.matchingSkills.length);
            
            sortedCandidates = sortedCandidates.map((item) => item.user);
           
          
          let candPshy = candidatePshyDetails?.data;

          candidates.sort((a, b) => {
            const aRef = sortedCandidates.find((item) => item.email === a.email);
            const bRef = sortedCandidates.find((item) => item.email === b.email);

            if (!aRef || !bRef) {
              return 0;
            }

            return sortedCandidates.indexOf(aRef) - sortedCandidates.indexOf(bRef);
          });
          res.send({candidates});
        }
       
    }
  } catch (error) {
    console.log('Error : ', error)
    res.send({ message: "Invalid linkedinUrlkey of reference user" });
  }
}


export const addCompatibilityUser = async(req,res)=>{
  try {
    let data = req.body
    let query = {
      linkedinUrlkey: data.linkedinUrlkey,
      companyId: data.companyId,
      jobId : data.jobId,
    };
    let user = await compatibilityUser.findOne(query)
    if (user) {
      res.status(409).send({ message: "User already added for this job" });
    } else {
      await compatibilityUser.create(data).then((result)=>{
        if (result) {
          res.send({message : "Compatibility user added"})
        } else {
          res.status(400).send({message : "Error in adding compatibility user"})
        }
      })
    }
  } catch (error) {
    console.log('Error while adding compatibility user : ', error)
  }
}

export const getAllCompatibilityUser = async(req,res)=>{
  try {
    let query = req.body
    await compatibilityUser.find(query).then((result)=>{
      res.send({ compatibilityUsers: result });
    })
  } catch (error) {
    console.log('Error while getting all compatibility user : ', error)
  }
}

export const deleteCompatibilityUser = async(req,res)=>{
  try {
    console.log('id------', req.body.id)
    await compatibilityUser.deleteOne({_id : req.body.id}).then(()=>{
      res.send({message : "User deleted"})
    })
  } catch (error) {
    console.log('Error while deleting compatibility user : ', error)
  }
}

export const compareCandidatesbyCompatibleUser = async(req,res)=>{
  try {
    console.log('req.body=========', req.body)
    let { linkedinUrl, companyId, jobId, role, candidates } = req.body;
    let job = await Job.findOne({ _id: jobId });
   
    let userLinkednkey = await User.findOne({ linkedinurl  : req.body.linkedinUrl});
    let linkedinUrlkey = userLinkednkey?.linkedinUrlkey
    let referenceUserPshy = await axios.get(
      `${psycurl}/${linkedinUrlkey}`
    ).then(async(result)=>{
      if (!result) {
        res.send({message : "Error in getting reference pshy details"})
      } else {
        let referenceUserPshy = result.data;
        let allCompanyPshych = await axios.get(`${companyPsyUrl}`);
        // let currentCompanyPshyc;
        let companyPshcId
        let companyDetails = await user.findOne({ company_id: companyId });
        let currentCompanyPshyc = null
        //  if (allCompanyPshych && allCompanyPshych.data.length > 0) {
        //     currentCompanyPshyc = allCompanyPshych.data.find((x)=>{
        //       if (x.name == companyDetails?.username) {
               
        //         companyPshcId = x._id
                
        //       } else {
        //         companyPshcId = "64cec7f53e6ff9718d97fd80"; // For development testing
        //       }
        //     })
        //     currentCompanyPshyc = await axios.get(
        //       `${companyPsyUrl}/${companyPshcId}`
        //     );
        //   }
        const PeerAggregated = mongoose.connection.collection('peerAggregated');
        
        PeerAggregated.findOne({name : req.body.company_name})
          .then(data => {
            let responseObj = {}
            if (data) {
              currentCompanyPshyc = data
            }else {
              res.status(404).json({ message: 'Company details not found.' });
              return;
            }
          })
          .catch(error => {
            // console.error(error);
          });
          if (!currentCompanyPshyc) {
            res.send({message : "Error in getting company pshyc"})
          } else {
            currentCompanyPshyc = currentCompanyPshyc
            referenceUserPshy = referenceUserPshy?.persona?.details;
            let companyPersonaDetails = currentCompanyPshyc?.persona;
            let sum = 0;

            for (const value in referenceUserPshy) {
              if (referenceUserPshy.hasOwnProperty(value)) {
                const score = referenceUserPshy[value].score;
                sum += score;
              }
            }
            let avg = sum / 7;
            let companyGbAvg = companyPersonaDetails.gbAvg;
            let personality = (companyGbAvg - avg) / 10;
            personality = 1 - personality;
            if (personality < 0) {
              personality = Math.abs(personality);
            }
            let companySkills;
            let ratioCandidateToCompany = 0;
            let stars = 0;
            let referenceUserDetails = await User.findOne({ linkedinurlkey  : linkedinUrlkey});
            if (referenceUserDetails) {
              const referenceUserSkills = referenceUserDetails?.tools;
      
              companySkills = job?.skills;
              ratioCandidateToCompany = 0;
              if (referenceUserSkills.length > 0) {
                for (let i = 0; i < companySkills.length; i++) {
                  if (referenceUserSkills[i]?.role === companySkills[i]?.role) {
                    ratioCandidateToCompany =
                      referenceUserSkills[i]?.rating / companySkills[i]?.rating;
                      
                  } else if (role == companySkills[i]?.role ) {
                    ratioCandidateToCompany = ratioCandidateToCompany / companySkills[i]?.rating;
                  }
                }
                ratioCandidateToCompany = ratioCandidateToCompany / 10;

                ratioCandidateToCompany = ratioCandidateToCompany * 25;
              }
            
              if (ratioCandidateToCompany) {
                stars += ratioCandidateToCompany;
              }
              let recomentation = null
              if (stars > 3.5 && personality > 0.6) {
                recomentation = 'High'
              } if (stars > 3.5 && personality < 0.6 || stars < 3.5 || personality > 0.6) {
                recomentation = "Mild"
              } else {
                recomentation = "Low"
              }
              let referenceUserPsyDetails = {};
              referenceUserPsyDetails.personality = personality;
              referenceUserPsyDetails.stars = stars;
              referenceUserPsyDetails.recomentation = recomentation;
              candidates.sort((a, b) => {
                let aTotalDifference = 0;
                let bTotalDifference = 0;

                for (const key in referenceUserPsyDetails) {
                  if (key !== "recomentation") {
                    aTotalDifference += Math.abs(a[key] - referenceUserPsyDetails[key]);
                    bTotalDifference += Math.abs(b[key] - referenceUserPsyDetails[key]);
                  } else {
                    if (a[key] !== referenceUserPsyDetails[key]) {
                      aTotalDifference += 1;
                    }
                    if (b[key] !== referenceUserPsyDetails[key]) {
                      bTotalDifference += 1;
                    }
                  }
                }

                if (aTotalDifference < bTotalDifference) {
                  return -1;
                } else if (aTotalDifference > bTotalDifference) {
                  return 1;
                } else {
                  return 0;
                }
              });
              res.send({candidates})
            } else {
              if (companySkills.length > 0) {
                for (let i = 0; i < companySkills.length; i++) {
                  if (role === companySkills[i]?.role) {
                    ratioCandidateToCompany =
                      referenceUserSkills[i]?.rating / companySkills[i]?.rating;
                  }
                }
                ratioCandidateToCompany = ratioCandidateToCompany / 10;

                ratioCandidateToCompany = ratioCandidateToCompany * 25;

                if (ratioCandidateToCompany) {
                  stars += ratioCandidateToCompany;
                }
                let recomentation = null;
                if (stars > 3.5 && personality > 0.6) {
                  recomentation = "High";
                }
                if (
                  (stars > 3.5 && personality < 0.6) ||
                  stars < 3.5 ||
                  personality > 0.6
                ) {
                  recomentation = "Mild";
                } else {
                  recomentation = "Low";
                }
                let referenceUserPsyDetails = {};
                referenceUserPsyDetails.personality = personality;
                referenceUserPsyDetails.stars = stars;
                referenceUserPsyDetails.recomentation = recomentation;
                candidates.sort((a, b) => {
                  let aTotalDifference = 0;
                  let bTotalDifference = 0;

                  for (const key in referenceUserPsyDetails) {
                    if (key !== "recomentation") {
                      aTotalDifference += Math.abs(
                        a[key] - referenceUserPsyDetails[key]
                      );
                      bTotalDifference += Math.abs(
                        b[key] - referenceUserPsyDetails[key]
                      );
                    } else {
                      if (a[key] !== referenceUserPsyDetails[key]) {
                        aTotalDifference += 1;
                      }
                      if (b[key] !== referenceUserPsyDetails[key]) {
                        bTotalDifference += 1;
                      }
                    }
                  }

                  if (aTotalDifference < bTotalDifference) {
                    return -1;
                  } else if (aTotalDifference > bTotalDifference) {
                    return 1;
                  } else {
                    return 0;
                  }
                });
                res.send({candidates})
              }
            }
          }
      }
    })
  } catch (error) {
    console.log('Error while comparing candidates with comatible users : ', error?.message)
    res.send({message: "Invalid linkedinurlkey"})
  }
}

export const updateCandidateCategory = async(req,res)=>{

  try {
    let candidateId = req.body.candidate_id
   
     let candidate = await candidateInfo.findOne({_id : candidateId})
     if (candidate) {
      if (candidate.category) {
        
        candidate.category = req.body.category
      } else {
       
        candidate.category = req.body.category
      }
      await candidate.save();
      res.status(200).send({message : "success"})
     }
    
  } catch (error) {
    console.log('Error while updating category : ', error)
  }
}