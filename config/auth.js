// Login function
exports.isUser = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('warning', 'Please Login to continue')
        res.redirect('/users/login');
    }
}

exports.isAdmin = function(req, res, next) {
    if (req.isAuthenticated() && res.locals.user.admin == 1) {
        return next();
    } else {
        req.flash('warning', 'Please Login as admin')
        res.redirect('/users/login');
    }
}