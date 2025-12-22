require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const shortid = require("shortid")
const session = require('express-session');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve static assets; mount at /public (primary) and root (compat)
const publicPath = path.join(__dirname, 'public');
app.use('/public', express.static(publicPath));
app.use(express.static(publicPath));

// Database connection
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/motion_design';
mongoose.connect(MONGO_URL).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    googleId: { type: String, required: false, unique: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  id: { type: String, required: true, unique: true, default: shortid.generate },
});

// Compile User model
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Session middleware (simple MemoryStore for development)
app.use(session({
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set to true when using HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Passport serialize/deserialize (store user.id from schema `id` field)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findOne({ id }).exec();
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Google OAuth strategy and routes (only configured if env vars are set)
const _googleClientId = process.env.GOOGLE_CLIENT_ID;
const _googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const _googleCallback = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';

if (_googleClientId && _googleClientSecret) {
    passport.use(new GoogleStrategy({
        clientID: _googleClientId,
        clientSecret: _googleClientSecret,
        callbackURL: _googleCallback
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const googleId = profile.id;
            const email = (profile.emails && profile.emails[0] && profile.emails[0].value) ? profile.emails[0].value.toLowerCase() : null;

            // Try find by googleId first
            let user = await User.findOne({ googleId }).exec();

            // If not, try by email and link account
            if (!user && email) {
                user = await User.findOne({ email }).exec();
                if (user) {
                    user.googleId = googleId;
                    await user.save();
                    return done(null, user);
                }
            }

            // Create new user if none
            if (!user) {
                const randomPass = shortid.generate();
                const hashed = await bcrypt.hash(randomPass, 10);
                const name = profile.displayName || ((profile.name && `${profile.name.givenName || ''} ${profile.name.familyName || ''}`) || 'Google User');
                user = new User({ name: name.trim(), email: email || `${googleId}@google.local`, password: hashed, googleId });
                await user.save();
            }

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }));

    // Google OAuth routes
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
        // Successful authentication, set session user and redirect
        if (req.user) {
            req.session.user = { id: req.user.id, name: req.user.name, email: req.user.email };
        }
        res.redirect('/dashboard');
    });

} else {
    console.warn('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.');
}

// Basic route
app.get('/', (req, res) => {
    res.render('home');
});

// Signup route
app.get('/signup', (req, res) => {
        res.render('signup', { errors: null, formData: null });
});

// Login route
app.get('/login', (req, res) => {
    res.render('login', { errors: null, formData: null });
});

// Google OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    // Successful authentication, set session user and redirect
    if (req.user) {
        req.session.user = { id: req.user.id, name: req.user.name, email: req.user.email };
    }
    res.redirect('/dashboard');
});

// Handle login submission
app.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    const errors = {};
    const emailNormalized = (email || '').toLowerCase().trim();

    if (!emailNormalized) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalized)) errors.email = 'Invalid email address';
    if (!password || password.length < 8) errors.password = 'Password must be at least 8 characters';

    if (Object.keys(errors).length > 0) {
        return res.status(400).render('login', { errors, formData: { email: emailNormalized } });
    }

    try {
        const user = await User.findOne({ email: emailNormalized }).exec();
        if (!user) {
            return res.status(401).render('login', { errors: { general: 'Invalid email or password' }, formData: { email: emailNormalized } });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).render('login', { errors: { general: 'Invalid email or password' }, formData: { email: emailNormalized } });
        }

        // Auth success: set session and redirect to dashboard
        req.session.user = { id: user.id, name: user.name, email: user.email };
        return res.redirect('/dashboard');
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).render('login', { errors: { general: 'Server error, please try again later' }, formData: { email: emailNormalized } });
    }
});

// Handle signup submission, hash password, create user and auto-login
app.post('/signup', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body || {};
    const errors = {};

    // Basic validation
    if (!name || !name.trim()) errors.name = 'Name is required';
    const emailNormalized = (email || '').toLowerCase().trim();
    if (!emailNormalized) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalized)) errors.email = 'Invalid email address';
    if (!password || password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (Object.keys(errors).length > 0) {
        return res.status(400).render('signup', { errors, formData: { name, email: emailNormalized } });
    }

    try {
        // Check existing user
        const existing = await User.findOne({ email: emailNormalized }).exec();
        if (existing) {
            return res.status(409).render('signup', { errors: { email: 'Email already in use' }, formData: { name, email: emailNormalized } });
        }

        // Hash password
        const saltRounds = 10;
        const hashed = await bcrypt.hash(password, saltRounds);

        // Create and save user
        const user = new User({ name: name.trim(), email: emailNormalized, password: hashed });
        await user.save();

        // Auto-login: store minimal user info in session
        req.session.user = { id: user.id, name: user.name, email: user.email };

        // Redirect to dashboard (auto-logged in)
        return res.redirect('/dashboard');
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).render('signup', { errors: { general: 'Server error, please try again later' }, formData: { name, email: emailNormalized } });
    }
});

// Dashboard route (requires session user)
app.get('/dashboard', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/');
    }
    res.render('dashboard', { 
        user: req.session.user,
        activeRoute: 'dashboard'
    });
});

// Projects route (requires session user)
app.get('/projects', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/');
    }
    res.render('projects', { 
        user: req.session.user,
        activeRoute: 'projects'
    });
});

// Logout route
app.get('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error('Logout error:', err);
                return res.status(500).redirect('/');
            }
            // Clear session cookie
            res.clearCookie(process.env.SESSION_COOKIE_NAME || 'connect.sid');
            return res.redirect('/');
        });
    } else {
        return res.redirect('/');
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});