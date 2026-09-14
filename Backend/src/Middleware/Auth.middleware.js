import { User } from "../models/User.model";
import jwt from 'jsonwebtoken'
import AssyncHandler from "../utils/AssyncHandler";
import ApiError from "../utils/ApiError";


const verifyJWT = AssyncHandler(async (req , res, next )=>{
    const token = req.cookies.token || req.header.authorization?.split(" ")[1]

    if(!token){
        throw new ApiError(401,"unauthorized User");
    }

    const decode=  jwt.verify(token,process.env.ACCESS_TOKEN);

    const user = await User.findById(decode._id).select("-password");

    if(!user){
        throw new ApiError(401,"invalid token");
    }

    req.user=user;

    next();

})

export default verifyJWT;