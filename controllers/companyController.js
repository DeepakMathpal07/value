import User from "../models/userSchema.js";
import axios from "axios";
import passwordHash from "password-hash";
import {} from "dotenv/config";
import multer from "multer";
import fs from "fs";
import sendGridMail from "@sendgrid/mail";
import FormData from "form-data";
import path from "path";
import job from "../models/jobSchema.js";
import { response } from "express";
 import generator from "generate-password";
 import InterviewApplication from "../models/interviewApplicationSchema.js";
 import v4 from "uuid/v4.js";
 import Job from "../models/jobSchema.js";

const url = process.env.BACKEND_URL;
const front_url = process.env.FRONTEND_URL;
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
const supportEmail=process.env.VM_SUPPORT_EMAIL;




export const addCompanyUser = async (request, response) => {
  try {
    if (
      request.body.company_id === null ||
      request.body.company_id === undefined
    ) {
      return response.json({
        success: false,
        message: "Company id is required",
      });
    }
    await User.findOne({ _id: request.body.company_id }, function (err, res) {
      if (err) {
        console.log(err);
        return response.status(401).json("Request User Not Found");
      }
      if (res && res.user_type !== "Company") {
        return response
          .status(401)
          .json("Request User Not Registered as a Company");
        return;
      }
    }).clone();
    let user = await User.findOne({ email: request.body.email });
    if (user) {
      return response.json({
        message: "User already exists",
      });
      return;
    }
    if (user == null) {
      user = await User.findOne({ username: request.body.username });
      if (user) {
        return response.json({
          message: "Username already exists",
        });
        return;
      }
    }
    if (user == null) {
      user = await User.findOne({ contact: request.body.contact });
      if (user) {
        return response.json({
          message: "Contact already exists",
        });
        return;
      }
    }
    let permission = {};
    request.body.permission.forEach((i) => {
      permission[i.id] = i.value;
    });
    // console.log(permission);
    var password = generator.generate({
      length: 10,
      numbers: true
    });
    let id = v4();
    let newUser = new User({
      email: request.body.email,
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      username: request.body.username,
      contact: request.body.contact,
      password: passwordHash.generate(password),
      resetPassId:id,

      user_type: "Company_User",
      permissions: [{company_permissions:permission, admin_permissions: null}],
      company_id: request.body.company_id,
    });

    await newUser.save();
    let html = `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
    <div style="margin:50px auto;width:70%;padding:20px 0">
      <div style="border-bottom:1px solid #eee">
       <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Value Matrix</a>
      </div>
      <p style="font-size:1.1em">Hi, ${request.body.firstName} ${request.body.lastName}</p>
      <p style="font-size:1.1em">You have been invited to join the ValueMatrix platform as a member by  ${request.body.username}. </p>
      <p>Please click on the link provided to join the platform and feel free to contact us with any question: <a href="${front_url}/login">Link</a> </p>
      <div>Use this credentials</div>
      <p>Username : ${request.body.username}</P>
      <p>Password : ${password}</p>
      <p>You can change your password after login<p>
      <br/>
      <p style="font-size:1.1em">Best regards,</p>
      <p style="font-size:1.1em">ValueMatrix AI Team</p> 
    </div>
  </div>`;

        await sendGridMail.send({
          to: request.body.email,
          from: supportEmail,
          subject: "Invitation to Join Our Platform",
          html: html,
        });
    //console.log(newUser);
    return response.json({
      message: "User added successfully",
      user: newUser,
    });

  } catch (error) {
    console.log("Error : ", error);
  }
};

export const deleteCompanyUser = async(req,res)=>{
  try {
    let userId = req.body._id
    console.log("deleting userid",userId);
    await User.deleteOne({_id : userId}).then((result)=>{
      if (result && result.deletedCount) {
        res.send({message : 'user deleted'}).status(200);
      }else {
        res.send({message : 'user not found'}).status(404)
      }
    })
  } catch (error) {
    // console.log("deleting userid response",req);
    res.send(error)
  }
}

export const getCompanyUserList = async (request,response)=>{
  try {
    
   let company_users =await User.find({user_type:"Company_User" , company_id:request.query.id});
   response.status(200).send(company_users);

  } catch (error) {
    console.log(error);
  }
}

export const listCompanies = async (request,response)=>{
  try {
   //let company =await InterviewApplication.find().select({hiringOrganization:1});
    let company = await Job.aggregate(
      [
        {
          '$group': {
            '_id': '$hiringOrganization'
          }
        }
      ]
    );
   response.status(200).send(company);
  } catch (error) {
    console.log(error);
  }
}


export const filterCompany = async(request , response)=>{

try {

  let currentDate = new Date().toISOString();
  let test= request.params.vacancy;
  let id = request.body
  // console.log(id);
  let query = null;
  switch (request.params.time) {
    case "One":
      query = job.find({uploadBy: request.params.id});
      break;
    case "Two":
      query = job.find({ $and:
        [ {uploadBy: request.params.id },{ validTill: { $gte: currentDate } }]})
      break;
    case "Three":
      query = job.find({$and:
        [ {uploadBy: request.params.id },{ validTill: { $lte: currentDate } }] }) 
      break;
  }
  if(query){


  await query.exec(async function (err, res) {
    // console.log("RES:", res);
  let data = [];
  
  data = res;
  
    if(test === "true"){
      let jobs = [];
    data.map((item , index)=>{
      // console.log(index ,"---" ,item)

      if(item.location === "Loc" ){
        jobs.push(item)
      }
    })
    //  console.log("res1",jobs)
    return response.json({ jobs });

      
    }else{
      // console.log("res2:",res)
  let jobs=[]
  jobs=res;
    return response.json({jobs})
    }
    if (err) {
      // response.json({ Error: "Cannot Send Mails" });
      return;
    }
  })
}


} catch (error) {
  console.log(error)
}
}
