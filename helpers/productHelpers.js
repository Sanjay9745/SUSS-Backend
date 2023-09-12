const fs = require('fs').promises; // Import the 'fs' module for file operations
const path = require("path");
const Variation = require("../models/Variation");
// Helper function to unlink (delete) uploaded files
async function unlinkUploadedFiles(filePaths) {
    try {
      for (const filePath of filePaths) {
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.error("Error unlinking files:", error);
    }
  }
  // Helper function to delete existing images
  async function deleteExistingImages(imagePaths) {
    try {
      for (const imagePath of imagePaths) {
        const fullPath = path.join(__dirname, '..', imagePath); // Construct the full path
        await fs.unlink(fullPath); // Delete the image file
      }
    } catch (error) {
      console.error("Error deleting existing images:", error);
    }
  }
  const deleteVariationImages = async (variationId) => {
    try {
      const variation = await Variation.findById(variationId);
      if (!variation) {
        return; // Variation not found, no images to delete
      }
  
      const images = variation.images;
      for (const key in images) {
        const imagePath = images[key];
        const fullPath = path.join(__dirname, '..', 'uploads', imagePath);
  
        try {
          // Delete the image file using fs.promises.unlink
          await fs.unlink(fullPath);
        } catch (error) {
          console.error('Error deleting image:', error);
        }
      }
    } catch (error) {
      console.error('Error finding variation:', error);
    }
  };
    module.exports = { unlinkUploadedFiles, deleteExistingImages, deleteVariationImages };