import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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

    // if(fullName.trim()===""){
    //     throw new ApiError(400,"fullName is Required")
    // }

    if( 
        [fullName,username,password,email].some( (field)=> !field || field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser=User.findOne({
        $or:[{email},{username}]
    })

    if(existedUser){
        throw new ApiError(409,"User with same email id or username already exists")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required..!!")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar file is required..!!")
    }

    const user= await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    const createdUser= await User.findById(user._id).select("-password -refreshToken");

    if(createdUser){
        throw new ApiError(500,"Something went wrong while registering the user..!!");
    }
    
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully...!!")
    )

})

export {registerUser}