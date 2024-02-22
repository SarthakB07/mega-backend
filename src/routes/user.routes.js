import { Router } from "express";
// .js hamesha lagana h  
import { registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
const router=Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
            // no of files
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    
    registerUser)
// login waala is just for ex 
//router.route("/login").post(login)

export default router
