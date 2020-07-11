var express = require('express'),
router      = express.Router(),
Product     = require('../models/products'),
fs = require('fs-extra'),
Category    = require('../models/category');

// GET all products
router.get('/', function(req, res){
    Product.find(function(err, products){
        if (err)
            console.log(err);
        
        res.render('all_products', {
            title: 'All Products',
            products: products
        });
    });
});

// GET products by category
router.get('/:category', function(req, res){
    
    var categorySlug = req.params.category;
    Category.findOne({slug: categorySlug}, function(err, c){
        Product.find({category: categorySlug}, function(err, products){
            if (err)
                console.log(err);
            
            res.render('cat_products', {
                title: c.title,
                products: products
            });
        });
    });
});

// GET products details
router.get('/:category/:product',  function(req, res){
    
    var galleryImages = null;
    Product.findOne({slug: req.params.product}, function(err, product){
        if (err) {
            console.log(err);
        } else {
            var galleryDir = 'public/product_images/' + product._id + '/gallery';

            fs.readdir(galleryDir, function(err, files){
                if (err) {
                    console.log(err);
                } else {
                    galleryImages = files;
                    res.render('product', {
                        title: product.title,
                        p: product,
                        galleryImages: galleryImages,
                    });
                }
            });
        }
    });
});


//Exports
module.exports = router;