const express = require("express");
const app = express();
const mysql = require("mysql2");
const session = require('express-session');
const nodemailer = require('nodemailer');
const port = 3000;
const path = require("path");
const multer = require("multer");

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Folder to store uploaded images
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname); // Rename file with timestamp
    },
});

const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "delta",
    password: "rgukt123",
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL server.');
});

// Home route
app.get("/", (req, res) => {
    res.render("home.ejs");
});

// Admin home route
app.get("/admin-home", (req, res) => {
    const message = req.session.message || null; // Retrieve the message from the session
    req.session.message = null; // Clear the message after using it
    res.render("adminHome.ejs", { message });
});

// Admin login route
app.get("/admin", (req, res) => {
    res.render("adminLogin.ejs");
});
// Admin login POST request
app.post("/adminLogin", (req, res) => {
    const { username, password } = req.body;

    // Query to check admin credentials
    const query = "SELECT * FROM adminTable WHERE username = ? AND password = ?";
    connection.query(query, [username, password], (err, results) => {
        if (err) {
            console.error("Error during database query:", err);
            return res.send("Error occurred, please try again later.");
        }

        if (results.length > 0) {
            // Set session variables
            req.session.adminLoggedIn = true;
            req.session.adminUsername = username;

            // Add a success message in the session
            req.session.message = "Login successful! Welcome, " + username + ".";

            // Redirect to admin home
            res.redirect("/admin-home");
        } else {
            // Invalid credentials
            res.send(`<script>alert('Invalid Username and Password'); window.location.href='/admin';</script>`);
        }
    });
});

// Admin log out route
app.get("/logout", (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error("Error during session destruction:", err);
            return res.send("Error occurred while logging out. Please try again.");
        }

        // Redirect to the login page or home page after logout
        res.redirect("/");
    });
});

// User login route
app.get("/user", (req, res) => {
    res.render("userLogin.ejs");
});
// Login Form Submission
app.post('/userLogin', (req, res) => {
    const { username, password } = req.body;

    // Validate user credentials
    const loginQuery = 'SELECT * FROM userMajor WHERE username = ? AND password = ?';
    connection.query(loginQuery, [username, password], (err, results) => {
        if (err) {
            console.error('Error validating user:', err);
            return res.status(500).send('Database error');
        }

        if (results.length === 0) {
            // Invalid username or password
            res.send(`(<script>alert('Invalid Username and Password'); window.location.href='/user';</script>`);
        } else {
            // Login successful, set session and redirect to userHome
            req.session.userLoggedIn = true;
            req.session.user = results[0]; // Store the user object in session
            res.redirect("/userHome"); // Use res.redirect() for proper redirection
        }
    });
});

// Registration form route
app.get("/register", (req, res) => {
    res.render("registration.ejs");
});

// Registration Form Submission
app.post('/register', (req, res) => {
    const { name, email, mobile, address, username, password } = req.body;

    // Check if the username already exists
    const checkUserQuery = 'SELECT * FROM userMajor WHERE username = ?';
    connection.query(checkUserQuery, [username], (err, results) => {
        if (err) {
            console.error('Error checking user existence:', err);
            return res.status(500).send('Database error');
        }

        if (results.length > 0) {
            return res.send('Username already exists. Please choose another username.');
        }

        // Insert new user into the database
        const insertQuery = 'INSERT INTO userMajor (name, email, mobile, address, username, password) VALUES (?, ?, ?, ?, ?, ?)';
        connection.query(insertQuery, [name, email, mobile, address, username, password], (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).send('Database error');
            }
            // Show success message and redirect to login page
            res.send(`<script>alert('Registration successful! Please login now.'); window.location.href='/user';</script>`);
        });
    });
});

// User home route
app.get("/userHome", (req, res) => {
    if (req.session.userLoggedIn) {
        const user = req.session.user; // Access logged-in user data
        res.render("userHome.ejs", { username: user.username });
    } else {
        res.redirect("/user");
    }
});

// Post content route
app.get("/post-content", (req, res) => {
    res.render("postContent.ejs");
});

// Submit content form
app.post("/submit-content", upload.single("image"), (req, res) => {
    const { title, content } = req.body;
    const imagePath = req.file ? `uploads/${req.file.filename}` : null;

    if (!imagePath) {
        return res.status(400).send("Image upload failed.");
    }

    const query = "INSERT INTO posts (title, content, image_path) VALUES (?, ?, ?)";
    connection.query(query, [title, content, imagePath], (err, result) => {
        if (err) {
            console.error("Error saving post:", err);
            return res.status(500).send("Failed to save the post.");
        }
        res.send(`<script>alert('Post submitted successfully!'); window.location.href='/post-content';</script>`);
    });
});

// Route to display all posts
app.get('/view-all-posts', (req, res) => {
    connection.query('SELECT * FROM posts ORDER BY created_at DESC', (err, posts) => {
        if (err) {
            console.error('Error fetching posts:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('viewPosts.ejs', { posts });
    });
});

// Add comment route
app.post('/add-comment', async (req, res) => {
    const { postId, commentText } = req.body;

    if (!postId || !commentText) {
        return res.status(400).send("Post ID and comment text are required.");
    }

    try {
        // Insert the comment into the database
        await connection.promise().query("INSERT INTO comments (postId, username, text, createdAt) VALUES (?, ?, ?, ?)", [postId, req.session.user.username, commentText, new Date()]);
        res.redirect(`/view-post/${postId}`); // Redirect back to the post's view page
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).send("Error adding comment");
    }
});
app.get("/view-post/:id", async (req, res) => {
    try {
        const postId = req.params.id;

        // Fetch the post details
        const [post] = await connection.query('SELECT * FROM posts WHERE id = ?', [postId]);
        if (post.length === 0) {
            return res.status(404).send("Post not found");
        }

        // Fetch comments for the post
        const comments = await connection.query('SELECT * FROM comments WHERE postId = ? ORDER BY createdAt DESC', [postId]);

        // Render the post details page
        res.render("viewPosts.ejs", { post: post[0], comments });
    } catch (error) {
        console.error("Error fetching post:", error);
        res.status(500).send("Error retrieving post");
    }
});

// Add category page route
app.get("/add-category", (req, res) => {
    if (!req.session.adminLoggedIn) {
        return res.redirect("/admin");
    }
    // Pass the message variable (empty or with a value) to the template
    res.render("addCategory", { message: req.session.message || "" });
});

// Handle category creation
app.post("/add-category", (req, res) => {
    const { categoryName } = req.body;

    // Check if the category already exists
    const checkCategoryQuery = "SELECT * FROM categories WHERE name = ?";
    connection.query(checkCategoryQuery, [categoryName], (err, results) => {
        if (err) {
            console.error("Error checking category existence:", err);
            return res.status(500).send("Error occurred. Please try again.");
        }

        if (results.length > 0) {
            return res.send(
                `<script>alert('Category already exists. Please choose another name.'); window.location.href='/add-category';</script>`
            );
        }

        // Insert the new category
        const insertCategoryQuery = "INSERT INTO categories (name) VALUES (?)";
        connection.query(insertCategoryQuery, [categoryName], (err, result) => {
            if (err) {
                console.error("Error adding category:", err);
                return res.status(500).send("Error occurred while adding category.");
            }

            res.send(
                `<script>alert('Category added successfully!'); window.location.href='/add-category';</script>`
            );
        });
    });
});


// Add words to a category page route
app.get("/add-words", async (req, res) => {
    if (!req.session.adminLoggedIn) {
        return res.redirect("/admin");
    }

    try {
        const query = "SELECT * FROM categories";
        const [categories] = await connection.promise().query(query); // Awaiting the query result

        res.render("addWords.ejs", { categories });
    } catch (err) {
        console.error("Error fetching categories:", err);
        return res.status(500).send("Database error");
    }
});

app.post("/add-words", async (req, res) => {
    if (!req.session.adminLoggedIn) {
        return res.redirect("/admin");
    }

    const { category, word } = req.body;

    if (!category || !word) {
        return res.send("Please select a category and provide a word.");
    }

    try {
        // Validate category_id exists in the categories table
        const [categoryCheck] = await connection.promise().query("SELECT id FROM categories WHERE id = ?", [category]);
        if (categoryCheck.length === 0) {
            return res.send("Invalid category ID.");
        }

        // Insert the word into the words table
        const query = "INSERT INTO words (category_id, word) VALUES (?, ?)";
        await connection.promise().query(query, [category, word]);

        res.redirect("/add-words"); // Redirect to the add words page with a success message
    } catch (err) {
        console.error("Error inserting word:", err);
        return res.status(500).send("Database error");
    }
});

// Fetch posts containing harmful words or categories
app.get('/cyberharasser', (req, res) => {
    if (!req.session.adminLoggedIn) {
        return res.redirect('/admin'); // Redirect to admin login if not logged in
    }

    // Query to find posts with harmful content
    const query = `
        SELECT p.id AS post_id, p.title, p.content, w.word, c.name AS category
        FROM posts p
        LEFT JOIN words w ON p.content LIKE CONCAT('%', w.word, '%')
        LEFT JOIN categories c ON p.content LIKE CONCAT('%', c.name, '%')
        WHERE w.word IS NOT NULL OR c.name IS NOT NULL
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching posts with harmful content:', err);
            return res.status(500).send('Internal Server Error');
        }

        // Group posts based on harmful words or categories
        const harmfulPosts = {};
        results.forEach(({ post_id, title, content, word, category }) => {
            if (!harmfulPosts[post_id]) {
                harmfulPosts[post_id] = { title, content, matches: [] };
            }
            if (word) harmfulPosts[post_id].matches.push(`Word: ${word}`);
            if (category) harmfulPosts[post_id].matches.push(`Category: ${category}`);
        });

        res.render('cyberharasser.ejs', { harmfulPosts });
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
