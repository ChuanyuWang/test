var express = require('express');
var compression = require('compression')
var path = require('path');
var db_utils = require('./server/databaseManager');
//var favicon = require('serve-favicon');
var morgan = require('morgan');
//var cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');
var passport = require('passport');
var config = require('./config');
var i18n = require('i18n');
const helmet = require('helmet');

// main application
var app = express();
app.locals.CDN_FILES = config.cdnlibs;

// app.get('env') returns 'development' if NODE_ENV is not defined. 
var env = app.get('env');
app.locals.ENV = env;
app.locals.ENV_DEVELOPMENT = env == 'development';

// set the logging
var log4js = require('log4js');
log4js.configure(config.log4js);
const logger = app.locals.ENV_DEVELOPMENT ? log4js.getLogger() : log4js.getLogger('production');
// Console replacement
console.log = logger.info.bind(logger);
console.debug = logger.debug.bind(logger);
console.error = logger.error.bind(logger);

//setting various HTTP headers.
app.use(helmet({
    contentSecurityPolicy: false,
}));
// Sets all of the defaults, but overrides script-src
/* Uncomment below code when enable contentSecurityPolicy
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "style-src": [`'self'`, `'unsafe-inline'`, "cdn.bootcdn.net/"],
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "cdn.bootcdn.net/"],
        },
    })
);
*/

// passport config
const Account = require('./account');
passport.use(Account.createStrategy());
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

// Add super admin - TODO

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.locals.pretty = true; // output the pretty html for consistency 

// app.use(favicon(__dirname + '/public/img/favicon.ico'));
if (app.locals.ENV_DEVELOPMENT) {
    app.use(morgan('dev'));
} else {
    app.use(morgan('[:date[iso]] :remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length]'));
}

// Use gzip compression
app.use(compression())

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

// Load the webpack-dev-middleware to support hot reload if it's enabled
if (app.locals.ENV_DEVELOPMENT && process.env.HOTRELOAD === "true") {
    console.log("[HotReload] webpack-dev-middleware is loaded");
    const webpack = require('webpack');
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const config = require('./webpack.config.js'); // load dev webpack configuration
    const compiler = webpack(config);
    app.use(webpackDevMiddleware(compiler, {
        // router "/js/*" requset to this middleware (in-memory)
        publicPath: config.output.publicPath,
    }));

    /**
     * path - The path which the middleware will serve the event stream on, must match the client setting
     * heartbeat - How often to send heartbeat updates to the client to keep the connection alive. Should be less than the client's timeout setting - usually set to half its value.
     */
    app.use(require("webpack-hot-middleware")(compiler, {
        log: console.log, path: '/__webpack_hmr', heartbeat: 1000
    }));
}

app.use(express.static(path.join(__dirname, 'public')));
/**
 * Since express-session version 1.5.0, the cookie-parser middleware no longer needs to be used.
 */
//app.use(cookieParser());
app.use(session({
    secret: 'keyboard dog',
    resave: false, //don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    store: new MongoStore({
        url: db_utils.connectionURI('config') + '?authSource=admin&w=1',
        touchAfter: 24 * 3600 // time period in seconds
    }),
    cookie: {
        //this attribute tells the browser to only send the cookie 
        // if the request is being sent over HTTPS.
        secure: !app.locals.ENV_DEVELOPMENT,
        //this attribute is used to help prevent attacks such as cross-site scripting, 
        // since it does not allow the cookie to be accessed via JavaScript.
        httpOnly: true
    }
}));

//i18n configuration
i18n.configure({
    locales: ['zh'],
    // where to store json files
    directory: __dirname + '/locales',
    defaultLocale: 'zh',
    // query parameter to switch locale (ie. /home?lang=ch)
    queryParameter: 'lang',
    // watch for changes in json files to reload locale on updates
    autoReload: false // set as false, otherwise may fail git checkout
});
app.use(i18n.init);

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); //flash() requires sessions

// add router
var routes = require('./routes/index');
app.use('/', routes);

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
            message: err.message,
            code: err.code
        });
    } else {
        next(err);
    }
});

// development error handler
// will print stacktrace
// app.get('env') returns 'development' if NODE_ENV is not defined. 
if (app.locals.ENV_DEVELOPMENT) {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
            title: res.__('error_title')
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
