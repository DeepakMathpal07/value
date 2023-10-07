import {} from "dotenv/config";
import sendGridMail from "@sendgrid/mail";
import axios from "axios";
import User from "../models/userSchema.js";

const url = process.env.BACKEND_URL;

sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);
const supportEmail=process.env.VM_SUPPORT_EMAIL;

export const sendInterviewOTPEmail = async (req, res) => {
  let OTP = "";
  let id = req.body.userId;
  if(id){
    console.log("id: "+id);
    try{
      let user = await User.findById(id);
      if(user && user!=null){
        let email = user?.email;
        if(email){
          var digits = "0123456789";
          let OTP = "";
          for (let i = 0; i < 6; i++) {
            OTP += digits[Math.floor(Math.random() * 10)];
          }
          let html = `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
          <div style="margin:50px auto;width:70%;padding:20px 0">
              <div style="border-bottom:1px solid #eee">
                <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Value Matrix</a>
              </div>
              <p style="font-size:1.1em">Hi,</p>
              <p>Use the following code to complete your interview confirmation.</p>
              <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
              <p style="font-size:0.9em;">Regards,<br />Value Matrix Team</p>
              <hr style="border:none;border-top:1px solid #eee" />
            </div>
          </div>`;
          await sendGridMail.send({
            to: email,
            from: supportEmail,
            subject: "Value Matrix - Interview confirmation",
            html: html,
          });
          return res.status(200).json({ otp: OTP });
        }else{
          res.status(400).send({message:"Couldn't find emaild the user id passed"});  
        }
      }
    }catch(err){
      console.log(err);
      res.status(500).send(err);
    }
  }else{
    res.status(400).send({message:"Couldn't find user the id passed"});  
  }
};

// OTP For Sign Up
export const sendOTPEmail = async (req, res) => {
  try {
    var digits = "0123456789";
    let OTP = "";
    for (let i = 0; i < 6; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }

    let html = `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
        <div style="margin:50px auto;width:70%;padding:20px 0">
          <div style="border-bottom:1px solid #eee">
            <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Value Matrix</a>
          </div>
          <p style="font-size:1.1em">Hi,</p>
          <p>Thank you for choosing us. Use the following OTP to complete your Sign Up procedures. OTP is valid for 5 minutes</p>
          <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
          <p style="font-size:0.9em;">Regards,<br />Value Matrix</p>
          <hr style="border:none;border-top:1px solid #eee" />
        </div>
      </div>`;
    
    console.log("email: ",supportEmail);
    await sendGridMail.send({
      to: req.body.mail,
      from: supportEmail,
      subject: "Value Matrix OTP",
      html: html,
    });

    return res.status(200).json({ otp: OTP });
  } catch (err) {
    console.log(err);
  }
};
export const sendForwardedMail = async (req, res) => {
  try {
   

    let html = `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
        <div style="margin:50px auto;width:70%;padding:20px 0">
          <div style="border-bottom:1px solid #eee">
            <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Value Matrix</a>
          </div>
          <p style="font-size:1.1em">Hi,</p>
          <p>Thank you for choosing us. Your Request for Upgrading to XI has been forwarded. Kindly book a slot for the interview </p>
          <p style="font-size:0.9em;">Regards,<br />Value Matrix</p>
          <hr style="border:none;border-top:1px solid #eee" />
        </div>
      </div>`;
    
    await sendGridMail.send({
      to: req.body.mail,
      from: supportEmail,
      subject: "Value Matrix OTP",
      html: html,
    });

    return res.status(200).json({Message:"Request Forwarded"});
  } catch (err) {
    console.log(err);
  }
};

export const UpdateEmailOTP = async (request, response) => {
  try {
    let validate = await axios.post(
      `${url}/validateSignup`,
      request.body.updates
    );
    if (validate.data.email) {
      return response.json({
        Error: "Email already registered",
        contact: 0,
        email: 1,
      });
    }

    var digits = "0123456789";
    let OTP = "";
    for (let i = 0; i < 6; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }

    let html = `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
        <div style="margin:50px auto;width:70%;padding:20px 0">
          <div style="border-bottom:1px solid #eee">
            <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Value Matrix</a>
          </div>
          <p style="font-size:1.1em">Hi,</p>
          <p>Thank you for choosing us. Use the following OTP to complete your Sign Up procedures. OTP is valid for 5 minutes</p>
          <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
          <p style="font-size:0.9em;">Regards,<br />Value Matrix</p>
          <hr style="border:none;border-top:1px solid #eee" />
        </div>
      </div>`;

    await sendGridMail
      .send({
        to: request.body.mail,
        from: supportEmail,
        subject: "Value Matrix",
        html: html,
      })
      .then(() => {
        return response.status(200).json({ otp: OTP });
      })
      .catch((err) => {
        return response.status(401).json({ Error: "Email Not Sent" });
      });
  } catch (error) {
    console.log("Error :", error);
  }
};
