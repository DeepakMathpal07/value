import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { collectDefaultMetrics, register } from "prom-client";
import Connection from "./database/db.js";
import Routes from "./routes/routes.js";
import session from "express-session";
import passport from "passport";
import User from "./models/userSchema.js";
import { } from "dotenv/config";
import cookieParser from "cookie-parser";
import querystring from 'querystring';
import twilio from 'twilio';
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import RateLimitModel from "./models/rateLimitModel.js";

collectDefaultMetrics();

const domain = process.env.FRONTEND_DOMAIN
//console.log(domain, 'domaiin');

const app = express();
const PORT = 8000;
// const twilio = require('twilio');
const ClientCapability = twilio.jwt.ClientCapability;
const VoiceResponse = twilio.twiml.VoiceResponse;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;



// Set up rate limiting middleware with Mongoose store
const limiter = rateLimit({
  windowMs: 5 * 60 * 10000, // 5 minutes
  max: 1000, // limit each IP to 100 requests per windowMs
  handler: (req, res) => {
    res.status(429).json({ error: 'Too Many Requests' });
  },
  onLimitReached: (req, res, options) => {
    
    //console.log('Rate limit reached for', req.ip);
  },
  store: {
    // Custom store implementation using Mongoose model methods
    incr: async (key, cb) => {
      try {
        const result = await RateLimitModel.findOneAndUpdate(
          { key },
          { $inc: { count: 1 } },
          { upsert: true, new: true }
        );
        cb(null, result.count, result.createdAt.getTime());
      } catch (error) {
        cb(error);
      }
    },
    decrement: async (key) => {
      await RateLimitModel.findOneAndUpdate(
        { key },
        { $inc: { count: -1 } }
      );
    },
    resetKey: async (key) => {
      await RateLimitModel.findOneAndRemove({ key });
    },
    resetAll: async () => {
      await RateLimitModel.deleteMany({});
    },
  },
});

try{

  app.use(
    session({
      secret: "Our little secret.",
      resave: false,
      cookie: { domain: domain },
      saveUninitialized: false,
    })
  );

  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use("/media", express.static("media"));

  Connection();
  app.get('/token', (request, response) => {
    const capability = new ClientCapability({
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
    });
    capability.addScope(
      new ClientCapability.OutgoingClientScope({
        applicationSid: process.env.TWILIO_TWIML_APP_SID})
    );
    const token = capability.toJwt();
    response.send({
      token: token,
    });
  });

  // Create TwiML for outbound calls
  app.post('/voice', (request, response) => {
    let voiceResponse = new VoiceResponse();
    voiceResponse.dial({
      callerId: process.env.TWILIO_NUMBER
    }, request.body.number);
    response.type('text/xml');
    response.send(voiceResponse.toString());  
  });

  app.get("/metrics", async (_req, res) => {
    try {
      res.set("Content-Type", register.contentType);
      res.end(await register.metrics());
    } catch (err) {
      res.status(500).end(err);
    }
  });

  let backend_url = process.env.BACKEND_URL;
  let url = process.env.FRONTEND_URL;


  // Token Generator
  const getToken = async (user) => {
    // let token = await axios.post(`${backend_url}/generateToken`, {
    //   user: user.id,
    // });
    console.log("generating token");
    let token = tokenGen(user.id);
    let access_token = null;
    token.then((tok) => {
      access_token = tok;
      console.log("access_token:"+access_token);
    });
    await User.findOne({ _id: user.id }, function (err, res) {
      if (!res || err) return null;
      //res.access_token = token.data.token;
      res.access_token = access_token;
      res.access_valid = true;
      res.save();
    }).clone();
    //return token;
    console.log("access_token1:"+access_token);
    return access_token;
  };

// Token Generator
const tokenGen = async (user) => {
	try {
		if(user){
      console.log("user: "+user);
		const access_token = jwt.sign(
			{ user: user, iat: Date.now()},
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: 6 * 60 }
		);
		return access_token;
		}
	} catch (error) {
		console.log("Error: ", error);
	}  
}



  // Google Auth
    app.get(
      "/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );


  app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: `${url}/registerFirst`,
    }),
    async function (req, res) {
      // Successful authentication, redirect secrets.
      // const token = await getToken(req.user);
      // res.cookie("access_token", token.data.token, { origin: domain });
      const token = await getToken(req.user);
      res.cookie("access_token", token, { origin: domain });
      let type = req.user.user_type;
      if (req.user.invite) {
        res.redirect(`${url}/setProfile/${req.user.resetPassId}`)
        return;
      }
      let url1 = null;
      if (type === "Company") url1 = `${url}/company`;
      else if (type === "XI") url1 = `${url}/XI`;
      else if (type === "SuperXI") url1 = `${url}/XI`;
      else if (req.user.isAdmin) url1 = `${url}/admin`;
      else url1 = `${url}/user`;
      let r = querystring.stringify({
        // a: token.data.token
        a: token
      });

      res.redirect(url1 + "/?" + r);
    }
  );

  // Goolge Auth

  // Microsoft Auth
  app.get(
    "/auth/microsoft",
    passport.authenticate("microsoft", {
      prompt: "select_account",
    })
  );

  app.get(
    "/auth/microsoft/callback",
    passport.authenticate("microsoft", { failureRedirect: `${url}/registerFirst` }),
    async function (req, res) {
      // const token = await getToken(req.user);
      // await res.cookie("access_token", token.data.token, { origin: domain });
      const token = await getToken(req.user);
      res.cookie("access_token", token, { origin: domain });
      
      let type = req.user.user_type;
      if (req.user.invite) {
        res.redirect(`${url}/setProfile/${req.user.resetPassId}`)
        return;
      }
      let url1 = null;
      if (type === "Company") url1 = `${url}/company`;
      else if (type === "XI") url1 = `${url}/XI`;
      else if (type === "SuperXI") url1 = `${url}/XI`;

      else if (req.user.isAdmin) url1 = `${url}/admin`;
      else url1 = `${url}/user`;
      let r = querystring.stringify({
        //a: token.data.token
        a: token
      });

      res.redirect(url1 + "/?" + r);
    }
  );
  // Microsoft Auth

  // LinkedIn Auth
  app.get(
    "/auth/linkedin",
    passport.authenticate("linkedin", {
      scope: ["r_emailaddress", "r_liteprofile"],
    })
  );

  app.get(
    "/auth/linkedin/callback",
    passport.authenticate("linkedin", {
      failureRedirect: `${url}/registerFirst`,
    }),
    async function (req, res) {
      // if(req.user.pauth === true){}else{}
      const token = await getToken(req.user);
      //await res.cookie("access_token", token.data.token, { origin: domain });
      res.cookie("access_token", token, { origin: domain });
      if (req.user.invite) {
        res.redirect(`${url}/setProfile/${req.user.resetPassId}`)
        return;
      }
      let url1 = null;
      let type = req.user.user_type;
      if (type === "Company") url1 = `${url}/company`;
      else if (type === "XI") url1 = `${url}/XI`;
      else if (type === "SuperXI") url1 = `${url}/XI`;

      else if (req.user.isAdmin) url1 = `${url}/admin`;
      else url1 = `${url}/user`;
      console.log("url1");
      console.log(url1);
      let r = querystring.stringify({
        //a: token.data.token
        a: token
      });

      console.log("req.user.pauth");
      console.log(req.user.pauth);
      if(req.user.pauth === true){
        res.redirect(url1 + "/editProfile");
      }else{
        res.redirect(url1 + "/?" + r);
      }

    }
  );
  // LinkedIn Auth


  // Github Auth
  app.get('/auth/github',
    passport.authenticate('github'));

  app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    async function (req, res) {
      const token = await getToken(req.user);
      await res.cookie("access_token", token.data.token, { origin: domain });
      let url1 = null;
      let type = req.user.user_type;
      if (type === "Company") url1 = `${url}/company`;
      else if (type === "XI") url1 = `${url}/XI`;
      else if (req.user.isAdmin) url1 = `${url}/admin`;
      else url1 = `${url}/user`;
      let r = querystring.stringify({
        a: token.data.token
      });

      res.redirect(url1 + "/?" + r);
    }

  );
  //Github Auth

  app.listen(PORT, "0.0.0.0", () =>
    console.log(`Server is running successfully on PORT ${PORT}`)
  );


  app.use(bodyParser.json({ extended: true }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cors());
  const corsOptions = {
    origin: "*",
    credentials: true, //access-control-allow-credentials:true
    optionSuccessStatus: 200,
  };
  app.use(cors(corsOptions));
  app.use("/", Routes);
  // Add IP address to the request object
  // app.use((req, res, next) => {
  //   req.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  //   next();
  // });
  app.use(limiter);
  
}catch(err){
  console.log(err);
}
// Register the signal handler
process.on('SIGUSR1', disableInspector);

function disableInspector() {
  process.inspector.close();
  console.log('Inspector disabled');
}

process.on('uncaughtException', function(err) {
  // Handle the error safely
    console.log(err)
})

import { } from './scheduler/interview.scheduler.js';





