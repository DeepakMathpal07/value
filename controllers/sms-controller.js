import unirest from "unirest";
import {} from 'dotenv/config';
import axios from "axios";
var req = unirest("GET", "https://www.fast2sms.com/dev/bulkV2");


const url =process.env.BACKEND_URL;
// const fastsms_url = process.env.FAST2_SMS_URL;
// var twofactor_api = process.env.TWOFACTORIN_API_KEY;
// const twofactor_url = process.env.TWOFACTORIN_API_URL;
// var fastsms_api = process.env.FAST2SMS_API_KEY;

const fastsms_url = 'https://www.fast2sms.com/dev/bulkV2?';
var fastsms_api = '';

const twofactor_url = 'http://2factor.in/API/V1/';
var twofactor_api = '2822e1f5-e624-11ed-addf-0200cd936042';


export const sendOTPSMS = async(request,response) => {
  var digits = "0123456789";
  let OTP = "";
  let code = request?.body?.code;
  console.log("code :"+code);
  if(!code || (code =='' || code == 'undefined' || code==null)){
    // take country code as india by default
    code ='+91';
  }
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }

  try{
      let fast2SMSURL = fastsms_url+'authorization='+fastsms_api+'&route=otp'+'&variables_values='+OTP+'&numbers='+request?.body?.contact;
      let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: fast2SMSURL,
        headers: { 
          "cache-control": "no-cache"
        }
      };
      console.log("sending OTP via F2S");
      await axios.request(config);
      return response.status(200).json({otp:OTP})
    }catch(f2sError){
      console.log(f2sError);
      console.log("sending OTP via twofactor");
      let twofactorURL = twofactor_url+twofactor_api+'/SMS/' + code + request?.body?.contact+'/'+OTP+'/OTP1';
      var configTwoFactor = {method: 'get',maxBodyLength: Infinity,url: twofactorURL,headers: { }};
      try{
        await axios.request(configTwoFactor);
        return response.status(200).json({otp:OTP})
      }catch(err){
        console.log(err);
        response.status(400).json({"Error":err});
      }
    }
}


export const updateContactOTP = async(request,response) => {
    try {
        var digits = "0123456789";
        let OTP = "";
        for (let i = 0; i < 6; i++) {
          OTP += digits[Math.floor(Math.random() * 10)];
        }
        req.query({
            "authorization": fastsms_api,
            "variables_values": OTP,
            "route": "otp",
            "numbers":request.body.contact,
        })
        req.headers({
            "cache-control" :"no-cache"
        })
        req.end(function(res){
            if(res.error){
              let twofactorURL = twofactor_url+twofactor_api+'/SMS/'+code+request?.body?.contact+'/'+OTP+'/OTP1';
              var config = {method: 'get',maxBodyLength: Infinity,url: twofactorURL,headers: { }};
              axios(config).then(function (resp) {
                console.log(JSON.stringify(resp.data));
                response.status(200).json({otp:OTP});
              }).catch(function (error) {
                console.log(error);
                response.status(401).json({"Error":error});
              });
            }else{
              response.status(200).json({otp:OTP});
            }
        })
      } catch (error) {
        console.log("Error : ", error);
      }
}

export const sendOTP = async(phoneNo) =>{
  try {
      var digits = "0123456789";
      let OTP = "";
      for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
      }
      let fast2SMSURL = fastsms_url+'authorization='+fastsms_api+'&route=otp'+'&variables_values='+OTP+'&numbers='+phoneNo;
      let twofactorURL = twofactor_url+twofactor_api+'/SMS/'+phoneNo+'/'+OTP+'/OTP1';
      let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: fast2SMSURL,
        headers: { 
          "cache-control": "no-cache"
        }
      };
      console.log("sending OTP via F2S");
      let sent = 2;
      let err = null;
      await axios.request(config).then((response) => {
        // do nothing
        sent = 0;
      }).catch((error) => {
        // send otp via twofactor
        console.log("sending OTP via TWOFACTOR");
        var config = {method: 'get',maxBodyLength: Infinity,url: twofactorURL,headers: { }};
        axios(config).then(function (response) {
          console.log(JSON.stringify(response.data));
          sent = 0;
        }).catch(function (error) {
          console.log(error);
          sent = 1;
          err = error;
        });
      });
      if(sent == 0){
        return {otp:OTP}
      }else{
        return {error:err}
      }
  } catch (err) {
    console.log(err);
    return err;
  }
}