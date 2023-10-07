import mongoose from "mongoose";
import { } from "dotenv/config.js";
import fs from "fs";
import sendGridMail from "@sendgrid/mail";
import axios from "axios";
import interview from "../models/interviewApplicationSchema.js";
import interviewQuestion from "../models/interviewQuestionSchema.js";
import InterviewApplication from "../models/interviewApplicationSchema.js";
import Slot from "../models/slot.js";
import Job from "../models/jobSchema.js";
import { job } from "cron";
import User from "../models/userSchema.js";
import fetch from 'node-fetch';
import Jimp from 'jimp';
import zlib from 'zlib';
import AWS from 'aws-sdk';
import { response } from "express";

let savedURLs = []
const url = process.env.BACKEND_URL;
const frontendUrl = process.env.FRONTEND_URL;
const orgid = process.env.ORGID;
const apikey = process.env.DYTEAPIKEY;
const dyteBase64 = process.env.DYTEBASE64;
const proctoringurl= process.env.HEIMDALL_URL;
// Config for AWS S3
const recordings = process.env.AWS_S3_PROFILE_RECORDINGS_BUCKET_FOLDER;
const region = process.env.AWS_S3_RECORDINGS_BUCKET_REGION;
const accessKeyID = process.env.AWS_S3_ACCESS_KEY_ID;
const accessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;
const bucket = process.env.AWS_S3_BUCKET_NAME;
const recordingsURL=process.env.AWS_S3_RECORDINGS_URL;
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
const supportEmail=process.env.VM_SUPPORT_EMAIL;

AWS.config.update({
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY
});
let s3 = new AWS.S3();


export const getinterviewdetailsForBaseline = async (request, response) => {
  try {
    let interviewDetails = await interview.findById(request?.body?.meetingID);
    response.status(200).send({
      data: "Data Fetched",
      meetingID: interviewDetails.meetingID,
      faceTest: false,
      gazeTest: false,
      personTest: false,
      earTest: false,
      interviewStatus: interviewDetails.interviewStatus,
      jobid: interviewDetails.job.toString(),
      interviewState:interviewDetails.interviewState,
    });
  }
  catch (err) {
    response.status(400).send({ data: "something went wrong", err });
  }
};

export const getinterviewdetails = async (request, response) => {
  try {
    let interviewDetails = await interview.findById(request.body.meetingID);
    response.send({
      data: "Data Fetched",
      meetingID: interviewDetails.meetingID,
      meetingRoom: interviewDetails.meetingRoom,
      faceTest: interviewDetails.faceTest,
      gazeTest: interviewDetails.gazeTest,
      personTest: interviewDetails.personTest,
      earTest: interviewDetails.earTest,
      interviewStatus: interviewDetails.interviewStatus
    }).status(200);
  }
  catch (err) {
    response.send({ data: "something went wrong", err }).status(400);
  }
};


export const getInterviewStatus = async (request, response) => {
  try {
    let interviewDetails = await interview.findById(request.body.meetingID);
    //console.log("interviewDetails:");
    //console.log(interviewDetails);
    //console.log(interviewDetails.status);
    response.send({
      data: "Data Fetched",
      interviewStatus: interviewDetails.status,
      interviewState:interviewDetails.interviewState
    }).status(200);
  }
  catch (err) {
    response.send({ data: "something went wrong", err }).status(400);
  }
};


export const checkinterviewdetails = async (request, response) => {
  try {
    // console.log(request.body);
    let interviewDetails = await interview.findById(request?.body?.meetingID);
    if(interviewDetails.meetingID === null){
      axios.post("https://api.cluster.dyte.in/v1/organizations/"+orgid+"/meeting",{
        "title": "Value Matrix Interview Room #"+request.body.meetingID,
        "authorization":{
            "waitingRoom":false
        }
      },{headers:{Authorization: apikey}}).then(async (rspns)=>{
        var meetingdata = rspns.data.data.meeting;
        let interviewDetails = await interview.findOneAndUpdate({ _id: request.body.meetingID }, { $set: { meetingID: meetingdata.id, meetingRoom: meetingdata.roomName } }, { new: true });
        if(interviewDetails.interviewers[i] === request.body.participant._id ||
            JSON.stringify(interviewDetails.applicant) === '"'+request.body.participant._id+'"'){
          axios.post("https://api.cluster.dyte.in/v1/organizations/"+orgid+"/meetings/"+interviewDetails.meetingID+"/participant",{
            "clientSpecificId": request.body.participant._id,
            "userDetails": {
              "name": request.body.participant.firstName,
              "picture": `${url}/media/profileImg/${request.body.participant.profileImg}`
            },
          },{headers:{Authorization: apikey}}).then(async (userresponse)=>{
            var userAuthToken = userresponse.data.data.authResponse.authToken;
            response.send({
              data: "Data Retrieved",
              meetingID: interviewDetails.meetingID,
              meetingRoom: interviewDetails.meetingRoom,
              authToken: userAuthToken,
              faceTest: interviewDetails.faceTest,
              gazeTest: interviewDetails.gazeTest,
              personTest: interviewDetails.personTest,
              earTest: interviewDetails.earTest,
              interviewStatus: interviewDetails.interviewStatus,
              jobid: interviewDetails.job.toString(),
              interviewState:interviewDetails.interviewState,
            }).status(200);
            // console.log(userAuthToken);
          });
        }
      });
    }else{
      if(JSON.stringify(interviewDetails.applicant) === '"'+request.body.participant._id+'"'){
        axios.post("https://api.cluster.dyte.in/v1/organizations/"+orgid+"/meetings/"+interviewDetails.meetingID+"/participant",{
          "clientSpecificId": request.body.participant._id,
          "userDetails": {
            "name": request.body.participant.firstName,
            "picture": `${url}/media/profileImg/${request.body.participant.profileImg}`
          },
        },{headers:{Authorization: apikey}}).then(async (userresponse)=>{
          var userAuthToken = userresponse.data.data.authResponse.authToken;
          response.send({
            data: "Data Retrieved",
            meetingID: interviewDetails.meetingID,
            meetingRoom: interviewDetails.meetingRoom,
            authToken: userAuthToken,
            faceTest: interviewDetails.faceTest,
            gazeTest: interviewDetails.gazeTest,
            personTest: interviewDetails.personTest,
            earTest: interviewDetails.earTest,
            interviewStatus: interviewDetails.interviewStatus,
            livestream: interviewDetails.livestream,
            jobid: interviewDetails.job.toString(),
            interviewState:interviewDetails.interviewState,
          }).status(200);
          // console.log(userAuthToken);
        });
      }else{
        for(var i=0;i<interviewDetails.interviewers.length;i++){
          if(interviewDetails.interviewers[i] === request.body.participant._id){
            axios.post("https://api.cluster.dyte.in/v1/organizations/"+orgid+"/meetings/"+interviewDetails.meetingID+"/participant",{
              "clientSpecificId": request.body.participant._id,
              "userDetails": {
                "name": request.body.participant.firstName,
                "picture": `${url}/media/profileImg/${request.body.participant.profileImg}`
              },
            },{headers:{Authorization: apikey}}).then((userresponse)=>{
              var userAuthToken = userresponse.data.data.authResponse.authToken;
              response.send({
                data: "Data Retrieved",
                meetingID: interviewDetails.meetingID,
                meetingRoom: interviewDetails.meetingRoom,
                authToken: userAuthToken,
                faceTest: interviewDetails.faceTest,
                gazeTest: interviewDetails.gazeTest,
                personTest: interviewDetails.personTest,
                earTest: interviewDetails.earTest,
                interviewStatus: interviewDetails.interviewStatus,
                jobid: interviewDetails.job.toString(),
                interviewState:interviewDetails.interviewState,
              }).status(200);
              // console.log(userAuthToken);
            });
          }
          if(i == interviewDetails.interviewers.length-1 && interviewDetails.interviewers[i] != request.body.participant._id){
            response.send({
              data: "Not Authorized"
            }).status(200);
          }
        }
      }
    }
  }
  catch (err) {
    console.log(err);
    response.send({ data: "something went wrong", err }).status(400);
  }
};

export const startlivemeet = async (req, response)=>{
  try{
    await axios.post("https://api.cluster.dyte.in/v2/meetings/"+req.body.meetingID+"/livestreams",{
      name: req.body.room
    },{
      headers:{
        Authorization: 'Basic YzJjM2RkZTgtMGUzNy00NWVkLTlkNGEtZTMyNGE1ZjNmZGNlOmE5Nzc2NjM0YmMwNGUxNTczZDI2',
      }
    }).then((data)=>{
      response.send(data);
    }).catch( async (err)=>{
      let respp = await axios.get("https://api.cluster.dyte.in/v2/meetings/"+req.body.meetingID+"/active-livestream", {
        headers:{
          Authorization: 'Basic YzJjM2RkZTgtMGUzNy00NWVkLTlkNGEtZTMyNGE1ZjNmZGNlOmE5Nzc2NjM0YmMwNGUxNTczZDI2'
        }
      });
      response.send(respp).status(200);
      // .then((res2)=>{ response.send(res2).status(200); })
      // .catch((err)=> { response.send({ data: "something went wrong", err }).status(400); })
    });
  }catch(err){
    response.send({ data: "something went wrong 2", err }).status(400);
  }
}

export const startproctoring = async (id, link) => {
	try {
		return await axios.post(`${proctoringurl}/task/${id}`, {
			job_id: id,
			link: link,
		});
	} catch (err) {
		//console.log("Error : " + err);
	}
};

/* In case the candidate doesn't join the call */
export const handleNoShow = async (request, response)=>{
  try{
    let updatedinterviewstatus = await interview.findOneAndUpdate({ _id: request.body.interviewID }, { $set: { interviewStatus: false, interviewState:3} });
    response.send({
      data: "Interview Ended",
    }).status(200);
  }catch(err){
    response.send({ data: "something went wrong", err }).status(400);
  }
}
export const handleLeave = async (request, response)=>{
  try{
    let updatedinterviewstatus = await interview.findOneAndUpdate({ _id: request.body.interviewID }, { $set: { interviewStatus: false, interviewState:2 } });
    response.send({
      data: "Interview Ended",
    }).status(200);
  }catch(err){
    response.send({ data: "something went wrong", err }).status(400);
  }
}
// Handle leave for interviewer
/*export const handleLeave =async (request, response)=>{
  response.send("Good to go").status(200);
  // Recordings are no longer handled via code. The recordings are directly populated by dyte to s3
  // let meetingID = request?.body?.meetingID;
  // let interviewID = request?.body?.interviewID;
  // if(meetingID){
  //   let getrec = await axios.get("https://api.cluster.dyte.in/v1/organizations/" + `${orgid}` + "/meetings/" + meetingID + "/recordings", {
  //     headers: {
  //       Authorization: `${apikey}`,
  //     }
  //   });
  //   if(getrec){
      
  //     console.log("getrec?.data?.data?.recordings?.downloadUrl")
  //     let length = getrec?.data?.data?.recordings;
  //     getrec?.data?.data?.recordings.map((recording,i) => {
  //       handleRecordingURL(recording.downloadUrl,interviewID,i,length);
  //     });
  //   }else{
  //     console.log("No recordings for interview id : "+id);
  //     response.send("No recordings found").status(201);
  //   }
  // }

} */

export const handleRecordingURL =async(url,interviewID,index,length) =>{
  if(url){
    const res = await fetch(url);
    const blob = await res.buffer();
    const uploadedRecordings = await s3.upload({
      Bucket: process.env.AWS_S3_BUCKET_NAME+"/"+process.env.AWS_S3_PROFILE_RECORDINGS_BUCKET_FOLDER,
      Key: interviewID +"_"+index+".mp4",
      Body: res,
    }).promise();
    if(uploadedRecordings){
      savedURLs.push(uploadedRecordings.Location.toString());
      let setrecording = await interview.findOneAndUpdate({ _id: interviewID },{ recording: savedURLs});
    }
  }
}

export const handleJoin = async (request, response)=>{
  //let startproct = await startproctoring(id, "");
  // start the live stream 
  let interviewID = request?.body?.interviewID;
  let meetingRoom = request?.body?.meetingRoom;
  let meetingID = request?.body?.meetingID;
  let dtResp;
  if(interviewID && meetingRoom && meetingID){
    await axios.post("https://api.cluster.dyte.in/v2/meetings/"+meetingID+"/livestreams",{
      name: meetingRoom
    },{
      headers:{
        Authorization: 'Basic '+`${dyteBase64}`,
      }
    }).then(async (dt)=>{
      dtResp = dt;
     /* setTimeout(async()=>{
        let startproct = await startproctoring(interviewID, playbackURL);
      },120000);*/
      let startproct = await startproctoring(interviewID, dtResp?.data?.data?.playback_url);

    }).catch( async (err)=>{
      //console.log(err); 
      // if live stream is already started then get the live stream url
      let respp = await axios.get("https://api.cluster.dyte.in/v2/meetings/"+meetingID+"/active-livestream", {
        headers:{
          Authorization: 'Basic '+`${dyteBase64}`
        }
      }).catch( async (err)=>{
        console.log(err.response.status);
      });
      if(respp){
        let startproct = await startproctoring(interviewID, dtResp?.data?.data?.playback_url);
        //console.log("startproct2"); 
        //console.log(startproct); 
      }
    });

    var data = JSON.stringify({
      storageConfig: {
        type: "aws",
        accessKey: `${accessKeyID}`,
        secret: `${accessKey}`,
        bucket: `${bucket}`,
        region: `${region}`,
        path: `${recordings}`+"/"+meetingID
      }
    });
    
    var config = {method: 'post',maxBodyLength: Infinity,
      url: 'https://api.cluster.dyte.in/v1/organizations/'+orgid+'/meetings/'+meetingID+'/recording',
      data: data,
      headers: { 
        //'Authorization': '6d128483b9aeba9ffea3', 
        'Authorization': `${apikey}`, 
        'Content-Type': 'application/json'
      }
    };

    let resp2 = axios(config).catch(function (error) {
      if(error.response.status===409){
        // do nothing
        response.send(interviewID).status(202);
      }else{
        console.log("interviewID:"+interviewID);
        console.log("meetingID:"+meetingID);
        console.log("error status: "+error.response.status);
        console.log(error);
        response.send("Something went wrong").status(400);
      }
    });
    // console.log("resp2");
    // console.log(resp2); 
    // resp2.then(
    //   console.log(resp2)
    // )
    response.send(interviewID).status(200);
  }else{
    console.log("interviewID:"+interviewID);
    console.log("meetingID:"+meetingID);
    response.send("Something went wrong").status(400);
  }
}

export const handlerecording = async (req, response)=>{
  const recordingURL = req.body.link;
  let setrecording = await interview.findOneAndUpdate({ _id: req.body.meetingID },{ recording: recordingURL});
  response.send({
    data:"Recording Saved",
    link: recordingURL
  }).status(200);
  //TODO : move this recording to AWS S3
  /*const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  });
  console.log("recordingURL");
  console.log(recordingURL);
  const res = await fetch(recordingURL);
  const blob = await res.buffer();
  const uploadedRecordings = await s3.upload({
    Bucket: process.env.AWS_S3_BUCKET_NAME+"/"+process.env.AWS_S3_PROFILE_RECORDINGS_BUCKET_FOLDER,
    Key: req.body.id + "_recording" + ".mp4",
    Body: blob,
  }).promise();
  console.log(uploadedRecordings);
  if(uploadedRecordings){
    let setrecording = await interview.findOneAndUpdate({ _id: req.body.meetingID },{ recording: uploadedRecordings.Location.toString() });
    response.send({
      data:"Recording Saved",
      link: uploadedRecordings.Location
    }).status(200);
  }else{
    response.status(404).json({ Message: "Something went wrong" });
  }*/
}

export const handleproctoring = async (req, res)=>{
  try{
    let setintv = await interview.findOneAndUpdate({ _id: req.body.id }, req.body.proctoring);
    res.send(setintv).status(200);
  }catch(err){
    return err;
  }
}

/**
 * 
 * API to update the code language
 * 
 */

export const updateCodeLanguage  = async (request, response)=>{
  try{
    let id = request?.body?.id;
    let language = request.body.language;
    if(id && language){
      let val = await interview.findOneAndUpdate({ _id: id }, { $set: { codelanguage: language}});
      response.send({data: "Updated Language"}).status(200);
    }else{
      response.send({messaged:"Language update failed"}).status(400);
    }
  }catch(err){
    console.error(err);
    response.send({messaged:"Language update failed"}).status(400);
  }
}
export const updateinterviewcheck = async (request, response)=>{
  try{
    //let image = request?.body?.image;
    if(request.body.type === "face"){
      //let updatedinterview = await interview.findOneAndUpdate({ _id: request.body.meetingID }, { $set: { faceTest: true,faceTestImg:image } }, { new: true });
      let updatedinterview = await interview.findOneAndUpdate({ _id: request.body.meetingID }, { $set: { faceTest: true} }, { new: true });
      response.send({
        data: "Updated Test",
        updatedinterview: updatedinterview
      }).status(200);
    }else if(request.body.type === "gaze"){
      let updatedinterview = await interview.findOneAndUpdate({ _id: request.body.meetingID }, { $set: { faceTest: true, gazeTest: true } }, { new: true });
      response.send({
        data: "Updated Test",
        updatedinterview: updatedinterview
      }).status(200);
    }else if(request.body.type === "person"){
      let updatedinterview = await interview.findOneAndUpdate({ _id: request.body.meetingID }, { $set: { faceTest: true, gazeTest: true, personTest: true } }, { new: true });
      response.send({
        data: "Updated Test",
        updatedinterview: updatedinterview
      }).status(200);
    }else if(request.body.type === "ear"){
      let updatedinterview = await interview.findOneAndUpdate({ _id: request.body.meetingID }, { $set: { faceTest: true, gazeTest: true, personTest: true, earTest: true } }, { new: true });
      response.send({
        data: "Updated Test",
        updatedinterview: updatedinterview
      }).status(200);
    }
  }catch(err){
    console.log(err);
    response.send({ data: "something went wrong", err }).status(400);
  }
}

export const updatelivestatus = async (request, response)=>{
  try{
    let updatedinterview = await interview.findOneAndUpdate({ _id: request.body.meetingID }, { $set: { livestats: request.body.stats } }, { new: true });
    response.send({
      data: "Updated Stats",
    }).status(200);
  }catch(err){
    response.send({ data: "something went wrong", err }).status(400);
  }
}

export const startinterview = async (request, response)=>{
  try{
    let updatedinterviewstatus = await interview.findOneAndUpdate({ _id: request.body.meetingID }, { $set: { interviewStatus: true, interviewState:1 } }, { new: true });
    response.send({
      data: "Interview Started",
    }).status(200);
  }catch(err){
    response.send({ data: "something went wrong", err }).status(400);
  }
}

export const endinterview = async (request, response)=>{
  try{
    let updatedinterviewstatus = await interview.findOneAndUpdate({ _id: request.body.meetingID }, { $set: { interviewStatus: false, status: "Interviewed", interviewState:2 } }, { new: true });
    response.send({
      data: "Interview Completed",
    }).status(200);
  }catch(err){
    response.send({ data: "something went wrong", err }).status(400);
  }
}

export const setquestionresult = async (request, response)=>{
  try{
    let interviewDetails = await interview.findById(request.body.meetingID);
    let newset = [...interviewDetails.generalQuestions, request.body.qn]
    let updatedinterviewstatus = await interview.findOneAndUpdate({ _id: request.body.meetingID }, { $set: { generalQuestions: newset } }, { new: true });
    response.send({
      data: "Interview Completed",
    }).status(200);
  }catch(err){
    response.send({ data: "something went wrong", err }).status(400);
  }
}

export const savecode = async (request, response)=>{
  try{
    let updatedcode = await interview.findOneAndUpdate({ _id: request.body.meetingID }, { $set: { codearea: request.body.code, codestdin: request.body.stdin, codestdout: request.body.stdout } }, { new: true });
    response.send({
      data: "Updated Code",
      newstats: updatedcode
    }).status(200);
  }catch(err){
    response.send({ data: "something went wrong", err }).status(400);
  }
}

export const updatewhiteboard = async (request, response)=>{
  try{
    let updatedcode = await interview.findOneAndUpdate({ _id: request.body.meetingID }, { $set: { whiteboard: request.body.data } }, { new: true });
    response.send({
      data: "Updated Whiteboard",
      newstats: updatedcode
    }).status(200);
  }catch(err){
    response.send({ data: "something went wrong", err }).status(400);
  }
}

export const getlivestatus = async (request, response)=>{
  try{
    let livestatus = await interview.findById(request.body.meetingID);
    response.send({
      data: "Data Retrieved",
      stats: livestatus
    }).status(200);
  }catch(err){
    response.send({ data: "something went wrong", err }).status(400);
  }
}

export const nullallchecks = async (request, response, next)=>{
  try{
    let initcheck = await interview.findOneAndUpdate({ _id: request.body.meetingID }, { $set: { faceTest: false, gazeTest: false, personTest: false, earTest: false } });
    return next();
  }catch{
    response.send({ data: "something went wrong", err }).status(400);
  }
}

export const compilecode = async (request, response)=>{
  try{
    let id = request?.body?.data.id;
    let resp = await interview.find({_id:id});
    let data = {
      language_id:request?.body?.data.language_id,
      source_code:resp[0]?.codearea,
      stdin:resp[0]?.codestdin,
    }
    const options = {
      method: "POST",
      url: process.env.REACT_APP_RAPID_API_URL,
      params: { base64_encoded: "true", fields: "*" },
      headers: {
        "content-type": "application/json",
        "Content-Type": "application/json",
        "X-RapidAPI-Host": process.env.REACT_APP_RAPID_API_HOST,
        "X-RapidAPI-Key": process.env.REACT_APP_RAPID_API_KEY,
      },
      data: data,
    };

    //console.log("options");

    axios
      .request(options)
      .then(function (rspns) {
        const token = rspns.data.token;
        response.send({
          data : "Token Generated",
          token: token
        }).status(200);
      })
      .catch((err) => {
        let error = err.response ? err.response.data : err;
        console.log(error);
        response.send({
          data: "Error",
          error: error
        }).status(400);
      });
  }catch{
    response.send({ data: "something went wrong" }).status(400);
  }
}

export const checkcompilestatus = async (request, response)=>{
  try {
    
    let statusId = 1
    const options = {
      method: "GET",
      url: process.env.REACT_APP_RAPID_API_URL + "/" + request.body.token,
      params: { base64_encoded: "true", fields: "*" },
      headers: {
        "X-RapidAPI-Host": process.env.REACT_APP_RAPID_API_HOST,
        "X-RapidAPI-Key": process.env.REACT_APP_RAPID_API_KEY,
      },
    };
    
    let rsppnnss;
    do{
      rsppnnss = await axios.request(options);
      if(rsppnnss){
        statusId = rsppnnss?.data?.status?.id;
      }
    }while(statusId === 1 || statusId === 2);
    response.status(200).send({data: "Compilation Report",rsp: rsppnnss.data});
  } catch (err) {
    console.log(err);
    response.status(400).send({ data: "something went wrong", err });
  }
}

export const xiquestions = async (request, response)=>{
  try {
    interviewQuestion.findOne({ type: request.body.type, level: request.body.level, experience: request.body.experience, category: request.body.category }, async function (err, res) {
      if (err) {
        return response.send().status(400);
      } else {
        if(request.body.type === "Problem Statement"){
          let setproblemstm = await interview.findOneAndUpdate({ _id: request.body.meetingID }, { $set: { codequestion: res.question } });
        }
        return response
          .status(200)
          .json({ ques: res });
      }
    })
  } catch (err) {
    response.send({ data: "something went wrong", err }).status(400);
  }
}

export const getinterviewjob = async (request, response)=>{
  try {
    //console.log(request.body);
    let crntjob = await Job.findById(request.body.jobid);
    Job.findOne({}, function (err, res) {
      if (err) {
        return response.send().status(400);
      } else {
        return response
          .status(200)
          .json({ job: crntjob });
      }
    }).clone()
  } catch (err) {
    response.send({ data: "something went wrong", err }).status(400);
  }
}

// Get a live stream of a meeting to check on the interview
export const getLiveStreamURL = async(request,response) => {
  try{
    let meetingID = request.body.id;
    if(meetingID){
      let respp = await axios.get("https://api.cluster.dyte.in/v2/meetings/"+meetingID+"/active-livestream", {
        headers:{
          Authorization: 'Basic '+`${dyteBase64}`
        }
      }).catch( async (err)=>{
        console.log(err);
      });
      if(respp && respp?.data?.success){
        response.send({ data: {meetingID:meetingID,playback_url:respp?.data?.data?.playback_url}}).status(200);
      }
    }else{
      response.send({ data: "meeting id is invalid"}).status(400);
    }
  }catch(err){
    console.log(err);
    response.send({ data: "something went wrong", err }).status(400);
  }
}

export const getRecordings = async (request, response)=>{
  try{
    let iD = request.body.id;
    if(iD){
      let params ={
        Bucket: process.env.AWS_S3_BUCKET_NAME, 
        Prefix:process.env.AWS_S3_PROFILE_RECORDINGS_BUCKET_FOLDER+"/"+iD
      }
      let savedURLs = [];
      
      s3.listObjectsV2(params, function(err, values) {
        if (err){ 
          console.log(err);
          response.send({ data: "something went wrong", err }).status(404);
        }
        else{
          values?.Contents?.map((value)=>{
            savedURLs.push({
              url:recordingsURL+"/"+value.Key,
              size:value.Size
            });
          });
        }
        response.send({ recordings: savedURLs, err }).status(200);
      });
    }else{
      response.send({ data: "ID is invalid"}).status(400);
    }  
  }catch(err){
    response.send({ data: "something went wrong", err }).status(400);
  }
}

export const getBaseliningImagesFace = async (request,response) =>{
	let interviewID = request.body.id;
	if(interviewID){
    let params ={
      Bucket: process.env.AWS_S3_BUCKET_NAME, 
      Key:process.env.AWS_S3_PROFILE_BASELINING_BUCKET_FOLDER+'/'+interviewID+'-face.png',
    }
    s3.getObject(params, function(err, value) {
      if (err){ 
        console.log(err);
        return response.status(202).json({ success: false, image:""});
      }else{
        Jimp.read(value.Body).then((value) => {
            value.resize(100, Jimp.AUTO); 
            value.getBase64Async(Jimp.AUTO).then((image)=>{
                return response.status(200).json({ success: true, image:image})
            }).catch((err) => {
              console.error(err);
            });
        });
      }
  	});
  }else{
		return response.status(404).json({ Success: false });
	}
}

export const getBaseliningImagesEar = async (request,response) =>{
	let interviewID = request.body.id;
	if(interviewID){
    let params ={
      Bucket: process.env.AWS_S3_BUCKET_NAME, 
      Key:process.env.AWS_S3_PROFILE_BASELINING_BUCKET_FOLDER+'/'+interviewID+'-ear.png',
    }
    s3.getObject(params, function(err, value) {
      if (err){ 
        console.log(err);
        return response.status(202).json({ success: false, image:""});
      }else{
        Jimp.read(value.Body).then((value) => {
            value.resize(100, Jimp.AUTO); 
            value.getBase64Async(Jimp.AUTO).then((image)=>{
              return response.status(200).json({ success: true, image:image});
            }
          );
        }).catch((err) => {
          console.error(err);
        });
      }
    });
	}else{
		return response.status(404).json({ Success: false });
	}
}

export const getBaseliningImagesPerson = async (request,response) =>{
	let interviewID = request.body.id;
	if(interviewID){
    let params ={
      Bucket: process.env.AWS_S3_BUCKET_NAME, 
      Key:process.env.AWS_S3_PROFILE_BASELINING_BUCKET_FOLDER+'/'+interviewID+'-person.png',
    }
    s3.getObject(params, function(err, value) {
      if (err){ 
        console.log(err);
        return response.status(202).json({ success: false, image:""});
      }else{
        Jimp.read(value.Body).then((value) => {
            value.resize(100, Jimp.AUTO); 
            value.getBase64Async(Jimp.AUTO).then((image)=>{
              return response.status(200).json({ success: true, image:image});
            }
          );
        }).catch((err) => {
          console.error(err);
        });
      }
    });
	}else{
		return response.status(404).json({ Success: false });
	}
}

export const getBaseliningImagesGaze = async (request,response) =>{
	let interviewID = request.body.id;
	if(interviewID){
    let params ={
      Bucket: process.env.AWS_S3_BUCKET_NAME, 
      Key:process.env.AWS_S3_PROFILE_BASELINING_BUCKET_FOLDER+'/'+interviewID+'-gaze.png',
    }
    s3.getObject(params, function(err, value) {
      if (err){ 
        console.log(err);
        return response.status(202).json({ success: false, image:""});
      }else{
        Jimp.read(value.Body).then((value) => {
            value.resize(100, Jimp.AUTO); 
            value.getBase64Async(Jimp.AUTO).then((image)=>{
              return response.status(200).json({ success: true, image:image});
            }
          );
        }).catch((err) => {
          console.error(err);
        });
      }
    });
	}else{
		return response.status(404).json({ Success: false });
	}
}

export const listInterviewsByCompanyName = async (request, response) => {
  try { 
    let companyName = request?.body?.companyName;
      if(companyName){

        await Job.aggregate(
          [
            {
              '$match': {
                'hiringOrganization': companyName
              }
            }, {
              '$lookup': {
                'from': 'interviewapplications', 
                'localField': '_id', 
                'foreignField': 'job', 
                'as': 'applications'
              }
            }, {
              '$unwind': {
                'path': '$applications'
              }
            }, {
              '$lookup': {
                'from': 'users', 
                'localField': 'applications.applicant', 
                'foreignField': '_id', 
                'as': 'applicant'
              }
            }, {
              '$unwind': {
                'path': '$applicant'
              }
            }, {
              '$unwind': {
                'path': '$applications.interviewers'
              }
            }, {
              '$addFields': {
                'intId': {
                  '$convert': {
                    'input': '$applications.interviewers',
                    'to': 'objectId',
                    'onError': null
                  }
                }
              }
            }, {
              '$lookup': {
                'from': 'users', 
                'localField': 'intId', 
                'foreignField': '_id', 
                'as': 'interviewers'
              }
            }, {
              '$unwind': {
                'path': '$interviewers'
              }
            }, {
              '$lookup': {
                'from': 'slots', 
                'localField': 'applications._id', 
                'foreignField': 'interviewId', 
                'as': 'slots'
              }
            }, {
              '$unwind': {
                'path': '$slots'
              }
            }, {
              '$project': {
                'jobTitle': 1, 
                '_id': 1, 
                'interviewers._id': 1, 
                'interviewers.firstName': 1, 
                'interviewers.lastname': 1, 
                'applicant._id': 1, 
                'applicant.firstName': 1, 
                'applicant.lastname': 1, 
                'applicant.email' : 1,
                'applicant.contact' : 1,
                'applications._id': 1, 
                'applications.status': 1, 
                'applications.interviewState': 1, 
                'applications.meetingRoom': 1, 
                'applications.meetingID': 1, 
                'slots._id': 1, 
                'slots.startDate': 1, 
                'slots.endDate': 1, 
                'slots.status': 1
              }
            }
          ]
        ).then((values) =>{
          response.send({data: values}).status(200);
        });
    }
  }catch(err){
    console.log(err);
  }
}                                

