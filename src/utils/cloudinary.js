import {v2 as cloudinary} from 'cloudinary';
import fs from "fs" 
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary=async (localFilePath)=>{
    try{
        if(!localFilePath) return null
        // upload file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath,{
        resource_type:"auto"
    })
    // file has been uploaded successfully it shows in our vs code console when successfully postman works due to file uploaded on cloudinary
   // console.log("file has been uploaded on cloudinary",response.url);
   // now we r unlinking file
   fs.unlinkSync(localFilePath)
    return response;
}catch(error){
        // removing file from server using fs
        fs.unlinkSync(localFilePath) // removed the locally saved file
        // as upload operation got failed
        return null;

    }
}


  export {uploadOnCloudinary}