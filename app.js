require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static assets; mount at /public (primary) and root (compat)
const publicPath = path.join(__dirname, 'public');
app.use('/public', express.static(publicPath));
app.use(express.static(publicPath));

// Basic route
app.get('/', (req, res) => {
    res.render('home');
});

// Guest editor route for the free trial
const freeTrialProject = {
    id: 'free-trial',
    title: 'Try Formerly Free',
    width: 800,
    height: 500,
    frames: []
};

app.get('/editor/free', (req, res) => {
    const requestedWidth = parseInt(req.query.width, 10);
    const requestedHeight = parseInt(req.query.height, 10);

    const width = Number.isFinite(requestedWidth) && requestedWidth > 0 ? requestedWidth : freeTrialProject.width;
    const height = Number.isFinite(requestedHeight) && requestedHeight > 0 ? requestedHeight : freeTrialProject.height;

    return res.render('project-editor', {
        project: {
            ...freeTrialProject,
            width,
            height
        }
    });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});