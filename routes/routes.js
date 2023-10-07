import { startMeeting,addCandidateParticipant,addXIParticipant } from "../controllers/interviewControllerV2.js";
import { getPsychDetails,createPsychProfile , getAllCompanyPsych , getCompanyPsych } from "../controllers/psychController.js";
import { logIt } from "../controllers/logController.js";
//Credits
import {
	addCreditCategory,
	ListCreditCategory,
	updateCreditCategory,
	addCreditConverter,
	ListCreditConverter,
	updateCreditConverter,
	getCreditInfoList,
	updateUserCreditInfo,
	addCoupon,
} from "../controllers/creditControllers.js";
import CreditCategory from "../models/creditCategorySchema.js";
import Transaction from "../models/transactionSchema.js";
import { request } from "https";
import {
	getTransactions,
	updateWallet,
	userRequestUpdate,
	userAcceptUpdate,
} from "../controllers/transactionController.js";
import { createTaskScheduler } from "../controllers/taskScheduler.js";
import {
	getInterviewStatus,
	getinterviewdetails,
	getinterviewdetailsForBaseline,
	checkinterviewdetails,
	updateinterviewcheck,
	updatelivestatus,
	getlivestatus,
	startinterview,
	setquestionresult,
	endinterview,
	nullallchecks,
	compilecode,
	checkcompilestatus,
	savecode,
	updatewhiteboard,
	xiquestions,
	getinterviewjob,
	startlivemeet,
	handleproctoring,
	handlerecording,
	handleJoin,
	handleLeave,
	handleNoShow,
	listInterviewsByCompanyName,
	getRecordings,
	getLiveStreamURL,
	getBaseliningImagesFace,
	getBaseliningImagesPerson,
	getBaseliningImagesEar,
	getBaseliningImagesGaze,
	updateCodeLanguage
} from "../controllers/interview-controller.js";

import { insertUserInterviewApplications } from "../controllers/xiInterviewApplication-controller.js";
import {
	addXIPanels,
	ListXIPanels,
	updateXIPanels,
	addXICategory,
	ListXICategory,
	updateXICategory,
	addXILevel,
	ListXILevel,
	updateXILevel,
	addXIMultiplier,
	ListXIMultiplier,
	updateXIMultiplier,
	deleteXidFromPanel,
	deleteSkillFromPanel,
	updateSkillPanel,
} from "../controllers/XiCategory.js";
import {
	updateXIInfo,
	addXIInfo,
	getXIInfo,
	getDialerToken,
	getDialerCall,
} from "../controllers/xi_infoController.js";

import {
	jobStatusChange,
	jobDetailsUploadedByUser,
	jobDetailsByJobId,
	UserDetailsByJobId,
	allJobs,
	sendInvitation,
	sendCandidateReminderEmail,
	sendXIReminderEmail,	
	deletePendingJob,
	approveNewCandidates,
	sendJobAcceptedNotification,
	sendJobReceivedNotification,
	candidateDetailsByJobId,
	getAllCandidatesOfJob,
	listOfUnapproveJobswithPagination,
	allJobswithPagination,
	listJobwithPagination,
	listJobBinwithPagination,
	listJobsCount,
} from "../controllers/job-controller.js";
import {
	addCountryCodes,
	listOfCountryaCodes,
} from "../controllers/countryCodeController.js";
// Languages Routes
import {
	addLanguages,
	listOfLanguages,
	jobTitles,
	getJobTitles,
	listUnapproveTitles,
	approveTitle,
	addcompany,
} from "../controllers/languages.js";

import {
	addSlot,
	availableSlots,
	bookSlot,
	resendOTP,
	slotUpdate,
	newSlotUpdater,
	slotdelete,
	XISlots,
	findCandidateByEmail,
	slotDetailsOfXI,
	slotDetailsOfXIinterview,
	slotDetailsOfUser,
	userInterviewsDetails,
	ValidateSlot,
	priorityEngine,
	slot_by_interviewId,
	availableSlotsByJobSkills,
	updatecurrentSlot,
} from "../controllers/slots.js";

import { updateLinkedInProfile,handleXIStatusChange, inviteCandidate, sendJobInvitation , sendOtpToEmail,setTnCFlag,getTnCFlag, sendInterviewAcceptNotification } from "../controllers/userController.js";
import express from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import verifyToken from "../middleware/auth.js";
import tokenMiddleware from "../middleware/tokenMiddleware.js";
import { InvoiceNumber } from "invoice-number";
import multer from "multer";
import multerS3 from "multer-s3";
import AWS from "aws-sdk";
import {} from "dotenv/config";
import User from "../models/userSchema.js";
import job from "../models/jobSchema.js"
import Slot from "../models/slot.js";
import userCredit_info from "../models/userCreditSchema.js";
import {
	sendOTPEmail,
	UpdateEmailOTP,
	sendForwardedMail,
	sendInterviewOTPEmail,
} from "../controllers/mail-controller.js";

import {
	userSignup,
	updatePassword,
	userLogin,
	forcefullyLogoutUser,
	vaildateSignupDetails,
	getUserFromId,
	getUser,
	updateUserDetails,
	logout,
	updateProfileImage,
	updateBaseliningResp,
	getProfileImg,
	uploadCandidateResume,
	uploadUserResume,
	submitCandidateResumeDetails,
	submitCompanyDetails,
	getUserInviteFromResetPassId,
	setProfile,
	getJobInvitations,
	handleCandidateJobInvitation,
	fetchCountry,
	getCountryList,
	handleXIInterview,
	getuserbyEmail,
	getUserStats,
	setprofileauth,
	getprofileauth,
	getOtherLI,
	getBlockedDate,
	updateBlockedDate,
	updateUserLanguage,
	updateUserSkills
} from "../controllers/userController.js";

import { sendOTPSMS, updateContactOTP } from "../controllers/sms-controller.js";

import {
	getUserIdFromToken,
	tokenGenerator,
} from "../controllers/token-controller.js";

import {
	adminLogin,
	companyList,
	getXIList,
	getXIUserList,
	getSuperXIUserList,
	postXIUserLevel,
	userList,
	downloadResume,
	addAdminUser,
	addTaxId,
	findAndUpdateTax,
	findAndDeleteTax,
	createUser,
	addQuestion,
	getQuestions,
	addPanelToJob,
	getPanelDetails,
	updateJobPanelId,
	getUserListFirstLetter,
} from "../controllers/adminController.js";

import {
	getUserNotification,
	markNotiReadForUser,
	pushNotification,
	sendEmailNotification,
	whatsappMessage,
	deleteNotification,
} from "../controllers/notification-controller.js";
import { sendOneSignalNotification } from "../controllers/oneSignal.js";
import {
	addJob,
	exportJobDetails,
	listJobs,
	listBinJobs,
	updateJob,
	GetJobFromId,
	sendJobInvitations,
	listJobsCandidate,
	archiveJob,
	approveJob,
	approveCandidate,
	listOfUnapproveJobs,
	getJobBinById,
} from "../controllers/job-controller.js";
import {
	resetPassword,
	resetPasswordByContact,
	resetPasswordByEmail,
	resetPasswordByUsername,
} from "../controllers/passwordController.js";
import {
	addCompanyUser,
	filterCompany,
	getCompanyUserList,
	listCompanies,
	deleteCompanyUser
} from "../controllers/companyController.js";
import {
  addSkill,
  getSkills,
  updateSkills,
  rmSkills,
  getcognitiveSkills,
  getRoles,
} from "../controllers/skillController.js";
import {
	getInterviewApplication,
	getUserInterviewApplications,
	getXIEvaluationList,
	updateEvaluation,
	updateCandidateFeedback,
	updateEvalSkills,
	getXIEvaluatedReports,
	getCandidateEvaluation,
	interviewApplicationStatusChange,
	updateInterviewApplication,
	XIPerformance,
	updateXIInterviewApplication,
	getXIInterviewList,
	getcandidatesevaluations,
	sendFeedBackInvitation,
	getFeedBackInvitation,
	pushQuestion,
} from "../controllers/interviewApplication-controller.js";
import Routes from "twilio/lib/rest/Routes.js";
import {
	addEvaluationQuestion,
	addInterviewQuestion,
	fetchInterviewQuestion,
	updateInterviewQuestion,
} from "../controllers/evaulationQuestion-controller.js";
import {
	addCompanyList,
	addUniversityList,
	getCompanyList,
	getSchoolList,
	checkCompany,
	listUnapproveCompany,
	approveCompany,
} from "../controllers/dbListDataController.js";

import {
	addCandidate,
	listCandidate,
	findAndDeleteCandidate,
	findAndUpdateCandidate,
	eligibleCandidateList,
	saveCandidateReport,
	eligibleJobsForCandidate,
} from "../controllers/candidateController.js";

import {
	save,
	update,
	updateMany,
	read,
} from "../controllers/commonController.js";
import user from "../models/userSchema.js";
import slot from "../models/slot.js";
import InterviewApplication from "../models/interviewApplicationSchema.js";
import XIPanels from "../models/xiPanelsSchema.js";
import company from "../models/companyListSchema.js";
import { addCandidateInfo, deleteCandidateInfo, getCandidateInfo, getCandidateListofCompany } from "../controllers/candidateInfoControllers.js";


import {
	getCandidatesDetailsForJob,
	getAllInterviewStatus,
	getTotalCandidatesForJob,
	jobDetails,
	getTeamCompatibility,
	compareCandidateByTeam,
	addCompatibilityUser,
	getAllCompatibilityUser,
	compareCandidatesbyCompatibleUser,
	deleteCompatibilityUser,
	updateCandidateCategory,
} from "../controllers/teamCompatibilityController.js";



const router = express.Router();
const IMAGEPATH = process.env.ROOTPATH + "" + process.env.IMAGEPATH;
const RESUMEPATH = process.env.ROOTPATH + "" + process.env.RESUMEPATH;
const ignorePaths = process.env.IGNORE_URLS;

// the url path should be in env file and don't add it here directly
router.use(function(req , res , next){
	let url = req.url;
	if (url && ((url==='/getUserFromId') || (url==='/health') || (url==='//favicon.ico') || 
					(url === '/userSignup') || (url === '/sendResetPasswordMail') 
					|| (url === '/resetPassword') || ignorePaths.indexOf(url)>-1) 
					|| (url === '/getUserInviteFromResetPassId') 
					|| (url === '/setProfile')
					|| (url === '/findCompanyById')) {
	  next();
	}else{
	  let access_token = req.headers.authorization;
	  // access_token = access_token ? access_token.split(" ")[1] : null;
	  if(access_token){
		tokenMiddleware(req,res,next,access_token);
	  }else{
		res.status(401).json({ message: "Not Authorized" });
	  }
	}
});


try {
	// Profile Image Upload
	var storage = multer.diskStorage({
		destination: (req, file, cb) => {
			cb(null, IMAGEPATH);
		},
		filename: (req, file, cb) => {
			cb(null, req.body.user_id + "-profileImg.png");
		},
	});
	var upload = multer({ storage: storage });

	AWS.config.update({
		accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
	});
	let s3 = new AWS.S3();
	// Multer upload (Use multer-s3 to save directly to AWS instead of locally)
	// This will upload the baselining images to S3
	var uploadBaseliningImage = multer({
		storage: multerS3({
			s3: s3,
			bucket:
				process.env.AWS_S3_BUCKET_NAME +
				"/" +
				process.env.AWS_S3_PROFILE_BASELINING_BUCKET_FOLDER,
			// Set public read permissions
			acl: "private",
			// Auto detect contet type
			contentType: multerS3.AUTO_CONTENT_TYPE,
			// Set key/ filename as original uploaded name
			key: function (req, file, cb) {
				cb(null, req?.body?.interviewID + "-"+req?.body?.section+".png");
			},
		}),
	});

	var uploadProfileImage = multer({
		storage: multerS3({
			s3: s3,
			bucket:
				process.env.AWS_S3_BUCKET_NAME +
				"/" +
				process.env.AWS_S3_PROFILE_IMAGE_BUCKET_FOLDER,
			// Set public read permissions
			acl: "private",
			// Auto detect contet type
			contentType: multerS3.AUTO_CONTENT_TYPE,
			// Set key/ filename as original uploaded name
			key: function (req, file, cb) {
				cb(null, req.body.user_id + "-profileImg.png");
			},
		}),
	});

	// Multer upload (Use multer-s3 to save directly to AWS instead of locally)
	var uploadResume = multer({
		storage: multerS3({
			s3: s3,
			bucket:
				process.env.AWS_S3_BUCKET_NAME +
				"/" +
				process.env.AWS_S3_PROFILE_IMAGE_BUCKET_FOLDER,
			// Set public read permissions
			acl: "private",
			// Auto detect contet type
			contentType: multerS3.AUTO_CONTENT_TYPE,
			// Set key/ filename as original uploaded name
			key: function (req, file, cb) {
				cb(null, req.body.user_id + "-resume");
			},
		}),
	});

	// Candidate Resume Upload
	var storage1 = multer.diskStorage({
		destination: (req, file, cb) => {
			cb(null, RESUMEPATH);
		},
		filename: (req, file, cb) => {
			// console.log(req.body);
			cb(null, req.body.user_id + "-resume");
		},
	});
	var upload1 = multer({ storage: storage1 });

	router.post("/logIt",logIt);

	//V2 for meetings and recordings
	router.post("/v2/startMeeting/:interviewID", startMeeting);
	router.post("/v2/participant/candidate/:interviewID/:userID", addCandidateParticipant);
	router.post("/v2/participant/xi/:interviewID/:userID", addXIParticipant);
	
	// User Routes
	router.post("/getUserStats", getUserStats);
	router.post("/setprofileauth", setprofileauth);
	router.post("/getprofileauth", getprofileauth);
	router.post("/getOtherLI", getOtherLI);
	router.post("/userSignup", userSignup);
	router.post("/updatePassword", updatePassword);
	router.post("/userLogin", userLogin);
	router.post("/forcefullyLogoutUser",forcefullyLogoutUser);
	router.post("/validateSignup", vaildateSignupDetails);
	router.post("/getUserFromId", verifyToken, getUserFromId);
	router.post("/getUser", verifyToken, getUser);
	router.post("/getProfileImage", verifyToken, getProfileImg);
	router.post("/updateUserDetails", verifyToken, updateUserDetails);
	router.post("/updateBaselining",verifyToken,uploadBaseliningImage.single("file"),updateBaseliningResp);
	router.post("/getBaseliningImagesFace", verifyToken, getBaseliningImagesFace);
	router.post("/getBaseliningImagesPerson", verifyToken, getBaseliningImagesPerson);
	router.post("/getBaseliningImagesEar", verifyToken, getBaseliningImagesEar);
	router.post("/getBaseliningImagesGaze", verifyToken, getBaseliningImagesGaze);
	router.post("/updateCodeLanguage", updateCodeLanguage);
	router.post("/sendOtpToEmail" , verifyToken,sendOtpToEmail);
	router.post("/termsAndConditions" , verifyToken,setTnCFlag);
	router.post("/getTncFlag" , verifyToken,getTnCFlag);
	router.post("/updateUserLanguage" , verifyToken , updateUserLanguage)
	router.post("/updateUserSkills" , verifyToken , updateUserSkills)

	router.post(
		"/updateProfilePicture",
		verifyToken,
		//uploadProfileImage.single("file"),
		upload.single("file"),
		updateProfileImage
	);

	router.post('/sendInterviewAcceptNotification',sendInterviewAcceptNotification)

	router.post("/createUserByAdmin", verifyToken, createUser);
	router.post("/getUserListFirstLetter/:letter", getUserListFirstLetter);

	router.post("/logout", logout);
	router.post("/getUserInviteFromResetPassId", getUserInviteFromResetPassId);
	router.post("/setProfile", setProfile);
	router.post("/fetchCountry", fetchCountry);
	router.post("/getBlockedDate", getBlockedDate);
	router.post("/updateBlockedDate", updateBlockedDate);
	router.post("/getCountryList", getCountryList);
	router.post("/handleXIInterview", handleXIInterview);
	router.post("/getuserbyEmail", getuserbyEmail);

	router.post("/handleXIStatusChange", handleXIStatusChange);

	// Candidate Routes
	// router.post(
	// 	"/uploadCandidateResume",
	// 	verifyToken,
	// 	upload1.single("file"),
	// 	uploadCandidateResume
	// );

	router.post(
		"/uploadCandidateResume",
		verifyToken,
		upload1.single("file"),
		uploadUserResume
	);

	
	router.post(
		"/submitCandidateDetails",
		verifyToken,
		submitCandidateResumeDetails
	);
	router.post('/sendJobInvitation',verifyToken,sendJobInvitation)
	router.post("/getJobInvitations", verifyToken, getJobInvitations);
	router.post(
		"/handleCandidateJobInvitation",
		verifyToken,
		handleCandidateJobInvitation
	);

	// Company Routes
	router.post("/submitCompanyDetails", verifyToken, submitCompanyDetails);
	router.post("/addCompanyUser", verifyToken, addCompanyUser);
	router.post("/filterCompany/:time/:vacancy/:id", filterCompany);
	router.post("/getCandidateEvaluation", verifyToken, getCandidateEvaluation);
	router.post("/getPsychDetails", verifyToken, getPsychDetails);
	router.post("/psychDetails", verifyToken, createPsychProfile);
	router.post("/updateLinkedInProfile", verifyToken, updateLinkedInProfile);
	router.post('/deleteCompanyUser',deleteCompanyUser)

	// router.post("/approveCompany", approveCompany);
	router.get("/unapprovedJobsList", listOfUnapproveJobs);
	router.get("/getCompanyUserList", getCompanyUserList);
	router.post("/listCompanies", verifyToken,listCompanies);

	// Reset Password
	router.post("/sendResetPasswordMail", resetPasswordByEmail);
	router.post("/sendResetPasswordSMS", resetPasswordByContact);
	router.post("/sendResetPasswordUsername", resetPasswordByUsername);
	router.post("/resetPassword", resetPassword);

	// Admin Routes
	router.post("/adminLogin", adminLogin);
	router.post("/getCompanyList", verifyToken, companyList);
	router.post("/getXIList", verifyToken, getXIList);
	router.post("/getXIUserList", verifyToken, getXIUserList);
	router.post("/getSuperXIUserList", verifyToken, getSuperXIUserList);
	router.post("/postXIUserLevel", verifyToken, postXIUserLevel);
	router.post("/getUserList", verifyToken, userList);
	router.post("/downloadResume", verifyToken, downloadResume);
	router.post("/addAdminUser", verifyToken, addAdminUser);
	router.post("/addTaxId", verifyToken, addTaxId);
	router.post("/updateTaxId/:id", verifyToken, findAndUpdateTax);
	router.post("/deleteTaxId/:id", verifyToken, findAndDeleteTax);

	// Sending mails
	router.post("/updateEmailOTP", verifyToken, UpdateEmailOTP);
	router.post("/OTPMail", sendOTPEmail);
	router.post("/sendForwardedMail", sendForwardedMail);
	router.post("/sendInterviewOTPEmail", sendInterviewOTPEmail);


	// sending sms
	router.post("/OTPSms", sendOTPSMS);
	router.post("/updateContactOTP", verifyToken, updateContactOTP);
	router.post("/resendOTP", verifyToken, resendOTP);

	// jwt
	router.post("/generateToken", tokenGenerator);
	router.post("/getUserIdFromToken", verifyToken, getUserIdFromToken);

	// Notifications API
	router.post("/pushNotification", verifyToken, pushNotification);
	router.post("/getUserNotification", verifyToken, getUserNotification);
	router.post("/markNotificationRead", verifyToken, markNotiReadForUser);
	router.post(
		"/sendOneSignalNotification",
		verifyToken,
		sendOneSignalNotification
	);
	router.post("/deleteNotification" , deleteNotification);

	// Email Notifications
	router.post("/sendEmailNotification", verifyToken, sendEmailNotification);

	//trillio Whatsapp
	router.post("/sendWhatsappNotification", verifyToken, whatsappMessage);

	// Job
	router.post("/addJob", addJob);
	router.post("/listJob/:id", listJobs);

	router.post("/listJobwithPagination/:id", listJobwithPagination);
	router.post("/listBinjobwithPagination/:id", listJobBinwithPagination);

	router.post("/getJobCount/:id", listJobsCount); 
	router.get("/listBinJob/:id", listBinJobs);
	router.post("/listJobCandidate", listJobsCandidate);
	router.post("/updateJobDetails", verifyToken, updateJob);
	router.post("/exportJobDetails", exportJobDetails);
	router.post("/getJobFromId", verifyToken, GetJobFromId);
	router.post("/getJobBinById", verifyToken, getJobBinById);
	router.post("/sendJobInvitation", verifyToken, sendJobInvitations);
	router.post("/archiveJob", archiveJob);
	router.post("/approveJob", approveJob);
	router.post("/approveCandidate", approveCandidate);
	router.post('/sendInvitation',sendInvitation);
	router.post('/sendCandidateReminderEmail',verifyToken,sendCandidateReminderEmail);
	router.post('/sendXIReminderEmail',verifyToken,sendXIReminderEmail);
	router.post("/listInterviewsByCompanyName", listInterviewsByCompanyName);
	router.post("/getRecordings", verifyToken, getRecordings);
	router.post("/getLiveStreamURL", verifyToken, getLiveStreamURL);

	// Interview Applications
	router.post(
		"/getUserInterviewApplications",
		verifyToken,
		getUserInterviewApplications
	);

	// Skills Routes
	router.post("/addSkills", verifyToken, addSkill);
	router.post("/getSkills", verifyToken, getSkills);
  	router.post('/updateSkills', verifyToken, updateSkills);
	// to get roles
	router.post("/getRoles", verifyToken, getRoles);
	router.post("/getcognitiveSkills", verifyToken, getcognitiveSkills);
	router.post("/rmSkills", rmSkills);

	// XI Routes
	router.post("/listXIEvaluation", verifyToken, getXIEvaluationList);
	router.post("/getXIInterviewList", verifyToken, getXIInterviewList);
	router.post("/listXIEvaluatedReports", verifyToken, getXIEvaluatedReports);
	router.post("/getInterviewApplication", verifyToken, getInterviewApplication);
	router.post('/sendFeedbackInvitation',verifyToken,sendFeedBackInvitation);
	router.post('/getFeedBackInvitation', verifyToken, getFeedBackInvitation);
	router.post("/getcandidatesevaluations", getcandidatesevaluations);
	router.post("/updateEvaluation", verifyToken, updateEvaluation);
	router.post("/updateCandidateFeedback", verifyToken, updateCandidateFeedback);
	router.post("/updateEvaluationSkills", verifyToken, updateEvalSkills);
	router.put("/updateInterviewApplication", updateInterviewApplication);
	router.put("/updateXIInterviewApplication", updateXIInterviewApplication);
	router.post("/XIPerformance", XIPerformance);

	// Evaluation Question availableSlots
	router.post("/addEvaluationQuestions", verifyToken, addEvaluationQuestion);
	router.post("/addInterviewQuestions", verifyToken, addInterviewQuestion);
	router.get("/fetchInterviewQuestions", verifyToken, fetchInterviewQuestion);
	router.post("/updateInterviewQuestion", updateInterviewQuestion);

	// DB List Data Routes
	router.post("/addCompanyList", verifyToken, addCompanyList);
	router.get("/getCompanyList", getCompanyList);
	router.post("/addUniversityList", verifyToken, addUniversityList);
	router.get("/getSchoolList", getSchoolList);
	router.post("/jobTitles", jobTitles);
	router.post("/addcompany", addcompany);
	router.get("/getJobTitles", getJobTitles);
	router.get("/listUnapproveTitles", listUnapproveTitles);
	router.post("/approveTitle", approveTitle);

	// Candidate Routes
	router.post("/addCandidate", verifyToken, addCandidate);
	router.post("/getCandidateList", listCandidate);
	router.post("/deleteCandidate", findAndDeleteCandidate);
	router.put("/updateCandidate/:id", findAndUpdateCandidate);
	router.post("/eligibleCandidateList", eligibleCandidateList);
	router.get("/saveCandidateReport", saveCandidateReport);
	router.get("/eligibleJobsForCandidate", eligibleJobsForCandidate);
	router.post('/inviteCandidate',inviteCandidate)


	// Team Compatibility Routes 
	router.post("/getCandidatesDetailsForJob", getCandidatesDetailsForJob);
	router.post("/getAllInterviewStatus", getAllInterviewStatus);
	router.post("/getTotalCandidatesForJob", getTotalCandidatesForJob);
	router.post("/jobDetails", jobDetails);
	router.get("/getAllCompanyPsych" , getAllCompanyPsych);
	router.get("/getCompanyPsych" , getCompanyPsych);

	router.post("/getTeamCompatibility", getTeamCompatibility);
	router.post("/compareCandidates", compareCandidateByTeam);


	// common CRUD operations
	router.post("/add", (req, res) => {
		const { body } = req;
		save(body.model, body.data, (data) => {
			res.send(data);
		});
	});

	router.post("/update", (req, res) => {
		const { body } = req;
		update(body.model, body.data, (data) => {
			res.send(data);
		});
	});

	router.post("/updateMany", (req, res) => {
		const { body } = req;
		updateMany(body.model, body.data, (data) => {
			res.send(data);
		});
	});

	router.post("/read", (req, res) => {
		const { body } = req;
		read(body.model, body.data, (data) => {
			res.send(data);
		});
	});

	router.get("/slotDetailsOfUser", slotDetailsOfUser);
	router.get("/userInterviewsDetails", userInterviewsDetails);
	router.get("/slot_by_interviewId", slot_by_interviewId);
	router.get("/slotDetailsOfXI", slotDetailsOfXI);
	router.get("/slotDetailsOfXIinterview", slotDetailsOfXIinterview);
	router.get("/XISlots", XISlots);
	router.post("/findCandidateByEmail", findCandidateByEmail);
	router.post('/approveNewCandidates',approveNewCandidates)

	router.post("/ValidateSlot", ValidateSlot);
	router.post("/addSlot", (req, res) => {
		const { body } = req;
		addSlot(body, (err, data) => {
			if (err) {
				res.status(500).send(err);
			} else {
				res.send(data);
			}
		});
	});

	router.post("/availableSlotsByJobSkills", (req, res) => {
		const { body } = req;

		availableSlotsByJobSkills(body, (err, data) => {
			if (err) {
				res.status(500).send(err);
			} else {
				res.send(data);
			}
		});
		
	});

	router.post("/availableSlotsFromMatchedXis",async(req,res)=>{
		let data = req.body
		let jobDetails = await job.findOne({_id : req.body.jobId})
		let matchedXiList;
		if (jobDetails.panelId) {
			

			let panelDetails = await XIPanels.findOne({ _id: jobDetails?.panelId });
			let today = new Date().setHours(0, 0, 0, 0);
			Slot.find({
			status: "Available",
			isDeleted: false,
			createdBy: { $in: panelDetails?.xiIds },
			startDate: { $gte: today },
			})
			.sort({ startDate: 1 })
			.exec(async (err, result) => {
				if (err) throw err;
				res.send(result);
			});
		} else {
			if (req.body.userId) {
				matchedXiList = jobDetails['matchedXis'] ? jobDetails['matchedXis']
				.filter((matchedXi) => matchedXi._id !== req.body.userId) : []
			} else {
				matchedXiList = jobDetails['matchedXis'] ? jobDetails['matchedXis'] : []
			}
			let today = new Date().setHours(0, 0, 0, 0);
			Slot.find({
			status: "Available",
			isDeleted: false,
			createdBy: { $in: matchedXiList },
			startDate: { $gte: today },
			})
			.sort({ startDate: 1 })
			.exec(async (err, result) => {
				if (err) throw err
				res.send(result)
			});
		}
	});

	router.post("/selectXisBySlot",async(req,res)=>{
		let xis = req.body.matchedXis
		let slotTime = new Date(req.body.slotTime)
		let matchedXiswithSlot = []
		let XISlots = await Slot.find({createdBy : {$in : xis},startDate:slotTime})
		
		if (XISlots && XISlots.length > 0) {
			for (let i = 0;i<XISlots.length ; i++) {
				let xiIds = XISlots[i].createdBy
				matchedXiswithSlot.push(xiIds)
			}
		}
		res.send({matchedXiswithSlot : matchedXiswithSlot})
	})

	router.post("/availableSlots", (req, res) => {
		const { body } = req;

		availableSlots(body, (err, data) => {
			if (err) {
				res.status(500).send(err);
			} else {
				res.send(data);
			}
		});
	});
	router.post("/bookSlot", (req, res) => {
		const { body } = req;
		bookSlot(body, (err, data) => {
			if (err) {
				res.status(500).send(err);
			} else {
				res.send(data);
			}
		});
	});
	router.post('/updatecurrentSlot',updatecurrentSlot)

	router.put("/updateSlot", (req, res) => {
		slotUpdate(req, (err, data) => {
			if (err) {
				res.status(500).send(err);
			} else {
				res.send(data);
			}
		});
	});

	router.put("/newslotupdater", (req, res) => {
		newSlotUpdater(req, (err, data) => {
			if (err) {
				res.status(500).send(err);
			} else {
				res.send(data);
			}
		});
	});

	router.delete("/deleteSlot", (req, res) => {
		slotdelete(req, (err, data) => {
			if (err) {
				res.status(500).send(err);
			} else {
				res.send(data);
			}
		});
	});

	router.post("/addLanguages", (req, res) => {
		addLanguages(req.body, (err, data) => {
			if (err) {
				res.status(500).send(err);
			} else {
				res.send(data);
			}
		});
	});

	router.get("/languagesList", (req, res) => {
		listOfLanguages(req, (err, data) => {
			if (err) {
				res.status(500).send(err);
			} else {
				res.send(data);
			}
		});
	});

	// Check Company
	router.post("/checkCompany", checkCompany);
	router.get("/listUnapproveCompany", listUnapproveCompany);
	router.post("/approveCompany", approveCompany);

	// CountryCode Routes

	router.post("/addCountryCodes", (req, res) => {
		addCountryCodes(req.body, (err, data) => {
			if (err) {
				res.status(500).send(err);
			} else {
				res.send(data);
			}
		});
	});

	router.get("/countryCodeList", (req, res) => {
		listOfCountryaCodes(req, (err, data) => {
			if (err) {
				res.status(500).send(err);
			} else {
				res.send(data);
			}
		});
	});

	router.post(
		"/interviewApplicationstatusChange",
		interviewApplicationStatusChange
	);

	router.post("/jobStatusChange", jobStatusChange);
	router.get("/jobDetailsUploadedByUser", jobDetailsUploadedByUser);
	router.get("/jobDetailsByJobId", jobDetailsByJobId);
	router.get("/UserDetailsByJobId", UserDetailsByJobId);
	router.get("/allJobs", allJobs);
	router.get("/allJobswithPagination", allJobswithPagination);
	router.post('/deletePendingJob',deletePendingJob)
	router.post(
		"/insertUserInterviewApplications",
		insertUserInterviewApplications
	);

	router.get("/UserDetailsByJobId", UserDetailsByJobId);

	router.post("/handleJoin", verifyToken,handleJoin);
	router.post("/handleLeave", verifyToken,handleLeave);
	router.post("/noshow", verifyToken,handleNoShow);
	router.post("/handlerecording", handlerecording);
	router.post("/handleproctoring", handleproctoring);
	router.post("/getinterviewdetails", getinterviewdetails);
	router.post("/getinterviewdetailsForBaseline", nullallchecks,getinterviewdetailsForBaseline);
	router.post("/getInterviewStatus", verifyToken, getInterviewStatus);

	router.post("/checkinterviewdetails", nullallchecks, checkinterviewdetails);
	router.post("/fetchinterviewdetails", checkinterviewdetails);
	router.post("/updateinterviewcheck", updateinterviewcheck);
	router.post("/updatelivestatus", updatelivestatus);
	router.post("/getlivestatus", getlivestatus);
	router.post("/startlivemeet", startlivemeet);
	router.post("/compilecode", compilecode);
	router.post("/savecode", savecode);
	router.post("/updatewhiteboard", updatewhiteboard);
	router.post("/startinterview", startinterview);
	router.post("/setquestionresult", setquestionresult);
	router.post("/endinterview", endinterview);
	//router.post("/savecode", savecode);
	router.post("/getxiquestions", xiquestions);
	router.post("/getinterviewjob", getinterviewjob);
	router.post("/checkcompilestatus", checkcompilestatus);
	router.get("/getDialerToken", getDialerToken);
	router.post("/getDialerCall", getDialerCall);

	//Xi Category , limit ,performance Multiplier

	router.post("/updateXICategory", updateXICategory);
	router.post("/addXICategory", addXICategory);
	router.get("/listXICategory", ListXICategory);

	router.post("/updateXIPanels", updateXIPanels);
	router.post("/updateSkillPanel", updateSkillPanel);
	router.post("/addXIPanels", addXIPanels);
	router.get("/listXIPanels", ListXIPanels);
	router.post("/deleteXIPanel", deleteXidFromPanel);
	router.post("/deleteSkillPanel", deleteSkillFromPanel);

	router.post("/updateXILevel", updateXILevel);
	router.post("/addXILevel", addXILevel);
	router.get("/listXILevel", ListXILevel);

	router.post("/updateXIMultiplier", updateXIMultiplier);
	router.post("/addXIMultiplier", addXIMultiplier);
	router.get("/listXIMultiplier", ListXIMultiplier);

	router.post("/updateCreditCategory", updateCreditCategory);
	router.post("/addCreditCategory", addCreditCategory);
	router.get("/listCreditCategory", ListCreditCategory);

	router.post("/updateCreditConverter", updateCreditConverter);
	router.post("/addCreditConverter", addCreditConverter);
	router.get("/listCreditConverter", ListCreditConverter);

	router.post("/getCreditInfoList", getCreditInfoList);
	router.post("/updateUserCreditInfo", updateUserCreditInfo);

	//XI Info

	router.post("/updateXIInfo", updateXIInfo);
	router.post("/addXIInfo", addXIInfo);
	router.get("/getXIInfo", getXIInfo);

	// priority Engine

	router.post("/priorityEngine", priorityEngine);
	router.post("/addCoupon", addCoupon);

	//Transactions

	router.get("/getTransactions", getTransactions);
	router.post("/updateWallet", updateWallet);
	router.get("/userRequestUpdate", userRequestUpdate);
	router.get("/userAcceptUpdate", userAcceptUpdate);

	//Razorpay
	router.post("/getUserCurrentCredit", async (req, res) => {
		try {
			console.log(req.body);
			userCredit_info.findOne(
				{ userId: req.body.userId },
				async function (err, res1) {
					if (res1) {
						return res.status(200).json({ data: res1 });
					}
					res.status(403).json({ Message: "Wallet Not Found" });
				}
			);
		} catch (error) {
			console.log(error);
			res.status(500).send(error);
		}
	});
	router.post("/payment/orders", async (req, res) => {
		try {
			const instance = new Razorpay({
				key_id: process.env.RAZORPAY_KEY_ID,
				key_secret: process.env.RAZORPAY_SECRET,
			});
			// console.log(instance)
			let amount = 0;
			let data = await CreditCategory.find({ category: req.body.user_type });

			let tcount = await Transaction.find().count();

			let dcount = tcount.toString().length;

			let invcount = "";
			for (let i = 0; i < 6 - dcount; i++) {
				invcount = invcount + "0";
			}
			invcount = invcount + tcount;

			let usr = await User.findById(req.body.userId);

			let dt = new Date();

			let invoice =
				dt.getFullYear().toString() +
				"/" +
				(dt.getMonth() + 1).toString() +
				"/" +
				usr.firstName.substring(0, 3).toUpperCase() +
				invcount.toString();

			let tData = {
				applicantId: req.body.userId,
				amount: data[0].amount * req.body.amount * 100,
				credit: req.body.amount,
				transactionDate: new Date(),
				invoiceID: invoice,
				invoiceDate: new Date(),
			};
			let transactionData = new Transaction(tData);

			await transactionData.save();

			const options = {
				amount: data[0].amount * req.body.amount * 100, // amount in smallest currency unit
				currency: "INR",
				receipt: "receipt_order_" + invoice,
			};

			const order = await instance.orders.create(options);
			console.log(order);
			if (!order) return res.status(500).send("Some error occured");

			res.json({ order: order, id: transactionData._id });
		} catch (error) {
			res.status(500).send(error);
		}
	});
	router.post("/payment/success", async (req, res) => {
		try {
			// getting the details back from our font-end
			console.log(req.body);
			const {
				orderCreationId,
				razorpayPaymentId,
				razorpayOrderId,
				razorpaySignature,
			} = req.body.data;
			let id = req.body.id;

			let data = await Transaction.findOneAndUpdate(
				{ _id: id },
				{
					orderCreationId: orderCreationId,
					razorpayPaymentId: razorpayPaymentId,
					razorpayOrderId: razorpayOrderId,
					razorpaySignature: razorpaySignature,
				},
				async function (err, res) {
					console.log(res);
				}
			).clone();

			console.log("razorpaysignature : " + razorpaySignature);
			let data1 = await User.findOneAndUpdate(
				{ _id: mongoose.Types.ObjectId(req.body.userId) },
				{
					$push: {
						transactions: id,
					},
				}
			).clone();
			// console.log(data1)

			let data2 = await userCredit_info
				.findOneAndUpdate(
					{ userId: mongoose.Types.ObjectId(req.body.userId) },
					{
						$inc: {
							credit: req.body.credit,
						},
					}
				)
				.clone();

			// console.log(data2)

			// Creating our own digest
			// The format should be like this:
			// digest = hmac_sha256(orderCreationId + "|" + razorpayPaymentId, secret);
			const shasum = crypto.createHmac("sha256", "w2lBtgmeuDUfnJVp43UpcaiT");

			shasum.update(`${orderCreationId}|${razorpayPaymentId}`);

			const digest = shasum.digest("hex");
			console.log("Digest : " + digest);
			// comaparing our digest with the actual signature
			// if (digest !== razorpaySignature)
			//   return res.status(400).json({ msg: "Transaction not legit!" });

			// THE PAYMENT IS LEGIT & VERIFIED
			// YOU CAN SAVE THE DETAILS IN YOUR DATABASE IF YOU WANT

			res.json({
				msg: "success",
				orderId: razorpayOrderId,
				paymentId: razorpayPaymentId,
			});
		} catch (error) {
			console.log(error.message);
			res.status(500).send(error);
		}
	});

	// Task Scheduler
	router.post("/createTaskScheduler", createTaskScheduler);

	// Health check and running

	router.get("/health", async (_req, res, _next) => {
		const healthcheck = {
			uptime: process.uptime(),
			processtime: process.hrtime(),
			message: "OK",
			timestamp: Date.now(),
		};
		try {
			res.send(healthcheck);
		} catch (error) {
			healthcheck.message = error;
			res.status(503).send();
		}
	});

	router.post("/getMatchedxis",async(req,res)=>{
		let jobDetails = await job.findOne({_id : req.body.jobId})
		if (jobDetails) {
			let matchedXiList;
			if (req.body.userId) {
				matchedXiList = jobDetails['matchedXis'] ? jobDetails['matchedXis']
				.filter((matchedXi) => matchedXi._id !== req.body.userId) : []
			} else {
				matchedXiList = jobDetails['matchedXis'] ? jobDetails['matchedXis'] : []
			}
			let users = await user.find({_id : {$in : matchedXiList},user_type:"XI"},{firstName : 1,lastname: 1,email: 1})
			
			res.send(users)
		}
	})

	router.post('/rescheduleSlot',async(req,res)=>{
		let {slotId,createdBy,startDate,endDate,status} = req.body
		
		await slot.updateOne({_id : slotId},{$set : {createdBy,startDate,endDate: endDate,status}}).then((response)=>{
			res.send()
		})
	})

	router.post('/cancel-interview',async(req,res)=>{
		let {slotId,interviewId} = req.body
		
		slot.updateOne({_id : slotId},{ $set: { status: 'Available' } }).then(async()=>{
			await InterviewApplication.updateOne({_id : interviewId},{ $set: { status: 'Suspended' } })
		})
		res.send()
	})

	router.post('/get-xis-slots',async(req,res)=>{
		slot.find({createdBy: req.body.createdBy,status:"Available"}).then((result)=>{
			res.send(result)
		})
		
	})

	// Add questions by admin
	router.post('/add-question',async(req,res)=>{
		const data = req.body
		const question_type = req.body.type
		
		await addQuestion(question_type,data).then((response)=>{
			res.send(response)
		})
	})

	// Get questions added by admin
	router.get('/get-questions',async(req,res)=>{
		getQuestions(req.query).then((response)=>{
			if (response) {
				res.send(response)
			}
		})
	})

	router.post('/add-panel-to-job',async(req,res)=>{
		await addPanelToJob(req).then((result)=>{
			res.send(result)
		})
	})

	router.post('/get-panel-details',async(req,res)=>{
		await getPanelDetails(req).then((result)=>{
			res.send(result)
		})
	})

	router.post('/update-panelId',async(req,res)=>{
		await updateJobPanelId(req).then((result)=>{
			res.send(result)
		})
	})

	router.post("/availableSlotsFromJobPanel", async (req, res) => {
		let jobDetails = await job.findOne({ _id: req.body.jobId });
		let panelDetails = await XIPanels.findOne({ _id: jobDetails?.panelId });
		let today = new Date().setHours(0, 0, 0, 0);

		const panelUsers = await User.find({ _id: { $in: panelDetails?.xiIds } });
		
		let blockedDates = panelUsers.map((user) => user.blockedDates).flat();
		blockedDates = blockedDates.map((dateString) => new Date(dateString));
		
		Slot.find({
			status: "Available",
			isDeleted: false,
			createdBy: { $in: panelDetails?.xiIds },
			$and: [
				{ startDate: { $gte: today } },
				{ startDate: { $nin: blockedDates } },
			],
		})
		.sort({ startDate: 1 })
		.exec(async (err, result) => {
			if (err) throw err;
			res.send(result);
		});
	});

	router.post('/sendJobAcceptedNotification',async(req,res)=>{
		sendJobAcceptedNotification(req.body).then((result)=>{
			res.send(result)
		})
	})

	router.post("/sendJobReceivedNotification", async (req, res) => {
		sendJobReceivedNotification(req.body).then((result) => {
			res.send(result);
		});
  	});

	router.post('/candidateDetailsByJobId',async(req,res)=>{
		let jobId = req.body.jobId
		candidateDetailsByJobId(jobId).then((result)=>{
			res.send(result)
		})
	})

	router.post('/findCompanyById',async(req,res)=>{
		let companyId = req.body.companyId
		await company.findOne({_id : companyId}).then((result)=>{
			let response = {}
			if (result) {
				response.status = 200
				response.companyDetails = result
			} else {
				response.status = 404
			}
			res.send(response)
		})
	})

	router.post('/addCandidateInfo',async(req,res)=>{
		let candidateData = req.body.candidateDataDup;
		let jobId = req.body.jobId ? req.body.jobId : ""
		let companyId = req.body.companyId ? req.body.companyId : ""

		// Check company id exists
		await company.findOne({_id : companyId}).then(async(company)=>{
			if (company) {
				console.log('CANDIATE DATA-----------', candidateData ? candidateData : 'no candidate data')
				await User.findOne({email : candidateData.Email}).then(async(result)=>{
					await addCandidateInfo(candidateData, jobId, companyId).then(async(user) => {
						res.send(user);
					});
				})
			} else {
				res.status(204).send({ message: "No companyId found" });
			}
		})
	})

	router.post('/getCandidateInfo',async(req,res)=>{
		let jobId = req.body.jobId
		getCandidateInfo(jobId).then((result)=>{
			res.send(result)
		})
	})

	router.post('/deleteCandidateInfo',async(req,res)=>{
		let id = req.body._id
		deleteCandidateInfo(id).then((result)=>{
			res.send(result)
		})
	})

	router.post('/getCandidateListofCompany',async(req,res)=>{
		let companyId = req.body.companyId
		getCandidateListofCompany(companyId).then((result)=>{
			res.send(result)
		})
	})

	router.post("/getAllCandidatesOfJob/:jobID", getAllCandidatesOfJob);

	// code for getting unapprovedjob with pagination functionality
	router.post("/pendingjobsofcompany", listOfUnapproveJobswithPagination);

	// for pushing question from xi interview panel to candidate interview panel
	router.post("/push-question", pushQuestion);
	
	router.post("/add-compatibilityUser", addCompatibilityUser);
	router.post("/get-compatibilityUsers", getAllCompatibilityUser);
	router.post("/compareCandidatesbyCompatibleUser",compareCandidatesbyCompatibleUser);
	router.post("/deleteCompatibilityUser", deleteCompatibilityUser);
	router.post('/updateCandidateCategory',updateCandidateCategory)
	router.post('/updateCategory',updateCandidateCategory)

} catch (err) {
	console.log(err);
}
export default router;
