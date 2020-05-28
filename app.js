const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const Joi = require('@hapi/joi');
const flash = require('connect-flash');
const session = require('express-session');
const mongoose = require('mongoose');
const config = require('./config/database');
// const expressValidator = require('express-validator')
const passport = require('passport')


mongoose.connect(config.database);
let db = mongoose.connection;

// Check connection
db.once('open', function(){
    console.log('Connected to MongoDB');
});

// Check for DB errors
db.on('error', function(err){
    console.log(err);
});

// Init App
const app = express();

// Body parser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Bring in Models
let Articles = require('./models/article');

// Load Public
app.use(express.static(path.join(__dirname, 'public')));

// Load View Engine
app.set('views',path.join(__dirname, 'views'));
app.set('view engine','pug');

// Express Session Middleware
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
}));

// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Express Validator Middleware
/*
app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.')
        , root    = namespace.shift()
        , formParam = root;
      while(namespace.length) {
        formParam += '[' + namespace.shift() + ']';
      }
      return {
        param : formParam,
        msg   : msg,
        value : value
      };
    }
}));
*/

// Passport Config
require('./config/passport')(passport);

//Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*',function(req,res,next) {
    res.locals.user = req.user || null;
    next();
});

// Home Route
app.get('/', (req,res) => {
    Articles.find({}, function(err,articles) {
        if (err){
            console.log(err)
        }else{
            res.render('index', {
                title:'Hello',
                articles: articles
            });
        }
    })
});

// Route Files
let articles = require('./routes/articles');
let users = require('./routes/users');
let reset = require('./routes/passreset')
app.use('/article',articles);
app.use('/users',users);
app.use('/passreset',reset);

//Start Server
app.listen(3000, function() {
    console.log('Server started on port 3000...');
});