const jwt = require('jsonwebtoken');

const jwtSecretKey = process.env.VENDOR_JWT_SECRET_KEY;
// Define your JWT secret key

const userAuth = (req, res, next) => {
    // Get token from header x-access-token
    const token = req.headers['x-access-token'] || req.headers['authorization'];
    
    // Check if not token
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    
    // Verify token
    jwt.verify(token, jwtSecretKey, (err, decoded) => {
        if (err) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
        }
    
        // Token is valid, save to request for use in other routes
        req.vendor = decoded;
        next();
    });
}
module.exports = userAuth;