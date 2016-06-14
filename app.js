var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var sessions = require('client-sessions');
var csrf = require('csurf'); //security for cross site request forjery
var bcrypt = require('bcryptjs');

//connect to mongoose db:nodeapp
mongoose.connect('mongodb://binitdev:Binit.123@ds015194.mlab.com:15194/nodeapp');

//setup template engine and view source preety
app.set('view engine', 'jade');
app.locals.pretty = true;

//import all the controllers
var userController = require('./controllers/user.js');

//middlewares
/*useed static property to access public folder*/
app.use(express.static('bower_components'));

/*body-parser to parse form data into json req.body*/
app.use(bodyParser.urlencoded({
    extended: true
}));

/* client session save session using cookie in browser*/
app.use(sessions({
    cookieName: 'session',
    secret: 'kjsdfbdbkdfbijbifvkmbouiefeufbefibqew', //private secret key for sessoin data encryption
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000
}));

app.use(csrf());
/* on every request checking if session is set then adding user in request */
app.use(function(req, res, next) {
    if (req.session && req.session.user) {
        var user = userController.getUser(req.session.user.email, function(err, user) {
            if (user != null) {
                req.user = user;
                delete req.user.password;
                req.session.user = req.user;
                res.locals.user = req.user;
                next();
            } else {
                next();
            }
        });
    } else {
        next();
    }
});

/* require login middleware can apply on routes in which we need required login */
function requireLogin(req, res, next) {
    if (!req.user) {
        res.redirect('/login');
    } else {
        next();
    }
}

//post requests
/*on post managing function on global way direct accessing request and response parameter in controller */
app.post('/login', userController.tryLogin);
/*on post managing function using call back functions*/
app.post('/register', function(req, res) {
    userController.registerUser(req, function(err, registered) {
        if (registered == true) {
            var message = "User registered successfully";
            req.session.message = message;
            res.redirect('/');
        } else {
            req.session.error = err;
            res.redirect('/register');
        }
    });
});

//get requests
app.get('/', function(req, res) {
    if (req.session.message) {
        var x = req.session.message;
        delete req.session.message;
        res.render('home.jade', {message: x});
    } else if (req.session.error) {
        var x = req.session.error;
        delete req.session.error;
        res.render('home.jade', {error: x});
    } else {
        res.render('home.jade');
    }
});
app.get('/register', function(req, res) {
    if (req.session.message) {
        var x = req.session.message;
        delete req.session.message;
        res.render('register.jade', {message: x,csrfToken: req.csrfToken()});
    } else if (req.session.error) {
        var x = req.session.error;
        delete req.session.error;
        res.render('register.jade', {error: x,csrfToken: req.csrfToken()});
    } else {
        res.render('register.jade', {csrfToken: req.csrfToken()});
    }
});
app.get('/login', function(req, res) {
    if (req.session && req.session.user) {
        res.locals.user = req.session.user;
        res.redirect('/dashboard');
    } else {
        res.render('login.jade', {csrfToken: req.csrfToken()});
    }
});
app.get('/logout', function(req, res) {
    req.session.reset();
    res.send('Session Logged out.<br> <a href="/login">Login Again</a>');
});
app.get('/dashboard', requireLogin, function(req, res) {
    res.render('dashboard.jade');
});

/* started app on localhost:8000 port*/
app.listen(8000, function() {
    console.log('Example app listening on port 8000!');
});
