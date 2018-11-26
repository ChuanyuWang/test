
/**
 * An Express middleware to check user session and redirect. 
 * If user is unauthenticated, then redirect to home page;
 * If user is authenticated but access other tenant pages, then redirect to user tenant home page.
 *
 * Examples:
 * 
 *     router.get('/', checkTenantUser, function (req, res, next) {
 *       res.render('index');
 *     });
 * 
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @public
 */
module.exports.checkTenantUser = function(req, res, next) {
    // use the isUnauthenticated() method provided by passport
    if (req.isUnauthenticated()) {
        req.flash('error', '用户未登陆或连接超时');
        res.redirect('/');
    } else if (req.user.tenant != req.tenant.name) {
        res.redirect('/t/' + req.user.tenant + '/home');
    } else {
        next();
    }
};

/**
 * Return an Express middleware to check user is authenticated with sepcific role. 
 * Continue to next middleware if user is authenticated with sepcific role;
 * Otherwise respond with error message and status 403.
 * 
 * @param {String} role
 * @return {Function} Express middleware
 * @public
 */
module.exports.requireRole = function(role) {
    return function(req, res, next) {
        if (req.isUnauthenticated()) {
            var err = new Error("Unauthorized Request");
            err.status = 401;
            next(err);
        } else if (req.user.role === role)
            // success
            next();
        else {
            var err = new Error("没有权限执行此操作");
            err.status = 403;
            next(err);
        }
    };
};

/**
 * Check if the user of request has specific role
 * 
 * @param {Object} req http request
 * @param {String} role user role
 */
module.exports.hasRole = function(req, role) {
    if (req.isUnauthenticated() && req.user.role === role) {
        return true;
    }
    return false;
};

/**
 * An Express middleware to check user is authenticated. 
 * Continue to next middleware if user is authenticated;
 * Otherwise respond with error message and status 401.
 * 
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @public
 */
module.exports.isAuthenticated = function(req, res, next) {
    if (req.isAuthenticated()) {
        next()
    } else {
        res.status(401).send('Unauthorized Request');
    }
};

/**
 * @param {String} tenantName the name of tenant
 * @return {String}
 */
module.exports.getTenantLogo = function(tenantName) {
    return '/img/' + tenantName + '-logo-2x.png';
};

/**
 * Remove the non-digit character from tel string, e.g. 136-6166-6616 -> 13664666616
 * @param {String} telString the telephone number
 */
module.exports.getTel = function(telString) {
    return telString && telString.replace(/\D/g, '');
};