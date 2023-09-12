const multer = require('multer');
const path = require('path'); // To work with file paths

// Define storage settings for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Specify the destination folder where uploaded images will be stored
    cb(null, 'uploads/productImage/');
  },
  filename: function (req, file, cb) {
    // Specify the filename for the uploaded image
    const extname = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + extname);
  },
});

// Create a Multer instance with the defined storage settings for multiple files
const productImage = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (in bytes)
  },
}).array('image', 5); // 'logo' is the field name for the file input, and '5

module.exports = productImage;

