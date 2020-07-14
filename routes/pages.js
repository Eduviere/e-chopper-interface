var express = require('express'),
router      = express.Router(),
Product     = require('../models/products'),
Page        = require('../models/page');

// GET /
router.get('/', function(req, res){
    Page.findOne({slug: 'home'}, function(err, page, products){
        if (err)
            console.log(err);
        
        Product.find(function(err, products){
            if (err)
                console.log(err);
            
            res.render('index', {
                title: page.title,
                content: page.content,
                products: products
            });
        });
    });
});

// GET Contact Us page
router.get('/contact-us', function(req, res){
    res.render('contact-us', {
        title: 'cmsShoppingCart | Contact Us'
    });
});

// GET About page
router.get('/about', function(req, res){
    res.render('about', {
        title: 'cmsShoppingCart | About Us'
    });
});

// GET a page
router.get('/:slug', function(req, res){
    
    var slug = req.params.slug;
    Page.findOne({slug: slug}, function(err, page){
        if (err)
            console.log(err);
        
        if (!page) {
            res.redirect('/');
        } else {
            res.render('index', {
                title: page.title,
                content: page.content
            });
        }
    });
});

//Exports
module.exports = router;