 import mongoose,{Schema} from "mongoose"
 import jwt from "jsonwebtoken"
 import bcrypt from "bcrypt"
 // to encrypt them we use pre hook of middleware which run just before saving 
 const userSchema= new Schema(
    {
        username:{
            type:String,
             required:true,
             unique:true,
             lowercase:true,
             trim:true,
             index:true
            // index searching mei helps karenga db mei
        },
        email:{
            type:String,
             required:true,
             unique:true,
             lowercase:true,
             trim:true, 
        },
        fullName:{
            type:String,
             required:true,
             trim:true, 
             index:true
        },
        avatar:{
            type:String,// clodinary url
            required:true,
        },
        coverImage:{
            type:String,// clodinary url
        },
        watchHistory:{
            type:Schema.Types.ObjectId,
            ref:"Video"
        },
        password:{
            type:String,
             requried:[true,"Password is required"],
            unique:true,
        },
        refreshToken:{
            type:String
        },
    },{timestamps:true}
 )

 // pre hook
 userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    // kind of else
    this.password= await bcrypt.hash(this.password,10)
    // this 10 is numbe rof rounds random 8,10 etc
    next()
 })
 // now using methods
 userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
 }

 // generating access token
 userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id:this._id,
        email:this.email,
        username:this.username,
        fullName:this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
    )
 }
 userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id:this.id,
    },
    process.env.REFRESH_TOKEN_SECRET,{
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
    )
 }

 export const User= mongoose.model("User",userSchema)