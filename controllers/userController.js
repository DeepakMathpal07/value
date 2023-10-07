import mongoose from "mongoose";
import User from "../models/userSchema.js";
import UserBin from "../models/userSchemaBin.js";
import Candidate from "../models/candidate_info.js";
import Country from "../models/countrySchema.js";
import AddCountry from "../models/countryAddSchema.js";
import axios from "axios";
import passwordHash from "password-hash";
import v4 from "uuid/v4.js";
import {} from "dotenv/config";
import Job from "../models/jobSchema.js";
import jobBin from "../models/jobBinSchema.js";
import Interview from "../models/interviewApplicationSchema.js";
import multer from "multer";
import fs from "fs";
import sendGridMail from "@sendgrid/mail";
import FormData from "form-data";
import path from "path";
import XIInterview from "../models/xiInterviewApplication.js";
import xi_info from "../models/xi_infoSchema.js";
import userCredit_info from "../models/userCreditSchema.js";
import jwt from "jsonwebtoken";
//import { request } from "http";
import AWS from "aws-sdk";
import { logItDirect } from "./logController.js";
const url = process.env.BACKEND_URL;
const front_url = process.env.FRONTEND_URL;
const IMAGEPATH = process.env.ROOTPATH + "" + process.env.IMAGEPATH;
const RESUMEPATH = process.env.ROOTPATH + "" + process.env.RESUMEPATH;
const sovrenAccountID = process.env.SOVREN_ACCOUNTID;
const sovrenServiceKey = process.env.SOVREN_SERVICEKEY;
AWS.config.update({
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
});
let s3 = new AWS.S3();
const psycurl = process.env.PSYC_URL;
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
const supportEmail=process.env.VM_SUPPORT_EMAIL;

var storage = multer.memoryStorage({
  destination: (req, file, cb) => {
    cb(null, "media/profileImg");
  },
  filename: (req, file, cb) => {
    cb(null, file.filename + "-" + Date.now());
  },
});
var upload = multer({ storage: storage });

let profileData = {
  firstName: "",
  username: "",
  email: "",
  password: "",
  contact: "",
  address: "",
  education: [],
  desc: [],
  billing: [],
  experience: [],
  associate: [],
  tools: [],
  timeRegistered: "",
  isAdmin: null,
  user_type: "",
  permissions: [],
  access_valid: null,
  resetPassId: "",
  invite: null,
  job_invitations: [],
  linkedInId: "",
  access_token: "",
  resume: "",
  city: "",
  country: "",
  houseNo: "",
  street: "",
  state: "",
  zip: "",
  language: [],
  secondaryContacts: [],
  secondaryEmails: [],
  profileImg: "",
  googleId: "",
};

export const getToken = async(request,response) => {
  try{
    // let userId = request.locals.userId;
    // let access = await tokenGen(userId);
    // let userResp  = await User.find({_id:userId});
    // let user_type = userResp[0].user_type;
    // response.setHeader("authorization",access);
    // response.setHeader("user_id",userId);
    // response.setHeader("user_type",user_type);
    // response.setHeader("vm_version","0.1");
    return response
      .send({
        message: "token sent",
      })
      .status(200);
  }catch(error){
    console.log(error);
  }
}

export const getUserStats = async (request, response) => {
  try {
    let id = request.body.id;
    let user = await User.findById(id);
    if (user && user.job_invitations.length > 0) {
      return response
        .send({
          message: "Data Retrieved",
          invited: user.job_invitations.length,
        })
        .status(200);
    }
    return response.status(200);
  } catch (error) {
    console.log("Error : ", error);
  }
};

export const setprofileauth = async (request, response) => {
  try {
    let id = request.body.id;
    //console.log("id", id)
    let user = await User.findOneAndUpdate({ _id: id }, { pauth: true });
    return response
      .send({
        message: "Profile Auth Updated",
      })
      .status(200);
  } catch (error) {
    console.log("Error : ", error);
  }
};

export const getTnCFlag = async (request, response) => {
  try {
		let id = request?.body?.id;
		if(!id){
			return response
			  .send({
				message: "ID is emtpy or null",
			  })
			  .status(400);
		}
		let getuser = await User.findById(id);
		if(getuser && getuser!=null){
			return response
			  .send({
        acceptTC:getuser.acceptTC,
        acceptTCDate:getuser.acceptTCDate
			  })
			  .status(400);
		}else{
			return response
			  .send({
				message: id+" -> user not found",
				
			  })
			  .status(200);
		}
	  } catch (error) {
		console.log("Error : ", error);
		return response
			  .send({
				message: "Something went wrong",
			  })
			  .status(400);
	  }

}

// function to set TNC flag
export const setTnCFlag = async (request, response) => {
	try {
		let id = request?.body?.id;
		if(!id){
			return response
			  .send({
				message: "ID is emtpy or null",
			  })
			  .status(400);
		}
		let getuser = await User.findById(id);
		if(getuser && getuser!=null){
			let user = await User.findOneAndUpdate({ _id: id }, { acceptTC: true,acceptTCDate: new Date().toISOString()});
			return response
			  .send({
				message: "Terms and conditions set for user id ->"+id,
			  })
			  .status(400);
		}else{
			return response
			  .send({
				message: id+" -> user not found",
				
			  })
			  .status(200);
		}
	  } catch (error) {
		console.log("Error : ", error);
		return response
			  .send({
				message: "Something went wrong",
			  })
			  .status(400);
	  }
	
};



export const getprofileauth = async (request, response) => {
  try {
    let id = request.body.id;
    let getuser = await User.findById(id);
    let pauthstatus = getuser.pauth;
    let user = await User.findOneAndUpdate({ _id: id }, { pauth: false });
    return response
      .send({
        message: "Profile Auth Updated",
        status: pauthstatus,
      })
      .status(200);
  } catch (error) {
    console.log("Error : ", error);
  }
};

export const getOtherLI = async (request, response) => {
  try {
    let li = request.body.li;
    let getuser = await User.findOne(
      { linkedinurl: li },
      async function (err, res) {
        if (res) {
          return response
            .send({
              message: "Profile Found",
            })
            .status(200);
        } else {
          return response
            .send({
              message: "Profile Not Found",
            })
            .status(200);
        }
      }
    ).clone();
  } catch (error) {
    console.log("Error : ", error);
  }
};

export const handleXIStatusChange = async (request, response) => {
  try {
    let data = request.body;
    //console.log("data");
    //console.log(data);
    let user = await User.findOneAndUpdate(
      { _id: data.id },
      { status: data.status, isXI: true }
    );
    //console.log(user)
    return response.send("XI status updated successfully.").status(200);
  } catch (error) {
    console.log("Error : ", error);
  }
};

/*
	Duplicate method to avoid axios call
*/

export const vaildateSignupDetls = async (request) => {
  try {
    //console.log(request);
    let user1 = null,
      user2 = null,
      user3 = null;
    if (request.email) user1 = await User.findOne({ email: request.email });
    if (request.contact)
      user2 = await User.findOne({ contact: request.contact });
    if (request.username) {
      user3 = await User.findOne({ username: request.username });
    }
    return {
      email: user1 !== null,
      contact: user2 !== null,
      username: user3 !== null,
    };
  } catch (error) {
    console.log("Error : ", error);
  }
};

// Validate Signup details
export const vaildateSignupDetails = async (request, response) => {
  try {
    let user1 = null,
      user2 = null,
      user3 = null;
    if (request.body.email)
      user1 = await User.findOne({ email: request.body.email });
    if (request.body.contact)
      user2 = await User.findOne({ contact: request.body.contact });
    if (request.body.username) {
      user3 = await User.findOne({ username: request.body.username });
    }
    return response.json({
      email: user1 !== null,
      contact: user2 !== null,
      username: user3 !== null,
    });
  } catch (error) {
    console.log("Error : ", error);
  }
};

export const getuserbyEmail = async (request, response) => {
  try {
    let user = await User.findOne({ email: request.body.email });
    return response.json({
      data: user,
    });
  } catch (error) {
    console.log("Error : ", error);
  }
};

// Token Generator
export const tokenGen = async (user) => {
  try {
    if (user) {
      const access_token = jwt.sign(
        { user: user, iat: Date.now() },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: 6 * 60 }
      );
      return access_token;
    }
  } catch (error) {
    console.log("Error: ", error);
  }
};

// User Login
export const userLogin = async (request, response) => {
  try {
    //console.log("Checking User Function");
    //console.log(request.body)
    var userData = await User.findOne({
      secondaryEmails: request.body.username,
    });
    //console.log(userData);
    if (userData) {
      return response.status(400).json({
        msg: "You can not login with secondary email",
        email: request.body.username,
      });
    }
    var user = await User.findOne({ email: request.body.username });
    if (user == null) {
      user = await User.findOne({ username: request.body.username });
    }
    if (user == null) {
      user = await User.findOne({ contact: request.body.username });
    }
    let correctuser = false;
    if (user) {
      correctuser = passwordHash.verify(request.body.password, user.password);
    }
    if (user && correctuser) {
      let access_token = null;
      const token = tokenGen(user.id);
      token.then((tok) => {
        access_token = tok;
      });
      let ussrr = await User.findOneAndUpdate(
        { _id: user._id.toString() },
        { access_token: access_token, access_valid: true,logoutUser:false }
      );
      response.setHeader("access", access_token);
      response.setHeader("vmversion", '0.1');
      return response.status(200).json({access_token: access_token,user: ussrr});
    } else {
      return response.status(401).json("Invalid Login!");
    }
  } catch (error) {
    console.log("Error : ", error);
    return response.status(401).json(`Error : ${error.message}`);
  }
};

export const forcefullyLogoutUser = async (request, response) => {
  try {
		let id = request?.body?.id;
		if(!id){
			return response
			  .send({
				message: "ID is emtpy or null",
			  })
			  .status(400);
		}
		let getuser = await User.findById(id);
		if(getuser && getuser!=null){
			let user = await User.findOneAndUpdate({ _id: id }, { logoutUser: true});
			return response
			  .send({
				message: "User logout flag set ->"+id,
			  })
			  .status(400);
		}else{
			return response
			  .send({
				message: id+" -> user not found",
				
			  })
			  .status(200);
		}
	  } catch (error) {
		console.log("Error : ", error);
		return response
			  .send({
				message: "Something went wrong",
			  })
			  .status(400);
	  }

}


// Signup For User Using Email
export const userSignup = async (request, response) => {
  try {
    let userData = await User.findOne({
      $or: [
        {
          secondaryEmails: request.body.email,
        },
        {
          secondaryContacts: request.body.contact,
        },
      ],
    });
    if (userData) {
      return response
        .status(400)
        .json({ msg: "Email/Contact already registered" });
    }
    const candidate = await Candidate.findOne({ email: request.body.email });
    let name = String(request.body.name).split(" ");
    let firstname = name[0];
    let lastname = name.slice(1).join(" ");
    let temp_acc = v4();
    let password = passwordHash.generate(request.body.password);
    let cc = request.body.countryCode.split("-");
    let country = cc[1];
    let countryCode = cc[0];
    let user1 = {
      username: request.body.username,
      email: request.body.email,
      contact: request.body.contact,
      firstName: firstname,
      lastname: lastname,
      password: password,
      user_type: request.body.user_type,
      access_token: temp_acc,
      job_invitations: candidate ? [candidate.jobId] : [],
      language: request.body.user_type,
      showComName: request.body.showComName,
      showComLogo: request.body.showComLogo,
      showEducation: request.body.showEducation,
      showContact: request.body.showContact,
      showEmail: request.body.showEmail,
      country: country,
      countryCode: countryCode,
      status: request.body.user_type === "XI" ? "Pending" : "User",
      acceptTC: true,
      acceptTCDate: new Date().toISOString(),
      company_id: request.body.companyId
    };
    const newUser = new User(user1);
    await newUser.save();
    if (!candidate) {
      if (request.body.user_type == "User" || request.body.user_type == "XI") {
        const CandidadeCount = await Candidate.count();
        const candidateInfo = {
          email: newUser.email,
          phoneNo: newUser.contact,
          firstName: firstname,
          lastName: lastname,
          candidate_id: CandidadeCount + 1,
          jobId: "",
        };

        let newCandidate = new Candidate(candidateInfo);
        await newCandidate.save();
      }
    }

    const creditInfo = {
      userId: newUser._id,
    };
    let user_creditInfo = new userCredit_info(creditInfo);
    await user_creditInfo.save();

    if (request.body.user_type === "XI") {
      const candidateInfo = {
        candidate_id: newUser._id,
      };
      let xi = new xi_info(candidateInfo);
      await xi.save();
    }

    // const token = await axios.post(`${url}/generateToken`, {
    //   user: newUser.id,
    // });
    // // console.log(token);
    // let access_token = token.data.token;
    let access_token;
    const token = tokenGen(newUser.id);
    token.then((tok) => {
      access_token = tok;
    });

    let ussrr = await User.findOneAndUpdate(
      { _id: newUser._id.toString() },
      { access_token: access_token, access_valid: true }
    );

    let html = `<div>Hi ${request.body.username}</div>,
    <div>Welcome to Value Matrix. It is a great pleasure to have you on board</div>.
    <div>Regards,</div>
    <div>Value  Matrix</div>`;

    await sendGridMail.send({
      to: request.body.email,
      from: supportEmail,
      subject: "Value Matrix Sign Up",
      html: html,
    });
    if (ussrr) {
      return response
        .status(200)
        .json({ user: ussrr, access_token: access_token });
    } else {
      return response.status(400).json("Invalid Signup!");
    }
  } catch (error) {
    console.log(error);
    return response.status(400).json("Something went wrong.");
  }
};

// Update Password
export const updatePassword = async (request, response) => {
  try {
    const { userId, currentPassword, newPassword } = request.body;
    const user = await User.findById(userId);

    if (!user) {
      return response.status(404).json({ msg: "User not found" });
    }
    const passwordMatch = await passwordHash.verify(
      currentPassword,
      user.password
    );
    if (!passwordMatch) {
      return response
        .status(401)
        .json({ msg: "Current password is incorrect" });
    }

    const hashedPassword = await passwordHash.generate(newPassword);

    await User.updateOne({ _id: userId }, { password: hashedPassword });

    return response.status(200).json({ msg: "Password updated successfully" });
  } catch (error) {
    return response.status(500).json({ msg: `Error: ${error.message}` });
  }
};

// Get User From Id
export const getUserFromId = async (request, response) => {
  try {
    User.findById(request.body.id, async function (err, res) {
      if (res) {
        // console.log(res);
        return response.status(200).json({ user: res });
      }
      response.status(403).json({ Message: "User Not Found" });
    });
  } catch (error) {
    console.log("Error :", error);
  }
};
export const getUserFromid = async (id) => {
  try {
    const user = await User.findById(id);
    return user;
  } catch (error) {
    console.log("Error :", error);
    return null;
  }
};
export const getUser = async (request, response) => {
  try {
    User.findById(request.body.id, async function (err, res) {
      if (res) {
        // console.log(res);
        return response.status(200).json({ user: res });
      }
      response.status(403).json({ Message: "User Not Found" });
    });
  } catch (error) {
    console.log("Error :", error);
  }
};

// Get country
export const fetchCountry = async (request, response) => {
  try {
    // let res = await country.find({});
    // console.log("hii");
    // console.log(res);
    await Country.find({})
      .collation({ locale: "en" })
      .sort({ country: 1 })
      .exec(function (err, countries) {
        if (err) return console.error(err);
        //console.log(countries);

        return response.status(200).json({ countries });
      });
  } catch (error) {
    console.log("Error :", error);
  }
};
export const getCountryList = async (request, response) => {
  try {
    // let res = await country.find({});
    // console.log("hii");
    // console.log(res);
    await AddCountry.find({})
      .collation({ locale: "en" })
      .sort({ country: 1 })
      .exec(function (err, countries) {
        if (err) return console.error(err);
        //console.log(countries);

        return response.status(200).json({ countries });
      });
  } catch (error) {
    console.log("Error :", error);
  }
};
/*
// read profile image from S3 bucket
export const getProfileImg = async (request, response) => {
    try {
      console.log("request.body.id:"+request.body.id);
      // check if the request is empty
      if(request?.body?.id){
        //console.log("request.body.id2:"+request.body.id);
        // check if the user is valid
        User.findById(request.body.id, async function (err, res) {
          if(res){
            // retrieve image from S3
            let params = { 
              Bucket: process.env.AWS_S3_BUCKET_NAME+"/"+process.env.AWS_S3_PROFILE_IMAGE_BUCKET_FOLDER, 
              Key: request.body.id + "-profileImg.png" 
            };
            s3.getObject(params, function(err, data){
              if (err) { 
                console.log(err);
                return response.status(400).json({ Message: "User profile image not found" });
              } else {
                // Convert file to base65 image
                let img = new Buffer(data.Body, 'base64');
                //console.log("img"+img);
                //res.contentType(data.ContentType);
                //res.status(200).send(img);
                return response.status(200).json({ Image: img });
              } 
            });
    
          }else {
            return response.status(403).json({ Message: "Invalid user id" });
          }
        });

      }
      

    }catch (error) {
      console.log("Error : ", error);
    }
  
};
*/

// export const getProfileImg = async (request, response) => {
// 	{
// 		try {
// 			//console.log("request.body.id:"+request.body.id);
// 			User.findById(request.body.id, async function (err, res) {
// 				//console.log("res.access_valid:");
// 				if (res) {
// 					//console.log(res.profileImg);
// 					if (res.profileImg) {
// 						let path_url = IMAGEPATH + res.profileImg;
// 						let d = await fs.readFileSync(
// 							path.resolve(path_url),
// 							{},
// 							function (err, res) {}
// 						);
// 						// console.log(d)
// 						return response.status(200).json({ Image: d });
// 					} else {
// 						return response.status(400).json({ Message: "No Profile Image" });
// 					}
// 				}
// 				return response.status(403).json({ Message: "User Not Found" });
// 			});
// 		} catch (error) {
// 			console.log("Error : ", error);
// 		}
// 	}
// };

export const getProfileImg = async (request, response) => {
  try {
    const user = await User.findById(request.body.id);
    if (user) {
      if (user.profileImg) {
        const path_url = IMAGEPATH + user.profileImg;
        if (fs.existsSync(path_url)) {
          const d = await fs.readFileSync(path.resolve(path_url));
          return response.status(200).json({ Image: d });
        } else {
          return response.status(400).json({ Message: "No Profile Image" });
        }
      } else {
        return response.status(400).json({ Message: "No Profile Image" });
      }
    } else {
      return response.status(403).json({ Message: "User Not Found" });
    }
  } catch (error) {
    console.log("Error : ", error);
  }
};

//Update Linkedin profile 
// export const updateLinkedInProfile = async (request, response) => {
//   let linkedinurl = request?.body?.linkedinurl;

//   let respData=[]
//    if(linkedinurl && linkedinurl.length>0){
//     try{
//     console.log("linkedinurl: ",linkedinurl);
//     linkedinurl.forEach((item) => {
//      axios.post(psycurl + "?linkedInProfileUrl=" + linkedinurl).then((linkedinurlkey)=>{
//       if(linkedinurlkey){
//         respData.push({
//           linkedinurl:linkedinurl,
//           linkedinurlkey:linkedinurlkey
//         });
//         let usrs = User.findOne({linkedinurl:linkedinurl});
//         console.log("usrs: ",usrs);
//         if(usrs){
//           User.findOneAndUpdate(
//             { linkedinurl: linkedinurl},{ linkedinurlkey: linkedinurlkey },async function (err, res) {
//               if(err){
//                 response.send({message:"Something went wrong - ULP 004"}).status(400);          
//               }
//               if(res){
//                 response.send({linkedinurlkey:linkedinurlkey}).status(200);    
//               }
//             }
//           );
//         }
//       }else{
//         response.send({message:"Something went wrong - ULP 003"}).status(400);    
//       }
//      });
//     });
//     }catch(error){
//       console.log(error);
//       response.send({message:"Something went wrong - ULP 002"}).status(400);  
//     }
//   }else{
//     response.send({message:"Something went wrong - ULP 001"}).status(400);
//   }
// }

// Update Linkedin profile 
export const updateLinkedInProfile = async (request, response) => {
  let linkedinurl = request?.body?.linkedinurl;
  let respData = [];
  if (linkedinurl && linkedinurl.length > 0) {
    try {
      await Promise.all(linkedinurl.map(async (item) => {
        try {
          const linkedinurlkey = await axios.post(psycurl + "?linkedInProfileUrl=" + item)
          if (linkedinurlkey) {
            respData.push({
              linkedinurl: item,
              linkedinurlkey: linkedinurlkey
            });
            // let usrs = await User.findOne({ linkedinurl: item });
            
            // if (usrs) {
            //   User.updateOne({ linkedinurl: item },{ $set: { linkedinurlkey: linkedinurlkey.data } }).then(async(err,res)=>{
            //       if (err) {
            //         response.send({ message: "Something went wrong - ULP 004" }).status(400);
            //       }
            //       if (res) {
            //         response.send({ linkedinurlkey: linkedinurlkey }).status(200);
            //       }
            //   })
            // }
          } 
          // else {
          //   response.send({ message: "Something went wrong - ULP 003" }).status(400);
          // }
        } catch (error) {
          console.log(error);
          response.send({ message: "Something went wrong - ULP 002" }).status(400);
        }
      }));
    } catch (error) {
      console.log(error);
      response.send({ message: "Something went wrong - ULP 002" }).status(400);
    }
  } else {
    response.send({ message: "Something went wrong - ULP 001" }).status(400);
  }
  response.send({ respData: respData }).status(200);
}



// Update User Profile
export const updateUserDetails = async (request, response) => {
  // console.log("request.body.updates" , request.body.updates);
  //console.log(request.body.updates);
  try {
    // let validate = await axios.post(
    // 	`${url}/validateSignup`,
    // 	request.body.updates
    // );
    let validate = await vaildateSignupDetls(request.body.updates);
    if (validate.email) {
      return response.json({
        Error: "Email already registered",
        contact: 0,
        email: 1,
      });
    }
    if (validate.contact) {
      return response.json({
        Error: "Contact already registered",
        contact: 1,
        email: 0,
      });
    }
    let linkedinurlkey = "";
    if (request?.body?.updates?.linkedinurl) {
      //run the psych profile for the linkedin url passed
      linkedinurlkey = await axios.post(
        psycurl + "?linkedInProfileUrl=" + request?.body?.updates?.linkedinurl
      );
    }

    let updates = request?.body?.updates;
    let data = updates.data?updates.data:updates;
    updates.linkedinurlkey = linkedinurlkey?.data;
    User.findOne({ _id: request.body.user_id }, function (err, res) {
      if (res.access_valid === false) return response.status(403);
    });
    let user1 = await User.findOneAndUpdate(
      { _id: request.body.user_id },
      data,
      { new: true }
    );
    response.status(200).json({ user: user1 });
  } catch (error) {
    console.log("update Error, ", error);
  }
};

export const updateUserLanguage = async (request , response) => {
  try{
    let updates = request?.body?.updates;
    console.log("uu" , updates)
    let data = updates.data?updates.data:updates;
    User.findOne({ _id: request.body.user_id }, function (err, res) {
      if (res.access_valid === false) return response.status(403);
    });
    let user1 = await User.findOneAndUpdate(
      { _id: request.body.user_id },
      data,
      { new: true }
    );
    response.status(200).json({ user: user1 });

  }
  catch(error){
    console.log("update Error, ", error);
  }
}

export const updateUserSkills = async (request , response) =>{
  try{
    let updates = request?.body?.updates;
    let data = updates.data?updates.data:updates;
    User.findOne({ _id: request.body.user_id }, function (err, res) {
      if (res.access_valid === false) return response.status(403);
    });
    let user1 = await User.findOneAndUpdate(
      { _id: request.body.user_id },
      data,
      { new: true }
    );
    response.status(200).json({ user: user1 });

  }
  catch(error){
    console.log("update Error, ", error);
  }
}


export const updateBaseliningResp = async (request, response) => {
  return response.status(200).json({ Success: true });
};

// Update Profile Picture
// export const updateProfileImage = async (req, response) => {
//   try {
//     User.findOne({ _id: req.body.user_id }, async function (err, user) {
//       let user_type = req.query.user;
//       console.log(user_type);
//       if (user_type === "User") {
//         let path_url = IMAGEPATH + req.file.filename;
//         console.log("path_url", path_url);
//         // const options = {
//         //   method: "POST",
//         //   url: "https://face-detection6.p.rapidapi.com/img/face",
//         //   headers: {
//         //     "content-type": "application/json",
//         //     "X-RapidAPI-Key":
//         //       "8f063108cfmsh3aa100a3fcfbaacp154179jsnb2004b15c7fc",
//         //     "X-RapidAPI-Host": "face-detection6.p.rapidapi.com",
//         //   },
//         //   data: { url: path_url, accuracy_boost: 2 },
//         // };

//         // let profileData = await axios.request(options);

//         // if (profileData.data.detected_faces.length == 0) {
//         //   return response.status(200).json({ Message: "No Faces Found" });
//         // } else if (profileData.data.detected_faces.length != 1) {
//         //   return response
//         //     .status(200)
//         //     .json({ Message: "More than one faces Found" });
//         // }
//       }

//       let str = user._id + "-profileImg.png";
//       user.profileImg = str;
//       await user.save();

//       //console.log(user);
//       return response.status(200).json({ Success: true });
//     });
//   } catch (error) {
//     return response.status(400).send(error);
//   }
// };
export const updateProfileImage = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.user_id });
    if (!user) {
      return res.status(404).json({ Success: false, Message: "User not found" });
    }
    
    let user_type = req.query.user;
    console.log(user_type);

    if (user_type === "User") {
      let path_url = IMAGEPATH + req.file.filename;
      console.log("path_url", path_url);
    }

    let str = user._id + "-profileImg.png";
    user.profileImg = str;
    await user.save();
    
    return res.status(200).json({ Success: true });
  } catch (error) {
    return res.status(500).json({ Success: false, Message: "Internal Server Error" });
  }
};

// Logout
export const logout = async (req, response) => {
  try {
    await User.findOne({ _id: req.body.user_id }, function (err, res) {
      if (res) {
        res.access_valid = false;
        res.save();
      }
    }).clone();
    response.status(200);
    response.send("success");
  } catch (error) {
    console.log("Error : ", error);
  }
};


// upload resume
export const uploadUserResume = async (req, response) => {
  try{
    let userId= req?.body?.user_id;
    if(userId){
      // check if the user of such ID is present
      User.findOne({ _id: userId}, async function (err, user) {
        if(err){
          let log = {
            action:"Resume upload",
            data: "Couldn't find user for ID : "+userId+" - UPR0002"
          }
          logItDirect(log);
          response.status(400).send("Couldn't find user for ID : "+userId+" - UPR0002");      
        }
        if(user){
          // lets process the resume file
          user.resume = userId+ "-resume";
          let path_url = RESUMEPATH + req.body.user_id + "-resume";
          let buffer = fs.readFileSync(path.resolve(path_url));
          var base64Doc = buffer.toString("base64");
          var modifiedDate = new Date().toISOString().substring(0, 10);
          var postData = JSON.stringify({
            DocumentAsBase64String: base64Doc,
            DocumentLastModified: modifiedDate,
          });
          var options = {
            url: "https://rest.resumeparsing.com/v10/parser/resume",
            method: "POST",
            maxContentLength: process.env.FILE_MAX_CONTENT_SIZE || 10485760, // 10mb
            maxBodyLength: process.env.FILE_MAX_BODY_LENGTH || 10485760, // 10mb
            timeout: 5000000,
            headers: {
              "Sovren-AccountId": `${sovrenAccountID}`,
              "Sovren-ServiceKey": `${sovrenServiceKey}`,
              Accept: "application/json",
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(postData),
            },
            data: postData,
          };
          let ResumeParseData = await axios.request(options);
          if ( ResumeParseData?.data && ResumeParseData?.data?.Info.Code === "Success") {
            let resumeData = ResumeParseData?.data?.Value?.ResumeData;
            user.firstName =resumeData?.ContactInformation?.CandidateName?.GivenName;
            user.lastname =resumeData?.ContactInformation?.CandidateName?.FamilyName;
          let arr = [];
          if (
            resumeData &&
            resumeData?.ContactInformation?.EmailAddresses &&
            Object.values(resumeData?.ContactInformation?.EmailAddresses)[0] !=
              user.email
          ) {
            // console.log("rrrr123" , resumeData?.ContactInformation)
            arr.push(
              Object.values(resumeData?.ContactInformation?.EmailAddresses)[0]
            );
            user.secondaryEmails = arr;
          } else {
            // console.log("rrrr" , resumeData?.ContactInformation)
            if(resumeData?.ContactInformation?.EmailAddresses){
                user.email = Object.values(
                resumeData?.ContactInformation?.EmailAddresses
                )[0];
            }
            else {
              user.email = user?.email
            }

          }

          if (
            resumeData &&
            resumeData?.ContactInformation &&
            resumeData?.ContactInformation?.Telephones
          ) {
            if (
              resumeData?.ContactInformation?.Telephones[0]?.Raw !=
              user?.contact
            ) {
              if (resumeData?.ContactInformation?.Telephones?.[0]?.Raw) {
                let arr = [];
                arr.push(resumeData?.ContactInformation?.Telephones[0]?.Raw);
                user.secondaryContacts = arr;
              }
            } else {
              user.contact =
                resumeData?.ContactInformation?.Telephones[0]?.Raw;
            }
          }

          // user.street = resumeData?.ContactInformation?.Location
          //   ? resumeData?.ContactInformation?.Location?.StreetAddressLines?.[0]
          //   : "";

          let linkedIn = resumeData?.ContactInformation?.WebAddresses
            ? resumeData?.ContactInformation?.WebAddresses.filter(
                (obj) => obj.Type == "LinkedIn"
              )
            : [];
          user.linkedinurl =
            linkedIn && linkedIn.length > 0 ? linkedIn[0].Address : "";
          user.resume = user._id + "-resume";

          if (resumeData?.Education && resumeData?.Education?.EducationDetails) {
            let eduArr = [];
            for (
              let i = 0;
              i < resumeData?.Education?.EducationDetails?.length;
              i++
            ) {
              const edu = resumeData?.Education?.EducationDetails[i];
              let EduObj = {
                school: edu?.SchoolName?.Raw ? edu?.SchoolName?.Raw: "",
                degree: edu?.Degree?.Name?.Raw ? edu?.Degree?.Name?.Raw:"",
                field_of_study: edu.Majors ? edu.Majors[0] : "",
                start_date: "",
                end_date: edu?.LastEducationDate?.Date ? edu?.LastEducationDate?.Date : "",
                grade: edu?.GPA?.Score ?edu?.GPA?.Score : "",
                description: "",
                Ispresent: edu?.LastEducationDate?.IsCurrentDate ? edu?.LastEducationDate?.IsCurrentDate : false,
              };
              eduArr.push(EduObj);
            }
            if(eduArr && eduArr.length>0){
              user.education = eduArr;
            }
          }

          if (
            resumeData?.EmploymentHistory &&
            resumeData?.EmploymentHistory?.Positions
          ) {
            let exp =[];
            for (
              let i = 0;
              i < resumeData?.EmploymentHistory?.Positions?.length;
              i++
            ) {
              const experience = resumeData?.EmploymentHistory?.Positions[i];
              let experienceObj = {
                title: experience.JobTitle ? experience.JobTitle.Raw : "",
                company_name: experience.Employer
                  ? experience?.Employer?.Name?.Raw
                  : "",
                location: "",
                start_date: experience.StartDate
                  ? experience?.StartDate?.Date
                  : "",
                end_date: experience.EndDate ? experience.EndDate.Date : "",
                industry: "",
                description: experience?.Description ? experience?.Description : "",
                Ispresent: experience?.EndDate
                  ? experience?.EndDate?.IsCurrentDate
                  : "",
              };
              exp.push(experienceObj);
            }
            if(exp && exp.length>0){
              user.experience=exp;
            }
          }
          if (resumeData?.LanguageCompetencies) {
            for (let i = 0; i < resumeData?.LanguageCompetencies?.length; i++) {
              const languages = resumeData?.LanguageCompetencies[i];
              let lanObj = {
                name: languages.Language,
                read: false,
                write: false,
                speak: true,
              };
              user.language.push(lanObj);
            }
          }
          user.save().then(()=>{
            response.status(200).send({ success: true, user:user});
          });
          }else{
            let log = {
              action:"Resume upload",
              data: "Couldn't parse the resume provided by the user - UPR0003"
            }
            logItDirect(log);
            response.status(400).send("Couldn't parse the resume provided by the user - UPR0003");      
      
          }
        }
      });
    }else{
      let log = {
        action:"Resume upload",
        data: "User ID is empty or null - UPR0001"
      }
      logItDirect(log);
      response.status(400).send("User ID is empty or null - UPR0001");      
    }
  }catch(err) {
    let log = {
      action:"Resume upload",
      data:err
    }
    logItDirect(log);
    response.status(400).send("Something went wrong in resume upload - UPR0000");
  }

}
// Candidate Resume Upload
export const uploadCandidateResume = async (req, response) => {
  try {
    User.findOne({ _id: req.body.user_id }, async function (err, user) {
      let str = user._id + "-resume";
      user.resume = str;
      await user.save();
      let path_url = RESUMEPATH + req.body.user_id + "-resume";
      let buffer = await fs.readFileSync(path.resolve(path_url));
      var base64Doc = buffer.toString("base64");
      var modifiedDate = new Date().toISOString().substring(0, 10);
      var postData = JSON.stringify({
        DocumentAsBase64String: base64Doc,
        DocumentLastModified: modifiedDate,
      });

      var options = {
        url: "https://rest.resumeparsing.com/v10/parser/resume",
        method: "POST",
        maxContentLength: process.env.FILE_MAX_CONTENT_SIZE || 10485760, // 10mb
        maxBodyLength: process.env.FILE_MAX_BODY_LENGTH || 10485760, // 10mb
        timeout: 5000000,
        headers: {
          "Sovren-AccountId": `${sovrenAccountID}`,
          "Sovren-ServiceKey": `${sovrenServiceKey}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        data: postData,
      };

      try {
        let ResumeParseData = await axios.request(options);
        if (
          ResumeParseData.data &&
          ResumeParseData.data.Info.Code === "Success"
        ) {
          let resumeData = ResumeParseData?.data?.Value?.ResumeData;
          console.log("resumeData :",resumeData);
          profileData.firstName =
            resumeData?.ContactInformation?.CandidateName?.FormattedName;
          let arr = [];
          if (
            resumeData &&
            resumeData.ContactInformation.EmailAddresses &&
            Object.values(resumeData.ContactInformation.EmailAddresses)[0] !=
              user.email
          ) {
            arr.push(
              Object.values(resumeData.ContactInformation.EmailAddresses)[0]
            );
            profileData.secondaryEmails = arr;
          } else {
            profileData.email = Object.values(
              resumeData.ContactInformation.EmailAddresses
            )[0];
          }

          if (
            resumeData &&
            resumeData.ContactInformation &&
            resumeData.ContactInformation.Telephones
          ) {
            if (
              resumeData?.ContactInformation?.Telephones[0]?.Raw !=
              user?.contact
            ) {
              if (resumeData?.ContactInformation?.Telephones?.[0]?.Raw) {
                let arr = [];
                arr.push(resumeData?.ContactInformation?.Telephones[0]?.Raw);
                profileData.secondaryContacts = arr;
              }
            } else {
              profileData.contact =
                resumeData?.ContactInformation?.Telephones[0]?.Raw;
            }
          }

          profileData.address = resumeData?.ContactInformation?.Location
            ? resumeData?.ContactInformation?.Location?.StreetAddressLines?.[0]
            : "";

          let linkedIn = resumeData?.ContactInformation?.WebAddresses
            ? resumeData?.ContactInformation?.WebAddresses.filter(
                (obj) => obj.Type == "LinkedIn"
              )
            : [];
          profileData.linkedInId =
            linkedIn && linkedIn.length > 0 ? linkedIn[0].Address : "";
          profileData.resume = user._id + "-resume";

          if (resumeData.Education && resumeData.Education.EducationDetails) {
            for (
              let i = 0;
              i < resumeData.Education.EducationDetails.length;
              i++
            ) {
              const edu = resumeData.Education.EducationDetails[i];
              let EduObj = {
                school: edu?.SchoolName?.Raw,
                degree: edu?.Degree?.Name?.Raw,
                field_of_study: edu.Majors ? edu.Majors[0] : "",
                start_date: "",
                end_date: edu?.LastEducationDate?.Date,
                grade: edu?.GPA?.Score,
                description: null,
                Ispresent: edu?.LastEducationDate?.IsCurrentDate,
              };
              profileData.education.push(EduObj);
            }
          }

          if (
            resumeData.EmploymentHistory &&
            resumeData.EmploymentHistory.Positions
          ) {
            for (
              let i = 0;
              i < resumeData.EmploymentHistory.Positions.length;
              i++
            ) {
              const experience = resumeData.EmploymentHistory.Positions[i];
              let experienceObj = {
                title: experience.JobTitle ? experience.JobTitle.Raw : "",
                company_name: experience.Employer
                  ? experience.Employer.Name.Raw
                  : "",
                location: "",
                start_date: experience.StartDate
                  ? experience.StartDate.Date
                  : "",
                end_date: experience.EndDate ? experience.EndDate.Date : "",
                industry: "",
                description: experience.Description,
                Ispresent: experience.EndDate
                  ? experience.EndDate.IsCurrentDate
                  : "",
              };
              profileData.experience.push(experienceObj);
              profileData.associate.push(experienceObj);
            }
          }

          if (resumeData.Skills && resumeData.Skills.Raw) {
            for (let i = 0; i < resumeData.Skills.Raw.length; i++) {
              const skills = resumeData.Skills.Raw[i];
              let toolsObj = {
                _id: "",
                primarySkill: skills.Name,
                secondarySkill: "",
                role: "",
                proficiency: "0",
              };
              profileData.tools.push(toolsObj);
            }
          }

          if (resumeData.LanguageCompetencies) {
            for (let i = 0; i < resumeData.LanguageCompetencies.length; i++) {
              const languages = resumeData.LanguageCompetencies[i];
              let lanObj = {
                name: languages.Language,
                read: false,
                write: false,
                speak: true,
              };
              profileData.language.push(lanObj);
            }
          }
          return response
            .status(200)
            .json({ Success: true, data: profileData });
        }
      } catch (error) {
        console.log(error);
        return response.status(422).json({ Success: true, data: profileData });
      }
    });
  } catch (error) {
    console.log("Error : ", error);
    return response.status(400).json(error);
  }
};

// Submit Candidate Resume Details
export const submitCandidateResumeDetails = async (req, response) => {
  try {
    console.log(req.body);
    await User.findOne({ _id: req.body.user_id }, async function (err, user) {
      if (user === null) return response.status(403);
      if (req.body.education) {
        user.education = req.body.education;
      }
      if (req.body.experience) {
        user.experience = req.body.experience;
      }
      if (req.body.houseNo) {
        user.houseNo = req.body.houseNo;
      }
      if (req.body.street) {
        user.street = req.body.street;
      }
      if (req.body.city) {
        user.city = req.body.city;
      }

      if (req.body.country) {
        user.country = req.body.country;
      }
      if (req.body.state) {
        user.state = req.body.state;
      }
      if (req.body.zip) {
        user.zip = req.body.zip;
      }
      if (req.body.associate) {
        user.associate = req.body.associate;
      }
      if (req.body.language) {
        user.language = req.body.language;
      }
      if (
        (user.contact === user.googleId ||
          user.contact === user.microsoftId ||
          user.contact === user.linkedInId ||
          user.contact === user.githubId) &&
        req.body.contact &&
        req.body.contact.contact
      ) {
        user.contact = req.body.contact.contact;
      }
      if (req.body.tools) {
        let tools = user.tools ? user.tools : [];
        tools = tools.concat(req.body.tools);
        user.tools = tools;
      }

      await user.save();

      return response.status(200).json({ Success: true, user: user });
    }).clone();
  } catch (error) {
    console.log("Error : ", error);
  }
};

// Submit Company Resume Details
export const submitCompanyDetails = async (req, response) => {
  try {
    User.findOne({ _id: req.body.user_id }, async function (err, user) {
      user.desc = req.body.about;
      // user.experience =req.body.experience;
      // user.address = req.body.contact.address;
      user.city = req.body.city;
      user.country = req.body.country;
      user.street = req.body.street;
      user.state = req.body.state;
      user.zip = req.body.zip;
      user.houseNo = req.body.houseNo;

      user.tools = req.body.tools;
      await user.save();
      return response.status(200).json({ Success: true, user: user });
    });
  } catch (error) {
    console.log("Error : ", error);
  }
};

// Get User From Reset Pass ID
export const getUserInviteFromResetPassId = async (request, response) => {
  try {
    User.findOne(
      { resetPassId: request.body.reset_id },
      async function (err, res) {
        if (res) {
          return response.status(200).json({
            user_invite: res.invite,
            email: res.email,
            contact: res.contact,
          });
        }
        response.status(403).json({ Message: "" });
      }
    );
  } catch (error) {
    console.log("Error :", error);
  }
};

// Set Profile

export const setProfile = async (request, response) => {
  try {
    User.findOne(
      { resetPassId: request.body.reset_pass_id },
      async function (err, user) {
        if (
          user.resetPassId &&
          user.resetPassId === request.body.reset_pass_id
        ) {
          user.username = request.body.username;
          user.password = passwordHash.generate(request.body.password);
          let access_token ;
          const token = tokenGen(user.id).then((value) =>{
            access_token = value;
          });
          user.access_token = access_token;
          user.access_valid = true;
          user.invite = false;
          await user.save();
          return response
            .status(200)
            .json({ Success: true, access_token: access_token });
        }
        return response.status(403);
      }
    );
  } catch (error) {
    console.log("Error : ", error);
  }
};

// Get Job Invitations
export const getJobInvitations = async (request, response) => {
  try {
    await User.findOne(
      { _id: request.body.user_id },
      async function (err, user) {
        if (user) {
          let jobInvites = await Job.find({
            _id: { $in: user.job_invitations },
          }).clone();
          let jobInvitesbin = await jobBin
            .find({
              _id: { $in: user.job_invitations },
            })
            .clone();
          console.log(jobInvitesbin);
          return response
            .status(200)
            .json({ jobInvites: jobInvites, jobInvitesbin: jobInvitesbin });
        }
        return response.status(403);
      }
    ).clone();
  } catch (error) {
    console.log("Error : ", error);
  }
};

// Send candidate Invitation
export const inviteCandidate = async (request, response) => {
  console.log("BODY------------", request.body);
  let userId = request.body.userId;
  let candidateEmail = request.body.candidates[0].Email;
  let jobInvitationExists = false;
  await User.findOne({ email: userId }).then(async (user) => {
    if (user) {
      if (user.job_invitations && user.job_invitations.length > 0) {
        await User.updateOne(
          { _id: userId },
          { $push: { job_invitations: request.body.jobId } }
        ).then((result) => {
          return response.status(200).json({ Success: true });
        });
      } else {
        await User.updateOne(
          { _id: userId },
          { $set: { job_invitations: [request.body.jobId] } }
        ).then((result) => {
          return response.status(200).json({ Success: true });
        });
      }
    } else {
      return response.status(403);
    }
  });
};

// send invitation to candidate
export const sendJobInvitation = async (request, response) => {
  let userId = request.body.userId;
  let jobInvitationExists = false;
  await User.findOne({ _id: userId }).then(async (user) => {
    if (user) {
      if (user.job_invitations && user.job_invitations.length > 0) {
        await User.updateOne(
          { _id: userId },
          { $push: { job_invitations: request.body.jobId } }
        ).then((result) => {
          return response.status(200).json({ Success: true });
        });
      } else {
        await User.updateOne(
          { _id: userId },
          { $set: { job_invitations: [request.body.jobId] } }
        ).then((result) => {
          return response.status(200).json({ Success: true });
        });
      }
    } else {
      return response.status(403);
    }
  });
};

// Handle Candidate Job Invitation
export const handleCandidateJobInvitation = async (request, response) => {
  try {
    await Job.findOne({ _id: request.body.job_id }, async function (err, job) {
      if (job) {
        await User.findOne(
          { _id: request.body.user_id },
          async function (err, user) {
            if (user) {
              if (request.body.accept) {
                let e = user.job_invitations.filter(
                  (item) => item !== request.body.job_id
                );
                user.job_invitations = e;
                let d = job.applicants ? job.applicants : [];
                d.push(user._id);
                job.applicants = d;
                let newInterview = new Interview({
                  job: request.body.job_id,
                  applicant: user._id,
                  interviewers: request.body.interviewers,
                  interviewState: 0,
                });
                await newInterview.save();
                await user.save();
                await job.save();
                return response
                  .status(200)
                  .json({ Success: true, data: newInterview });
              } else {
                user.job_invitations = user.job_invitations.filter(
                  (item) => item !== request.body.job_id
                );
                let d = job.invitations_declined
                  ? job.invitations_declined
                  : [];
                d.push(user._id);
                job.invitations_declined = d;
                await job.save();
                await user.save();
                return response.status(200).json({ Success: true });
              }
            }
            return response.status(403);
          }
        ).clone();
      }
      return response.status(403);
    }).clone();
  } catch (err) {
    console.log(err);
  }
};

// Approve company
export const approveCompany = async (req, res) => {
  try {
    const jobData = await UserBin.findOne({
      _id: req.body._id,
      user_type: "Company",
    }).lean();
    delete jobData._id;
    delete jobData.__v;
    const newJob = new User(jobData);
    await newJob.save();
    await UserBin.findOneAndDelete({ _id: req.body._id });
    res.send();
  } catch (err) {
    console.log("Error approveJob: ", err);
    res.send(err);
  }
};

// list of unapproved jobs
export const listOfUnapproveCompanies = async (req, res) => {
  try {
    const jobData = await UserBin.find({ user_type: "Company" });
    res.send(jobData);
  } catch (err) {
    console.log("Error listOfUnapproveCompanies: ", err);
    res.send(err);
  }
};

// list of unapproved jobs
export const getBlockedDate = async (req, res) => {
  try {
    const uuser = await User.findById(req.body.id);
    res
      .send({
        data: "Date Added",
        dates: uuser.blockedDates,
      })
      .status(200);
  } catch (err) {
    console.log("Error Update Blocked Date: ", err);
    res.send(err);
  }
};

// list of unapproved jobs
export const updateBlockedDate = async (req, res) => {
  try {
    const uuser = await User.findOneAndUpdate(
      { _id: req.body.id },
      { blockedDates: req.body.blockeddates }
    );
    res
      .send({
        data: "Date Added",
      })
      .status(200);
  } catch (err) {
    console.log("Error Update Blocked Date: ", err);
    res.send(err);
  }
};

export const handleXIInterview = async (request, response) => {
  try {
    console.log(request.body);

    let newInterview = new XIInterview({
      slotId: request.body.slotId,
      applicant: request.body.applicant,
      interviewer: request.body.interviewer,
      status: request.body.status,
    });
    await newInterview.save();

    console.log(newInterview);

    return response.status(200).json({ Success: true, data: newInterview });
  } catch (err) {
    console.log(err);
  }
};

// Otp helper function
function generateOTP() {
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

// Send Otp To Email
export const sendOtpToEmail = async (req, res) => {
  let userId = req.body.id;
  if (userId) {
    try {
      let resp = await User.findOne(
        { _id: userId },
        async function (err, result) {
          if (err) {
            res.status(404).send("unsuccessful");
          } else if (res) {
            console.log("res", result.firstName);
            let email = result.email;
            console.log("email", email);
            let otp = generateOTP();
            let html = `<h3>OTP</h3>
			<br/>
			Hi ${result.firstName},
			<br/>
			This is your OTP <b>${otp}</b>
			<br/>
  
			<br/>
			If you are facing any technical difficulties please reach to us at, support@valuematrix.ai.
			<br/>
			Best regards.
			<br/>
			Valuematrix.ai Team. `;

            await sendGridMail.send({
              to: email,
              from: supportEmail,
              subject: `OTP ${otp}`,
              html: html,
            });
            res.status(200).json({
              Success: true,
              OTP: otp,
            });
          }
        }
      ).clone();
    } catch (err) {
      console.log(err);
    }
  }
};

export const sendInterviewAcceptNotification = async(req,res)=>{
  
  let xiIds = req.body.xiIds
  let xiDetails = await User.find({ _id: { $in: xiIds } })
  let jobData = await Job.findOne({_id : req.body.jobId})
  let role = jobData?.jobTitle
  
  if (xiDetails && xiDetails.length > 0) {
    for (let i = 0;i<xiDetails.length;i++) {
      let elem = xiDetails[i]
      let email = elem["email"]
      let html
      let subject
      let firstName = elem["firstName"]
      
      if (req.body.toCandidate) {
        subject = `Interview Scheduled for ${role} Role : ValueMatrix`
        html = `Dear ${firstName},
        <br/>
        I hope this email finds you well. 
        <br/>
        We are pleased to inform you that the interview meeting for the [Position] role at [Company Name] has been scheduled.
        <br />
        The interview will take place on [Date] at [Time] [Timezone]. The interview will be conducted via our platform and will last for approximately 60 minutes. You will find the option to join the interview on the Scheduled Page of your ValueMatrix Dashboard, 30 minutes before the interview starts.
        <br />
        Please ensure that you are prepared for the interview and have reviewed the job description.
        
    
        <br/>
        If you are facing any technical difficulties please reach to us at, support@valuematrix.ai.
        <br/>
        Thank you for your time and assistance.
        <br/>
        Best regards,
        ValueMatrix Team.`;
        
      } else {
          html = `
                    Dear ${firstName},
                    <br/>
                    You have received an interview invitation for the [Position] role.
                    We would appreciate it if you could conduct the interview via our platform for approximately 60 minutes.

                    To accept this invitation, please visit our Platform and click on the accept button. 
                    <br/>
                    <a href=${front_url}>Click here</a>
                
                    <br/>
                    If you are facing any technical difficulties please reach to us at, support@valuematrix.ai.
                    <br/>
                    Thank you for your time and assistance.
                    <br/>
                    Best regards,
                    ValueMatrix Team.`;
      
          subject = `Interview Invitation for ${role} Role: ValueMatrix`
          const now = new Date();
          const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

          tomorrow.setHours(11, 0, 0, 0);

          const delay = tomorrow - now;

          setTimeout(async() => {
            await sendGridMail.send({
              to: email,
              from: supportEmail,
              subject: subject,
              html: html,
            });
          }, delay);
      }
      await sendGridMail.send({
        to: email,
        from: supportEmail,
        subject: subject,
        html: html,
      });
      res.send()
    }
  }

}
