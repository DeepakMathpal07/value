import mongoose from "mongoose";
import Job from "../models/jobSchema.js";
import JobBin from "../models/jobBinSchema.js";
import User from "../models/userSchema.js";
import Candidate from "../models/candidate_info.js";
import Notification from "../models/notificationSchema.js";
import { } from "dotenv/config.js";
import fs from "fs";
import passwordHash from "password-hash";
import json2xls from "json2xls";
import v4 from "uuid/v4.js";
import sendGridMail from "@sendgrid/mail";
import axios from "axios";
import InterviewApplication from "../models/interviewApplicationSchema.js";
import job from "../models/jobSchema.js"
import company from "../models/companyListSchema.js";
import holdWallet from "../models/holdWalletSchema.js";
import userCredit_info from "../models/userCreditSchema.js";
import { response } from "express";
import { request } from "http";
import jobBin from "../models/jobBinSchema.js";
import XIPanels from "../models/xiPanelsSchema.js";
import user from "../models/userSchema.js";
import { formatDateTime } from "../utils/utils.js";
import candidateInfo from "../models/candidateInfo.js";
import { updateCandidateInfo } from "./candidateInfoControllers.js";

const MAX_EMAIL_RETRIES = 3;
const EMAIL_RETRY_DELAY = 5000;

const url = process.env.BACKEND_URL;
const frontendUrl = process.env.FRONTEND_URL;

sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
const supportEmail=process.env.VM_SUPPORT_EMAIL;

function generatePassword() {
  var length = 8,
    charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&",
    retVal = "";
  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

export const addJob = async (request, response) => {
  try {
    User.findOne({ _id: request.body.user_id }, async function (err, res) {
      if (res === null || res === undefined) {
        response.status(404).json({ Message: "Admin Not Found" });
        return;
      }
      let getWallet = await userCredit_info.find({userId:request.body.user_id});
      let jobC = {
        jobTitle: request.body.jobTitle,
        jobDesc: request.body.jobDesc,
        uploadBy: request.body.user_id,
        location: request.body.location,
        jobType: request.body.jobType ? request.body.jobType : "Full-Time",
        jobLocation: request.body.jobLocation,
        reqApp: request.body.reqApp,
        validTill: request.body.validTill ? request.body.validTill : null,
        hiringOrganization: request.body.hiringOrganization,
        salary: request.body.salary ? request.body.salary : null,
        perks: request.body.perks ? request.body.perks : null,
        eligibility: request.body.eligibility ? request.body.eligibility : null,
        skills: request.body.skills ? request.body.skills : null,
        questions: request.body.questions ? request.body.questions : [],
        archived: false,
        location: request.body.location,
        showComLogo: request.body.showComLogo,
        showComName: request.body.showComName,
        showEmail: request.body.showEmail,
        showEducation: request.body.showEducation,
        showContact: request.body.showContact,
        draft: request.body.draft,
        invitations: request.body.invitations,
      };

      const newJob = new JobBin(jobC);
      await newJob.save();
     
      if (newJob && newJob.invitations.length > 0) {
        for (let i = 0; i < newJob.invitations.length; i++) {
          const elem = newJob.invitations[i];
          let query = {
            _id : elem._id
          }
          await candidateInfo.updateOne(query, {
            $set: { "inviteDetails.jobId": newJob._id },
          });
        }
      }
      
      if (newJob) {
        let candidateList = request.body.candidateList ? request.body.candidateList.map((a) => a.email) : null;
        let asd = await Candidate.updateMany(
          { email: { $in: candidateList } },
          { jobId: newJob._id.valueOf() }
        );
        
        // code for delete candidate from candidateinfo collection, if candidate with no jobid is existing for this company
        await candidateInfo.deleteMany({
          "inviteDetails.companyId": res.company_id,
          "inviteDetails.jobId":""
        });

          
        response
          .status(200)
          .json({ Message: "Job Added Successfully", job: newJob });
        return;
      } else {
        response.status(401).json({ Message: "Error Adding Job" });
        return;
      }
    });
  } catch (error) {}
};

// List Jobs
export const listJobs = async (request, response) => {
  try {
    await Job.find({ uploadBy: request.params.id })
      .sort({ createTime: -1 })
      .exec(async function (err, res) {
        await response.status(200).json({ jobs: res });
        return;
      });
  } catch (error) {}
};

// List job with pagination
export const listJobwithPagination = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const pageSize = 5;
    const skip = (page - 1) * pageSize;
   
    let activeJobs = await Job.find({ uploadBy: req.params.id ,status:"Active"}).sort({ createTime: -1 })
    .skip(skip)
    .limit(pageSize);
    
    let activeJobsCount = await Job.countDocuments({ uploadBy: req.params.id,status:"Active" })
   
    let closedJobs = await Job.find({ uploadBy: req.params.id ,status:"Closed"}).sort({ createTime: -1 })
    .skip(skip)
    .limit(pageSize);
    let closedJobsCount = await Job.countDocuments({ uploadBy: req.params.id,status:"Closed" })
    
    let notAcceptedJobs = await Job.find({ uploadBy: req.params.id ,status:"Not Accepting"}).sort({ createTime: -1 })
    .skip(skip)
    .limit(pageSize);
    let notAcceptedJobsCount = await Job.countDocuments({ uploadBy: req.params.id,status:"Not Accepting" })
    
    let archivedJob = await Job.find({ uploadBy: req.params.id ,status:"Archived"}).sort({ createTime: -1 })
    .skip(skip)
    .limit(pageSize);
    let ArchivedJobsCount = await Job.countDocuments({ uploadBy: req.params.id,status:"Archived" })


    const jobData = await Job.find({ uploadBy: req.params.id })
      .sort({ createTime: -1 })
      .skip(skip)
      .limit(pageSize);

    const totalItems = await Job.countDocuments({ uploadBy: req.params.id });

    let responseObj = {
      active_Job:{
        data : activeJobs,
        totalPages: Math.ceil(activeJobsCount / pageSize),
        currentPage: page,
      },
      closed_Job:{
        data : closedJobs,
        totalPages: Math.ceil(closedJobsCount / pageSize),
        currentPage: page,
      },
      not_accepted_Job:{
        data : notAcceptedJobs,
        totalPages: Math.ceil(notAcceptedJobsCount / pageSize),
        currentPage: page,
      },
      archive_Job:{
        data : archivedJob,
        totalPages: Math.ceil(ArchivedJobsCount / pageSize),
        currentPage: page,
      },
    }
    res.json(responseObj)
  } catch (err) {
    res.send(err);
  }
};

// List jobbin with pagination
export const listJobBinwithPagination = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const pageSize = 5;
    const skip = (page - 1) * pageSize;
    const jobData = await JobBin.find({ uploadBy: req.params.id })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(pageSize);

    const totalItems = await Job.countDocuments({ uploadBy: req.params.id });

    res.json({
      jobData,
      totalPages: Math.ceil(totalItems / pageSize),
      currentPage: page,
    });
  } catch (err) {
    res.send(err);
  }
}
// get job count
export const listJobsCount = async (request, response) => {
  try {    
    let closedJobs = await Job.countDocuments({ uploadBy: request.params.id,status:"Closed" })
    let activeJobs = await Job.countDocuments({ uploadBy: request.params.id,status:"Active" })
    let notAcceptedJobs = await Job.countDocuments({ uploadBy: request.params.id,status:"Not Accepting" })
    let ArchivedJobs = await Job.countDocuments({ uploadBy: request.params.id,status:"Archived" })
    let pendingJobs = await JobBin.countDocuments({ uploadBy: request.params.id})
    let responseObj = {}
    responseObj["closedJob"] = closedJobs;
    responseObj["active"] = activeJobs;
    responseObj["not_accepted"] = notAcceptedJobs;
    responseObj["archived"] = ArchivedJobs;
    responseObj["pendingJobs"] = pendingJobs;
    response.status(200).json({ data: responseObj });
  } catch (error) {}
};

export const listBinJobs = async (request, response) => {
  try {
    await JobBin.find({ uploadBy: request.params.id })
      .sort({ "_id": -1 })
      .exec(async function (err, res) {
        await response.status(200).json({ jobs: res });
        return;
      });
  } catch (error) {}
};

export const listJobsCandidate = async (request, response) => {
  try {
    let currentDate = new Date().toISOString();
    await Job.find({ validTill: { $gte: currentDate } })
      .sort({ createTime: -1 })
      .exec(async function (err, res) {
        await response.status(200).json({ jobs: res });
        return;
      });
  } catch (error) {}
};

// Update Jobs
export const updateJob = async (request, response) => {
  try {
    let newJob = await Job.findOne(
      { _id: request.body._id },
      async function (err, user) {
        if (user) {
          user.jobTitle = request.body.jobTitle;
          user.jobType = request.body.jobType;
          user.jobDesc = request.body.jobDesc;
          user.reqApp = request.body.reqApp;
          user.location = request.body.location;
          user.jobLocation = request.body.jobLocation;
          user.hiringOrganization = request.body.hiringOrganization;
          user.eligibility = request.body.eligibility;
          user.perks = request.body.perks;
          user.invitations = request.body.invitations
          user.salary = request.body.salary;
          user.skills = request.body.skills;
          user.questions = request.body.questions;
          user.showComLogo = request.body.showComLogo;
          user.showComName = request.body.showComName;
          user.showEmail = request.body.showEmail;
          user.showEducation = request.body.showEducation;
          user.showContact = request.body.showContact;
          await user.save();


          updateCandidateInfo(request.body.invitations,user._id,user.uploadBy,user._id);

          
          return response.status(200).json({ Success: true });
        } else {
          await jobBin.findOne({_id : request.body._id},async function(err,user){
            user.jobTitle = request.body.jobTitle;
            user.jobType = request.body.jobType;
            user.jobDesc = request.body.jobDesc;
            user.reqApp = request.body.reqApp;
            user.location = request.body.location;
            user.jobLocation = request.body.jobLocation;
            user.hiringOrganization = request.body.hiringOrganization;
            user.eligibility = request.body.eligibility;
            user.perks = request.body.perks;
            user.invitations = request.body.invitations
            user.salary = request.body.salary;
            user.skills = request.body.skills;
            user.questions = request.body.questions;
            user.showComLogo = request.body.showComLogo;
            user.showComName = request.body.showComName;
            user.showEmail = request.body.showEmail;
            user.showEducation = request.body.showEducation;
            user.showContact = request.body.showContact;
            let query = {
            $or: [
              {
                "inviteDetails.jobId": mongoose.Types.ObjectId(request.body._id),
                "inviteDetails.companyId":"",
                "inviteDetails.invitedDate":"",
              },
              {
                $expr: {
                  $eq: [{ $toString: "$inviteDetails.jobId" }, request.body._id],

                },
              },
            ],
          };

            let dataForUpdate = {
              jobId: user.jobId,
              companyId: user.uploadBy,
              invitedDate: new Date(),
            };

            await candidateInfo.updateOne(query, {
              $set: { inviteDetails: dataForUpdate },
            });
            await user.save().then((resp)=>{
              return response.status(200).json({ Success: true, Status:resp?.status});
            });
            //return response.status(200).json({ Success: true });
          })
        }
      }
    ).clone();
  } catch (error) {
    console.log("Error : ", error);
  }
};

export const archiveJob = async (request, response) => {
  try {
    let statusData = await job.findOneAndUpdate({ _id: request.body._id }, { $set: { archived: request.body.archived ,status: request.body.status } }, { new: true })
   
    if (statusData.status === request.body.status) {
      response.send({ data: "update successfully" }).status(200);
    } else {
      response.send({ data: "status not updated!" }).status(400);

    }
  }
  catch (err) {
    response.send({ data: "something went wrong", err }).status(400);
  }
};

// Export JobDetails
export const exportJobDetails = async (request, response) => {
  try {
    var today = new Date();
    var date =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate();

    await Job.findOne({ _id: request.body.job_id }, async function (err, res) {
      if (res === undefined || res.uploadBy._id != request.body.user_id) {
        response.status(403);
        return;
      }

      // Saving and downloading job details
      var filename = res.jobTitle + " - Details " + date + ".xls";
      var file1 = json2xls(JSON.parse(JSON.stringify(res)));
      var detailsFile = await fs.writeFile(filename, file1, "binary", (err) => {
        if (err) throw err
      });
      await response.download(filename);

      // Getting Canditates
      let candidateArr = res.applicants;
      let query = User.find({ _id: { $in: candidateArr } }).select({
        username: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        contact: 1,
      });
      await query.exec(async function (err1, res1) {
        if (res1 !== undefined) {
          var filename = res.jobTitle + " - Candidates " + date + ".xls";
          var file2 = json2xls(JSON.parse(JSON.stringify(res1)));
          var candidateFile = await fs.writeFile(
            filename,
            file2,
            "binary",
            (err) => {
              if (err) throw err;
            }
          );
          await response.download(filename);
        }
      });
    });
    response.status(200).json({ Message: "Files Downloaded" });
  } catch (error) { }
};

export const GetJobDetailsfromID = async (request, response) => {}

// Get Job From Id
export const GetJobFromId = async (request, response) => {
  try {
    let jobDetails = await Job.findOne({ _id: request.body.job_id });
		if (jobDetails) {
			response.status(200).json({ job: jobDetails });
		} else {
			jobDetails = await JobBin.findOne({ _id: request.body.job_id });
			response.status(200).json({ job: jobDetails });
		}
  } catch (error) {
    return 
  }
};

export const getJobBinById = async (request, response) => {
  try {
    await JobBin.find({ _id: request.body.job_id }, async function (err, res) {
      let applicants = [],
        declined = [],
        invited = [];
        
      if (res) {
        await User.find({ _id: { $in: res.applicants } }, function (err, res) {
          res.map((result) => {
            InterviewApplication.findOne(
              { applicant: result._id },
              function (err, res) {
                let data = {
                  _id: result._id,
                  appid: res._id,
                  firstName: result.firstName,
                  lastname: result.lastname,
                  contact: result.contact,
                  email: result.email,
                  username: result.username,
                  status: res.status,
                };
                applicants.push(data);
              }
            );
          });
        }).clone();
        
        declined = await User.find({ _id: { $in: res.invitations_declined } });
        invited = await User.find({ _id: { $in: res.invitations } });
        response.status(200).json({ job: res, applicants, declined, invited });
      } else response.status(403).json("Data Not Found");
    });
  } catch (error) { }
};


// send email to XI
export const sendXIReminderEmail = async(req,response)=>{
  let userId = req?.body?.id;
  let dateTime = req?.body?.dateTime;
  let jobTitle = req?.body?.jobTitle;
  if(userId){
    await User.find({ _id: userId}, function (err, res) {
      if(err){
        console.log(err);
        response.status(404).send('unsuccessful');
      }else if(res){
        let email = res[0].email;
        let html = `<h3>${jobTitle}</h3>
          <br/>
          Hi ${ res[0].firstName},
          <br/>
          This is a gentle reminder for the upcoming interview for <b>${jobTitle}</b> at ${dateTime}. 
          <br/>
          Please do logon to the valuematrix platform atleast 15 minutes before interview schedule. 
          <br/> 
          If you are facing any technical difficulties please reach to us at, support@valuematrix.ai. 
          <br/>
          Best regards.
          <br/>
          Valuematrix.ai Team. `;

        sendGridMail.send({
            to: email,
            from: supportEmail,
            subject: `Valuematrix - Scheduled interview reminder ${jobTitle}`,
            html: html,
          });
          response.status(200).send('success');
      }
    }).clone();
  }
}
// send email to candidate
export const sendCandidateReminderEmail = async(req,response)=>{
  let userId = req?.body?.id;
  let dateTime = req?.body?.dateTime;
  let jobTitle = req?.body?.jobTitle;
  if(userId){
    await User.find({ _id: userId}, function (err, res) {
      if(err){
        console.log(err);
        response.status(404).send('unsuccessful');
      }else if(res){
        let email = res[0].email;
        let html = `<h3>${jobTitle}</h3>
          <br/>
          Hi ${ res[0].firstName},
          <br/>
          This is a gentle reminder for the upcoming interview for <b>${jobTitle}</b> at ${dateTime}. 
          <br/>
          Please do logon to the valuematrix platform at-least 15 minutes before the interview schedule to complete the pre check formalities. 
          <br/> 
          We recommend you to use Google chrome browser to access the platform. 
          <br/>
          In case you face any technical difficulties please reach us at, support@valuematrix.ai. 
          <br/>
          Best regards.
          <br/>
          Valuematrix.ai Team. `;

        sendGridMail.send({
            to: email,
            from: supportEmail,
            subject: `Valuematrix - Scheduled interview reminder ${jobTitle}`,
            html: html,
          });
          response.status(200).send('success');
      }
    }).clone();
  }
}

// Send job invitation to candidate
export const sendInvitation = async(req,res)=>{
  try {
    let jobData = req.body
    let job_id = jobData.job_id
    let candidate = jobData.candidates[0]
    let result = await User.findOne({email:candidate.Email})
    let invitations = []
    if (result) {
      if (!result.job_invitations.includes(result._id)) {
        let i = result.job_invitations ? result.job_invitations : [];
        i.push((job_id).valueOf());
        invitations.push((result._id));
        result.job_invitations = i;
        await result.save();
        await User.findOneAndUpdate(
          { _id: result._id },
          { job_invitations: i }
        );
        let job = await Job.findOne({_id : job_id})
        if (job) {
          let noti = new Notification({
            forAll: false,
            title: "Job Invitation - " + job.jobTitle,
            message:
              "You have been invited for the job " +
              job.jobTitle,
            // " by " +
            // res.username,
            sendTo: [result._id],
            type: "Notification",
          });
          await noti.save();

          let html = `<h1>Job Invitation</h1>
          <br/>
          <p>
            You have been invited for the job <b>${job.jobTitle}</b> 
          </p><br/>
          <p>Please logon and check out the job invitations at :</p><br/>
          <a href="${frontendUrl}/login
          " target="_blank">${frontendUrl}/login</a>`;

          await sendGridMail.send({
            to: result.email,
            from: supportEmail,
            subject: `Job Invitation for ${job.jobTitle} - Value Matrix`,
            html: html,
          });
          res.status(200).send('success')
        }
      }
    } else {
      let id = v4();
      let pass = generatePassword();
      let reset_pass_id = id;
      
      let newUser  = {
        username: id,
        firstName: candidate.FirstName ? candidate.FirstName : "",
        lastName: candidate.LastName ? candidate.LastName : "",
        email: candidate.Email,
        contact: candidate.Contact,
        password: passwordHash.generate(pass),
        user_type: "User",
        invite: 1,
        address: candidate.Address ? candidate.Address : null,
        resetPassId: reset_pass_id,
        job_invitations: [job_id],
        tools: job.skills ? job.skills : [],
      };
      await User.findOne(
        {
          $or: [
            {
              email: newUser.email,
            },
            {
              contact: newUser.contact,
            },
          ],
        },async(err,res)=>{
          if (err) throw err
          if (!res) {
            await User.create(newUser);
          }
        })
     
      const CandidadeCount = await Candidate.count();
        
        const candidateInfo = {
          email: candidate.Email,
          phoneNo: candidate.Contact,
          firstName: candidate.FirstName ? candidate.FirstName : "",
          lastName: candidate.LastName ? candidate.LastName : "",
          candidate_id: CandidadeCount + 1,
          jobId:job_id,
        }
             
        let newCandidate = new Candidate(candidateInfo);
        await newCandidate.save();

        invitations.push(newUser._id);
        let htmltext = `<h1>Invitation to join Job Portal</h1><br/><p>You have been invited for the job interview for <b>${job.jobTitle}</b> .
          </p>
          <br/>
          <p>To continue with the interview inviation click on the link below ( or paste the link in the browser ) and login with the credentials given below : </p>
          <br/>
          <a href="${frontendUrl}/login" target="_blank">${frontendUrl}/login</a><br/>
          <p><b>Username :</b> ${candidate.Email}</p><br/>
          <p><b>Password</b> ${pass} </p><br/>`;
        await sendGridMail.send({
          to: candidate.Email,
          from: supportEmail,
          subject: `Job Invitation for ${job.jobTitle} - Value Matrix`,
          html: htmltext,
        });
        res.status(200).send('success')
    }
  } catch (error) {
    
  }
}

// Send Invitations To Users
export const sendJobInvitations = async (job) => {
  try {
    let job_id = job._id;
    let candidates = job.invitations;
    let jobId = "";
    // await User.findOne({ _id: user_id }, async function (err, res) {
    // pushing in hold Wallet
  //   let creditHold ={
  //     jobId:mongoose.Types.ObjectId(job._id) ,
  //     amount : candidates.length,
  //     userId:job.uploadBy,
  //     user_type:"Company",

  //   }
  //   let Wallet = new holdWallet(creditHold);
  // await Wallet.save();
  //Deducting From Wallet

    let data = await userCredit_info.findOneAndUpdate({userId:job.uploadBy},{$inc : {credit : -candidates.length}})

    // await JobBin.findOne({ _id: mongoose.Types.ObjectId(job_id) }, async function (err1, res1) {
    let invitations = [];
    await candidates.forEach(async (candidate, index) => {
      await User.findOne(
        {
          $or: [
            {
              email: candidate.Email,
            },
            {
              contact: candidate.Contact,
            },
          ],
        },



        async function (error, result) {
          if (result) {
            if (!result.job_invitations.includes(result._id)) {
              let i = result.job_invitations ? result.job_invitations : [];
              i.push((job_id).valueOf());
              invitations.push((result._id));
              result.job_invitations = i;
              await result.save();
              await User.findOneAndUpdate(
                { _id: result._id },
                { job_invitations: i }
              );
              
              await Candidate.findOne({
                $or: [
                  {
                    email: candidate.Email,
                  },
                  {
                    phoneNo: candidate.Contact,
                  },
                ],
              }).then(async(res)=>{
                if (!res){
                  const CandidadeCount = await Candidate.count();
                  const candidateInfo = {
                    email: candidate.Email,
                    phoneNo: candidate.Contact,
                    firstName: candidate.FirstName ? candidate.FirstName : "",
                    lastName: candidate.LastName ? candidate.LastName : "",
                    candidate_id: CandidadeCount + 1,
                    jobId:job_id,
                  }
                 
                  let newCandidate = new Candidate(candidateInfo);
                  await newCandidate.save();
                }
              })


              let noti = new Notification({
                forAll: false,
                title: "Job Invitation - " + job.jobTitle,
                message:
                  "You have been invited for the job " +
                  job.jobTitle,
                // " by " +
                // res.username,
                sendTo: [result._id],
                type: "Notification",
              });
              await noti.save();

              let html = `<h1>Job Invitation</h1>
              <br/>
              <p>
                You have been invited for the job <b>${job.jobTitle}</b> 
              </p><br/>
              <p>Please logon and check out the job invitations at :</p><br/>
              <a href="${frontendUrl}/login
              " target="_blank">${frontendUrl}/login</a>`;

              await sendGridMail.send({
                to: result.email,
                from: supportEmail,
                subject: `Job Invitation for ${job.jobTitle} - Value Matrix`,
                html: html,
              });

              if (index === candidates.length - 1) {
                await Job.findOne(
                  { _id: job._id },
                  async function (err, user) {
                    user.invitations = invitations;
                    await user.save();
                  }).clone()
              }
            }
          } else {
            let id = v4();
            let pass = generatePassword();
            let reset_pass_id = id;
            let newUser = new User({
              username: id,
              firstName: candidate.FirstName ? candidate.FirstName : "",
              lastName: candidate.LastName ? candidate.LastName : "",
              email: candidate.Email,
              contact: candidate.Contact,
              password: passwordHash.generate(pass),
              user_type: "User",
              invite: 1,
              address: candidate.Address ? candidate.Address : null,
              resetPassId: reset_pass_id,
              job_invitations: [job_id],
              tools: job.skills ? job.skills : [],
            });

            await newUser.save();
            const CandidadeCount = await Candidate.count();
              
            const candidateInfo = {
              email: candidate.Email,
              phoneNo: candidate.Contact,
              firstName: candidate.FirstName ? candidate.FirstName : "",
              lastName: candidate.LastName ? candidate.LastName : "",
              candidate_id: CandidadeCount + 1,
              jobId:job_id,
            }
             
            let newCandidate = new Candidate(candidateInfo);
            await newCandidate.save();

            invitations.push(newUser._id);
            let htmltext = `<h1>Invitation to join Job Portal</h1><br/><p>You have been invited for the job interview for <b>${job.jobTitle}</b> .
              </p>
              <br/>
              <p>To continue with the interview inviation click on the link below ( or paste the link in the browser ) and login with the credentials given below : </p>
              <br/>
              <a href="${frontendUrl}/login" target="_blank">${frontendUrl}/login</a><br/>
              <p><b>Username :</b> ${candidate.Email}</p><br/>
              <p><b>Password</b> ${pass} </p><br/>`;
            await sendGridMail.send({
              to: candidate.Email,
              from: supportEmail,
              subject: `Job Invitation for ${job.jobTitle} - Value Matrix`,
              html: htmltext,
            });
            if (index === candidates.length - 1) {
              await Job.findOne(
                { _id: job._id },
                async function (err, user) {
                  user.invitations = invitations;
                  await user.save();
                }).clone();
            }
          }
        }
      ).clone();

      jobId = await FindCandidateByEmail(candidate.Email, job_id
        );
    });

  } catch (err) {
    throw err
  }
};

export const sendInvitationToNewCandidates = async(jobId,indx,candidates,job)=>{
  try {
    let job_id = jobId
    if (candidates && candidates.length > 0) {
      for (let i = 0;i<candidates.length;i++) {
        const candet = candidates[i]
        const email = candet.Email
        const Contact = candet.Contact
        let result = await User.findOne({
          $or:[
            {
              email: candet.Email
            },
            {
              contact: candet.Contact
            }
          ]
        })
        if (result) {
          if (!result.job_invitations.includes(result._id)) {
            let i = result.job_invitations ? result.job_invitations : [];
            i.push((job_id).valueOf());
            result.job_invitations = i;
            
            await result.save();
            
            await User.findOneAndUpdate(
              { _id: result._id },
              { job_invitations: i }
            );

            let noti = new Notification({
              forAll: false,
              title: "Job Invitation - " + job.jobTitle,
              message:
                "You have been invited for the job " +
                job.jobTitle,
              // " by " +
              // res.username,
              sendTo: [result._id],
              type: "Notification",
            });
            await noti.save();

            let html = `<h1>Job Invitation</h1>
            <br/>
            <p>
              You have been invited for the job <b>${job.jobTitle}</b>
            </p>
            <p>
              Instructions to attend the interview:
            </p>
            <ol>
              <li>Login to the platform 10 minutes before the interview.</li>
              <li>Click on the "Join" button against the interview.</li>
              <li>Follow the instructions provided on the page.</li>
              <li>When prompted, please share the entire screen and not just one window.</li>
              <li>If prompted, please enable video and share the system sound.</li>
              <li>Please follow the instructions for checking a few things.</li>
              <li>After checking, a gray "Waiting" button might be displayed. Once the meeting starts, the waiting button would turn to "Join" and turn green in color.</li>
              <li>Click on the "Join" button to enter the meeting room.</li>
            </ol>
            <br/>
            <p>Please log on and check out the job invitations at:</p>
            <a href="${frontendUrl}/login" target="_blank">${frontendUrl}/login</a>`;

            await sendGridMail.send({
              to: result.email,
              from: supportEmail,
              subject: `Job Invitation for ${job.jobTitle} - Value Matrix`,
              html: html,
            });
            
          }
        } else {
          let id = v4();
          let pass = generatePassword();
          let reset_pass_id = id;
          let newUser = new User({
            username: id,
            firstName: candet.FirstName ? candet.FirstName : "",
            lastName: candet.LastName ? candet.LastName : "",
            email: candet.Email,
            contact: candet.Contact,
            password: passwordHash.generate(pass),
            user_type: "User",
            invite: 1,
            address: candet.Address ? candet.Address : null,
            resetPassId: reset_pass_id,
            job_invitations: [job_id],
            tools: job.skills ? job.skills : [],
          });

          

          await newUser.save();

          let htmltext = `<h1>Invitation to join Job Portal</h1><br/><p>You have been invited for the job interview for <b>${job.jobTitle}</b> .
            </p>
            <br/>
            <p>To continue with the interview inviation click on the link below ( or paste the link in the browser ) and login with the credentials given below : </p>
            <br/>
            <a href="${frontendUrl}/login" target="_blank">${frontendUrl}/login</a><br/>
            <p><b>Username :</b> ${candet.Email}</p><br/>
            <p><b>Password</b> ${pass} </p><br/>`;
          await sendGridMail.send({
            to: candet.Email,
            from: supportEmail,
            subject: `Job Invitation for ${job.jobTitle} - Value Matrix`,
            html: htmltext,
          });

          let invitations = []
          //invitations.push(newUser._id);
          candidates.map((value,index) => {
            if(value.FirstName === candet.FirstName && 
                value.LastName === candet.LastName){
                value.Uid = newUser._id;
            }
            invitations.push(value);
          })
          await Job.findOne({ _id: job._id }, async function (err, user) {
            user.invitations = invitations;
            await user.save();
          }).clone();
        }
        const CandidadeCount = await Candidate.count();
        const candidateInfo = {
          email: candet.Email,
          phoneNo: candet.Contact,
          firstName: candet.FirstName ? candet.FirstName : "",
          lastName: candet.LastName ? candet.LastName : "",
          candidate_id: CandidadeCount + 1,
          jobId:job_id,
        }
        await Candidate.findOne({$or:[
          {
            email: candet.Email
          },
          {
            contact: candet.Contact
          }
        ]}).then(async(data)=>{
          if (!data) {
            let newCandidate = new Candidate(candidateInfo);
            await newCandidate.save();
          }
        })
      }
    }
  } catch (error) {
    
  }
}

export const sendEmailWithRetry = async (emailData, retries = MAX_EMAIL_RETRIES) => {
  try {
    await sendGridMail.send(emailData);
    console.log("Email sent successfully!");
  } catch (error) {
    if (retries > 0) {
      console.log(`Email sending failed. Retrying in ${EMAIL_RETRY_DELAY / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, EMAIL_RETRY_DELAY));
      await sendEmailWithRetry(emailData, retries - 1);
    } else {
      console.error("Max email retries reached. Email could not be sent.");
    }
  }
};

export const approveJobandSendInvitation = async(jobId)=>{
  try {
    let jobData = await job.findOne({ _id: mongoose.Types.ObjectId(jobId) });
    if (jobData) {
     let query = {
       $or: [
         {
           "inviteDetails.jobId": mongoose.Types.ObjectId(jobId),
         },
         {
           $expr: {
             $eq: [{ $toString: "$inviteDetails.jobId" }, jobId],
           },
         },
       ],
       "inviteDetails.invitedDate": "",
     };
    let response = {};
     await candidateInfo.find(query).then(async(candidates)=>{
        if (candidates.length > 0) {
          for (let i = 0;i<candidates.length;i++) {
            const candet = candidates[i]
            const email = candet.Email ? candet.Email : candet.email;
            const contact = candet.Contact ? candet.Contact : candet.phoneNo;
            let job_id = jobId
            await User.findOne({email}).then(async(result)=>{
              if (result) {
                if (!result.job_invitations.includes(result._id)) {
                  let i = result.job_invitations ? result.job_invitations : [];
                  i.push((job_id).valueOf());
                  result.job_invitations = i;
                  await result.save();
                  await User.findOneAndUpdate(
                    { _id: result._id },
                    { job_invitations: i }
                  );
                  let noti = new Notification({
                    forAll: false,
                    title: "Job Invitation - " + jobData.jobTitle,
                    message:
                      "You have been invited for the job " +
                      jobData.jobTitle,
                    // " by " +
                    // res.username,
                    sendTo: [result._id],
                    type: "Notification",
                  });
                  await noti.save();
      
                  let html = `<h1>Job Invitation</h1>
                  <br/>
                  <p>
                    You have been invited for the job <b>${jobData.jobTitle}</b>
                  </p>
                  <p>
                    Instructions to attend the interview:
                  </p>
                  <ol>
                    <li>Login to the platform 10 minutes before the interview.</li>
                    <li>Click on the "Join" button against the interview.</li>
                    <li>Follow the instructions provided on the page.</li>
                    <li>When prompted, please share the entire screen and not just one window.</li>
                    <li>If prompted, please enable video and share the system sound.</li>
                    <li>Please follow the instructions for checking a few things.</li>
                    <li>After checking, a gray "Waiting" button might be displayed. Once the meeting starts, the waiting button would turn to "Join" and turn green in color.</li>
                    <li>Click on the "Join" button to enter the meeting room.</li>
                  </ol>
                  <br/>
                  <p>Please log on and check out the job invitations at:</p>
                  <a href="${frontendUrl}/login" target="_blank">${frontendUrl}/login</a>`;

                  await sendEmailWithRetry({
                    to: email,
                    from: supportEmail,
                    subject: `Job Invitation for ${jobData.jobTitle} - Value Matrix`,
                    html: html,
                  });
      
                  // await sendGridMail.send({
                  //   to: email,
                  //   from: supportEmail,
                  //   subject: `Job Invitation for ${jobData.jobTitle} - Value Matrix`,
                  //   html: html,
                  // });
                
                  const updatedData = candidates.map(x => (x.Email === candet.Email ? { ...x, Status: "Invited", Uid:result._id } : x));
                  
                  await Job.findOne({ _id: jobData._id },async function (err, user) {
                    user.invitations = updatedData?._doc;
                    await user.save();
                  }).clone()
                }
              } else {
                let id = v4();
              let pass = generatePassword();
              let reset_pass_id = id;
              let newUser = new User({
                username: id,
                firstName: candet.FirstName ? candet.FirstName : "",
                lastName: candet.LastName ? candet.LastName : "",
                email,
                contact,
                password: passwordHash.generate(pass),
                user_type: "User",
                invite: 1,
                address: candet.Address ? candet.Address : null,
                resetPassId: reset_pass_id,
                job_invitations: [job_id],
                tools: job.skills ? job.skills : [],
              });

              await newUser.save();

              let htmltext = `<h1>Invitation to join Job Portal</h1><br/><p>You have been invited for the job interview for <b>${jobData.jobTitle}</b> .
                </p>
                <br/>
                <p>To continue with the interview inviation click on the link below ( or paste the link in the browser ) and login with the credentials given below : </p>
                <br/>
                <a href="${frontendUrl}/login" target="_blank">${frontendUrl}/login</a><br/>
                <p><b>Username :</b> ${newUser.username}</p><br/>
                <p><b>Password</b> ${pass} </p><br/>`;
              // await sendGridMail.send({
              //   to: email,
              //   from: supportEmail,
              //   subject: `Job Invitation for ${jobData.jobTitle} - Value Matrix`,
              //   html: htmltext,
              // });

              await sendEmailWithRetry({
                to: email,
                from: supportEmail,
                subject: `Job Invitation for ${jobData.jobTitle} - Value Matrix`,
                html: htmltext,
              });

              let invitations = []
              //invitations.push(newUser._id);
              candidates.map((value,index) => {
                if(value.FirstName === candet.FirstName && 
                    value.LastName === candet.LastName){
                    value.Uid = newUser._id;
                }
                invitations.push(value);
              })
              await Job.findOne({ _id: jobData._id }, async function (err, user) {
                user.invitations = invitations;
                await user.save();
              }).clone();
              }
            })
            
          }
      }
     }) 
    }
    
  } catch (error) {
    console.log('Error : ', error)
  }
}
// end


// job invitation to the candidate 

export const sendJobInvitation = async (job, indx, candet) => {
  try {
    let job_id = job._id;
    let candidates = job.invitations;
    let jobId = "";
    // pushing in hold Wallet
    // let creditHold ={
    //   jobId:mongoose.Types.ObjectId(job._id) ,
    //   amount : candidates.length,
    //   userId:job.uploadBy,
    //   user_type:"Company",

    // }
    // let Wallet = new holdWallet(creditHold);
    // await Wallet.save();
    // //Deducting From Wallet

    // let data = await userCredit_info.findOneAndUpdate({userId:job.uploadBy},{$inc : {credit : -candidates.length}})
  
    let indcount = 0;

    await User.findOne({
      $or:[
        {
          email: candet.Email
        },
        {
          contact: candet.Contact
        }
      ]
    }, async function (error,result) {
        if (result) {
          if (!result.job_invitations.includes(result._id)) {
            let i = result.job_invitations ? result.job_invitations : [];
            i.push((job_id).valueOf());
            result.job_invitations = i;
            await result.save();
            
            await User.findOneAndUpdate(
              { _id: result._id },
              { job_invitations: i }
            );

            let noti = new Notification({
              forAll: false,
              title: "Job Invitation - " + job.jobTitle,
              message:
                "You have been invited for the job " +
                job.jobTitle,
              // " by " +
              // res.username,
              sendTo: [result._id],
              type: "Notification",
            });
            await noti.save();

            let html = `<h1>Job Invitation</h1>
            <br/>
            <p>
              You have been invited for the job <b>${job.jobTitle}</b>
            </p>
            <p>
              Instructions to attend the interview:
            </p>
            <ol>
              <li>Login to the platform 10 minutes before the interview.</li>
              <li>Click on the "Join" button against the interview.</li>
              <li>Follow the instructions provided on the page.</li>
              <li>When prompted, please share the entire screen and not just one window.</li>
              <li>If prompted, please enable video and share the system sound.</li>
              <li>Please follow the instructions for checking a few things.</li>
              <li>After checking, a gray "Waiting" button might be displayed. Once the meeting starts, the waiting button would turn to "Join" and turn green in color.</li>
              <li>Click on the "Join" button to enter the meeting room.</li>
            </ol>
            <br/>
            <p>Please log on and check out the job invitations at:</p>
            <a href="${frontendUrl}/login" target="_blank">${frontendUrl}/login</a>`;

            await sendGridMail.send({
              to: result.email,
              from: supportEmail,
              subject: `Job Invitation for ${job.jobTitle} - Value Matrix`,
              html: html,
            });
          
            const updatedData = candidates.map(x => (x.Email === candet.Email ? { ...x, Status: "Invited", Uid:result._id } : x));
            
            await Job.findOne({ _id: job._id },async function (err, user) {
              user.invitations = updatedData;
              await user.save();
            }).clone()
            
          }
        } else {
          let id = v4();
          let pass = generatePassword();
          let reset_pass_id = id;
          let newUser = new User({
            username: id,
            firstName: candet.FirstName ? candet.FirstName : "",
            lastName: candet.LastName ? candet.LastName : "",
            email: candet.Email,
            contact: candet.Contact,
            password: passwordHash.generate(pass),
            user_type: "User",
            invite: 1,
            address: candet.Address ? candet.Address : null,
            resetPassId: reset_pass_id,
            job_invitations: [job_id],
            tools: job.skills ? job.skills : [],
          });

          await newUser.save();

          let htmltext = `<h1>Invitation to join Job Portal</h1><br/><p>You have been invited for the job interview for <b>${job.jobTitle}</b> .
            </p>
            <br/>
            <p>To continue with the interview inviation click on the link below ( or paste the link in the browser ) and login with the credentials given below : </p>
            <br/>
            <a href="${frontendUrl}/login" target="_blank">${frontendUrl}/login</a><br/>
            <p><b>Username :</b> ${candet.Email}</p><br/>
            <p><b>Password</b> ${pass} </p><br/>`;
          await sendGridMail.send({
            to: candet.Email,
            from: supportEmail,
            subject: `Job Invitation for ${job.jobTitle} - Value Matrix`,
            html: htmltext,
          });

          let invitations = []
          //invitations.push(newUser._id);
          candidates.map((value,index) => {
            if(value.FirstName === candet.FirstName && 
                value.LastName === candet.LastName){
                value.Uid = newUser._id;
            }
            invitations.push(value);
          })
          await Job.findOne({ _id: job._id }, async function (err, user) {
            user.invitations = invitations;
            await user.save();
          }).clone();
        }
        // add candidate to the candidate info collection
        const CandidadeCount = await Candidate.count();
        const candidateInfo = {
          email: candet.Email,
          phoneNo: candet.Contact,
          firstName: candet.FirstName ? candet.FirstName : "",
          lastName: candet.LastName ? candet.LastName : "",
          candidate_id: CandidadeCount + 1,
          jobId:job_id,
        }
        await Candidate.findOne({$or:[
          {
            email: candet.Email
          },
          {
            contact: candet.Contact
          }
        ]}).then(async(data)=>{
          if (!data) {
            let newCandidate = new Candidate(candidateInfo);
            await newCandidate.save();
          }
        })
        
    }).clone()
    
  } catch (err) {
    throw err
  }
};

export const sendJobInvite = async (job, indx, candet) => {
  try {
    let job_id = job._id;
    let candidate = job.invitations;
    let jobId = "";
    // pushing in hold Wallet
    let creditHold ={
      jobId:mongoose.Types.ObjectId(job._id) ,
      amount : candidates.length,
      userId:job.uploadBy,
      user_type:"Company",

    }
    let Wallet = new holdWallet(creditHold);
    await Wallet.save();
    //Deducting From Wallet

    let data = await userCredit_info.findOneAndUpdate({userId:job.uploadBy},{$inc : {credit : -candidates.length}})
  
    // await JobBin.findOne({ _id: mongoose.Types.ObjectId(job_id) }, async function (err1, res1) {
    let invitations = [];
    let indcount = 0;
    await candidates.forEach(async (candidate, index) => {
      if(indcount == indx){
        await User.findOne(
          {
            $or: [
              {
                email: candidate.Email,
              },
              {
                contact: candidate.Contact,
              },
            ],
          },



          async function (error, result) {
            if (result) {
              if (!result.job_invitations.includes(result._id)) {
                let i = result.job_invitations ? result.job_invitations : [];
                i.push((job_id).valueOf());
                invitations.push({
                  FirstName: candet.FirstName,
                  LastName: candet.LastName,
                  Email: candet.Email,
                  Contact: candet.Contact,
                  Address: candet.Address,
                  Uid: result._id.toString(),
                  Status: "Invited"
                });
                result.job_invitations = i;
                await result.save();
                await User.findOneAndUpdate(
                  { _id: result._id },
                  { job_invitations: i }
                );

                let noti = new Notification({
                  forAll: false,
                  title: "Job Invitation - " + job.jobTitle,
                  message:
                    "You have been invited for the job " +
                    job.jobTitle,
                  // " by " +
                  // res.username,
                  sendTo: [result._id],
                  type: "Notification",
                });
                await noti.save();

                let html = `<h1>Job Invitation</h1>
                <br/>
                <p>
                  You have been invited for the job <b>${job.jobTitle}</b> 
                </p><br/>
                <p>Please logon and check out the job invitations at :</p><br/>
                <a href="${frontendUrl}/login
                " target="_blank">${frontendUrl}/login</a>`;

                await sendGridMail.send({
                  to: result.email,
                  from: supportEmail,
                  subject: `Job Invitation for ${job.jobTitle} - Value Matrix`,
                  html: html,
                });

                if (index === candidates.length - 1) {
                  await Job.findOne(
                    { _id: job._id },
                    async function (err, user) {
                      user.invitations = invitations;
                      await user.save();
                    }).clone()
                }
              }
            } else {
              let id = v4();
              let pass = generatePassword();
              let reset_pass_id = id;
              let newUser = new User({
                username: id,
                firstName: candidate.FirstName ? candidate.FirstName : "",
                lastName: candidate.LastName ? candidate.LastName : "",
                email: candidate.Email,
                contact: candidate.Contact,
                password: passwordHash.generate(pass),
                user_type: "User",
                invite: 1,
                address: candidate.Address ? candidate.Address : null,
                resetPassId: reset_pass_id,
                job_invitations: [job_id],
                tools: job.skills ? job.skills : [],
              });

              await newUser.save();

              const CandidadeCount = await Candidate.count();
                
              const candidateInfo = {
                email: candidate.Email,
                phoneNo: candidate.Contact,
                firstName: candidate.FirstName ? candidate.FirstName : "",
                lastName: candidate.LastName ? candidate.LastName : "",
                candidate_id: CandidadeCount + 1,
                jobId:job_id,
              }
              
              let newCandidate = new Candidate(candidateInfo);
              await newCandidate.save();

              invitations.push(newUser._id);
              let htmltext = `<h1>Invitation to join Job Portal</h1><br/><p>You have been invited for the job interview for <b>${job.jobTitle}</b> .
                </p>
                <br/>
                <p>To continue with the interview inviation click on the link below ( or paste the link in the browser ) and login with the credentials given below : </p>
                <br/>
                <a href="${frontendUrl}/login" target="_blank">${frontendUrl}/login</a><br/>
                <p><b>Username :</b> ${candidate.Email}</p><br/>
                <p><b>Password</b> ${pass} </p><br/>`;
              await sendGridMail.send({
                to: candidate.Email,
                from: supportEmail,
                subject: `Job Invitation for ${job.jobTitle} - Value Matrix`,
                html: htmltext,
              });
              if (index === candidates.length - 1) {
                await Job.findOne(
                  { _id: job._id },
                  async function (err, user) {
                    user.invitations = invitations;
                    await user.save();
                  }).clone();
              }
            }
          }
        ).clone();

        jobId = await FindCandidateByEmail(candidate.Email, job_id);

      }
      indcount = indcount + 1;
    });

  } catch (err) {
    throw err
  }
};

// Approve job
// Approve job
export const approveJob = async (req, res) => {
  try {
    const jobData = await JobBin.findOne({ _id: req.body._id }).lean();

    let pSkills = [];
    if (jobData) {
      for (let i = 0; i < jobData.skills.length; i++) {
        const e = jobData.skills[i];
        pSkills.push(e.primarySkill);
      }
    }
    pSkills = [...new Set(pSkills)];
   
    let result = await XIPanels.findOne({_id : jobData?.panelId})
      
    let matchedXiList = result?.xiIds
    
    matchedXiList = [...new Set(matchedXiList)];
    console.log(
      "In total " +
        matchedXiList.length +
        " XI's matched for Job ID:" +
        req.body._id
    );
    if (matchedXiList.length == 0) {
      res.status(204).send({ message: "No matched xis found" });
    } else {
      let jobBinId = jobData._id
      delete jobData._id;
      delete jobData.__v;
      res.send(jobData.__v);
      jobData.matchedXis = matchedXiList;
      jobData.invitations = jobData.invitations;
      jobData.status = "Active";
      jobData.panelId = jobData.panelId;

      await Job.create(jobData).then(async (result) => {
        
        if (result) {
          // await approveJobandSendInvitation(result);
          let candidateDetails = result.invitations;
          if (candidateDetails.length > 0) {
            updateCandidateInfo(candidateDetails,result._id,result.uploadBy,jobBinId);
          }
        }
      });
      await JobBin.findOneAndDelete({ _id: req.body._id });
      res.send();
    }
  } catch (err) {
    // res.send(err);
  }
};


        
   
export const approveCandidate = async (req, res) => {
  try {
    const jobData = await Job.findOne({ _id: req.body._id }).lean();
    sendJobInvitation(jobData, req.body.index, req.body.candet);
    res.send();
  } catch (err) {
    res.send(err);
  }
};

// Approve newly added candidates for an approved job
export const approveNewCandidates = async(req,res)=>{
  try {
    const jobData = await Job.findOne({ _id: req.body._id }).lean();
    sendInvitationToNewCandidates(req.body._id, req.body.index, req.body.candet,jobData);
    res.send()
  } catch (error) {
    res.send(error);
  }
}

// list of unapproved jobs
export const listOfUnapproveJobs = async (req, res) => {
  try {
    const jobData = await JobBin.find({draft: false}).sort({ "_id": -1 });
    res.send(jobData);
  } catch (err) {
    res.send(err);
  }
};

// list of unapproved jobs
export const listOfUnapproveJobswithPagination = async (req, res) => {
  try {
    const page = req.query.page || 1; 
    const pageSize = 5;
    const skip = (page - 1) * pageSize;
    const jobData = await JobBin.find({draft: false}).sort({ "_id": -1 }).skip(skip).limit(pageSize);
    
    const totalItems = await JobBin.countDocuments();
    
    res.json({
      jobData,
      totalPages: Math.ceil(totalItems / pageSize),
      currentPage: page,
    });
  } catch (err) {
    res.send(err);
  }
};


export const allJobs = async (req, res) => {
  try {
    const jobData = await Job.find({ draft: false }).sort({ "_id": -1 });
    res.send(jobData);
  } catch (err) {
    res.send(err);
  }
};

export const allJobswithPagination = async(req,res)=>{
  try {
    const page = req.query.page || 1; 
    const pageSize = 5;
    const skip = (page - 1) * pageSize;
    const jobData = await Job.find({draft: false}).sort({ "_id": -1 }).skip(skip).limit(pageSize);
    
    const totalItems = await Job.countDocuments();
    
    res.json({
      jobData,
      totalPages: Math.ceil(totalItems / pageSize),
      currentPage: page,
    });
  } catch (err) {
    res.send(err);
  }
}

const FindCandidateByEmail = async (email, job_id) => {
  return new Promise((resolve, reject) => {
    let jobId = [];
    Candidate.findOne({ email: email }, async function (err, user) {
      if (err) {
        throw err
      } if(user){
        let newJobID;
        if (user.jobId === "" || user.jobId === null) {
          newJobID = job_id;
        } else {
          newJobID = user.jobId.concat(",", job_id);
        }

        user.jobId = newJobID;
        jobId = newJobID;

        await user.save();
        resolve(jobId);}
    }).clone();
  
  });
};



export const jobStatusChange = async (req, res) => {
  try {
    let statusData = await job.findOneAndUpdate({ _id: req.body.job_id }, { $set: { status: req.body.status } }, { new: true })
    if (statusData.status === req.body.status) {
      res.send({ data: "update successfully" }).status(200);
    } else {
      res.send({ data: "status not updated!" }).status(400);
    }
  }
  catch (err) {
    res.send({ data: "something went wrong", err }).status(400);
  }
}
var ObjectId = mongoose.Types.ObjectId;

export const jobDetailsUploadedByUser = async (req, res) => {
  try {

    const data = await job.aggregate([
      { $match: { uploadBy: ObjectId(req.query.userId) } },
      {
        $lookup: {
          from: "interviewapplications",
          localField: "_id",
          foreignField: "job",
          as: "interviewApplication",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "interviewApplication.applicant",
          foreignField: "_id",
          as: "user",
        },
      },
    ]);
    res.send(data).status(200);
  }
  catch (err) {
    res.send(err)
  }
}

export const jobDetailsByJobId = async (req, res) => {
  try {

    const data = await job.aggregate([
      { $match: { _id: ObjectId(req.query.userId) } },
      {
        $lookup: {
          from: "interviewapplications",
          localField: "_id",
          foreignField: "job",
          as: "interviewApplication",
        },
      },
    ]);
    res.send(data).status(200);
  }
  catch (err) {
    res.send({ data: "something went wrong", err }).status(400);
  }
}

export const UserDetailsByJobId = async (req, res) => {
  try {

    const data = await job.aggregate([
      { $match: { _id: ObjectId(req.query.userId) } },
      {
        $lookup: {
          from: "interviewapplications",
          localField: "_id",
          foreignField: "job",
          as: "interviewApplication",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "interviewApplication.applicant",
          foreignField: "_id",
          as: "user",
        },
      },
    ]);
    res.send(data).status(200);
  }
  catch (err) {
    res.send(err)
  }
}

export const deletePendingJob = async(req,res)=>{
  try {
    let jobId = req.body._id
    await jobBin.deleteOne({_id : jobId}).then((result)=>{
      if (result && result.deletedCount) {
        res.send({message : 'job deleted'}).status(200);
      }else {
        res.send({message : 'job not found'}).status(404)
      }
    })
  } catch (error) {
    res.send(error)
  }
}

export const sendJobAcceptedNotification = async(applicationData)=>{
  try {
    let candidateDetails = await User.findOne({_id : applicationData.userId})
    await InterviewApplication.findOne({_id : applicationData.interviewId}).then(async(response)=>{
      if (response) {
        let jobDetails = await job.findOne({_id : response.job}).select({jobTitle : 1})
        
        let candidateEmail;
        if (candidateDetails.email) {
          candidateEmail = candidateDetails.email;
        } else if (
          candidateDetails.secondaryEmails &&
          candidateDetails.secondaryEmails.length > 0
        ) {
          candidateEmail = candidateDetails.secondaryEmails[0];
        }

        let formatedDate = await formatDateTime(applicationData.startDate);

        let noti = new Notification({
          forAll: false,
          title: "Job Invitation - " + jobDetails.jobTitle,
          message: "Your Interview invitation for " + job.jobTitle + " is accepted",
          sendTo: [candidateDetails._id],
          type: "Notification",
        });
        await noti.save();
        
        let html = `<h3>${jobDetails?.jobTitle}</h3>
          <br/>
          Hi ${candidateDetails?.firstName},
          <br/>
          Your request for the interview for <b>${jobDetails.jobTitle}</b> on ${formatedDate} is accepted.
          <br/>
          Please do login to the valuematrix platform atleast 15 minutes before interview. 
          <br/> 
          If you are facing any technical difficulties please reach to us at, support@valuematrix.ai. 
          <br/>
          Best regards.
          <br/>
          Valuematrix.ai Team. `;
        
       
        sendGridMail.send({
          to: candidateEmail,
          from: supportEmail,
          subject: `Valuematrix - Scheduled interview reminder ${jobDetails.jobTitle}`,
          html: html,
        });
        return {status:200,message:'success'}
      }
    })
  } catch (error) {
    console.log('Error : ', error) 
  }
}

export const sendJobReceivedNotification = async (applicationData) => {
  try {
    let xiDetails = await User.findOne({ _id: applicationData.userId });

    let jobDetails = await job.findOne({ _id: applicationData.jobId });
    if (jobDetails) {
      let interviwerEmail;
      if (xiDetails.email) {
        interviwerEmail = xiDetails.email;
      } else if (
        xiDetails.secondaryEmails &&
        xiDetails.secondaryEmails.length > 0
      ) {
        interviwerEmail = xiDetails.secondaryEmails[0];
      }

      let formatedDate = await formatDateTime(applicationData.startDate);

      if (jobDetails) {
        let noti = new Notification({
          forAll: false,
          title: "Job Invitation - " + jobDetails.jobTitle,
          message: "You have been invited for the job " + jobDetails.jobTitle,
          sendTo: [xiDetails._id],
          type: "Notification",
        });
        await noti.save();

        let html = `<h1>Job Invitation</h1>
          <br/>
          <p>
            You have been invited for the job <b>${jobDetails.jobTitle}</b> 
          </p><br/>
          Please do login to the valuematrix platform atleast 15 minutes before interview. 
          <br/> 
          If you are facing any technical difficulties please reach to us at, support@valuematrix.ai. 
          <br/>
          <a href="${frontendUrl}/login
          " target="_blank">${frontendUrl}/login</a>`;
      
        await sendGridMail.send({
          to: interviwerEmail,
          from: supportEmail,
          subject: `Job Invitation for ${jobDetails.jobTitle} - Value Matrix`,
          html: html,
        });
        return { status: 200, message: "success" };
      }
    }
   
    
  } catch (error) {
    console.log("Error : ", error);
  }
};
export const candidateDetailsByJobId = async(jobId)=>{
  try {
    let jobDetails = await Job.findOne({_id : jobId})
    if (jobDetails) {
      let companyId = jobDetails.uploadBy;

      let query = {
        $or: [
          {
            "inviteDetails.jobId": mongoose.Types.ObjectId(jobId),
          },
          {
            $expr: {
              $eq: [{ $toString: "$inviteDetails.jobId" }, jobId],
            },
          },
        ],
      };
      
      // const query = {
      //   'inviteDetails.jobId' : mongoose.Types.ObjectId(jobId)
      // }
      let candidateDetails = await candidateInfo.find(query)
      return { status: 200, candidates: candidateDetails };
    }
  } catch (error) {
    console.log('Error : ', error)
  }
}

export const getAllCandidatesOfJob = async (request, response) => {
  try{
    let jobId = request?.params?.jobID;
    console.log("jobId :",jobId);
    if(jobId){
      let query = {
        $or: [
          {
            "inviteDetails.jobId": mongoose.Types.ObjectId(jobId),
          },
          {
            $expr: {
              $eq: [{ $toString: "$inviteDetails.jobId" }, jobId],
            },
          },
        ],
      };
      candidateInfo.aggregate([
        {
          '$match': query
        }, {
          '$lookup': {
            'from': 'users', 
            'localField': 'email', 
            'foreignField': 'email', 
            'as': 'user'
          }
        }, {
          '$project': {
            'candidate_id': 1, 
            'firstName': 1, 
            'lastName': 1, 
            'email': 1, 
            'phoneNo': 1, 
            'inviteDetails.invitedDate': 1, 
            'user._id': 1
          }
        }
      ]).then(async (candidates) =>{
        console.log("candidates :",candidates);
        if(candidates && candidates.length>0){
          response.status(200).send({candidates:candidates});
        }else{
          response.status(400).send({message:"No candidates found for Job ID " +jobId +" - GACOJ002"});
        }
      });
    }else{
      response.status(400).send({message:"Job ID cannot be null or empty - GACOJ001"});
    }
  }catch(err){
    console.log(err);
    response.status(400).send({message:"Something went wrong - GACOJ000"});
  }
}
