//import mongoose,{Schema} from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";




const registerUser=asyncHandler(async(req,res)=>{
     //res.status(200).json({
      //  message:"ok"
   // })

   /*  checking all conditions which make registration possible
   1. get user details from the frontend(postman)
   2. valdation = means to check not empty
   3. check if already user present or not
   4. check for images ,avatar
   5. upload them  to cloudinary
   6. create user project- create entry in DB
   7. remove passowrd and refresh token from response so that now need to show to customers
   8.check for user creatuon - means to check whemther bool check=0070 \\\
   9. return response
   
   */
    // now we are writing for registering a user
   const{fullName,email,username,password}=req.body
   // console.log("email:",email);

 /*   if(fullName===""){
        throw new ApiError(400,"fullname is required")
 }
 */   // another way of writing this condition
 if([fullName,email,username,password].some((field)=>
 field?.trim()==="")
 // means yeh some function here returns true or false , trim means removing
 ){
    throw new ApiError(400,"all fields are required")
 }
 // now adding for user validation this user will match with email or username
 const existedUser=await User.findOne({
    $or:[{ username },{ email }]
 })
 // console.log(existedUser) 
 // for just ex
 if(existedUser){
    throw new ApiError(409,"User with similar details exist")
 }
// now for images and avatar
// multer gives us files access
const avatarLocalPath=req.files?.avatar[0]?.path;
const coverImageLocalPath=req.files?.coverImage[0]?.path;
if(!avatarLocalPath){throw new ApiError(400,"avatar error")}
if(!coverImageLocalPath){throw new ApiError(400, "cover image req")}

// now for cloudinary upload method which we have written already only we have to import it
const avatar=await uploadOnCloudinary(avatarLocalPath)
const coverImage=await uploadOnCloudinary(coverImageLocalPath)
if(!avatar){throw new ApiError(400,"avatar error")}

// creating user project using user only
const user=await User.create({
    fullName,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
})

const createdUser=await User.findById(user._id).select(
    // here we write which we dont need
    "-password -refreshToken"
)

if(!createdUser){
    throw new ApiError(500,"Something went wrong while regisering user ")
}
// our apiresponse for created user 
return res.status(201).json(
    new ApiResponse(200,createdUser,"user successfully")
)

})

export {registerUser}
