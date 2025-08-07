const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = {};

const isValid = (username)=>{ //returns boolean
    let userswithsamename = Object.keys(users).filter((user)=>{
        return user === username
    });
    if(userswithsamename.length > 0){
        return true;
    } else {
        return false;
    }
}

const authenticatedUser = (username,password)=>{ //returns boolean
    let validusers = Object.keys(users).filter((user)=>{
        return (user === username && users[user].password === password)
    });
    if(validusers.length > 0){
        return true;
    } else {
        return false;
    }
}

//only registered users can login
regd_users.post("/login", (req,res) => {
    // Extract username and password from request body
    const username = req.body.username;
    const password = req.body.password;

    // Validate that both username and password are provided
    if (!username && !password) {
        return res.status(400).json({message: "Both username and password are required"});
    } else if (!username) {
        return res.status(400).json({message: "Username is required"});
    } else if (!password) {
        return res.status(400).json({message: "Password is required"});
    }

    // Authenticate the user
    if (authenticatedUser(username, password)) {
        // Generate JWT token with user information
        // Note: In a production environment, avoid storing sensitive data like passwords in the token
        let accessToken = jwt.sign({
            username: username,
            role: "customer"
        }, 'access', { 
            expiresIn: 60 * 60, // Token expires in 1 hour
            issuer: "book-reviews-api"
        });

        // Store authorization data in session
        req.session.authorization = {
            accessToken,
            username
        };

        // Return success response with token
        return res.status(200).json({
            message: "User successfully logged in",
            username: username,
            accessToken: accessToken
        });
    } else {
        // Return error for invalid credentials
        return res.status(401).json({message: "Invalid username or password"});
    }
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    // Extract parameters from request
    const isbn = req.params.isbn;
    const review = req.body.review;
    
    // Get username from the session authorization
    // This is available because the user is authenticated via middleware
    const username = req.session.authorization.username;

    // Using Promise for consistency with other endpoints
    const addOrModifyReview = new Promise((resolve, reject) => {
        // Validate input
        if (!review) {
            reject(new Error("Review content is required"));
            return;
        }

        // Check if book exists
        if (!books[isbn]) {
            reject(new Error(`Book with ISBN ${isbn} not found`));
            return;
        }

        // Initialize reviews object if it doesn't exist
        if (!books[isbn].reviews) {
            books[isbn].reviews = {};
        }

        // Check if this is a modification or a new review
        const isModification = books[isbn].reviews.hasOwnProperty(username);
        
        // Add or update the review
        books[isbn].reviews[username] = review;
        
        // Resolve with success message and status
        resolve({
            message: isModification ? "Review modified successfully" : "Review added successfully",
            isbn: isbn,
            username: username,
            review: review
        });
    });

    // Handle the Promise result
    addOrModifyReview.then((result) => {
        return res.status(200).json(result);
    })
    .catch((error) => {
        // Return appropriate status code based on error type
        if (error.message.includes("not found")) {
            return res.status(404).json({message: error.message});
        } else {
            return res.status(400).json({message: error.message});
        }
    });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    // Extract parameters from request
    const isbn = req.params.isbn;
    
    // Get username from the session authorization
    // This ensures users can only delete their own reviews
    const username = req.session.authorization.username;

    // Using Promise for consistency with other endpoints
    const deleteReview = new Promise((resolve, reject) => {
        // Check if book exists
        if (!books[isbn]) {
            reject(new Error(`Book with ISBN ${isbn} not found`));
            return;
        }

        // Check if reviews object exists
        if (!books[isbn].reviews) {
            reject(new Error(`No reviews found for book with ISBN ${isbn}`));
            return;
        }

        // Check if the user has a review for this book
        if (!books[isbn].reviews[username]) {
            reject(new Error(`You have not reviewed the book with ISBN ${isbn}`));
            return;
        }

        // Store the review before deleting for confirmation
        const reviewToDelete = books[isbn].reviews[username];
        
        // Delete the user's review
        delete books[isbn].reviews[username];
        
        // Resolve with success message and details
        resolve({
            message: "Review deleted successfully",
            isbn: isbn,
            username: username,
            deletedReview: reviewToDelete
        });
    });

    // Handle the Promise result
    deleteReview.then((result) => {
        return res.status(200).json(result);
    })
    .catch((error) => {
        // Return appropriate status code based on error type
        if (error.message.includes("not found") || error.message.includes("have not reviewed")) {
            return res.status(404).json({message: error.message});
        } else {
            return res.status(400).json({message: error.message});
        }
    });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
