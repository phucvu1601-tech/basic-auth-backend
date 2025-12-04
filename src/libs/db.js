import mongoose from 'mongoose'

export const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
        console.log("Connection to database successfully");
    }catch(error){
        console.log(`Error connecting to database: ${error}`);
        process.exit(1);
    }
}