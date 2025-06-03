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
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({message: "Username and password are required"});
    }

    if (authenticatedUser(username,password)) {
        let accessToken = jwt.sign({
            data: password
        }, 'access', { expiresIn: 60 * 60 });

        req.session.authorization = {
            accessToken,username
        }
        return res.status(200).json({message: "User successfully logged in"});
    } else {
        return res.status(401).json({message: "Invalid username or password"});
    }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.body.review;
    const username = req.session.authorization.username;

    if (!review) {
        return res.status(400).json({message: "Review is required"});
    }

    if (!books[isbn]) {
        return res.status(404).json({message: "Book not found"});
    }

    // If the user has already reviewed this book, modify their review
    if (books[isbn].reviews[username]) {
        books[isbn].reviews[username] = review;
        return res.status(200).json({message: "Review modified successfully"});
    }
    
    // If this is a new review from the user
    books[isbn].reviews[username] = review;
    return res.status(200).json({message: "Review added successfully"});
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization.username;

    if (!books[isbn]) {
        return res.status(404).json({message: "Book not found"});
    }

    if (!books[isbn].reviews[username]) {
        return res.status(404).json({message: "Review not found"});
    }

    // Delete the user's review
    delete books[isbn].reviews[username];
    return res.status(200).json({message: "Review deleted successfully"});
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
