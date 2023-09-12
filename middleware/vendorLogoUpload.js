const multer = require('multer');
const path = require('path'); // To work with file paths

// Define storage settings for Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Specify the destination folder where uploaded images will be stored
    cb(null, 'uploads/vendorLogo/');
  },
  filename: function (req, file, cb) {
    // Specify the filename for the uploaded image
    const extname = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + extname);
  },
});

// Create a Multer instance with the defined storage settings
const vendorLogo = multer({ storage: storage });

module.exports = vendorLogo;
