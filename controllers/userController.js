const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
  sendMail,
  generateOTP,
  generateRandomCode,
} = require("./emailController");
const {
  createUser,
  findUserByEmail,
  findUserById,
  findUserAndAddOTPCode,
  findUserAndVerifyOTPCode,
  updateUserProfile,
  DeleteUser,
} = require("../helpers/userHelper"); // Import userHelper

const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Variation = require("../models/Variation");
const ShippingAddress = require("../models/ShippingAddress");
const BillingDetails = require("../models/BIllingDetails");
const WatchList = require("../models/WatchList");
const jwtSecretKey = process.env.JWT_SECRET_KEY;

// Register a new user
const registerUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check if the user already exists in the database
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create a new user and save to the database using the helper function
    const newUser = await createUser(name, email, password, "user");

    // Create and return a JWT token for the registered user
    const token = jwt.sign({ userId: newUser._id }, jwtSecretKey, {
      expiresIn: "5d", // 5 days
    });

    res.status(201).json({ token });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Login a user
const loginUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find the user by email using the helper function
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare the provided password with the hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create and return a JWT token for the logged-in user
    const token = jwt.sign({ userId: user._id }, jwtSecretKey, {
      expiresIn: "5d", // 5 days
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//send otp
const sendOtp = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object

    const code = generateRandomCode(6); // Generate a 6-digit OTP
    const result = await findUserAndAddOTPCode(userId, code); // Add the OTP to the user's document in the database

    if (!result.user) {
      return res
        .status(400)
        .json({ message: "User not found or user is already verified" });
    }

    const emailResult = await sendMail(
      result.user.email,
      "OTP Verification",
      `Verify Your Account`,
      `
          <div class="container">
            <div class="card">
              <h3>Verify Your Account</h3>
              <br>
              <a href="${process.env.DOMAIN}/api/user/verify-otp?code=${code}&uid=${req.user.userId}">
                <button>Verify</button>
              </a>
            </div>
          </div>`
    );

    if (emailResult instanceof Error) {
      // Check if sending email resulted in an error
      console.error("Error sending email:", emailResult);
      res
        .status(500)
        .json({ error: "An error occurred while sending the email" });
    } else {
      res
        .status(200)
        .json({ message: "OTP generated and sent for verification" });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { code, uid } = req.query; // Get the OTP code and userId from the query parameters
    if (!code || !uid) {
      return res.status(400).json({ message: "OTP and userId are required" });
    }

    const result = await findUserAndVerifyOTPCode(uid, code);

    if (result.user) {
      // User was found and OTP was successfully verified
      res.redirect(`${process.env.DOMAIN}/profile`);
    } else if (result.message === "User is already verified") {
      // User is already verified
      res.redirect(`${process.env.DOMAIN}/profile`);
    } else {
      // Invalid OTP
      res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get the user's profile (protected route)
const userProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object

    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove the password field from the user object
    delete user._doc.password;
    // Return the user's profile data without the password
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId; // Get the userId from the request object
    const { name } = req.body;
    const data = { name };
    const result = await updateUserProfile(userId, data);
    if (!result.user) {
      return res.status(400).json({ message: result.message });
    }
    res.status(200).json({ message: result.message });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updatePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } // Check for validation errors
    const userId = req.user.userId; // Get the userId from the request object

    const { oldPassword, newPassword } = req.body;

    const user = await findUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare the provided password with the hashed password
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const code = generateRandomCode(6);
    user.passwordResetToken = code;
    await user.save();
    const emailResult = await sendMail(
      user.email,
      "Reset Password",
      `Reset Your Password`,
      `
          <div class="container">
            <div class="card">
              <h3>Reset Your Password</h3>
              <br>
              <a href="${process.env.DOMAIN}/reset-password?code=${code}&uid=${user._id}">
                <button>Reset</button>
              </a>
            </div>
          </div>`
    );
    if (emailResult instanceof Error) {
      // Check if sending email resulted in an error
      console.error("Error sending email:", emailResult);
      res
        .status(500)
        .json({ error: "An error occurred while sending the email" });
    } else {
      res.status(200).json({ message: "OTP generated and sent" });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } // Check for validation errors
    const { code, uid, newPassword } = req.body;
    if (!code || !uid) {
      return res.status(400).json({ message: "OTP and userId are required" });
    }
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    const user = await findUserById(uid);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.passwordResetToken !== code) {
      return res.status(400).json({ message: "Invalid code" });
    }
    if (user.passwordResetToken === code) {
      user.passwordResetToken = null;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object

    await DeleteUser(userId); // Call the helper function

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const registerSuperAdmin = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } // Check for validation errors
    const { name, email, password } = req.body;
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const newUser = await createAdmin(name, email, password, "admin");
    const token = jwt.sign({ userId: newUser._id }, jwtSecretKey, {
      expiresIn: "5d", // 5 days
    });
    res.status(201).json({ token });
  } catch (error) {
    console.error("Error registering superadmin:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const loginSuperAdmin = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } // Check for validation errors
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (user.userType !== "admin") {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user._id }, jwtSecretKey, {
      expiresIn: "5d", // 5 days
    });
    res.status(200).json({ token });
  } catch (error) {
    console.error("Error logging in superadmin:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object
    const { productId, variationId, count, price, thumbnail, size, color } =
      req.body;

    // Check if any of the required values are missing
    if (!productId || !variationId || !count || !price) {
      return res
        .status(400)
        .json({ message: "Invalid request. Missing required fields." });
    }

    // Check if the user exists
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the user's cart or create a new one if it doesn't exist
    let cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      cart = new Cart({
        userId: userId,
        products: [],
      });
    }

    // Check if the product already exists in the cart, and update it or add a new entry
    const existingProductIndex = cart.products.findIndex((product) => {
      return (
        product.productId === productId && product.variationId === variationId
      );
    });

    if (existingProductIndex !== -1) {
      // Product already exists in the cart, update the quantity and price
      cart.products[existingProductIndex].count += count;
      cart.products[existingProductIndex].price = price;
    } else {
      // Product doesn't exist in the cart, add a new entry
      cart.products.push({
        productId: productId,
        variationId: variationId,
        count: count,
        price: price,
        thumbnail: thumbnail || "",
        size: size || "",
        color: color || "",
      });
    }

    // Save the cart
    await cart.save();

    res.status(200).json({ message: "Product added to cart successfully" });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object
    const { variationId } = req.body; // Get the variationId from the request body

    // Check if the user exists
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the user's cart
    const cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found for the user" });
    }

    // Find the index of the product with matching variationId in the cart
    const productIndex = cart.products.findIndex((product) => {
      return product.variationId === variationId;
    });

    if (productIndex !== -1) {
      // Remove the product from the cart
      cart.products.splice(productIndex, 1);

      // Save the updated cart
      await cart.save();

      return res
        .status(200)
        .json({ message: "Product removed from cart successfully" });
    } else {
      return res.status(404).json({
        message: "Product with the specified variationId not found in the cart",
      });
    }
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getCart = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object
    const cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found for the user" });
    }

    // Fetch full product and variation details for each item in the cart
    const newCart = await Promise.all(
      cart.products.map(async (product) => {
        const productData = await Product.findOne({ _id: product.productId });
        const variationData = await Variation.findOne({
          _id: product.variationId,
        });

        // Construct a new object with complete product and variation details
        return {
          product: productData.toObject(), // Full product details
          variation: variationData.toObject(), // Full variation details
          count: product.count, // Include other cart item properties like count
        };
      })
    );

    res.status(200).json(newCart);
  } catch (error) {
    console.error("Error getting cart:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { variationId, count, price, thumbnail, size, color } = req.body;

    // Check if the user's cart exists
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found for the user" });
    }

    // Find the item in the cart based on the variationId
    const itemToUpdate = cart.products.find(
      (product) => product.variationId === variationId
    );

    if (!itemToUpdate) {
      return res.status(404).json({ message: "Item not found in the cart" });
    }

    // Update the count and price of the item if provided, otherwise keep the previous values
    if (count !== undefined) {
      itemToUpdate.count = count;
    }

    if (price !== undefined) {
      itemToUpdate.price = price;
    }
    if (thumbnail !== undefined) {
      itemToUpdate.thumbnail = thumbnail;
    }
    if (color !== undefined) {
      itemToUpdate.color = color;
    }
    if (size !== undefined) {
      itemToUpdate.size = size;
    }

    // Save the updated cart
    await cart.save();

    res.status(200).json({ message: "Cart updated successfully" });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const emptyCart = async (req, res) => {
  try {
    // Check if the user's cart exists
    const cart = await Cart.findOne({ userId: req.user.userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found for the user" });
    }

    // Clear all items from the cart
    cart.products = [];

    // Save the updated cart
    await cart.save();

    res.status(200).json({ message: "Cart emptied successfully" });
  } catch (error) {
    console.error("Error emptying cart:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const addShippingAddress = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object
    const {
      first_name,
      last_name,
      street_address,
      city,
      state,
      postal_code,
      country,
      phone,
      company_name,
      apartment,
      delivery_instruction,
    } = req.body;

    // Check if the user exists
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create a new shipping address document
    const shippingAddress = new ShippingAddress({
      first_name,
      last_name,
      street_address,
      city,
      state,
      postal_code,
      country,
      phone,
      company_name,
      apartment,
      delivery_instruction,
      user_id: userId,
    });

    // Save the shipping address to the database
    await shippingAddress.save();

    res.status(200).json({ message: "Shipping address added successfully" });
  } catch (error) {
    console.error("Error adding shipping address:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const updateShippingAddress = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object
    const {
      first_name,
      last_name,
      street_address,
      city,
      state,
      postal_code,
      country,
      phone,
      company_name,
      apartment,
      delivery_instruction,
      // Add more fields here as needed
    } = req.body;

    // Check if the user exists
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the user's existing shipping address
    let shippingAddress = await ShippingAddress.findOne({ user_id: userId });

    // If the shipping address doesn't exist, create a new one
    if (!shippingAddress) {
      shippingAddress = new ShippingAddress({
        first_name,
        last_name,
        street_address,
        city,
        state,
        postal_code,
        country,
        phone,
        company_name,
        apartment,
        delivery_instruction,
        user_id: userId,
      });
    } else {
      // Update specific fields if they exist in the request body
      if (first_name) {
        shippingAddress.first_name = first_name;
      }
      if (last_name) {
        shippingAddress.last_name = last_name;
      }
      if (street_address) {
        shippingAddress.street_address = street_address;
      }
      if (city) {
        shippingAddress.city = city;
      }
      if (state) {
        shippingAddress.state = state;
      }
      if (postal_code) {
        shippingAddress.postal_code = postal_code;
      }
      if (country) {
        shippingAddress.country = country;
      }
      if (phone) {
        shippingAddress.phone = phone;
      }
      if (company_name) {
        shippingAddress.company_name = company_name;
      }
      if (apartment) {
        shippingAddress.apartment = apartment;
      }
      if (delivery_instruction) {
        shippingAddress.delivery_instruction = delivery_instruction;
      }
      // Add more fields as needed

      // Save the updated shipping address
      await shippingAddress.save();
    }

    res.status(200).json({ message: "Shipping address updated successfully" });
  } catch (error) {
    console.error("Error updating shipping address:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const getShippingAddress = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object

    // Find the user's shipping address
    const shippingAddress = await ShippingAddress.find({ user_id: userId }); // change to findOne if only one shipping address

    if (!shippingAddress) {
      return res.status(404).json({ message: "Shipping address not found" });
    }

    res.status(200).json(shippingAddress);
  } catch (error) {
    console.error("Error getting shipping address:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const deleteShippingAddress = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object
    const { id } = req.params;

    // Find and delete the user's shipping address
    const deletedShippingAddress = await ShippingAddress.findOneAndDelete({
      user_id: userId,
      _id: id,
    });

    if (!deletedShippingAddress) {
      return res.status(404).json({ message: "Shipping address not found" });
    }

    res.status(200).json({ message: "Shipping address deleted successfully" });
  } catch (error) {
    console.error("Error deleting shipping address:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
// Import necessary modules and your BillingDetails model

// Controller for adding a billing address
const addBillingAddress = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object
    const {
      first_name,
      last_name,
      street_address,
      city,
      state,
      postal_code,
      country,
      phone,
      company_name,
      apartment,
    } = req.body;

    // Create a new billing address document
    const billingAddress = new BillingDetails({
      first_name,
      last_name,
      street_address,
      city,
      state,
      postal_code,
      country,
      phone,
      company_name,
      apartment,
      user_id: userId,
    });

    // Save the billing address to the database
    await billingAddress.save();

    res.status(200).json({ message: "Billing address added successfully" });
  } catch (error) {
    console.error("Error adding billing address:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Controller for updating a billing address
const updateBillingAddress = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object
    const {
      first_name,
      last_name,
      street_address,
      city,
      state,
      postal_code,
      country,
      phone,
      company_name,
      apartment,
    } = req.body;

    // Find and update the user's billing address
    await BillingDetails.updateOne(
      { user_id: userId },
      {
        $set: {
          first_name,
          last_name,
          street_address,
          city,
          state,
          postal_code,
          country,
          phone,
          company_name,
          apartment,
        },
      }
    );

    res.status(200).json({ message: "Billing address updated successfully" });
  } catch (error) {
    console.error("Error updating billing address:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Controller for getting a billing address
const getBillingAddress = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object

    // Find the user's billing address
    const billingAddress = await BillingDetails.findOne({ user_id: userId });

    if (!billingAddress) {
      return res.status(404).json({ message: "Billing address not found" });
    }

    res.status(200).json(billingAddress);
  } catch (error) {
    console.error("Error getting billing address:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Controller for deleting a billing address
const deleteBillingAddress = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object

    // Find and delete the user's billing address
    const deletedBillingAddress = await BillingDetails.findOneAndDelete({
      user_id: userId,
    });

    if (!deletedBillingAddress) {
      return res.status(404).json({ message: "Billing address not found" });
    }

    res.status(200).json({ message: "Billing address deleted successfully" });
  } catch (error) {
    console.error("Error deleting billing address:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const addToWatchlist = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object
    const { productId, variationId, price, thumbnail } = req.body;

    // Check if a watchlist already exists for the user
    let watchlist = await WatchList.findOne({ userId: userId });

    if (!watchlist) {
      // If no watchlist exists, create a new one
      watchlist = new WatchList({
        userId: userId,
        products: [],
      });
    }

    // Create a product object to add to the watchlist
    const product = {
      productId,
      variationId,
      userId,
      price,
      thumbnail: thumbnail || "",
    };

    // Check if the product already exists in the watchlist
    const existingProductIndex = watchlist.products.findIndex(
      (p) => p.productId === productId && p.variationId === variationId
    );

    if (existingProductIndex === -1) {
      // If the product does not exist, add it to the watchlist
      watchlist.products.push(product);
    } else {
      // If the product already exists, update its information
      watchlist.products[existingProductIndex] = product;
    }

    // Save the watchlist to the database
    await watchlist.save();

    res.status(200).json({ message: "Watchlist updated/added successfully" });
  } catch (error) {
    console.error("Error updating/adding to watchlist:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const deleteFromWatchlist = async (req, res) => {
  try {
    const userId = req.user.userId; // Get the userId from the request object
    const { productId, variationId } = req.body;

    // Find the user's watchlist
    const watchlist = await WatchList.findOne({ userId: userId });

    if (!watchlist) {
      return res.status(404).json({ message: "Watchlist not found" });
    }

    // Find the index of the product in the watchlist's products array
    const productIndex = watchlist.products.findIndex(
      (p) => p.productId === productId && p.variationId === variationId
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in watchlist" });
    }

    // Remove the product from the watchlist
    watchlist.products.splice(productIndex, 1);

    // Save the updated watchlist
    await watchlist.save();

    res.status(200).json({ message: "Product removed from watchlist" });
  } catch (error) {
    console.error("Error deleting from watchlist:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


module.exports = {
  registerUser,
  loginUser,
  userProfile,
  sendOtp,
  verifyOtp,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
  deleteAccount,
  registerSuperAdmin,
  loginSuperAdmin,
  addToCart,
  removeCartItem,
  getCart,
  updateCartItem,
  emptyCart,
  addShippingAddress,
  updateShippingAddress,
  getShippingAddress,
  deleteShippingAddress,
  addBillingAddress,
  updateBillingAddress,
  getBillingAddress,
  deleteBillingAddress,
  addToWatchlist,
  deleteFromWatchlist
};
