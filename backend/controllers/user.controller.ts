require("dotenv").config();
import { NextFunction, Request, Response } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "../middleware/catchAsyncError";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import express from "express";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
// register user

interface IRegistration {
  username: string;
  email: string;
  password: string;
  avatar?: string;
}
export const registerUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, email, password } = req.body;
      const isEmailExists = await userModel.findOne({ email });

      if (isEmailExists) {
        return next(new ErrorHandler("Email already exists", 400));
      }

      const user: IRegistration = {
        username,
        email,
        password,
      };

      const activationToken = createActivationToken(user);

      const activationCode = activationToken.activationCode;

      const data = { user: { username: user.username }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activationMail.ejs"),
        data
      );
      try {
        await sendMail({
          email: user.email,
          subject: "Activate your account",
          template: "activationMail.ejs",
          data,
        });

        res.status(201).json({
          success: true,
          message: `Please check your email: ${user.email} to activate your account.`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  // const  = Math.floor(1000 + Math.random() + 9000).toString();
  const randomNumber = Math.random();

  // Multiply the random number by 9000 and add 1000 to get a number between 1000 and 9999
  const activationCode = Math.floor(randomNumber * 900000 + 100000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_TOKEN as Secret,
    {
      expiresIn: "5m",
    }
  );
  return { token, activationCode };
};

// activate user

interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}
export const activateUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;

      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_TOKEN as string
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }

      const { username, email, password } = newUser.user;

      const existUser = await userModel.findOne({ email });

      if (existUser) {
        return next(new ErrorHandler("Email already exists", 400));
      }

      const user = await userModel.create({
        username,
        email,
        password,
      });

      res.status(200).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// login user

interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;
      if (!email || !password) {
        return next(new ErrorHandler("Please enter email and password", 400));
      }
      const user = await userModel.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("Invalid email or password", 400));
      }

      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid  email or password", 400));
      }
      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// lOGOUT USER

export const logoutUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      // delete data from redis database
      const userId = req.user?._id || "";
      // console.log(req.user);
      redis.del(userId);
      res.status(200).json({
        suceess: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Delete user

const router = express.Router();

// Define a function to delete a user from the database
export const deleteUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id || "";

    // Find and delete the user from the database
    const user = await mongoose.model("User").findByIdAndDelete(userId);

    // Check if the user was found and deleted
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });

      // delete data from redis database
      redis.del(userId);
      res.status(200).json({
        suceess: true,
        message: "User successfully deleted",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// update user profile

// Define a function to hash the password
const hashPassword = async (password: string) => {
  // Generate a salt
  const salt = await bcryptjs.genSalt(12);

  // Hash the password with the salt
  const hashedPassword = await bcryptjs.hash(password, salt);

  // Return the hashed password
  return hashedPassword;
};
// Define a function to update a user's profile
export const updateUserProfile = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get the user id from the request header
    const userId = req.user?._id || "";
    // Get the update data from the request body
    const updateData = req.body;

    if (updateData.password) {
      // Hash the password
      updateData.password = await hashPassword(updateData.password);
    }

    // Find and update the user in the database
    const user = await mongoose
      .model("User")
      .findByIdAndUpdate(userId, updateData, {
        new: true, // Return the updated user
        runValidators: true, // Validate the update data using the user schema
      });

    // Check if the user was found and updated
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });

      // delete data from redis database
      redis.set(userId, user);
      res.status(200).json({
        suceess: true,
        message: "User successfully updated",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// reset password
export const resetPasswordRequest = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const user = await mongoose.model("User").findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a 6-digit numeric token
    const generateToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    if (!generateToken) {
      return next(new ErrorHandler("Token not generated", 400));
    }

    user.resetToken = generateToken;
    user.expireToken = Date.now() + 5 * 60 * 1000; // 5 minutes in milliseconds
    await user.save();

    const resetLink = `${process.env.BASE_URL}/resetpassword/${generateToken}`;
    const data = {
      user: { username: user.username },
      resetLink,
      resetToken: generateToken,
    };

    try {
      await sendMail({
        email: user.email,
        subject: "Reset your password",
        template: "resetPassword.ejs",
        data,
      });
      res.status(200).json({
        success: true,
        message: "Please check your email to reset your password",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const resetPassword = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.params;
  const { email, password } = req.body;

  const user = await mongoose.model('User').findOne({ 
    email: email,
    resetToken: token,
    expireToken: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }

  // Hash the new password
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(password, salt);

  user.password = hashedPassword;
  user.resetToken = undefined;
  user.expireToken = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password successfully reset",
  });
});
// validate user role

export const validateRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          `Role: ${req.user?.role} is not allowed to access this resource.`,
          403
        )
      );
    }
    next();
  };
};

// update access_token

export const updateAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refresh_token = req.cookies.refresh_token as string;
    const decoded = jwt.verify(
      refresh_token,
      process.env.REFRESH_TOKEN as string
    ) as JwtPayload;

    const message = "Couldn't access refresh token";
    if (!decoded) {
      return next(new ErrorHandler(message, 400));
    }
    const session = await redis.get(decoded._id as string);

    if (!session) {
      return next(new ErrorHandler(message, 400));
    }
    const user = JSON.parse(session);

    const accessToken = jwt.sign(
      { id: user._id },
      process.env.ACCESS_TOKEN as string,
      {
        expiresIn: "5m",
      }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN as string,
      {
        expiresIn: "5d",
      }
    );
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);

    res.status(200).json({
      status: "success",
      accessToken,
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
};
