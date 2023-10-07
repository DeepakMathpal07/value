import mongoose from 'mongoose';
import ServerApiVersion from "mongodb";

const Connection = async () => {
    console.log('Database Connection');
    //console.log(process.env.MONGODB_DATABASE_URL);
    try{
        mongoose.connect(process.env.MONGODB_DATABASE_URL,{useNewUrlParser:true, useUnifiedTopology:true,  serverApi: ServerApiVersion.v1});
        console.log('Database Connected Succesfully');
    }   
    catch(error){
        console.log("Error: ", error.message)
    }
};

export default Connection;