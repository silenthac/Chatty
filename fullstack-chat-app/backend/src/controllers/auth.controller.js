import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    console.log("salt", salt);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("hashedPassword", hashedPassword);
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

     console.log("newUser", newUser);

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token and set cookie
    const token = generateToken(user._id, res);
    
    // Set cookie with domain
    // res.cookie("jwt", token, {
    //   httpOnly: true,
    //   secure: false,
    //   sameSite: "lax",
    //   path: "/",
    //   domain: "127.0.0.1",
    //   maxAge: 7 * 24 * 60 * 60 * 1000
    // });

    console.log("Setting cookie with token:", token);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    // Add validation for base64 image
    if (!profilePic.startsWith('data:image')) {
      return res.status(400).json({ message: "Invalid image format" });
    }

    try {
      console.log("Attempting to upload to Cloudinary...");
      
      const timestamp = Math.round((new Date).getTime()/1000);
      const uploadResponse = await cloudinary.uploader.upload(profilePic, {
        folder: "chat_app",
        timestamp: timestamp,
        // Add signature verification
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
      
      console.log("Cloudinary upload successful:", uploadResponse.secure_url);

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: uploadResponse.secure_url },
        { new: true }
      ).select("-password");

      res.status(200).json(updatedUser);
    } catch (uploadError) {
      console.error("Cloudinary upload error details:", {
        message: uploadError.message,
        name: uploadError.name,
        http_code: uploadError.http_code,
        stack: uploadError.stack
      });
      
      return res.status(500).json({ 
        message: "Error uploading image",
        error: uploadError.message 
      });
    }
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
