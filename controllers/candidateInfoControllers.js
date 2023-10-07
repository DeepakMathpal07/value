import mongoose from 'mongoose'
import candidateInfo from "../models/candidateInfo.js";
import {approveJobandSendInvitation} from '../controllers/job-controller.js'
import job from '../models/jobSchema.js';
import jobBin from '../models/jobBinSchema.js';
import user from '../models/userSchema.js';

// Insert candidate data into candiateInfo Collection
export const addCandidateInfo = async(candidateData,jobId,companyId)=>{
  try {
    let query = {
      email: candidateData.Email,
      "inviteDetails.jobId": jobId,
      
    };

    if (jobId.trim() !== "") {
         jobId = mongoose.Types.ObjectId.isValid(jobId)
           ? mongoose.Types.ObjectId(jobId)
           : jobId;
       }

      let candidateExists = await candidateInfo.findOne(query)
      if (!candidateExists) {
        let newCandidate = {
          email: candidateData.Email ? candidateData.Email : candidateData.email,
          phoneNo: candidateData.Contact ? candidateData.Contact : candidateData.phoneNo,
          firstName: candidateData.FirstName ? candidateData.FirstName : candidateData.firstName,
          lastName: candidateData.LastName ? candidateData.LastName : candidateData.lastName,
          candidate_id: candidateData.Uid ? candidateData.Uid : "",
          inviteDetails: {
            jobId: jobId,
            companyId: companyId,
            invitedDate: "",
          },
        };
        let response = {};
        let candidate = new candidateInfo(newCandidate).save()
       
        return candidate;
      }

    } catch (error) {
      console.log('Error : ', error)
    }
}

// Update candidateInfo collection while approving job
export const updateCandidateInfo = async(candidateData,jobId,companyId,jobBinId)=>{
    try {
      let jobData = {}
      jobData._id = jobId
      jobData.invitations = candidateData

      // First find company id of that user
      let companyDetails = await user.findOne({_id : companyId},{company_id:1})
      
      if (companyDetails){
        let company_id = companyDetails.company_id;
        for (let i = 0; i < candidateData.length; i++) {
          const elem = candidateData[i];
          let query = {
            email: elem.Email ? elem.Email : elem.email,
            "inviteDetails.invitedDate": "",
            "inviteDetails.jobId": jobBinId,
          };
          let candidateDetails = await candidateInfo.findOne(query);
          if (candidateDetails) {
            let dataForUpdate = {
              jobId,
              companyId: company_id,
              invitedDate: "",
            };
            
            await candidateInfo.updateOne(query,{$set:{'inviteDetails' : dataForUpdate}}).then(async()=>{
              await approveJobandSendInvitation(jobId).then(async()=>{
                await candidateInfo.updateOne({'inviteDetails.invitedDate' : '', 'inviteDetails.jobId':jobId},{$set:{'inviteDetails.invitedDate': new Date()}})
              })
            })
          } else {
            let query = {
              email: elem.Email ? elem.Email : elem.email,
              "inviteDetails.jobId": mongoose.Types.ObjectId(jobId),
              "inviteDetails.invitedDate": "",
            };
             await approveJobandSendInvitation(jobId).then(async()=>{
                await candidateInfo.updateOne({'inviteDetails.invitedDate' : '', 'inviteDetails.jobId':jobId},{$set:{'inviteDetails.invitedDate': new Date()}})
             })
          }
        } 
        
      }
    }catch (error) {
      console.log('Error : ', error)
    }
}

// Get candidate Info from jobId
export const getCandidateInfo = async(jobId)=>{
    try {
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
        let response = {}
        let candidateDetails = await candidateInfo.find(query)
        if (candidateDetails.length == 0) {
          let jobDetails = await jobBin.findOne({_id : jobId})
          candidateDetails = jobDetails?.invitations;
        }
       
        response.candidateDetails = candidateDetails;
        return response
    } catch (error) {
        console.log('Error : ', error)
    }
}

// Delete candidateInfo
export const deleteCandidateInfo = async(id)=>{
  try {
    await candidateInfo.deleteOne({_id : id}).then((response)=>{
      return response
    })
  } catch (error) {
    console.log('Error : ', error)
  }
}

// Get all candidates under a company
export const getCandidateListofCompany = async(companyId)=>{
  try {
    let query = {
      $or: [
        {
          "inviteDetails.companyId": mongoose.Types.ObjectId(companyId),
        },
        {
          $expr: {
            $eq: [{ $toString: "$inviteDetails.companyId" }, companyId],
          },
        },
      ],
    };
    let candidateDetails = await candidateInfo.find(query)
    return candidateDetails
  } catch (error) {
    console.log('Error : ', error)
  }
}