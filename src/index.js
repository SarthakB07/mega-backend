// it is most required statement for dotenv but we dont write here as it doesnot look good here
// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import mongoose from "mongoose"
//import {DB_NAME} from "./constants.js"
import connectDB from "./db/index.js"

dotenv.config({path:'./env'})
// two ways of connecting db
// 2nd using db folder and in db folder we have created index.js


connectDB()





// 1st using iffe
/*
import { express } from "express"
const app=express()
(async ()=>{
    try{
        // means connected
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       // we r also applying listeners
       app.on("error",(error)=>{
        console.log("ERROR: not able to listen",error)
        throw(error)
       })

       app.listen(process.env.PORT,()=>{
        console.log(`App is listening on port ${process.env.PORT}`)
       })

    } catch(error){
        console.log("ERROR: ",error)
        throw err
    }
}
)()*/