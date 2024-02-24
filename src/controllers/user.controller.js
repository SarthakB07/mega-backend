//import mongoose,{Schema} from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefreshedTokens=async(userId)=>{
    try{
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        
        user.refreshToken=refreshToken
       await user.save({validateBeforeSave:false})

       // now return access and refresh

       return {accessToken,refreshToken}

    }catch(error){
        throw new ApiError(500,"something went wrong while generating token")
    }
}


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
 // yeh postman ke console me upload hogi and then output vscode mei show karengi
 // direct vscode mei show nhi hogi first we have to run on postman

 //console.log(req.files)


// now for images and avatar
// multer gives us files access
const avatarLocalPath=req.files?.avatar[0]?.path;

// yeh method se error aayenga if we dont pass it 

//const coverImageLocalPath=req.files?.coverImage[0]?.path;

// we r modifying it
let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path
}

if(!avatarLocalPath){throw new ApiError(400,"avatar error")}
//if(!coverImageLocalPath){throw new ApiError(400, "cover image req")}

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

}) // yeh jo }) hai yeh register user ka hai which starts from top starting






// now we r writing for a access token and refresh token and this is for how a user should login like steps

const loginUser=asyncHandler(async(req,res)=>{
/* steps for user login
1. user is registered so he will login
2. get data from req body
3. check with username or email means kiss se login
4. then find user
5. if user available then password check
6. password matches then generate tokens
7. send cookies
*/
const {email,username,password}=req.body
if(!username || !email){
    throw new ApiError(400,"username or password is required")
}
const user=User.findOne({
$or: [{username},{email}]
})

if(!user){throw new ApiError(404,"user does not exist")}
// checking password

const isPasswordValid=await user.isPasswordCorrect(password)

if(!isPasswordValid){throw new ApiError(401,"password does not matches")}

// now access and refresh token, we are putting them in another model
// just above in this file
const{accessToken,refreshToken}=await generateAccessAndRefreshedTokens(user._id)

const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

//sending them in cookies

const options={
    httpOnly:true,
    secure:true
}
return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    // yeh jo h vo this.data ka part h apna from api response ke part ka
    new ApiResponse(
        200,{
            user:loggedInUser,accessToken,
            refreshToken
        },
        "user logged in successfully"
    )
)

})
const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,{
            $set:{refreshToken:undefined}
        },
        {new:true}
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    // here {} is data
    .json(new ApiResponse(200,{},"User logged outsuccessfully"))
})

export {registerUser,loginUser,logoutUser}
