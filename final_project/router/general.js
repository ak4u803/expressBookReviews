const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({message: "Username and password are required"});
  }

  if (users[username]) {
    return res.status(400).json({message: "Username already exists"});
  }

  users[username] = {
    "username": username,
    "password": password
  };

  return res.status(200).json({message: "User successfully registered"});
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  // Using Promise callbacks
  const getBooks = new Promise((resolve, reject) => {
    resolve(books);
  });

  getBooks.then((books) => {
    return res.status(200).json(JSON.stringify(books, null, 4));
  })
  .catch((error) => {
    return res.status(500).json({message: "Error getting books", error: error.message});
  });
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  
  // Using Promise callbacks
  const getBookByISBN = new Promise((resolve, reject) => {
    if (books[isbn]) {
      resolve(books[isbn]);
    } else {
      reject(new Error("Book not found"));
    }
  });

  getBookByISBN.then((book) => {
    return res.status(200).json(JSON.stringify(book, null, 4));
  })
  .catch((error) => {
    return res.status(404).json({message: error.message});
  });
});
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  const author = req.params.author;
  
  // Using Promise callbacks
  const getBooksByAuthor = new Promise((resolve, reject) => {
    const booksByAuthor = {};
    
    // Get all book keys and iterate through them
    Object.keys(books).forEach(key => {
      if (books[key].author.toLowerCase() === author.toLowerCase()) {
        booksByAuthor[key] = books[key];
      }
    });

    if (Object.keys(booksByAuthor).length > 0) {
      resolve(booksByAuthor);
    } else {
      reject(new Error("No books found for this author"));
    }
  });

  getBooksByAuthor.then((booksByAuthor) => {
    return res.status(200).json(JSON.stringify(booksByAuthor, null, 4));
  })
  .catch((error) => {
    return res.status(404).json({message: error.message});
  });
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  const title = req.params.title;
  
  // Using Promise callbacks
  const getBooksByTitle = new Promise((resolve, reject) => {
    const booksByTitle = {};
    
    // Get all book keys and iterate through them
    Object.keys(books).forEach(key => {
      if (books[key].title.toLowerCase() === title.toLowerCase()) {
        booksByTitle[key] = books[key];
      }
    });

    if (Object.keys(booksByTitle).length > 0) {
      resolve(booksByTitle);
    } else {
      reject(new Error("No books found with this title"));
    }
  });

  getBooksByTitle.then((booksByTitle) => {
    return res.status(200).json(JSON.stringify(booksByTitle, null, 4));
  })
  .catch((error) => {
    return res.status(404).json({message: error.message});
  });
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  
  if (books[isbn]) {
    return res.status(200).json(JSON.stringify(books[isbn].reviews, null, 4));
  } else {
    return res.status(404).json({message: "Book not found"});
  }
});

module.exports.general = public_users;
