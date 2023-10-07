import User from "../models/userSchema.js";
import axios from "axios";
import passwordHash from "password-hash";
import {} from "dotenv/config";
import fs from "fs";
import path from "path";
import Country from "../models/countrySchema.js";
import { generatePassword, generateRandomUsername } from "../utils/utils.js";
import xi_info from "../models/xi_infoSchema.js";
import Candidate from "../models/candidate_info.js";
const front_url = process.env.FRONTEND_URL;
import sendGridMail from "@sendgrid/mail";
import Questions from "../models/questionSchema.js";
import jobBin from "../models/jobBinSchema.js";
import XIPanels from "../models/xiPanelsSchema.js";

sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
const supportEmail=process.env.VM_SUPPORT_EMAIL;

const url = process.env.BACKEND_URL;

const MAX_QUESTIONS_APPEARING_LIMIT = process.env.MAX_QUESTIONS_APPEARING_LIMIT || 9

// Admin Login
export const adminLogin = async (request, response) => {
	try {
		console.log("Checking function");
		var user = await User.findOne({
			email: request.body.username,
			isAdmin: true,
		});
		if (user == null) {
			user = await User.findOne({
				username: request.body.username,
				isAdmin: true,
			});
		}
		if (user == null) {
			user = await User.findOne({
				contact: request.body.username,
				isAdmin: true,
			});
		}
		let correctuser = false;
		if (user) {
			correctuser = passwordHash.verify(request.body.password, user.password);
		}
		if (!user.isAdmin) {
			return response.status(403);
		}
		if (user && correctuser) {
			let u = { user };
			const token = await axios.post(`${url}/generateToken`, { user: user.id });
			const access_token = token.data.token;
			user.access_token = access_token;
			user.save();
			return response.status(200).json({ access_token: access_token });
		} else {
			return response.status(401).json("Invalid Login!");
		}
	} catch (error) {
		return response.status(401).json(`Error : ${error.message}`);
	}
};

export const createUser = (request, response) => {
	return new Promise(async (resolve, reject) => {
		let data = request.body;

		let emailExists = await User.findOne({ email: request.body.email });
		if (emailExists) {
			return response.status(409).json({ status : 409 ,message: "Email already exists",conflitedValue: 'email' });
		} 
		let phoneExists = await User.findOne({ contact: request.body.contact});
		if(phoneExists){
			return response.status(409).json({ message: "Phone already exists",conflitedValue: 'phone' });
		} else {
			const candidate = await Candidate.findOne({ email: request.body.email });
			if (candidate) {
				data.job_invitations =  [candidate.jobId]
			}else {
				data.job_invitations = []
				const CandidateCount = await Candidate.count();
				const candidateInfo = {
					email: data.email,
					phoneNo: data.contact,
					firstName: data.firstname,
					lastName: data.lastname,
					candidate_id: CandidateCount + 1,
					jobId: "",
				};
				await Candidate.create(candidateInfo)
			}
			
			data["user_type"] = "XI";
			let username = data.firstName[0] + data.lastname;
			let userNameExists = await User.findOne({username})
			if (userNameExists) {
				username = await generateRandomUsername(username)
			}
			
			data.username = username
			let password = await generatePassword();
			let hashedPassword = passwordHash.generate(password);

			data.password = hashedPassword;
			await User.create(data).then(async (result) => {
				if (result) {
					if (data.user_type === "XI") {
						const candidateInfo = {
							candidate_id: result._id,
						};
						let xi = new xi_info(candidateInfo);
						await xi.save();

						const token = await axios.post(`${url}/generateToken`, {
							user: result._id,
						});

						let access_token = token.data.token;

						let ussrr = await User.findOneAndUpdate(
							{ _id: result._id.toString() },
							{ access_token: access_token, access_valid: true, isXI:true, status:"Approved" }
						);
						let html = `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
							<div style="margin:50px auto;width:70%;padding:20px 0">
							<div style="border-bottom:1px solid #eee">
								<a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Value Matrix</a>
							</div>
							<p style="font-size:1.1em">Hi, ${request.body.firstName}</p>
							<div>Welcome to Value Matrix. It is a great pleasure to have you on board</div>.
							<p>Click this link to claim your registration: <a href="${front_url}/login">Link</a> </p>
							<div>Use this credentials</div>
							<p>Username : ${data.username}</P>
							<p>Password : ${password}</p>
							<p>You can change your password after login<p>
							<div>Regards,</div>
							<div>Value  Matrix</div>
	
							</div>`;
						await sendGridMail.send({
							to: request.body.email,
							from: supportEmail,
							subject: "Value Matrix Sign Up",
							html: html,
						});
						if (ussrr) {
							return response
								.status(200)
								.json({ user: ussrr, access_token: token.data.token });
						} else {
							return response.status(401).json("Invalid Signup!");
						}
					}
					return response
						.status(200)
						.json({ message: "Successfully created user" });
				} else {
					return response.status(401).json("Error : something went wrong");
				}
			});
		}
	});
};

export const companyList = async (request, response) => {
	try {
		await User.findOne({ _id: request.body.user_id }, function (error, res) {
			console.log(res);
			if (res && res.isAdmin === false) {
				return response.status(403).json("You are not an admin");
			}
		}).clone();
		await User.find({ user_type: "Company" }, function (err, res) {
			return response.status(200).json({ company: res });
		}).clone();
	} catch (error) {
		return response.status(401).json(`Error : ${error.message}`);
	}
};
export const getXIList = async (request, response) => {
	try {
		console.log(request.body);
		await User.find(
			{ user_type: "XI", status: "Pending" },
			function (err, res) {
				return response.status(200).json(res);
			}
		).clone();
	} catch (error) {
		return response.status(401).json(`Error : ${error.message}`);
	}
};

export const getXIUserList = async (request, response) => {
	try {
		console.log(request.body);
		await User.findOne({ _id: request.body.user_id }, function (error, res) {
			if (res && res.permissions[0].admin_permissions.list_XI === false) {
				return response.status(403).json("You cannot view XI");
			}
		}).clone();

		const data = await User.aggregate([
			{ $match: { user_type: "XI", isXI:true } },
			{
				$lookup: {
					from: "xi_infos",
					localField: "_id",
					foreignField: "candidate_id",
					as: "xi_info",
				},
			},
		]);

		return response.status(200).json(data);

		// await User.find({ user_type: "XI",status:"Approved" }, function (err, res) {
		// }).clone();
	} catch (error) {
		return response.status(401).json(`Error : ${error.message}`);
	}
};
export const getSuperXIUserList = async (request, response) => {
	try {
		console.log(request.body);
		await User.findOne({ _id: request.body.user_id }, function (error, res) {
			console.log(res);
			if (res && res.permissions[0].admin_permissions.list_XI === false) {
				return response.status(403).json("You cannot view SuperXI");
			}
		}).clone();
		await User.find({ user_type: "SuperXI" }, function (err, res) {
			return response.status(200).json(res);
		}).clone();
	} catch (error) {
		return response.status(401).json(`Error : ${error.message}`);
	}
};

export const postXIUserLevel = async (request, response) => {
	try {
		let statusData = await User.findOneAndUpdate(
			{ _id: request.body.user_id },
			{ $set: { level: request.body.level } },
			{ new: true }
		);

		if (statusData.level === request.body.level) {
			response.send({ data: "update successfully" }).status(200);
		} else {
			response.send({ data: "status not updated!" }).status(400);
		}
	} catch (err) {
		res.send({ data: "something went wrong", err }).status(400);
	}
};

export const getUserListFirstLetter = async (request, response) => {
	try{
		let letter = request?.params?.letter;
		if(letter){
			await User.findOne({ _id: request?.body?.user_id }, function (error, res) {
				if (res && res.isAdmin === false) {
					return response.status(403).json("You are not an admin");
				}
			}).clone();
			await User.find({user_type: "User", firstName: { $regex:'^'+letter, $options: 'i' } }, function (err, res) {
				return response.status(200).json({ user: res });
			}).clone();
		}
	}catch(error){
		console.log(error);
	}
}


export const userList = async (request, response) => {
	try {
		await User.findOne({ _id: request.body.user_id }, function (error, res) {
			if (res && res.isAdmin === false) {
				return response.status(403).json("You are not an admin");
			}
		}).clone();
		await User.find({ user_type: "User" }, function (err, res) {
			return response.status(200).json({ user: res });
		}).clone();
	} catch (error) {
		return response.status(401).json(`Error : ${error.message}`);
	}
};

// Download Resume
export const downloadResume = async (request, response) => {
	try {
		User.findOne({ _id: request.body.user_id }, async function (err, user) {
			let path_url = "./media/resume/" + user.resume;
			let d = await fs.readFileSync(
				path.resolve(path_url),
				{},
				function (err, res) {}
			);
			let url1 = url + "/media/resume/" + user.resume;
			return response.json({ Resume: d, link: url1 });
		}).clone();
	} catch (error) {
		console.log("Error : ", error);
	}
};

// Add Admin User
export const addAdminUser = async (request, response) => {
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
			if (res && res.isAdmin === false) {
				return response
					.status(401)
					.json("Request User Not Registered as a Company");
				return;
			}
			if (
				res &&
				res.user_type === "Admin_User" &&
				res.permissions[0] &&
				res.permissions[0].admin_permissions.add_admin_user === false
			) {
				return response
					.status(401)
					.json("You are not allowed to add admin user");
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
		let newUser = new User({
			email: request.body.email,
			firstName: request.body.firstName,
			lastName: request.body.lastName,
			username: request.body.username,
			isAdmin: true,
			contact: request.body.contact,
			password: passwordHash.generate(request.body.password),
			user_type: "Admin_User",
			permissions: [
				{ company_permissions: null, admin_permissions: permission },
			],
			company_id: request.body.company_id,
		});
		await newUser.save();
		console.log(newUser);
		return response.json({
			message: "User added successfully",
			user: newUser,
		});
	} catch (error) {
		console.log("Error : ", error);
	}
};

// add Tax ID

export const addTaxId = async (request, response) => {
	try {
		console.log(request.body);

		//  await Country.insert({country : request.body.data})
		var user = new Country({
			country: request.body.data.country,
			tax_id: request.body.data.tax_id,
		});

		user.save(async function (err, results) {
			console.log(results._id);
			await Country.find({})
				.collation({ locale: "en" })
				.sort({ country: 1 })
				.exec(function (err, countries) {
					if (err) return console.error(err);
					// console.log(countries);

					return response.status(200).json({ countries });
				});
		});
	} catch (error) {
		console.log(error);
	}
};

export const findAndUpdateTax = async (request, response) => {
	try {
		let tax_id = request.params.id;
		console.log(tax_id);
		console.log(request.body);

		Country.findOne({ _id: tax_id }, async function (err, countries) {
			countries.country = request.body.data.country;
			countries.tax_id = request.body.data.tax_id;
			await countries.save();

			await Country.find({})
				.collation({ locale: "en" })
				.sort({ country: 1 })
				.exec(function (err, countries) {
					if (err) return console.error(err);
					// console.log(countries);

					return response.status(200).json({ countries });
				});
			// return response.status(200).json({ Success: true, country: country });
		});
	} catch (error) {}
};

export const findAndDeleteTax = async (request, response) => {
	try {
		let tax_id = request.params.id;
		console.log(tax_id);

		Country.findOneAndDelete({ _id: tax_id }, async function (err, res) {
			console.log("delete");
			await Country.find({})
				.collation({ locale: "en" })
				.sort({ country: 1 })
				.exec(function (err, countries) {
					if (err) return console.error(err);
					console.log(countries);

					return response.status(200).json({ countries });
				});
		});
	} catch (err) {
		console.log(err);
	}
};

export const addQuestion = (type,data)=>{
	return new Promise(async(resolve,reject)=>{
		let question = await Questions.findOne({type,question: data["question"]})
		let response = {}
		
		if (question) {
			response.status = 409
			response.message = "Question already added" 
			resolve(response)
		} else {
			await Questions.create(data).then((err,result)=>{
				if (err) {
					console.log('ERROR : ', err)
				}
				response.status = 200
				response.data = result
				resolve(response)
			})
			
		}
	})
}

export const getQuestions = async(query)=>{
	try {
		if (query.type == 'skill_based') {
			// let skills = await Questions.find({skill: query.skill,counter: { $lt: 9 }})
			let skills = await Questions.find({type: 'sb',counter: { $lt: 9 }})
			let response = {}
			response.data = skills
			return response
		} else if (query.type == 'problem_based'){
			let skills = await Questions.find({type:'pb'})
			let response = {}
			response.data = skills
			skills.forEach(async (document) => {
				document.counter += 1;
				await document.save();
			  });
			return response
		}
	} catch (error) {
		console.log('Error : ', error)
	}
}

// Add panel to a job while approving a job
export const addPanelToJob = async(request,response)=>{
	try {
		await jobBin.updateOne({ _id: request.body.jobId },{ $set: { panelId: request.body.panelId } }).then((err,res)=>{
			if (err){
				console.log('Error : ', err)
			}
			
		})
	} catch (error) {
		console.log('Error : ', error)
	}
}

// Get panel details
export const getPanelDetails = async(request,response)=>{
	try {
		let panelDetails = await XIPanels.findOne({_id : request.body.panelId})
		let response = {}
		if (panelDetails){
			response.status = 200
			response.panelData = panelDetails
		
			return response
			
		} else {
			response.status = 404
			return response
		}
	} catch (error) {
		
	}
}

// Update panel id inside a job
export const updateJobPanelId = async(request,response)=>{
	try {
		await job.updateOne({_id : request.body.jobId},{ $set: { panelId: request.body.panelId } }).then((result)=>{
			return 
		})
	} catch (error) {

	}
}