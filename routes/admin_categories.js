var express = require('express'),
router      = express.Router();

var auth = require('../config/auth.js');
var isAdmin = auth.isAdmin;

// Get Category model
var Category = require('../models/category');

// Get Category Index 
router.get('/', isAdmin, function(req, res){
    Category.find(function(err, categories){
        if (err)
        return console.log(err);
        res.render('admin/categories', {
            categories: categories
        });
    });
});
 
// Get Add Category 
router.get('/add-category', isAdmin, function(req, res){
    
    var title = "";

    res.render('admin/add_category', {
        title: title
    });
});
 
// Post Add Category
router.post('/add-category', function(req, res){
    
    req.checkBody('title', 'Title must have a value').notEmpty();

    var title = req.body.title;
    var slug = title.replace(/\*+/g, "-").toLowerCase();
    
    var errors = req.validationErrors();

    if(errors) {
        res.render('admin/add_category', {
            errors: errors,
            title: title
        });
    } else {
        Category.findOne({slug: slug}, function(err, category){
            if(category) {
                req.flash('danger', 'Category title exists, choose another');
                res.render('admin/add_category', {
                    errors: errors,
                    title: title
                });
            } else {
                var category = new Category({
                    title: title,
                    slug: slug
                });
                category.save(function(err) {
                    if(err) 
                    return console.log(err);

                    Category.find(function(err, categories){
                        if (err) {
                            console.log(err);
                        } else {
                            req.app.locals.categories = categories;
                        }
                    });

                    req.flash('success', 'Category added');
                    res.redirect('/admin/categories');
                });
            }
        });
    }
});

// Get Edit Category 
router.get('/edit-category/:id', isAdmin, function(req, res){
    
    Category.findById(req.params.id, function(err, category){
        if(err)
         return console.log(err);

        res.render('admin/edit_category', {
            title: category.title,
            id: category._id
        });
    });
});

// Post edit category
router.post('/edit-category/:id', function(req, res){
    
    req.checkBody('title', 'Title must have a value').notEmpty();

    var title = req.body.title;
    var slug = title.replace(/\*+/g, "-").toLowerCase();
    var id = req.params.id;
    
    var errors = req.validationErrors();

    if(errors) {
        res.render('admin/edit_category', {
            errors: errors,
            title: title,
            id: id
        });
    } else {
        Category.findOne({slug: slug, _id:{'$ne':id}}, function(err, category){
            if(category) {
                req.flash('danger', 'Category title exists, choose another');
                res.render('admin/edit_category', {
                    title: title,
                    id: id
                });
            } else {
                Category.findById(id, function(err, category){
                    if(err)
                    return console.log(err);

                    category.title = title;
                    category.slug = slug;

                    category.save(function(err) {
                        if(err) 
                        return console.log(err);

                        Category.find(function(err, categories){
                            if (err) {
                                console.log(err);
                            } else {
                                req.app.locals.categories = categories;
                            }
                        });

                        req.flash('success', 'Category edited');
                        res.redirect('/admin/categories/edit-category/'+ id);
                    });
                });
            }
        });
    }
});

// Get Delete Category 
router.get('/delete-category/:id', isAdmin, function(req, res){
    Category.findByIdAndDelete(req.params.id, function(err){
        if (err)
        return console.log(err);

        Category.find(function(err, categories){
            if (err) {
                console.log(err);
            } else {
                req.app.locals.categories = categories;
            }
        });

        req.flash('success', 'Category Deleted');
        res.redirect('/admin/categories');
    });
});

//Exports
module.exports = router;