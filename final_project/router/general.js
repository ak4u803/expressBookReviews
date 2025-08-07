const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


// Register a new user
public_users.post("/register", (req,res) => {
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

  // Check if username is already taken
  if (users[username]) {
    return res.status(400).json({message: "Username already exists. Please choose a different username."});
  }

  // Validate password strength (optional)
  if (password.length < 6) {
    return res.status(400).json({message: "Password must be at least 6 characters long"});
  }

  // Register the new user
  users[username] = {
    "username": username,
    "password": password
  };

  // Return success message
  return res.status(201).json({
    message: "User successfully registered",
    username: username
  });
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  // Using Promise callbacks
  const getBooks = new Promise((resolve, reject) => {
    if (books) {
      resolve(books);
    } else {
      reject(new Error("Books data not available"));
    }
  });

  getBooks.then((booksData) => {
    // Using res.json() automatically converts the object to JSON
    // No need to use JSON.stringify() with res.json()
    return res.status(200).json(booksData);
  })
  .catch((error) => {
    return res.status(500).json({message: "Error getting books", error: error.message});
  });
});

// Get the book list using async/await with Axios
public_users.get('/books/async', async (req, res) => {
  try {
    // In a real-world scenario, we would make an HTTP request to a books API
    // For this example, we're simulating an API call using axios and setTimeout
    const booksData = await new Promise((resolve) => {
      // Simulate network delay
      setTimeout(() => {
        // Resolve with the books data
        resolve(books);
      }, 100);
    });
    
    // Return the books data
    return res.status(200).json({
      message: "Books retrieved successfully using async/await",
      books: booksData
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return res.status(500).json({
      message: "Error retrieving books",
      error: error.message
    });
  }
});

// Get the book list using Axios to make an actual HTTP request
public_users.get('/books/axios', async (req, res) => {
  try {
    // In a real application, this would be an external API endpoint
    // For this example, we're making a request to our own API
    const response = await axios.get('http://localhost:5000/');
    
    // Process the response data
    const booksData = response.data;
    
    // Return the books data with additional information
    return res.status(200).json({
      message: "Books retrieved successfully using Axios",
      source: "External API",
      timestamp: new Date().toISOString(),
      books: booksData
    });
  } catch (error) {
    console.error('Error fetching books with Axios:', error);
    return res.status(500).json({
      message: "Error retrieving books from external API",
      error: error.message || 'Unknown error'
    });
  }
});

// Get book details based on ISBN using Promise callbacks
public_users.get('/isbn/:isbn',function (req, res) {
  // Retrieve ISBN from request parameters
  const isbn = req.params.isbn;
  
  // Using Promise callbacks
  const getBookByISBN = new Promise((resolve, reject) => {
    // Check if book with the given ISBN exists
    if (books[isbn]) {
      resolve(books[isbn]);
    } else {
      reject(new Error("Book not found for ISBN: " + isbn));
    }
  });

  getBookByISBN.then((book) => {
    // Return the book details as JSON
    return res.status(200).json(book);
  })
  .catch((error) => {
    // Return error if book not found
    return res.status(404).json({message: error.message});
  });
});

// Get book details based on ISBN using async/await
public_users.get('/isbn/async/:isbn', async (req, res) => {
  try {
    // Retrieve ISBN from request parameters
    const isbn = req.params.isbn;
    
    // Using async/await with a Promise
    const book = await new Promise((resolve, reject) => {
      if (books[isbn]) {
        resolve(books[isbn]);
      } else {
        reject(new Error(`Book not found for ISBN: ${isbn}`));
      }
    });
    
    // Return the book details with additional metadata
    return res.status(200).json({
      message: "Book retrieved successfully using async/await",
      isbn: isbn,
      book: book
    });
  } catch (error) {
    console.error(`Error fetching book with ISBN ${req.params.isbn}:`, error);
    return res.status(404).json({
      message: error.message,
      isbn: req.params.isbn
    });
  }
});

// Get book details based on ISBN using Axios
public_users.get('/isbn/axios/:isbn', async (req, res) => {
  try {
    // Retrieve ISBN from request parameters
    const isbn = req.params.isbn;
    
    // In a real application, this would be an external API endpoint
    // For this example, we're making a request to our own API
    const response = await axios.get(`http://localhost:5000/isbn/${isbn}`);
    
    // Process the response data
    const bookData = response.data;
    
    // Return the book details with additional information
    return res.status(200).json({
      message: "Book retrieved successfully using Axios",
      source: "External API",
      timestamp: new Date().toISOString(),
      isbn: isbn,
      book: bookData
    });
  } catch (error) {
    console.error(`Error fetching book with ISBN ${req.params.isbn} using Axios:`, error);
    
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return res.status(error.response.status).json({
        message: "Error retrieving book from external API",
        error: error.response.data.message || 'Book not found',
        isbn: req.params.isbn
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      return res.status(500).json({
        message: "Error connecting to external API",
        error: error.message,
        isbn: req.params.isbn
      });
    }
  }
});
  
// Get book details based on author using Promise callbacks
public_users.get('/author/:author',function (req, res) {
  // Retrieve author from request parameters
  const author = req.params.author;
  
  // Using Promise callbacks
  const getBooksByAuthor = new Promise((resolve, reject) => {
    const booksByAuthor = {};
    
    // Get all book keys and iterate through them
    Object.keys(books).forEach(key => {
      // Case-insensitive comparison of author names
      if (books[key].author.toLowerCase() === author.toLowerCase()) {
        // Add matching book to the result object with its ISBN as the key
        booksByAuthor[key] = books[key];
      }
    });

    // Check if any books were found for the author
    if (Object.keys(booksByAuthor).length > 0) {
      resolve(booksByAuthor);
    } else {
      reject(new Error("No books found for author: " + author));
    }
  });

  getBooksByAuthor.then((booksByAuthor) => {
    // Return the books as JSON
    return res.status(200).json(booksByAuthor);
  })
  .catch((error) => {
    // Return error if no books found
    return res.status(404).json({message: error.message});
  });
});

// Get book details based on author using async/await
public_users.get('/author/async/:author', async (req, res) => {
  try {
    // Retrieve author from request parameters
    const author = req.params.author;
    
    // Using async/await with a Promise
    const booksByAuthor = await new Promise((resolve, reject) => {
      const result = {};
      
      // Get all book keys and iterate through them
      Object.keys(books).forEach(key => {
        // Case-insensitive comparison of author names
        if (books[key].author.toLowerCase() === author.toLowerCase()) {
          // Add matching book to the result object with its ISBN as the key
          result[key] = books[key];
        }
      });

      // Check if any books were found for the author
      if (Object.keys(result).length > 0) {
        resolve(result);
      } else {
        reject(new Error(`No books found for author: ${author}`));
      }
    });
    
    // Return the books with additional metadata
    return res.status(200).json({
      message: "Books retrieved successfully using async/await",
      author: author,
      count: Object.keys(booksByAuthor).length,
      books: booksByAuthor
    });
  } catch (error) {
    console.error(`Error fetching books for author ${req.params.author}:`, error);
    return res.status(404).json({
      message: error.message,
      author: req.params.author
    });
  }
});

// Get book details based on author using Axios
public_users.get('/author/axios/:author', async (req, res) => {
  try {
    // Retrieve author from request parameters
    const author = req.params.author;
    
    // In a real application, this would be an external API endpoint
    // For this example, we're making a request to our own API
    const response = await axios.get(`http://localhost:5000/author/${encodeURIComponent(author)}`);
    
    // Process the response data
    const booksData = response.data;
    
    // Return the books with additional information
    return res.status(200).json({
      message: "Books retrieved successfully using Axios",
      source: "External API",
      timestamp: new Date().toISOString(),
      author: author,
      count: Object.keys(booksData).length,
      books: booksData
    });
  } catch (error) {
    console.error(`Error fetching books for author ${req.params.author} using Axios:`, error);
    
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return res.status(error.response.status).json({
        message: "Error retrieving books from external API",
        error: error.response.data.message || 'Books not found',
        author: req.params.author
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      return res.status(500).json({
        message: "Error connecting to external API",
        error: error.message,
        author: req.params.author
      });
    }
  }
});

// Get all books based on title using Promise callbacks
public_users.get('/title/:title',function (req, res) {
  // Retrieve title from request parameters
  const title = req.params.title;
  
  // Using Promise callbacks
  const getBooksByTitle = new Promise((resolve, reject) => {
    const booksByTitle = {};
    
    // Get all book keys and iterate through them
    Object.keys(books).forEach(key => {
      // Case-insensitive comparison of book titles
      if (books[key].title.toLowerCase() === title.toLowerCase()) {
        // Add matching book to the result object with its ISBN as the key
        booksByTitle[key] = books[key];
      }
    });

    // Check if any books were found with the title
    if (Object.keys(booksByTitle).length > 0) {
      resolve(booksByTitle);
    } else {
      reject(new Error("No books found with title: " + title));
    }
  });

  getBooksByTitle.then((booksByTitle) => {
    // Return the books as JSON
    return res.status(200).json(booksByTitle);
  })
  .catch((error) => {
    // Return error if no books found
    return res.status(404).json({message: error.message});
  });
});

// Get all books based on title using async/await
public_users.get('/title/async/:title', async (req, res) => {
  try {
    // Retrieve title from request parameters
    const title = req.params.title;
    
    // Using async/await with a Promise
    const booksByTitle = await new Promise((resolve, reject) => {
      const result = {};
      
      // Get all book keys and iterate through them
      Object.keys(books).forEach(key => {
        // Case-insensitive comparison of book titles
        if (books[key].title.toLowerCase() === title.toLowerCase()) {
          // Add matching book to the result object with its ISBN as the key
          result[key] = books[key];
        }
      });

      // Check if any books were found with the title
      if (Object.keys(result).length > 0) {
        resolve(result);
      } else {
        reject(new Error(`No books found with title: ${title}`));
      }
    });
    
    // Return the books with additional metadata
    return res.status(200).json({
      message: "Books retrieved successfully using async/await",
      title: title,
      count: Object.keys(booksByTitle).length,
      books: booksByTitle
    });
  } catch (error) {
    console.error(`Error fetching books with title ${req.params.title}:`, error);
    return res.status(404).json({
      message: error.message,
      title: req.params.title
    });
  }
});

// Get all books based on title using Axios
public_users.get('/title/axios/:title', async (req, res) => {
  try {
    // Retrieve title from request parameters
    const title = req.params.title;
    
    // In a real application, this would be an external API endpoint
    // For this example, we're making a request to our own API
    const response = await axios.get(`http://localhost:5000/title/${encodeURIComponent(title)}`);
    
    // Process the response data
    const booksData = response.data;
    
    // Return the books with additional information
    return res.status(200).json({
      message: "Books retrieved successfully using Axios",
      source: "External API",
      timestamp: new Date().toISOString(),
      title: title,
      count: Object.keys(booksData).length,
      books: booksData
    });
  } catch (error) {
    console.error(`Error fetching books with title ${req.params.title} using Axios:`, error);
    
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return res.status(error.response.status).json({
        message: "Error retrieving books from external API",
        error: error.response.data.message || 'Books not found',
        title: req.params.title
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      return res.status(500).json({
        message: "Error connecting to external API",
        error: error.message,
        title: req.params.title
      });
    }
  }
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  // Retrieve ISBN from request parameters
  const isbn = req.params.isbn;
  
  // Using Promise callbacks for consistency with other endpoints
  const getBookReviews = new Promise((resolve, reject) => {
    // Check if book with the given ISBN exists
    if (books[isbn]) {
      resolve(books[isbn].reviews);
    } else {
      reject(new Error("Book not found for ISBN: " + isbn));
    }
  });

  getBookReviews.then((reviews) => {
    // Return the reviews as JSON
    return res.status(200).json(reviews);
  })
  .catch((error) => {
    // Return error if book not found
    return res.status(404).json({message: error.message});
  });
});

module.exports.general = public_users;
