import mongoose from "mongoose"

const connectDB=async()=>{
    try {
        await mongoose.connect(`${process.env.DATA_BASE_URL}`);
        console.log("database  connected !!");
    } catch (error) {
        console.log("something went wrong... database not connected !!",error);
        process.exit();
    }
}

export default connectDB;