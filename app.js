var express = require('express');
var path = require('path');
var util = require('util');
var favicon = require('serve-favicon');
var logger = require('morgan');
//var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var passport = require('passport');
var config = require('./config');
var db_config = require('./config.db');

// load routes
var routes = require('./routes/index');
//var users = require('./routes/user');

// route different tenant
var mygirl = require('./routes/mygirl');
var bqsq = require('./routes/bqsq');
var martin = require('./routes/martin');
var test = require('./routes/test');
var admin = require('./routes/admin');

// main application
var app = express();

var env = process.env.NODE_ENV || 'development';
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

// set the logging
var log4js = require('log4js');
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

//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('express-session')({ secret: 'keyboard dog', resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// add router
app.use('/', routes);
app.use('/admin', admin);

// add each tenant
app.use('/mygirl',mygirl);
app.use('/test', test);
app.use('/bqsq', bqsq);
app.use('/martin', martin);

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

module.exports = app;
