import { User } from "../models/User.model.js";
import jwt from "jsonwebtoken";
import AssyncHandler from "../utils/AssyncHandler.js";
import ApiError from "../utils/ApiError.js";

const verifyJWT = AssyncHandler(async (req, res, next) => {
  const token = req.cookies.token || req.header.authorization?.split(" ")[1];

  if (!token) {
    throw new ApiError(401, "unauthorized User");
  }

  const decode = jwt.verify(token, process.env.ACCESS_TOKEN);

  const user = await User.findById(decode._id).select("-password");

  if (!user) {
    throw new ApiError(401, "invalid token");
  }

  req.user = user;

  next();
});

const verifySystem = AssyncHandler(async (req, res, next) => {
  const token = req.cookies.token || req.header.authorization?.split(" ")[1];

  if (!token) {
    throw new ApiError(401, "unauthorized User");
  }

  const decode = jwt.verify(token, process.env.ACCESS_TOKEN);

  const user = await User.findById(decode._id).select("+systemUser");

  if (!user.systemUser) {
    throw new ApiError(403, "Not a system user");
  }

  req.user = user;

  next();
});

export  {verifyJWT , verifySystem};