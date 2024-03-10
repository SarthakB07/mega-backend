// // ek baar try and cathch se bhi likha h niche 
// yeh waala promise waala h
const asyncHandler=(requestHandler)=>{
    // agar ismei return nhin daala then error aa rha 
   return  (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

export {asyncHandler}

/*const asyncHandler = ()=>{}
const asyncHandler = (func)=>()=>{}
const asyncHandler = (func)=> async()=>{}*/
// these 3 steps are explanation of below step


// yeh waala code try catch waala tha now we will write for promises ke saath

/*const asyncHandler=(fn)=>async (req,res,next)=>{
    try{
        await fn(req,res,next)
    }catch(error){
        res.status(err.code || 500).json({
            success:false,
            message:err.message
        })
    }
}*/