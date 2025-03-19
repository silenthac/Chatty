import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

// Add debug logging
const config = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
};

console.log("Cloudinary Config:", {
  ...config,
  api_key: config.api_key?.slice(0, 5) + '...',
  api_secret: config.api_secret?.slice(0, 5) + '...'
});

// Configure cloudinary
cloudinary.config(config);

// Test connection with timestamp
const testUpload = async () => {
  try {
    const timestamp = Math.round((new Date).getTime()/1000);
    const result = await cloudinary.uploader.upload(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      { 
        folder: "test",
        timestamp: timestamp,
        // Add signature verification
        api_key: config.api_key,
        api_secret: config.api_secret
      }
    );
    console.log("Cloudinary test successful:", result.secure_url);
  } catch (error) {
    console.error("Cloudinary test failed:", error);
  }
};

testUpload();

export default cloudinary;
