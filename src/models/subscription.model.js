import mongoose,{Schema} from "mongoose";

const subscriptionSchema=new Schema({
    subcriber:{
        type:Schema.Types.ObjectId, // user who subscibes
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId, // where subscriber is subscribing
        ref:"User"
    }
},{timestamps:true})

export const Subscription=mongoose.model("Subscription",subscriptionSchema)