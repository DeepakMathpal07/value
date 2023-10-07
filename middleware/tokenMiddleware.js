import jwt from "jsonwebtoken";
import User from "../models/userSchema.js";
// Token Generator

// Token Generator
export const tokenGen = async (user,randomUID) => {
    try {
      if (user) {
        const access_token = jwt.sign(
          { user: user, iat: new Date().getTime(),randomUUID:randomUID},
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: 2 * 60 }
        );
        return access_token;
      }
    } catch (error) {
      console.log("Error: ", error);
    }
  };
  
// Create a function here
export const tokenMiddleware = (req, res, next,access_token) => {
  try {
    if(access_token){
      jwt.verify(
        access_token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, authData) => {
          if (err) {
            console.log(err);
            res.status(401).json({ message: "Invalid Token" });
          } else if (authData === null) {
            console.log("authData is null");
            res.status(401).json({ message: "Not Authorized" });
          } else {
            //get the user id from token
            // check the logout status or the user and accordingly set the request header
            let user_id = authData.user;
            if(user_id){
              let user = User.findById(user_id).then(value=>{
                next();
              });
            }else{
              console.log("user_id ["+user_id+"] is invalid");
              res.status(401).json({ message: "Not Authorized" });
            }
            // let currentTime = new Date().getTime();
            // if (authData.exp < currentTime) {
            //   // Here have to send new token and set it as a header
            //   let access_token;
            //   const token = tokenGen(authData.user, authData.randomUid);
            //   token
            //     .then(async (tok) => {
            //       access_token = tok;
            //       res.setHeader("access_token", access_token);
            //       next();
            //     })
            //     .catch((err) => {
            //       console.log("Error in tokenGen", err);
            //       return res
            //         .status(500)
            //         .json({ message: "Something went wrong" });
            //     });
            // }
          }
        });
    }else{
      next();
    }

  } catch (err) {
    console.log("Error in middleware", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export default tokenMiddleware