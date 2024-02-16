import { express } from "express";
import cors from "cors"
import cookieParser from "cookie-parser"

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
export {app}
