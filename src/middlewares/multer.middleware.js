import multer from "multer";

// we r using disk storage not memory storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // our destination
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      // file.originalName
      cb(null, file.originalname)
      // sirf small time ke liye rahega apne pass
    }
  })
  
 export const upload = multer({ 
    storage,
})