const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { createCanvas } = require('canvas');
const bcrypt = require('bcrypt');
const session = require('express-session');
require('dotenv').config();

const { Image, User } = require('./model'); // Importing the models
const app = express();

// Set the view engine
app.set("view engine", "ejs");

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("DB Connected"))
    .catch(err => console.log(err));

// Middleware for parsing form data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Static folder for uploaded images
app.use('/uploads', express.static('uploads'));

// Express session middleware
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
}));

// Middleware to check authentication
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/login');
}

// Route to display the home page
app.get('/', isAuthenticated, (req, res) => {
    Image.find({})
        .then((data) => {
            res.render('imagepage', { items: data });
        })
        .catch((err) => {
            console.log(err);
        });
});

// Route to render the add-item form
app.get('/add-item', isAuthenticated, (req, res) => {
    res.render('add-item'); // This should correspond to your template file
});


// Route to render the edit-item form
app.get('/edit-item/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    Image.findById(id)
        .then((data) => {
            res.render('edit-item', { item: data });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send("Error retrieving item for edit.");
        });
});

// Function to create an A4-sized image (300 DPI)
function createImage(name, age, salary, gender, profession, jadagam) {
    return new Promise((resolve, reject) => {
        const width = 2480;  // pixels
        const height = 3508;  // pixels

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#000";
        ctx.font = 'bold 60px Arial';

        let yPosition = 200;

        ctx.fillText(`Name: ${name}`, 100, yPosition);
        ctx.fillText(`Age: ${age}`, 100, yPosition + 100);
        ctx.fillText(`Salary: ${salary}`, 100, yPosition + 200);
        ctx.fillText(`Gender: ${gender}`, 100, yPosition + 300);
        ctx.fillText(`Profession: ${profession}`, 100, yPosition + 400);
        ctx.fillText(`Jadagam: ${jadagam}`, 100, yPosition + 500);

        const buffer = canvas.toBuffer('image/png');
        resolve(buffer);
    });
}

// Route to handle adding an item
app.post('/add-item', isAuthenticated, (req, res) => {
    const { name, age, salary, gender, profession, jadagam } = req.body;

    createImage(name, age, salary, gender, profession, jadagam)
        .then((imageBuffer) => {
            const newItem = {
                name,
                age,
                salary,
                gender,
                profession,
                jadagam,
                img: {
                    data: imageBuffer,
                    contentType: 'image/png'
                }
            };

            Image.create(newItem)
                .then(() => {
                    res.redirect('/');
                })
                .catch((err) => {
                    console.log(err);
                    res.status(500).send("Error saving item.");
                });
        })
        .catch(err => {
            console.log(err);
            res.status(500).send("Error creating image.");
        });
});

// Route to handle editing an item
app.post('/edit-item/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const { name, age, salary, gender, profession, jadagam } = req.body;

    createImage(name, age, salary, gender, profession, jadagam)
        .then((imageBuffer) => {
            const updatedData = {
                name,
                age,
                salary,
                gender,
                profession,
                jadagam,
                img: {
                    data: imageBuffer,
                    contentType: 'image/png'
                }
            };

            Image.findByIdAndUpdate(id, updatedData, { new: true })
                .then(() => {
                    res.redirect('/');
                })
                .catch((err) => {
                    console.log(err);
                    res.status(500).send("Error updating item.");
                });
        })
        .catch(err => {
            console.log(err);
            res.status(500).send("Error creating image.");
        });
});

// Route to delete an item
app.delete('/delete-item/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;

    Image.findByIdAndDelete(id)
        .then(result => {
            if (!result) {
                return res.status(404).send("Item not found");
            }
            res.status(200).send("Item deleted successfully");
        })
        .catch(err => {
            console.log(err);
            res.status(500).send("Error deleting item");
        });
});

// User login route
app.get('/login', (req, res) => {
    res.render('login');  // Render the login page
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    User.findOne({ username })
        .then(user => {
            if (!user) {
                return res.status(401).send("User not found.");
            }
            bcrypt.compare(password, user.password, (err, match) => {
                if (err) {
                    return res.status(500).send("Error checking password.");
                }
                if (match) {
                    req.session.userId = user._id;  // Set session
                    return res.redirect('/');
                }
                res.status(401).send("Invalid password.");
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).send("Error logging in.");
        });
});

// User logout route
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            return res.status(500).send("Error logging out.");
        }
        res.redirect('/login');  // Redirect to login page
    });
});

// Start the server
const PORT = process.env.PORT || 8132;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
