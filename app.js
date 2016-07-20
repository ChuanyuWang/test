var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var passport = require('passport');
var config = require('./config.js');
var log4js = require('log4js');

var routes = require('./routes/index');
//var users = require('./routes/user');

// route different public account
var mygirl = require('./routes/mygirl');
var bqsq = require('./routes/bqsq');
var test = require('./routes/test');
var admin = require('./routes/admin');

var app = express();

var env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

// set the logging
log4js.configure(config.log4js);
log4js.getLogger().setLevel("TRACE");

// passport config
var Account = require('./account');
var LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.locals.pretty = true; // output the pretty html for consistency 

// app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('express-session')({ secret: 'keyboard dog', resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(flash());
app.use(passport.session());

// add router
app.use('/', routes);
app.use('/admin', admin);

// add each tenant
app.use('/mygirl',mygirl);
app.use('/test', test);
app.use('/bqsq', bqsq);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// log error to std or err or file for persistent
app.use(function(err, req, res, next) {
    console.error(err.stack);
    if (err.innerError) {
        console.error(" is caused by ");
        console.error(err.innerError);
    }
    next(err);
});

// handle client error and return an error object
app.use(function(err, req, res, next) {
    if (req.xhr) {
        res.status(err.status || 500);
        res.send({
            message : err.message,
            code : err.code
        });
    } else {
        next(err);
    }
});

// development error handler
// will print stacktrace

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
            title: 'error'
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
        title: 'error'
    });
});

// load database connection string
if (app.get('env') === 'development') {
    app.locals.getURI = function(database) {
        return "mongodb://admin:39fe4847-6ecb-431c-9647-23160a80db54@localhost/" + database + "?authSource=admin";
    };
}

if (app.get('env') === 'production') {
    // TODO, load the connection string from local config.js file
    var connectionURL = "mongodb://admin:39fe4847-6ecb-431c-9647-23160a80db54@localhost/";
    app.locals.getURI = function(database) {
        return connectionURL + database + "?authSource=admin";
    };
}

module.exports = app;
