require("dotenv").config();
import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


const emailRegexPattern: RegExp =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export interface IUser extends Document {
  // here, I stands for interface
  username: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;

  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please enter your username"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: "Please enter a valid email address",
      },
      unique: true,
    },
    password: {
      type: String,
      require: [true, "Please enter your password"],
      minlength: [8, "Password must be min. 8 characters long"],
      select: false,
       unique: true,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",

    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// sign  acces token
userSchema.methods.SignAccessToken = function(){
  if (!process.env.ACCESS_TOKEN) {
    throw new Error('ACCESS_TOKEN is not defined in environment variables');
  }
  return jwt.sign({id:this._id}, process.env.ACCESS_TOKEN, {
    expiresIn: '5m',
  });
};

// sign  REFRESH token
userSchema.methods.SignRefreshToken = function(){
  if (!process.env.REFRESH_TOKEN) {
    throw new Error('REFRESH_TOKEN is not defined in environment variables');
  }
  return jwt.sign({id:this._id}, process.env.REFRESH_TOKEN, {
    expiresIn: '5d',
  });
};
//compare password

userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const userModel : Model<IUser> = mongoose.model("User", userSchema);
export default userModel;