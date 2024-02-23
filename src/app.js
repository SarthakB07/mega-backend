import  express  from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
// routes import
import userRouter from"./routes/user.routes.js";
// agar aisa impoort {} means not export default

const app=express()
app.use(cors({
    origin:process.env.CORS_ORIGIN
}))
// using limit
app.use(express.json({limit:"16kb"}))
// using for data coming from url as it changes somepart of data
app.use(express.urlencoded({extended:true,limit:"16kb"}))
// static for public assets
app.use(express.static("public"))
// for cookie parser
app.use(cookieParser())



// routes declaration
// hum pehle app.get likh rhe the but ab humne router ki alag file bana li hai so we need to introduce middleware
app.use("/api/v1/users",userRouter)
// http://localhost:8000/api/v1/users/register
// first it goes to users then register in


export {app}
