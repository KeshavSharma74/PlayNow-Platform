import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken= async(userId)=>{
    try {
            const user=await User.findById(userId);
            const accessToken=user.generateAccessToken();
            const refreshToken=user.generateRefreshToken();
            user.refreshToken=refreshToken;
            await user.save({validateBeforeSave:false})
        
            return {accessToken,refreshToken}
    }
    catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh token and access token")
    }
}

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
    // console.log('email : ' + email);
    // console.log('username : ' + username);
    // console.log('password : ' + password);
    // console.log(req.body);
    
    // console.log('fullName : ' + fullName);

    // if(fullName.trim()===""){
    //     throw new ApiError(400,"fullName is Required")
    // }

    if( 
        [fullName,username,password,email].some( (field)=> !field || field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser=await User.findOne({
        $or:[{email},{username}]
    })

    if(existedUser){
        throw new ApiError(409,"User with same email id or username already exists")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;
    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && (req.files.coverImage.length>0)){
        coverImageLocalPath=req.files.coverImage[0].path
    }

    // console.log(req.files)


    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required..!!")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);

    // console.log(coverImage)

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

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user..!!");
    }
    
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered Successfully...!!")
    )

})

const loginUser = asyncHandler( async(req,res)=>{
    // req.body-data
    // username or emailid
    // find user
    // check password
    // refresh token and access token
    // send cookies

    const {username,email,password}=req.body;

    // console.log("username : ", username);
    // console.log("email : ",email);

    if(!username && !email){
        throw new ApiError(400,"provide username or email to login");
    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){ 
        throw new ApiError(404,"user does not exists")
    }

    const isPasswordValid=await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(404,"password is not valid")
    }

    const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken(user._id);
    
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken");

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options).json( new ApiResponse(
        200,
        {
            user: loggedInUser,accessToken,refreshToken,
        },
        "User logged In Successfully"
    ) )

})

const logoutUser = asyncHandler( async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true,
    }

    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,{},"User logged Out"))

})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.accessToken || req.body.accessToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized Request");
    }

    try {
            const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
        
            const user=User.findById(decodedToken?._id);
        
            if(!user){
                throw new ApiError(401,"Invalid refresh Token")
            }
        
            if(incomingRefreshToken!==user?.refreshToken){
                throw new ApiError(401,"Refresh token is expired or used")
            }
        
            const options={
                httpOnly:true,
                secure:true
            }
        
            const {accessToken,newRefreshToken} = await generateAccessTokenAndRefreshToken(user._id);
        
            return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options).json(
                new ApiResponse(
                    200,
                    {accessToken,refreshToken:newRefreshToken},
                    "Access Token refreshed Successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token");
    }

})

export {registerUser,loginUser,logoutUser,refreshAccessToken}