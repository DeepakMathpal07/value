/***
 * - Start a meeting 
 * - If already running a meeting then join it
 * - start live meet
 */
import interview from "../models/interviewApplicationSchema.js";
import { logItDirect } from "./logController.js";
import axios from "axios";
import user from "../models/userSchema.js";

//config for dyte
let dyteBaseURL = process.env.DYTEBASEURL;
let dyteBase64 = process.env.DYTEBASE64;
let vmPreset = process.env.DYTEPRESET;

// Config for AWS S3
const recordings = process.env.AWS_S3_PROFILE_RECORDINGS_BUCKET_FOLDER;
const region = process.env.AWS_S3_RECORDINGS_BUCKET_REGION;
const accessKeyID = process.env.AWS_S3_ACCESS_KEY_ID;
const accessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;
const bucket = process.env.AWS_S3_BUCKET_NAME;
const cloud ='aws';


export const startRecording = async(meetingID) =>{
    if(meetingID){
        var options = {
        method: 'POST',
        url: `${dyteBaseURL}/recordings`,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${dyteBase64}`
        },
        data: {
            meeting_id: meetingID,
            max_seconds: 3600,
            storage_config: {
            type: cloud,
            access_key: accessKeyID,
            secret: accessKey,
            bucket: bucket,
            region: region,
            path: recordings+"/"+meetingID
            },
            dyte_bucket_config: {enabled: true},
            allow_multiple_recordings: false
        }
        };
        axios.request(options).then(function (response) {
            if(response?.data?.success){
                let log = {
                    action:"start recording for interview",
                    data:{
                      message:"Recording started",
                      success:response?.data?.success,
                      invoked_time:response?.data?.data?.invoked_time,
                      output_file_name:response?.data?.data?.output_file_name,
                      recording_id:response?.data?.data?.id,
                    }
                }
                logItDirect(log);
            }else{
                console.log("Meeting ID: "+meetingID+" didn't start recording - SR00002");
                let log = {
                    action:"start recording for interview ",
                    data:"Meeting ID: "+meetingID+" didn't start recording - SR00002"
                }
                logItDirect(log);
            }
        }).catch(function (error) {
            console.log("Meeting ID: "+meetingID+" not found - SR00001");
            let log = {
                action:"start recording for interview ",
                data:"Meeting ID: "+meetingID+" not found - SR00001"
            }
            logItDirect(log);
        });
    }else{
        console.log("Meeting ID: "+meetingID+" not found - SR00000");
        let log = {
            action:"start recording for interview ",
            data:"Meeting ID: "+meetingID+" not found - SR00000"
        }
        logItDirect(log);

    }   
}

export const startLiveStream = async(meetingID) =>{
    if(meetingID){
         let options = {
          method: 'POST',
          url: `${dyteBaseURL}/meetings/${meetingID}/livestreams`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${dyteBase64}`
          },
          data: {name: 'interview-'+meetingID}
        };
        axios.request(options).then(function (response) {
          if(response?.data?.success){
            let log = {
                action:"start livestream for interview",
                data:{
                  message:"Live stream started",
                  success:response?.data?.success,
                  playback_url:response?.data?.data?.playback_url,
                  stream_key:response?.data?.data?.stream_key,
                  playback_id:response?.data?.data?.id,
                }
            }
            logItDirect(log);
          }else{
            let log = {
                action:"start livestream for interview ",
                meetingID:meetingID,
                data:"Livestream was not started"
            }
            logItDirect(log);
          }
  
        }).catch(function (error) {
            console.log(error);
            let log = {
                action:"start livestream for interview ",
                meetingID:meetingID,
                data:error
            }
            logItDirect(log);
        });       
    }else{
        console.log("Meeting ID: "+meetingID+" not found - SLS0000");
        let log = {
            action:"start livestream for interview ",
            data:"Meeting ID: "+meetingID+" not found - SLS0000"
        }
        logItDirect(log);
    }
}

export const startMeeting = async (request, resp) => {
    try{
        let interviewID = request?.params?.interviewID;
        let interviewDetails = await interview.findById(interviewID);
        let meetingID ;
        if(interviewDetails){
            if(interviewDetails?.meetingID === null){
                var options = {
                method: 'POST',
                url: `${dyteBaseURL}/meetings`,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${dyteBase64}`
                },
                data: {title: "Interview Room #"+interviewID}
                };
                axios.request(options).then(function (response) {
                    meetingID = response?.data?.data?.id;
                    //update the interview application details
                    interview.findOneAndUpdate({ _id: interviewID }, { $set: { meetingID: meetingID} }, { new: true }).then((intDetails) => {
                        if(intDetails){
                            let log = {
                                action:"start meeting for interview id:"+interviewID,
                                data: meetingID + " created for interview id -> "+interviewID
                            }
                            logItDirect(log);
                            resp.send({meetingID:meetingID}).status(200);
                            startRecording(meetingID);
                            startLiveStream(meetingID);
                        }
                    });
                }).catch(function (error) {
                    let log = {
                        action:"start meeting for interview id:"+interviewID,
                        data:error
                    }
                    logItDirect(log);
                    console.error(error);
                });
            }else{
                let log = {
                    action:"start meeting for interview id:"+interviewID,
                    data: interviewDetails.meetingID + " created for interview id -> "+interviewID
                }
                logItDirect(log);
                resp.send({meetingID:interviewDetails.meetingID}).status(200);                    
            }
        }else{
            let log = {
                action:"start meeting for interview id:"+interviewID,
                data:"No such interview application for interview id -> "+interviewID+"- SM001"
            }
            logItDirect(log);
            resp.status(400).send({message:"No such interview application for interview id -> "+interviewID+"- SM001"});    
        }
    }catch(err){
        console.log(err);
        let log = {
            action:"start meeting for interview ",
            data:err
        }
        logItDirect(log);
        resp.status(400).send({message:"Something went wrong - SM000"});    
    }
}

export const addXIParticipant = async (request, response) => {
    try{
        let interviewID = request?.params?.interviewID;
        let userID = request?.params?.userID;
        if(interviewID && userID){
            //find the interview details 
            let interviewDetails = await interview.findById(interviewID);
            if( interviewDetails && interviewDetails?.meetingID!==null){
                //check if the user id is valid
                let userDetails = await user.findById(userID);
                let meetingID = interviewDetails?.meetingID;
                let testurl = `${dyteBaseURL}/meetings/${meetingID}/participants`;
                if(userDetails){
                    // check if the user is an xi
                    if(userDetails.isXI){
                        // check if the xi is present in the interviewer list
                        if(interviewDetails.interviewers.includes(userID)){
                            var options = {
                                method: 'POST',
                                url: `${dyteBaseURL}/meetings/${meetingID}/participants`,
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Basic ${dyteBase64}`
                                },
                                data: {
                                    name: `${userDetails.firstName} ${userDetails.lastname}`,
                                    preset_name: `${vmPreset}`,
                                    custom_participant_id: `${userID}`
                                }
                            };
                            axios.request(options).then(function (resp) {
                                let log = {
                                    action:"Add participant for interview ",
                                    data:resp?.data?.data?.token
                                }
                                logItDirect(log);
                                response.send({token:resp?.data?.data?.token}).status(200);
                            }).catch(function (error) {
                                console.error(error);
                                let log = {
                                    action:"Add participant for interview ",
                                    data:error
                                }
                                logItDirect(log);
                                response.send({message:"Something went wrong- AP003"}).status(400);        
                            });
                        }else{
                            let log = {
                                action:"Add participant for interviewer ",
                                data:"User ID:"+userID+" is not an approved interviewer for this interview:"+ interviewDetails._id+"- APX004"
                            }
                            logItDirect(log);
                            response.status(401).send({message:"User ID:"+userID+" is not an approved interviewer for this interview:"+ interviewDetails._id+"- APX004"});        
                        }
                    }
                }else{
                    let log = {
                        action:"Add participant for interviewerer ",
                        data:"User details not found for user id :"+userID+" - APX003"
                    }
                    logItDirect(log);
                    response.status(400).send({message:"User details not found for user id :"+userID+"- APX003"}); 
                }

            }else{
                let log = {
                    action:"Add participant for interviewer ",
                    data:"Interview details or meeting id not found for interview id :"+interviewID+" - APX002"
                }
                logItDirect(log);
                response.status(400).send({message:"Interview  details or meeting id not found for interview id :"+interviewID+"- APX002"});        
            }
        }else{
            let log = {
                action:"Add participant for interviewer ",
                data:"Interview ID or user ID is empty or null - APX001"
            }
            logItDirect(log);
            response.status(400).send({message:"Meeting ID or user ID is empty or null - APX001"});        
        }
    
    }catch(err){
        console.log(err);
        let log = {
            action:"start meeting for interview ",
            data:err
        }
        logItDirect(log);

        response.status(400).send({message:"Something went wrong - APX000"});    
    }

}


export const addCandidateParticipant = async (request, response) => {
    try{
        let interviewID = request?.params?.interviewID;
        let userID = request?.params?.userID;
        if(interviewID && userID){
            //find the interview details 
            let interviewDetails = await interview.findById(interviewID);
            if( interviewDetails && interviewDetails?.meetingID!==null){
                //check if the user id is valid
                let userDetails = await user.findById(userID);
                let meetingID = interviewDetails?.meetingID;
                if(userDetails){
                    //check if the user id is same as applicant
                    if(userDetails._id.valueOf() === interviewDetails.applicant.valueOf()){
                        var options = {
                            method: 'POST',
                            url: `${dyteBaseURL}/meetings/${meetingID}/participants`,
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Basic ${dyteBase64}`
                            },
                            data: {
                                name: `${userDetails.firstName} ${userDetails.lastname}`,
                                preset_name: `${vmPreset}`,
                                custom_participant_id: `${userID}`
                            }
                        };
                        axios.request(options).then(function (resp) {
                            let log = {
                                action:"Add participant for interview ",
                                data:resp?.data?.data?.token
                            }
                            logItDirect(log);
                            response.send({token:resp?.data?.data?.token}).status(200);
                        }).catch(function (error) {
                            console.error(error);
                            let log = {
                                action:"Add participant for interview ",
                                data:error
                            }
                            logItDirect(log);
                            response.send({message:"Something went wrong- AP003"}).status(400);        
                        });
                    }else{
                        let log = {
                            action:"Add participant for interview ",
                            data:"User ID:"+userID+" is not approved this interview:"+ interviewDetails._id+"- AP004"
                        }
                        logItDirect(log);
                        response.status(401).send({message:"User ID:"+userID+" is not approved this interview:"+ interviewDetails._id+"- AP004"});        
                    }

                }else{
                    let log = {
                        action:"Add participant for interview ",
                        data:"User details not found for user id :"+userID+" - AP002"
                    }
                    logItDirect(log);
                    response.send({message:"User details not found for user id :"+userID+"- AP002"}).status(400);        
                }

            }else{
                let log = {
                    action:"Add participant for interview ",
                    data:"Interview details or meeting id not found for interview id :"+interviewID+" - AP002"
                }
                logItDirect(log);
                response.send({message:"Interview  details or meeting id not found for interview id :"+interviewID+"- AP002"}).status(400);        
            }
        }else{
            let log = {
                action:"Add participant for interview ",
                data:"Interview ID or user ID is empty or null - AP001"
            }
            logItDirect(log);
            response.send({message:"Meeting ID or user ID is empty or null - AP001"}).status(400);        
        }
    
    }catch(err){
        console.log(err);
        let log = {
            action:"start meeting for interview ",
            data:err
        }
        logItDirect(log);

        response.send({message:"Something went wrong - AP000"}).status(400);    
    }

}

export const endInterviewStatusUpdate= async (request, response) => {
    try{
        let interviewID = request?.params?.interviewID;
        console.log("interviewID: ",interviewID);
        if(interviewID){
            let interviewDetails = await interview.findOneAndUpdate(
                { _id: interviewID },
                { $set: { interviewState: 2 } },
                { new: true }
              );
            if(interviewDetails){
                let log = {
                    action:"Ending interview by the XI",
                    data:"Interview state for Interview ID "+interviewID+" should be set to 2"
                }
                logItDirect(log);
                response.status(200).send({message:"Success"});        
            }else{
                let log = {
                    action:"Ending interview by the XI",
                    data:"Interview ID "+interviewID+" not found - EISU00002"
                }
                logItDirect(log);
                response.status(400).send({message:"Something went wrong - EISU00002"});        
            }
        }else{
            let log = {
                action:"Ending interview by the XI",
                data:"Interview ID is empty or null - EISU00001"
            }
            logItDirect(log);
            response.send({message:"Something went wrong - EISU00001"}).status(400);        
        }
    }catch(err){
        let log = {
            action:"Ending interview by the XI",
            data:"Interview ID is empty or null - EISU00001"
        }
        logItDirect(log);
        response.send({message:"Something went wrong - EISU00001"}).status(400);        

    }

}
