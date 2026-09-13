import ApiError from "../utils/ApiError.js";
import AssyncHandler from "../utils/AssyncHandler.js";
import ApiRes from "../utils/ApiRes.js";
import { User } from "../models/User.model.js";

const register = AssyncHandler(async (req, res) => {
  const { username, fullname, password, email } = req.body;

  if (!username || !fullname || !password || !email) {
    throw new ApiError(404, "All field require");
  }

  const userExist = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (userExist) {
    throw new ApiError(400, "user already exist");
  }

  const user = await User.create({
    username,
    fullname,
    email,
    password,
  });

  const userData = await User.findById(user._id).select("-password");

  if (!userData) {
    throw new ApiError(500, "user is not created!! server side error");
  }

  res.status(201).json(new ApiRes(201, userData, "user created !!"));
});

const login = AssyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, "all fields are required");
  }

  const user = await User.findOne({ username });

  if (!user) {
    throw new ApiError(401, "User not exists");
  }

  const validPassword = await user.isPasswordCorrect(password);

  if (!validPassword) {
    throw new ApiError(401, "password is invalid");
  }

  const token =  user.generateToken();

  const userdata= await User.findById(user._id).select("-password ");

  res.status(200).cookie("token",token).json(new ApiRes(200,{userdata,token},"user Loggedin !!"));
});

export { register, login };
