import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"

const registerUser= asyncHandler( async (req,res)=>{

    // get data from frontend
    // validation - if details are not empty
    // check if user exists before with same username or email
    // check for image, check for avatar
    // upload them to cloudinary -avatar
    // create object with details - push in db
    // remove password and refresh token field from response
    // check if user id entered in db
    // return res 
    const {username,password,email,fullName}=req.body
    console.log('email : ' + email);
    console.log('username : ' + username);
    console.log('password : ' + password);
    // console.log('fullName : ' + fullName);

    if(fullName.trim()===""){
        throw new ApiError(400,"fullName is Required")
    }

})

export {registerUser}