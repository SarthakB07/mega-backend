import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import  jwt  from "jsonwebtoken";
import mongoose,{Schema} from "mongoose";
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
   6. create user object- create entry in DB
   7. remove password and refresh token field from response so that now need to show to customers
   8.check for user creation - means to check whether bool check=0070 \\\
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

// avatar[0] means first propert of avatar
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
7. send cookies for tokens
*/
const {email,username,password}=req.body
console.log(email)
if(!username && !email){
    throw new ApiError(400,"username or email  is required")
}
const user=await User.findOne({
$or: [{username},{email}]
})

if(!user){throw new ApiError(404,"user does not exist")}
// checking password

const isPasswordValid=await user.isPasswordCorrect(password);

if(!isPasswordValid){throw new ApiError(401,"password does not matches")}

// now access and refresh token, we are putting them in another model
// just above in this file
const{accessToken,refreshToken}=await generateAccessAndRefreshedTokens(user._id)

const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

//sending them in cookies
const options={
    httpOnly:true,
    secure:true
    // by this method only modified by servers
}
return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    // yeh jo h vo this.data ka part h apna from api response ke part ka
    // means when user want to save tkens by himself  
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
            $unset:{refreshToken:1}// this removes field from document
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

//now we  r working on refresh token(session token)

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }
    // yeh refresh token ko verify kar waa rhe h
    try{const decodedToken=jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )
    const user=await User.findById(decodedToken?._id)
    if(!user){
        throw new ApiError(401,"Invalid refresh token")
    }
    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401,"Refresh token is expired or used")
    }

    // all verificatios are done now generate new
    const options={
        httpOnly: true,
        secure:true
    }
    const {accessToken,newRefreshToken}=await generateAccessAndRefreshedTokens(user._id)

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
        new ApiResponse(
            200,{accessToken,refreshToken:newRefreshToken},
            "Access Token Refreshed"
        )
    )
    }catch(error){
        throw new ApiError(401,"invalid ")
    }
})

// now making more users
const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body

  //  if(newPassword=== confirmPassowrd){

//}

    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old Password")
    }
    // now setting new password
    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password change successfully"))

})

// Getting current user

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"current user fetched successfully"))
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{fullName,email:email}
        },{new:true}
        ).select("-password")
        // means password nhi chahiye

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details change successfully"))
})

// updating user avatar
const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    // got this from multer
    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is missing")
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading avatar")
    }
    // updating here
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{avatar:avatar.url}
        },{new:true}
        ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar image updated successfully"))
})

// updating cover image
const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    // got this from multer
    if(!coverImageLocalPath){
        throw new ApiError(400,"cover image file is missing")
    }
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading coverImage")
    }
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{coverImage:coverImage.url}
        },{new:true}
        ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"coverImage image updated successfully"))
})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    // url se username le liya
    const {username} =req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }
    // aggregate method ismei generally aggregate ke baad arrays aati hain
    const channel=await User.aggregate([
    {
        $match:{
            username:username?.toLowerCase()
        }
    },
    { 
        $lookup:{
            // yeh lowercase plural mei from subscription model
            // autoar ke kitne subscriber
    from:"subsciptions",
    localField:"_id",
    foreignField:"channel",
    as:"subcribers"

    }
},
    {
        // how many we have subscribed
        $lookup:{
    from:"subsciptions",
    localField:"_id",
    foreignField:"subscriber",
    as:"subcribedTo"
        }
    },
    {
        $addFields:{
            subscibersCount:{
                // subscibers ka cnt
            $size:"$subscribers"
            },
            channelsSubscribedToCount:{
                  // channel subscribed to  ka cnt
                $size:"$subscribedTo"
            },
            isSubscribed:{
                $cond:{
                    if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                    then:true,
                    else:false
                }
            }
        }
    },
    {    // here we pass everything and give 1 to if giving t
        $project:{
            fullName:1,
            username:1,
            subscibersCount:1,
            channelsSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1
        }
    }

])
if(!channel?.length){
    throw new ApiError(400,"channel does not exist")
}
return res
.status(200)
.json(new ApiResponse(200,channel[0],"USer channel fetched successfully"))

})

const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            // it has sub pipeline
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                },
                                // another sub pipeline as here we r getting data into an array so just it becomes easy for frontend user
                                {
                                    $addFields:{
                                        owner:{
                                            $first:"$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"Watch histor of user fetced successfully"))

})

export {
registerUser,
loginUser,
logoutUser,
refreshAccessToken,
changeCurrentPassword,
getCurrentUser,
updateAccountDetails,
updateUserAvatar,
updateUserCoverImage,
getUserChannelProfile,
getWatchHistory
}
