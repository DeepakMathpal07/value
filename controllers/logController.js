import mongoose from "mongoose";
import Logs from "../models/logSchema.js";

export const logIt = async (request, response) => {
    try {
        let data = request.body;
        let action = request.body.action;
        let logs= new Logs({
			action: request?.body?.action,
            log:request?.body
        })
        logs.save();
    }catch(err){
        console.log(err);
    }
}

//added for internal
export const logItDirect = async (log) => {
    try {
        let logs= new Logs({
			action: log?.action,
            log:log?.data
        })
        logs.save();
    }catch(err){
        console.log(err);
    }
}