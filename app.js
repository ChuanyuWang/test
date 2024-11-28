const express = require('express');
const bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);
const compression = require('compression')
const path = require('path');
const mongoose = require('mongoose');
const connectionManager = require('./server/databaseManager');
//const favicon = require('serve-favicon');
const morgan = require('morgan');
//const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');
const passport = require('passport');
const config = require('./config');
const i18n = require('i18n');
const helmet = require('helmet');
const fs = require('fs');

async function createServer() {

    // main application
    const app = express();
    app.locals.CDN_FILES = config.cdnlibs;

    // app.get('env') returns 'development' if NODE_ENV is not defined. 
    const env = app.get('env');
    app.locals.ENV = env;
    app.locals.ENV_DEVELOPMENT = env == 'development';

    // set the main logging by log4js
    const log4js = require('log4js');
    // Configuration should take place immediately after requiring log4js for the first time in your application.
    log4js.configure(config.log4js);
    const logger = app.locals.ENV_DEVELOPMENT ? log4js.getLogger() : log4js.getLogger('production');
    // Console replacement
    console.log = logger.info.bind(logger);
    console.debug = logger.debug.bind(logger);
    console.error = logger.error.bind(logger);
    console.warn = logger.warn.bind(logger);

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

    // Log all http requests and responds by morgan
    morgan.token('pid', function getPid(req) {
        return process.pid;
    });

    morgan.token('remote-user', function getRemoteUserToken(req) {
        // return username
        return req.user ? req.user.username : "-";
    });

    morgan.token('tenant', function getRemoteUserToken(req) {
        // return tenant name
        return req.tenant ? req.tenant.name : "-";
    });

    if (app.locals.ENV_DEVELOPMENT) {
        app.use(morgan('dev'));
    } else {
        app.use(morgan('[:date[iso]] [:pid] :remote-addr - :tenant :method :url :status :res[content-length] - :response-time ms'));
    }

    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');
    app.locals.pretty = true; // output the pretty html for consistency 

    // app.use(favicon(__dirname + '/public/img/favicon.ico'));

    // Use gzip compression
    app.use(compression());

    // Load the vite-server-middleware to support hot reload if it's enabled
    if (app.locals.ENV_DEVELOPMENT && process.env.HOTRELOAD === "true") {
        console.log("[HotReload] vite-middleware is loaded");

        const { createServer: createViteServer } = require('vite');
        // Create Vite server in middleware mode
        let vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'custom'
        });

        // Use vite's connect instance as middleware
        app.use(vite.middlewares);
    }

    // Helper function to get the correct asset path
    const manifestFilePath = path.join(__dirname, 'public', 'manifest.json');
    let manifest = {};
    if (fs.existsSync(manifestFilePath)) {
        manifest = JSON.parse(fs.readFileSync(manifestFilePath, 'utf-8'));
    }
    app.locals.getAssetPath = function(filename) {
        if (app.locals.ENV_DEVELOPMENT) {
            return `/${filename}`;
        }
        if (manifest[filename])
            return `/${manifest[filename].file}`;
        else {
            console.error(`Entry ${filename} not exist in manifest file`)
            return `/${filename}`;
        }
    };

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
            //url: db_utils.connectionURI('config') + '?authSource=admin&w=1',
            //dbName: 'config',
            mongooseConnection: mongoose.connection,
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
        // setup some locales
        locales: ['zh', 'en'],
        // where to store json files
        directory: __dirname + '/locales',
        // you may alter a site wide default locale
        defaultLocale: 'zh',
        // will return translation from defaultLocale in case current locale doesn't provide it
        retryInDefaultLocale: true,
        // query parameter to switch locale (ie. /home?lang=ch)
        queryParameter: 'lang',
        // watch for changes in json files to reload locale on updates
        autoReload: false, // set as false, otherwise may fail git checkout
        // whether to write new locale information to disk - defaults to true
        updateFiles: true,
        // what to use as the indentation unit - defaults to "\t"
        indent: '    '
    });
    app.use(i18n.init);

    // Initialize Passport and restore authentication state, if any, from the session.
    // besides, passport adds additional functions to req object, e.g. isUnauthenticated, isAuthenticated
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash()); //flash() requires sessions

    // all kinds of parser
    app.use(express.json());
    app.use(express.text());
    app.use(bodyParser.xml({
        xmlParseOptions: {
            trim: true, // Trim the whitespace at the beginning and end of text nodes.
            explicitRoot: false, // remove root node
            explicitArray: false // Only put nodes in array if >1
        }
    }));

    app.use(express.urlencoded({
        extended: true
    }));

    // add router
    const routes = require('./routes/index');
    app.use('/', routes);

    /// catch 404 if no router match
    app.use(function(req, res, next) {
        res.status(404);
        if (req.xhr) {
            return res.send({ message: "API Not Found" });
        }
        else {
            res.render('404', {
                title: res.__('error_title')
            });
        }
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
            title: res.__('error_title')
        });
    });

    app.stop = function() {
        connectionManager.close();
        // make sure all logs are written to files when program exits
        log4js.shutdown();
    }

    return app;
}

module.exports = createServer();
