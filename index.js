const express=require("express");
const app=express();
const mysql=require("mysql2");
const session = require('express-session');
const port=8080;
const path=require("path");


app.use(express.urlencoded({extended:true}));
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname,"public")));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));



let systems=[
    {
        sysno:"100",
        sysstatus:"Allotted"
    },
    {
        sysno:"101",
        sysstatus:"Allotted"
    },
    {
        sysno:"102",
        sysstatus:"Not alotted"
    }
]


const connection=mysql.createConnection({
    host:"localhost",
    user:"root",
    database:"delta",
    password:"rgukt123",
  });

  connection.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL server.');
});
/*
  let q="select count(*) from students";
  try{
    connection.query(q,(err,result)=>{
      if(err) throw err;
      //let count=result[0]["count(*)"];
        console.log(result[0]["count(*)"]);
      //  res.send(result[0]["count(*)"]);
      //res.render("home.ejs",{count});
    });
    }catch(err){
      console.log(err);
    }*/
app.get("/home",(req,res)=>{
    res.render("home.ejs");
});

app.get("/contact",(req,res)=>{
    res.render("contactus.ejs");
})

app.get("/about",(req,res)=>{
    res.render("aboutus.ejs");
})


// Student dashboard route
app.get("/dashboard", (req, res) => {
    const email = req.session.email;
    if (!email) {
        return res.redirect('/login');
    }

    const query = "SELECT * FROM notes_student WHERE student_email = ?";

    connection.query(query, [email], (err, results) => {
        if (err) {
            console.error('Error fetching notes:', err);
            res.status(500).send("An error occurred.");
            return;
        }

        res.render('dashboard', { email: email, notes: results });
    });
});

/*
app.get("/dashboard", (req, res) => {
   
    const email = req.session.email;
    const query = "SELECT * FROM notes_student WHERE student_email = ?";

    connection.query(query, [email], (err, results) => {
        if (err) {
            console.error('Error fetching notes:', err);
            res.status(500).send("An error occurred.");
            return;
        }

        res.render('dashboard', { email: email, notes: results });
    });
});*/


/*app.get("/dlview",(req,res)=>{
    res.render("dlview.ejs",{systems});
});*/
/*
app.get("/dlview", (req, res) => {
    const query = "SELECT * FROM systems";
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data from the database:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render("dlview.ejs", { systems: results });
    });
});*/
app.get("/dlview", (req, res) => {
    const queryCounts = `
        SELECT
            SUM(CASE WHEN sysstatus = 'free' THEN 1 ELSE 0 END) AS freeCount,
            SUM(CASE WHEN sysstatus = 'allotted' THEN 1 ELSE 0 END) AS allottedCount,
            SUM(CASE WHEN sysstatus = 'emergency' THEN 1 ELSE 0 END) AS emergencyCount
        FROM systems`;

    const querySystems = "SELECT * FROM systems";

    connection.query(queryCounts, (err, countResults) => {
        if (err) {
            console.error('Error querying counts:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        connection.query(querySystems, (err, systemsResults) => {
            if (err) {
                console.error('Error querying systems:', err);
                res.status(500).send('Internal Server Error');
                return;
            }

            const { freeCount, allottedCount, emergencyCount } = countResults[0];
            res.render("dlview.ejs", {
                systems: systemsResults,
                freeCount,
                allottedCount,
                emergencyCount
            });
        });
    });
});


app.get("/admindlview", (req, res) => {
    const queryCounts = `
        SELECT
            SUM(CASE WHEN sysstatus = 'free' THEN 1 ELSE 0 END) AS freeCount,
            SUM(CASE WHEN sysstatus = 'allotted' THEN 1 ELSE 0 END) AS allottedCount,
            SUM(CASE WHEN sysstatus = 'emergency' THEN 1 ELSE 0 END) AS emergencyCount
        FROM systems`;

    const querySystems = "SELECT * FROM systems";

    connection.query(queryCounts, (err, countResults) => {
        if (err) {
            console.error('Error querying counts:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        connection.query(querySystems, (err, systemsResults) => {
            if (err) {
                console.error('Error querying systems:', err);
                res.status(500).send('Internal Server Error');
                return;
            }

            const { freeCount, allottedCount, emergencyCount } = countResults[0];
            res.render("admindlview.ejs", {
                systems: systemsResults,
                freeCount,
                allottedCount,
                emergencyCount
            });
        });
    });
});

app.get("/dlview/new",(req,res)=>{
    res.render("systemForm.ejs");
});

//app.get("/dlview/getsystem",(req,res)=>{
  //  res.render("systemForm.ejs");
//});
/*
app.post("/dlview",(req,res)=>{
    let {sysno,sysstatus}=req.body;
    systems.push({sysno,sysstatus});
    res.redirect("/dlview");
});*/
/*
app.post("/dlview", (req, res) => {
    const { sysno, sysstatus } = req.body;
    const queryCheck = "SELECT * FROM systems WHERE sysno = ? AND sysstatus = 'free'";
    const queryUpdate = "UPDATE systems SET sysstatus = ? WHERE sysno = ?";
    
    connection.query(queryCheck, [sysno], (err, results) => {
        if (err) {
            console.error('Error checking system status:', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        
        if (results.length === 0) {
            res.setHeader('Content-Type', 'text/html');
            res.send('<script>alert("System is not free or does not exist."); window.location.href="/dlview/new";</script>');
        } else {
            connection.query(queryUpdate, [sysstatus, sysno], (err, results) => {
                if (err) {
                    console.error('Error updating system status:', err);
                    res.status(500).send('Internal Server Error');
                    return;
                }
                res.redirect("/dlview");
            });
        }
    });
});*/
app.post("/dlview", (req, res) => {
    const { sysno, sysstatus } = req.body;
    
    // Check if the system exists and its status
    const queryCheck = "SELECT * FROM systems WHERE sysno = ?";
    // Update the system status
    const queryUpdate = "UPDATE systems SET sysstatus = ? WHERE sysno = ?";

    connection.query(queryCheck, [sysno], (err, results) => {
        if (err) {
            console.error('Error checking system status:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (results.length === 0) {
            res.setHeader('Content-Type', 'text/html');
            res.send('<script>alert("System does not exist."); window.location.href="/dlview/new";</script>');
        } else {
            const currentStatus = results[0].sysstatus;
            if ((currentStatus === 'free' && sysstatus === 'allotted') ||
                (currentStatus === 'allotted' && sysstatus === 'emergency') ||
                (currentStatus === 'free' && sysstatus === 'emergency')) {
                connection.query(queryUpdate, [sysstatus, sysno], (err, updateResults) => {
                    if (err) {
                        console.error('Error updating system status:', err);
                        res.status(500).send('Internal Server Error');
                        return;
                    }
                    res.redirect("/dlview");
                });
            } else {
                res.setHeader('Content-Type', 'text/html');
                res.send('<script>alert("Invalid status change."); window.location.href="/dlview/new";</script>');
            }
        }
    });
});

app.post("/admindlview", (req, res) => {
    const { sysno, sysstatus } = req.body;
    
    // Check if the system exists and its status
    const queryCheck = "SELECT * FROM systems WHERE sysno = ?";
    // Update the system status
    const queryUpdate = "UPDATE systems SET sysstatus = ? WHERE sysno = ?";

    connection.query(queryCheck, [sysno], (err, results) => {
        if (err) {
            console.error('Error checking system status:', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (results.length === 0) {
            res.setHeader('Content-Type', 'text/html');
            res.send('<script>alert("System does not exist."); window.location.href="/dlview/new";</script>');
        } else {
            const currentStatus = results[0].sysstatus;
            if ((currentStatus === 'free' && sysstatus === 'allotted') ||
                (currentStatus === 'allotted' && sysstatus === 'emergency') ||
                (currentStatus === 'free' && sysstatus === 'emergency')) {
                connection.query(queryUpdate, [sysstatus, sysno], (err, updateResults) => {
                    if (err) {
                        console.error('Error updating system status:', err);
                        res.status(500).send('Internal Server Error');
                        return;
                    }
                    res.redirect("/admindlview");
                });
            } else {
                res.setHeader('Content-Type', 'text/html');
                res.send('<script>alert("Invalid status change."); window.location.href="/dlview/new";</script>');
            }
        }
    });
});


app.get("/admin",(req,res)=>{
    res.render("adminLogin.ejs");
})

app.get("/login",(req,res)=>{
    res.render("login.ejs");
});
/*
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT * FROM students WHERE email = ? AND password = ?";

    connection.query(query, [email, password], (err, results) => {
        if (err) {
            console.error('Error during query execution:', err);
            res.send('<script>alert("An error occurred. Please try again."); window.location.href="/login";</script>');
            return;
        }

        if (results.length > 0) {
            res.send('<script>alert("Login successful!"); window.location.href="/dlview";</script>');
        } else {
            res.send('<script>alert("Invalid email or password."); window.location.href="/home";</script>');
        }
    });
});*/


// Admin login route
app.post("/admin", (req, res) => {
    const { username, password } = req.body;
    const query = "SELECT * FROM admin WHERE username = ? AND password = ?";

    connection.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Error during query execution:', err);
            res.setHeader('Content-Type', 'text/html');
            res.send('<script>alert("An error occurred. Please try again."); window.location.href="/login";</script>');
            return;
        }

        if (results.length > 0) {
            console.log("Admin login successful for user:", username);
            res.setHeader('Content-Type', 'text/html');
            res.send('<script>alert("Login successful!"); window.location.href="/admindlview";</script>');
        } else {
            console.log("Invalid admin login attempt for user:", username);
            res.setHeader('Content-Type', 'text/html');
            res.send('<script>alert("Invalid username or password."); window.location.href="/home";</script>');
        }
    });
});
/*
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT * FROM students WHERE email = ? AND password = ?";

    connection.query(query, [email, password], (err, results) => {
        if (err) {
            console.error('Error during query execution:', err);
            res.setHeader('Content-Type', 'text/html');
            res.send('<script>alert("An error occurred. Please try again."); window.location.href="/login";</script>');
            return;
        }

        if (results.length > 0) {
            console.log("Login successful for user:", email);
            res.setHeader('Content-Type', 'text/html');
            res.send('<script>alert("Login successful!"); window.location.href="/dlview";</script>');
        } else {
            console.log("Invalid login attempt for user:", email);
            res.setHeader('Content-Type', 'text/html');
            res.send('<script>alert("Invalid email or password."); window.location.href="/home";</script>');
        }
    });
});*/


// Login route
/*
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT * FROM students WHERE email = ? AND password = ?";

    connection.query(query, [email, password], (err, results) => {
        if (err) {
            console.error('Error during query execution:', err);
            res.setHeader('Content-Type', 'text/html');
            res.send('<script>alert("An error occurred. Please try again."); window.location.href="/login";</script>');
            return;
        }

        if (results.length > 0) {
            console.log("Login successful for user:", email);
            res.setHeader('Content-Type', 'text/html');
            res.send('<script>alert("Login successful!");</script>');
            req.session.email = email;
            res.redirect('/dashboard');
        } else {
            console.log("Invalid login attempt for user:", email);
            res.setHeader('Content-Type', 'text/html');
            res.send('<script>alert("Invalid email or password."); window.location.href="/home";</script>');
        }
    });
});*/
/*
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT * FROM students WHERE email = ? AND password = ?";

    connection.query(query, [email, password], (err, results) => {
        if (err) {
            console.error('Error during query execution:', err);
            if (!res.headersSent) {
                res.setHeader('Content-Type', 'text/html');
                res.send('<script>alert("An error occurred. Please try again."); window.location.href="/login";</script>');
            }
            return;
        }

        if (results.length > 0) {
            console.log("Login successful for user:", email);
            if (!res.headersSent) {
                res.setHeader('Content-Type', 'text/html');
                res.send('<script>alert("Login successful!"); window.location.href="/dashboard";</script>');
            }
        } else {
            console.log("Invalid login attempt for user:", email);
            if (!res.headersSent) {
                res.setHeader('Content-Type', 'text/html');
                res.send('<script>alert("Invalid email or password."); window.location.href="/home";</script>');
            }
        }
    });
});
*/
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT * FROM students WHERE email = ? AND password = ?";

    connection.query(query, [email, password], (err, results) => {
        if (err) {
            console.error('Error during query execution:', err);
            if (!res.headersSent) {
                res.setHeader('Content-Type', 'text/html');
                res.send('<script>alert("An error occurred. Please try again."); window.location.href="/login";</script>');
            }
            return;
        }

        if (results.length > 0) {
            console.log("Login successful for user:", email);
            req.session.email = email; // Set the email in the session
            res.setHeader('Content-Type', 'text/html');
            res.send('<script>alert("Login successful!"); window.location.href="/dashboard";</script>');
        } else {
            console.log("Invalid login attempt for user:", email);
            if (!res.headersSent) {
                res.setHeader('Content-Type', 'text/html');
                res.send('<script>alert("Invalid email or password."); window.location.href="/home";</script>');
            }
        }
    });
});


/*
// Route to add a new note
app.post("/add-note", (req, res) => {
    
    const { email, note } = req.body;
    const query = "INSERT INTO notes_student(student_email, note_text) VALUES (?, ?)";

    connection.query(query, [req.session.email, note], (err, results) => {
        if (err) {
            console.error('Error adding note:', err);
            res.status(500).send("An error occurred.");
            return;
        }

        res.redirect(`/dashboard`);
    });
});
*/

app.post("/add-note", (req, res) => {
    const email = req.session.email; // Get the email from the session
    const { note } = req.body;

    if (!email) {
        return res.redirect('/login');
    }

    const query = "INSERT INTO notes_student (student_email, note_text) VALUES (?, ?)";

    connection.query(query, [email, note], (err, results) => {
        if (err) {
            console.error('Error adding note:', err);
            res.status(500).send("An error occurred.");
            return;
        }

        res.redirect(`/dashboard`);
    });
});

// Logout route
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return;
        }
        res.redirect('/login');
    });
});

app.get("/signup", (req, res) => {
    res.render("signup.ejs");
});


app.post("/signup", (req, res) => {
    const { email, password } = req.body;
    const query = "INSERT INTO students (email, password) VALUES (?, ?)";

    connection.query(query, [email, password], (err, results) => {
        if (err) {
            console.error('Error during query execution:', err);
            res.setHeader('Content-Type', 'text/html');
            res.send('<script>alert("An error occurred. Please try again."); window.location.href="/signup";</script>');
            return;
        }

        console.log("User registered successfully:", email);
        res.setHeader('Content-Type', 'text/html');
        res.send('<script>alert("Sign up successful!"); window.location.href="/dlview";</script>');
    });
});
/*
app.get("/freeDetails",(req,res)=>{
    res.render("free.ejs");
})*/

app.get("/freeDetails", (req, res) => {
    // Query to retrieve system numbers that are free
    const query = "SELECT sysno FROM systems WHERE sysstatus = 'free'";

    connection.query(query, (error, results) => {
        if (error) {
            console.error("Error fetching free system numbers:", error);
            res.status(500).send("Error fetching free system numbers");
            return;
        }

        // Extract system numbers from the results
        const freeSystemNumbers = results.map(result => result.sysno);

        // Render the "free.ejs" template and pass the free system numbers data to it
        res.render("free.ejs", { freeSystemNumbers });

        // Close the MySQL connection
        
    });
});

/*
app.get("/emergencyDetails",(req,res)=>{
    res.render("emergency.ejs");
})
*/

app.get("/emergencyDetails", (req, res) => {
    // Query to retrieve system numbers that are free
    const query = "SELECT sysno FROM systems WHERE sysstatus = 'emergency'";

    connection.query(query, (error, results) => {
        if (error) {
            console.error("Error fetching free system numbers:", error);
            res.status(500).send("Error fetching free system numbers");
            return;
        }

        // Extract system numbers from the results
        const freeSystemNumbers = results.map(result => result.sysno);

        // Render the "free.ejs" template and pass the free system numbers data to it
        res.render("emergency.ejs", { freeSystemNumbers });

        // Close the MySQL connection
        
    });
});


app.get("/allottedDetails", (req, res) => {
    // Query to retrieve system numbers that are free
    const query = "SELECT sysno FROM systems WHERE sysstatus = 'allotted'";

    connection.query(query, (error, results) => {
        if (error) {
            console.error("Error fetching free system numbers:", error);
            res.status(500).send("Error fetching free system numbers");
            return;
        }

        // Extract system numbers from the results
        const freeSystemNumbers = results.map(result => result.sysno);

        // Render the "free.ejs" template and pass the free system numbers data to it
        res.render("allotted.ejs", { freeSystemNumbers });

        // Close the MySQL connection
        
    });
});



/*
app.get("/allottedDetails",(req,res)=>{
    res.render("allotted.ejs");
})*/
app.get("/student",(req,res)=>{
    res.render("dash.ejs");
})
app.listen(port,()=>{
    console.log("listening to the port:8080");
});





