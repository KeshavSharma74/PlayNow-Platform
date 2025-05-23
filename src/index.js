import dotenv from 'dotenv'
import mongoose from 'mongoose'
import connectDB from './db/index.js'

dotenv.config({
    path:'./env'
})

connectDB()
.then( ()=>{

    app.on("error",error=>{
        console.log("App failed to connect "+error);
        throw error;
    })

    const port=process.env.PORT||8000;
    app.listen( port, (req,res)=>{
        console.log(`App listening on port : ${port}`);
    } )
} )
.catch( (err)=>{
    console.log("MONGO db connection failed !!! "+err);
})



// import { DB_NAME } from './constants'






/*
import express from 'express'
const app=express()

;( async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on( "error" , (error)=>{
            console.log('APP FAILED TO CONNECT...!!'+error)
            throw error;
        } )

        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
        } )
    } catch (error) {
        console.log('MONGODB CONNECTION FAILED..!!!'+ error);
        throw error;
    }
} )()

*/