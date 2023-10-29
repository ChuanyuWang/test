
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
        req.flash('error', '用户未登录或连接超时');
        res.redirect('/');
    } else if (req.user.tenant != req.tenant.name) {
        if (req.user.tenant == 'admin') res.redirect('/admin/home');
        else res.redirect('/');
    } else {
        next();
    }
};

module.exports.checkUser = function(userName) {
    return function(req, res, next) {
        if (req.isUnauthenticated()) {
            req.flash('error', '用户未登录或连接超时');
            res.redirect('/');
        } else if (req.user.username !== userName) {
            res.redirect('/');
        } else {
            next();
        }
    }
};

module.exports.checkUserTenant = function(tenantName) {
    return function(req, res, next) {
        if (req.isUnauthenticated()) {
            req.flash('error', '用户未登录或连接超时');
            res.redirect('/');
        } else if (req.user.tenant !== tenantName) {
            res.redirect('/');
        } else {
            next();
        }
    }
};

module.exports.hasTenant = function(req, res, next) {
    if (!req.tenant || !req.tenant.name) {
        let error = new Error("tenant is not defined");
        error.status = 400;
        return next(error);
    } else {
        return next();
    }
};

/**
 * Return an Express middleware to check user is authenticated with sepcific role and access according tenant
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
        } else if (req.user.role === role && req.user.tenant === req.tenant.name)
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
 * Return an Express middleware to check user is authenticated with sepcific role. 
 * Continue to next middleware if user is authenticated with sepcific role;
 * Otherwise respond with error message and status 403.
 * 
 * @param {String} role user role
 */
module.exports.hasRole = function(role) {
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
 * An Express middleware to check user is authenticated to the target tenant. 
 * Continue to next middleware if user is authenticated;
 * Otherwise respond with error message and status 401.
 * 
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @public
 */
module.exports.isAuthenticated = function(req, res, next) {
    // user session is valid in the tenant
    if (req.isAuthenticated() && req.user.tenant === req.tenant.name) {
        next();
    } else {
        res.status(401).send('Unauthorized Request');
    }
};

/**
 * @param {String} tenant the tenant object
 * @return {String} the path to logo img
 */
module.exports.getTenantLogo = function(tenant) {
    if (tenant.logoPath)
        return `/img/${tenant.logoPath}.png`;
    else if (tenant.name)
        return `/img/${tenant.name}-logo-2x.png`;
    else
        return "";
};

/**
 * Remove the non-digit character from tel string, e.g. 136-6166-6616 -> 13664666616
 * @param {String} telString the telephone number
 */
module.exports.getTel = function(telString) {
    return telString && telString.replace(/\D/g, '');
};
