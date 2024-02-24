import { Router } from "express";
// .js hamesha lagana h  
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router=Router()

router.route("/register").post(
    // from 9 to 18 this is our middle ware
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
// login waala 
router.route("/login").post(loginUser)
// secured routes
router.route("/logout").post(verifyJWT,logoutUser)

export default router
