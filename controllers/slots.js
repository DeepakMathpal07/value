import async from "async";
import User from "../models/userSchema.js";
import Slot from "../models/slot.js";
import Candidate from "../models/candidate_info.js";
import unirest from "unirest";
import mongoose from "mongoose";
import xi_info from "../models/xi_infoSchema.js";
import job from "../models/jobSchema.js";
import user from "../models/userSchema.js";
import axios from "axios";
import sendGridMail from "@sendgrid/mail";

// var fastsms_api = process.env.FAST2SMS_API_KEY;
// const fastsms_url = process.env.FAST2_SMS_URL;
// var twofactor_api = process.env.TWOFACTORIN_API_KEY;
// const twofactor_url = process.env.TWOFACTORIN_API_URL;

const fastsms_url = 'https://www.fast2sms.com/dev/bulkV2?';
var twofactor_api = '2822e1f5-e624-11ed-addf-0200cd936042';
const twofactor_url = 'http://2factor.in/API/V1/';
var fastsms_api = '';

export const ValidateSlot = async (request, response) => {
  try {

    await Slot.find(
      { createdBy: request.body.id, isDeleted: false },
      async (err, res) => {
        if (err) {
        } else {
          let currentDate = new Date(request.body.startTime);
          let startDate = new Date(currentDate.getFullYear(), 0, 1);
          var days = Math.floor(
            (currentDate - startDate) / (24 * 60 * 60 * 1000)
          );

          var weekNumber = Math.ceil(days / 7);
          let count = 0;
          for (let i = 0; i < res.length; i++) {
            if (res[i].weekNo == weekNumber) {
              count++;
            }
          }
          let limit = 0;
          await xi_info
            .find({ candidate_id: request.body.id }, function (err, res) {
              if (res) {
                limit = res[0].limit;

                if (count >= limit) {
                  return response.status(200).json({ check: false });
                } else {
                  return response.status(200).json({ check: true });
                }
              }
            })
            .clone();
        }
      }
    );
  } catch (error) {
    // response.status(400).send('something went wrong', error);
  }
};

export const addSlot = (data, callback) => {
  try {
    let user_type;
    async.series(
      [
        function (cb) {
          try {
            User.findOne(
              { _id: data[0].createdBy },
              { user_type: 1 },
              (err, res) => {
                if (err) {
                  return cb(err, null);
                }
                user_type = res.user_type;
                if (
                  res &&
                  res.user_type !== "XI" &&
                  res.user_type !== "SuperXI"
                ) {
                  return cb("Your not eligible to create slot", null);
                }
                cb();
              }
            );
          } catch (err) {
            cb(err, null);
          }
        },

        function (cb) {
          try {
            let insertData = [];

            for (let i = 0; i < data.length; i++) {
              Slot.find(
                { createdBy: data[i].createdBy, isDeleted: false },
                async (err, res) => {
                  if (err) {
                    console.log(err);
                  } else {
                    for (let j = 0; j < res.length; j++) {
                      if (
                        (new Date(res[j].startDate) <=
                          new Date(data[i].startDate) &&
                          new Date(res[j].endDate) >=
                            new Date(data[i].startDate)) ||
                        (new Date(res[j].startDate) <=
                          new Date(data[i].endDate) &&
                          new Date(res[j].endDate) >= new Date(data[i].endDate))
                      ) {
                        console.log("slot booked");
                        // return cb("Slot Already Booked", null)
                      }
                    }
                  }
                }
              );

              data[i].slotId = i;
              let currentDate = new Date(data[i].startDate);
              let startDate = new Date(currentDate.getFullYear(), 0, 1);
              var days = Math.floor(
                (currentDate - startDate) / (24 * 60 * 60 * 1000)
              );

              var weekNumber = Math.ceil(days / 7);
              let insertObj = {
                createdBy: data[i].createdBy,
                startDate: new Date(data[i].startDate),
                endDate: new Date(data[i].endDate),
                slotType: user_type,
                weekNo: weekNumber,
              };
              insertData.push(insertObj);
            }
            Slot.insertMany(insertData, (err, res) => {
              if (err) {
                cb(err, null);
              }
              cb(null, "Data saved  succesfully");
            });
          } catch (err) {
            cb(err, null);
          }
        },
      ],
      function (err, results) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, data);
        }
      }
    );
  } catch (err) {
    callback(err, null);
  }
};

export const availableSlots = (data, callback) => {
  try {
    Slot.find({
      status: "Available",
      cancelBy: { $nin: [data.userId] },
      isDeleted: false,
      slotType: data.type,
    })
      .sort({ startDate: 1 })
      .exec(async (err, res) => {
        if (err) {
          callback(err, null);
        } else {
          // const data = await priorityEngine(res);
          callback(null, res);
        }
      });
  } catch (err) {
    callback(err, null);
  }
};
export const availableSlotsByJobSkills = async (data, callback) => {
  
  try {
    let jobRepoResponse = await job
      .find({ _id: data?.jobId }, { lean: true })
      .select({ skills: 1, _id: 0 })
      .exec();
    let jobRole = [
      ...new Set(jobRepoResponse[0]?.skills?.map((item) => item.role)),
    ];

    let usersMatchingSkills = await user
      .find(
        {
          $and: [{ "tools.role": { $in: jobRole } }, { user_type: data?.type }],
        },
        { lean: true }
      )
      .select("name _id")
      .exec();
    let matchedUserIds = usersMatchingSkills?.map((user) => user._id);
    let today = new Date().setHours(0, 0, 0, 0);
    Slot.find({
      status: "Available",
      cancelBy: { $nin: [data?.userId] },
      isDeleted: false,
      slotType: data?.type,
      createdBy: { $in: matchedUserIds },
      startDate: { $gte: today },
    })
    
      .sort({ startDate: 1 })
      .exec(async (err, res) => {
        if (err) {
          callback(err, null);
        } else {
          // const data = await priorityEngine(res);
          callback(null, res);
        }
      });
  } catch (err) {
    callback(err, null);
  }
};
export const updatecurrentSlot = async(req,res)=>{
  let {slotId,startDate,endDate} = req.body
  try {
    await Slot.updateOne({_id : slotId},{$set:{startDate ,endDate}});
    res.status(200).send({message : "Success"});
  } catch (error) {
    console.error(error);
    res.status(400).send({message : "Something went wrong", error});
  }
}

const updateSlot = async (id, body) => {
  await Slot.findOneAndUpdate(
    { _id: mongoose.Types.ObjectId(id) },
    body,

    (err, res) => {
      if (err) {
        console.log(err);
      } else {
        return;
      }
    }
  ).clone();
};

export const priorityEngine = async (request, response) => {

  try {
    let date = request.query.date;

    await Slot.find(
      {
        status: "Available",
        isDeleted: false,
        startDate: request.query.date,
        slotType: request.body.type,
      },
      async (err, res) => {
        if (err) {
          console.log(err);
        } else {
          // const data = await priorityEngine(res);

          let data = await helper(res);
          if (data.status == "Available"){
            return response.status(200).json({ slot: data });
          } else {
            return response.status(409).json({ message: 'already booked' });
          }
        }
      }
    );
  } catch (error) {}
};
const updateSlot1 = async (array) => {
  for (let j = 0; j < array.length; j++) {
    await updateSlot(array[j]._id, { priority: j });
    array[j]._id = j;
  }
  return array;
};

const helper = async (array) => {
  let length = array.length;

  for (let i = 0; i < array.length; i++) {
    let xi1 = 0;
    await xi_info
      .find({ candidate_id: array[i].createdBy }, async (err, res) => {
        if (res) {
          if (
            res[0] &&
            res[0].level &&
            res[0].level > 0 &&
            res[0].cat &&
            res[0].cat > 0 &&
            res[0].multiplier &&
            res[0].multiplier > 0
          ) {
            xi1 = res[0].level * res[0].cat * res[0].multiplier;
            array[i].value = xi1;
            await updateSlot(array[i]._id, { value: xi1 });
          }
        }
      })
      .clone();
  }

  array.sort(function (a, b) {
    return a.value - b.value;
  });
  let resArray = await updateSlot1(array);

  let obj = resArray[length - 1];

  return obj;
};

export const findCandidateByEmail = async (req, response) => {
  const email = req.query.email;
  await Candidate.find({ email: email }, async function (err, res) {
    return response.status(200).json(res);
  }).clone();
};


export const bookSlot = async (data, callback) => {

console.log(data);
let OTP = "";
let id = data.candidate_id;
if(id){
      let user = await User.findById(id);
      if(user && user!=null){
        let phoneNo = user.contact;
        let code = user.countryCode;
        if(user.countryCode){
          code = code = user.countryCode;
        }else{
          code='+91';
        }
        if(phoneNo && code){
          try {
            var digits = "0123456789";
            let OTP = "";
            for (let i = 0; i < 6; i++) {
              OTP += digits[Math.floor(Math.random() * 10)];
            }
            let fast2SMSURL = fastsms_url+'authorization='+fastsms_api+'&route=otp'+'&variables_values='+OTP+'&numbers='+phoneNo;
            let twofactorURL = twofactor_url+twofactor_api+'/SMS/'+phoneNo+'/'+OTP+'/OTP1';
            let config = {method: 'get',maxBodyLength: Infinity,url: fast2SMSURL,headers: { "cache-control": "no-cache"}};
            console.log("sending OTP via F2S");
            await axios.request(config).then((response) => {
              callback(null, { otp: OTP });
            }).catch((error) => {
              // send otp via twofactor
              console.log("failed to send with f2s, sending via twofactor");
              var config = {method: 'get',maxBodyLength: Infinity,url: twofactorURL,headers: { }};
              axios(config).then(function (response) {
                console.log(JSON.stringify(response.data));
                callback(null, { otp: OTP });
              }).catch(function (error) {
                console.log(error);
                callback(error, null);
              });
            });
        } catch (err) {
          console.log(err);
          callback(err, null);
        }
      }
    }
  }
}

  export const sendEmailToXIForSlotIntimation = async (slotId) =>{
    try{
      Slot.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(slotId) } },
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $project: {
            'user.email':1,
            'user.contact':1,
            'user.countryCode':1,
            'user.firstName':1,
            'user.lastname':1,
          }
        }
      ]).then((value)=>{
        console.log(value[0].user[0]);
        let html = `<h1>Interview Slot Accepted</h1>
        <br/>
        Hi ${value.firstName},
        <p>
          A slot put up by you have been accepted by the candidate. Please logon to the platform to view details or for further actions.
        </br>
          Please contact support@valuematrix.ai for any technical difficulties or queries. 
          </br>
          Best regards,
          </br>
          Valuematrix.ai team
        `;
        sendGridMail.send({
          to: value.email,
          from: supportEmail,
          subject: `Candidate interview for ${job.jobTitle} - Value Matrix`,
          html: html,
        });

      });

    }catch(err){
      
    }

  }

  export const resendOTP = async (request, response) =>{
    console.log("Resending otp");
    let id = request.body.user_id;
    console.log(id);
    if(id){
      let user = await User.findById(id);
      if(user && user!=null){
        let phoneNo = user.contact;
        let code = user.countryCode;
        if(user.countryCode){
          code = code = user.countryCode;
        }else{
          code='+91';
        }
        if(phoneNo && code){
          console.log(code+phoneNo);
          try {
            var digits = "0123456789";
            let OTP = "";
            for (let i = 0; i < 6; i++) {
              OTP += digits[Math.floor(Math.random() * 10)];
            }
            let twofactorURL = twofactor_url+twofactor_api+'/SMS/'+phoneNo+'/'+OTP+'/OTP1';
            // send otp via twofactor
            console.log("failed to send with f2s, sending via twofactor");
            var config = {method: 'get',maxBodyLength: Infinity,url: twofactorURL,headers: { }};
            axios(config).then(function (resp) {
              console.log(JSON.stringify(resp.data));
              return response.status(200).json({otp:OTP});
            }).catch(function (error) {
              console.log(error);
              return response.status(401).json({"Error":error});
            });
        } catch (err) {
          console.log(err);
          return response.status(401).json({"Error":err});
        }
      }
    }
  }
  }
      // Candidate.findOne({ _id: data.candidate_id },{ phone_No: data.PhoneNo}).then( candidate=>{
      // console.log(candidate);
      // sendOTP(data.PhoneNo).then((value)=>{
      //   console.log(value);
      //   if(value.otp){
      //     cb(null, value);
      //   }else{
      //     callback(value.error, null);
      //   }
      // });

    // for candidate OTP
    // async.parallel(
    //   [
    //     function (cb) {
    //       try {
    //         Candidate.findOne(
    //           { _id: data.candidate_id },
    //           { phone_No: data.PhoneNo},
    //           (err, res) => {
    //             if (err) {
    //               return cb(err, null);
    //             }
    //             console.log("send otp");
    //             sendOTP(data.PhoneNo).then((value)=>{
    //               console.log(value);
    //               cb(null, value);
    //             });
    //           }
    //         );
    //       } catch (err) {
    //         cb(err, null);
    //       }
    //     },

    //     // for XI OTP
    //     function (cb) {
    //       // try {
    //       //   Slot.aggregate(
    //       //     [
    //       //       { $match: { _id: mongoose.Types.ObjectId(data.slotId) } },
    //       //       {
    //       //         $lookup: {
    //       //           from: "users",
    //       //           localField: "createdBy",
    //       //           foreignField: "_id",
    //       //           as: "user",
    //       //         },
    //       //       },
    //       //     ],

    //       //     (err, res) => {
    //       //       if (err) {
    //       //         console.log(err);
    //       //       } else {

    //       //         let overALLURL = FAST2_SMS_URL+'authorization='+fastsms_api+'&route=q'+'&numbers='+res[0].user[0].contact+'&message=Candidate request to book your slot. Please acknowledge';
    //       //         let config = {
    //       //           method: 'get',
    //       //           maxBodyLength: Infinity,
    //       //           url: overALLURL,
    //       //           headers: { 
    //       //             "cache-control": "no-cache"
    //       //           }
    //       //         };
    //       //         axios.request(config)
    //       //         .then((response) => {
    //       //           console.log(JSON.stringify(response.data));
    //       //           cb(null, { otp: OTP });
    //       //         }).catch((error) => {
    //       //           console.log(error);
    //       //           cb({ Error: res.error }, null)
    //       //         });
    //       //         // req.query({
    //       //         //   authorization: fastsms_api,
    //       //         //   route: "q",
    //       //         //   message:
    //       //         //     "Candidate request to book your slot. Please acknowledge",
    //       //         //   numbers: res[0].user[0].contact,
    //       //         // });
    //       //         // req.headers({
    //       //         //   "cache-control": "no-cache",
    //       //         // });
    //       //         // req.end(function (res) {
    //       //         //   if (res.error) cb({ Error: res.error }, null);
    //       //         //   else cb();
    //       //         // });
    //       //       }
    //       //     }
    //       //   );
    //       // } catch (err) {
    //       //   cb(err, null);
    //       // }
    //     },
    //   ],
    //   function (err, results) {
    //     if (err) {
    //       callback(err, null);
    //     } else {
    //       callback(null, { OTP });
    //     }
    //   }
    // );

export const newSlotUpdater = (req, callback) => {
  try {
    let slotsdata = req.body.data;
    User.findOne(
      { _id: mongoose.Types.ObjectId(req.body.id) },
      async function (err, aduser) {
        if (err) {
          callback(err, null);
        }
        let insertions = [];
        for (let i = 0; i < slotsdata.length; i++) {
          if (slotsdata[i].action === "delete") {
            await Slot.findOneAndDelete({
              _id: mongoose.Types.ObjectId(slotsdata[i].data._id),
            });
          }
          if (slotsdata[i].action === "create") {
            // const startTime = new Date(`${req.body.date}T${slotsdata[i].startTime}:00`);
            // const endTime = new Date(`${req.body.date}T${slotsdata[i].endTime}:00`);
            // const starttimezoneOffset = startTime.getTimezoneOffset();
            // const endtimezoneOffset = endTime.getTimezoneOffset();
            // const utcStart = new Date(startTime.getTime() - (starttimezoneOffset * 60 * 1000)).toISOString()
            // const utcEnd = new Date(endTime.getTime() - (endtimezoneOffset * 60 * 1000)).toISOString()
            const utcStart = new Date(slotsdata[i].startTime);
            const utcEnd = new Date(slotsdata[i].endTime);
            
            let insertObj = {
              createdBy: mongoose.Types.ObjectId(req.body.id),
              startDate: utcStart,
              endDate: utcEnd,
              slotType: aduser.user_type,
              weekNo: 0,
            };
            insertions.push(insertObj);
          }
        }
        Slot.insertMany(insertions, (err, res) => {
          if (err) {
            console.log(err);
            callback(err, null);
          }else{
            console.log("Successfull");
            callback(null, "Data updated succesfully");
          }
          
        });
      }
    );
  } catch (err) {
    callback(err, null);
  }
};

export const slotUpdate = (req, callback) => {
  try {
    Slot.findOneAndUpdate(
      { _id: mongoose.Types.ObjectId(req.query.slotId) },
      req.body,
      { returnOriginal: false },
      (err, res) => {
        if (err) {
          callback(err, null);
        } else {
          callback(null, res);
        }
      }
    );
  } catch (err) {
    callback(err, null);
  }
};
export const slotdelete = (req, callback) => {
  try {
    Slot.findOneAndUpdate(
      { _id: mongoose.Types.ObjectId(req.query.slotId) },
      {
        isDeleted: true,
        status: "Available",
        $unset: { candidateId: 1, interviewId: 1 },
      },
      { returnOriginal: false },
      (err, res) => {
        if (err) {
          callback(err, null);
        } else {
          callback(null, res);
        }
      }
    );
  } catch (err) {
    callback(err, null);
  }
};

export const XISlots = async (request, response) => {
  let slots = await Slot.find({
    createdBy: request.query.id,
    isDeleted: false,
  });
  let slotArr = [];
  for (let i = 0; i < slots.length; i++) {
    let elem = slots[i];
    
    let elemSlotToEpoch = new Date(elem.endDate).valueOf();
    if (elemSlotToEpoch > new Date().valueOf()) {
      slotArr.push(elem);
    
    }
  }
  slotArr.sort((a, b) => {
    return new Date(a.endDate) - new Date(b.endDate);
  });

  return response.status(200).json(slotArr);
};

export const slotDetailsOfXI = async (req, res) => {
  try {
    const data = await Slot.aggregate([
      { $match: { createdBy: mongoose.Types.ObjectId(req.query.XI_id) } },
      {
        $lookup: {
          from: "interviewapplications",
          localField: "interviewId",
          foreignField: "_id",
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
      {
        $lookup: {
          from: "jobs",
          localField: "interviewApplication.job",
          foreignField: "_id",
          as: "job",
        },
      },
    ]);
    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send("something went wrong", err);
  }
};
export const slotDetailsOfXIinterview = async (req, res) => {
  try {
    const data = await Slot.aggregate([
      { $match: { createdBy: mongoose.Types.ObjectId(req.query.XI_id) } },
      {
        $lookup: {
          from: "xiInterviewapplications",
          localField: "interviewId",
          foreignField: "_id",
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
      {
        $lookup: {
          from: "jobs",
          localField: "interviewApplication.job",
          foreignField: "_id",
          as: "job",
        },
      },
    ]);
    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send("something went wrong", err);
  }
};

export const slotDetailsOfUser = async (req, res) => {
  try {
    const data = await Slot.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(req.query.userId) } },
      {
        $lookup: {
          from: "interviewapplications",
          localField: "interviewId",
          foreignField: "_id",
          as: "interviewApplication",
        },
      },
      {
        $lookup: {
          from: "xiinterviewapplications",
          localField: "interviewId",
          foreignField: "_id",
          as: "xiinterviewApplication",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "XI",
        },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "interviewApplication.job",
          foreignField: "_id",
          as: "job",
        },
      },
    ]);
    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send("something went wrong", err);
  }
};

export const userInterviewsDetails = async (req, res) => {
  try {
    const data = await Slot.aggregate([
      { $match: { _id: mongoose.Types.ObjectId(req.query.slotId) } },
      {
        $lookup: {
          from: "interviewapplications",
          localField: "interviewId",
          foreignField: "_id",
          as: "interviewApplication",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "XI",
        },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "interviewApplication.job",
          foreignField: "_id",
          as: "job",
        },
      },
    ]);
    res.send(data);
  } catch (err) {
    console.log(err);
    res.status(400).send("something went wrong", err);
  }
};

export const slot_by_interviewId = async (req, res) => {
  try {
    const data = await Slot.findOne({
      interviewId: mongoose.Types.ObjectId(req.query.id),
    });
    res.send(data);
  } catch (err) {
    res.status(400).send("something went wrong", err);
  }
};
