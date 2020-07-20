const methodOverride    = require("method-override"),
expressValidator        = require('express-validator'),
fileUpload              = require('express-fileupload'),
bodyParser              = require("body-parser"),
passport                = require('passport'),
mongoose                = require('mongoose'),
Category                = require('./models/category'),
Order                   = require('./models/order'),
Product                 = require('./models/products'),
express                 = require('express'),
session                 = require('express-session'),
Page                    = require('./models/page'),
path                    = require('path'),
db                      = require('./config/database.js').mongoURI,
User                    = require('./models/users'),
paypal                  = require('paypal-rest-sdk');

var auth = require('./config/auth.js');
var isUser = auth.isUser;
var isAdmin = auth.isAdmin;

Page();

// Database Connection
mongoose.connect(db, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => console.log('db Connected...!'))
.catch(err => console.log(err));  

// Initialize app
var app = express();

// View engine setup
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride("_method"));

// Set public folder
app.use(express.static(`public`));

// Set Global errors variable
app.locals.errors = null;

// Get all pages to pass to header ejs
Page.find({}).sort({sorting: 1}).exec(function(err, pages){
    if (err) {
        console.log(err);
    } else {
        app.locals.pages = pages;
    }
});

// Get all categories to pass to header ejs
Category.find(function(err, categories){
    if (err) {
        console.log(err);
    } else {
        app.locals.categories = categories;
    }
});

// Express fileUpload midleware
app.use(fileUpload());

// Express session midleware
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
//   cookie: { secure: true }
}));

// Express validator middleware
app.use(expressValidator({
    errorFormatter: function(param, msg, value){
        var namespace = param.split('.')
        , root = namespace.shift()
        , formParam = root;

        while(namespace.length) {
            formParam += '{' * namespace.shift() * '}';
        }
        return {
            param : formParam,
            msg : msg,
            value : value
        };
    },
    customValidators: {
        isImage: function(value, filename) {
            var extension = (path.extname(filename)).toLowerCase();
            switch (extension) {
                case '.jpg':
                    return '.jpg';
                case '.jpeg':
                    return '.jpeg';
                case '.png':
                    return '.png';
                case '':
                    return '.jpg';
            
                default:
                    return false;
            }
        }
    }
}));

// Express messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//PayPal Config
paypal.configure({
    'mode': 'sandbox',
    'client_id': 'Ab77X3O0K4WO8aFvNqOtmEDbLD4U2U8n-5U_sNYdh_AUN0NvOC0S0WXhcjvUoe6lGMeFlf5ralBG9IH9',
    'client_secret': 'EIVSLfM_AIxxEClMm_Gv3FDF0iQQmQXUIyWUKe9_LePnhGMpxOiUQrpOprwEjwfNDKxTFF91Y8eeQJ5E'
});

app.post('/pay', (req, res) => {
    const create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": "http://localhost:3000/success",
          "cancel_url": "http://localhost:3000/cancel"
      },
      "transactions": [{
          "item_list": {
              "items": [{
                  "name": "Red Sox Hat",
                  "sku": "001",
                  "price": "25.00",
                  "currency": "USD",
                  "quantity": 1
              }]
          },
          "amount": {
              "currency": "USD",
              "total": "25.00"
          },
          "description": "Hat for the best team ever"
      }]
  };
  
  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
        throw error;
    } else {
        for(let i = 0;i < payment.links.length;i++){
          if(payment.links[i].rel === 'approval_url'){
            res.redirect(payment.links[i].href);
          }
        }
    }
  });
  
  });
  
  app.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
  
    const execute_payment_json = {
      "payer_id": payerId,
      "transactions": [{
          "amount": {
              "currency": "USD",
              "total": "25.00"
          }
      }]
    };
  
    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
          console.log(error.response);
          throw error;
      } else {
          console.log(JSON.stringify(payment));
          res.send('Success');
      }
  });
  });
  
  app.get('/cancel', (req, res) => res.send('Cancelled'));
  

// Passport Config
require('./config/passport')(passport);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function(req, res, next) {
    res.locals.cart = req.session.cart;
    res.locals.user = req.user || null;
    next();
});

// Set Pages
var pages = require('./routes/pages.js');
var products = require('./routes/products.js');
var cart = require('./routes/cart.js');
var users = require('./routes/users.js');
var adminPages = require('./routes/admin_pages.js');
var adminCategories = require('./routes/admin_categories.js');
var adminProducts = require('./routes/admin_products.js');

app.use('/admin/pages', adminPages);
app.use('/admin/categories', adminCategories);
app.use('/admin/products', adminProducts);
app.use('/products', products);
app.use('/cart', cart);
app.use('/users', users);
app.use('/', pages);

// GET Payment page
app.get('/checkout/payment', isUser, function(req, res){
    res.render('payment');
});

// GET Proceed page
app.get('/checkout/payment/cod', isUser, function(req, res){
    res.render('order', {
        cart: req.session.cart,
        users: users
    });
});

app.post('/order', function(req, res){
    var name = req.body.name;
    var gsm = req.body.gsm;
    var town = req.body.town;
    var address_type = req.body.address_type;
    var address = req.body.address;
    var product_title = req.body.product_title;
    var product_price = req.body.product_price;
    var product_qty = req.body.product_qty;
    var product_amount = req.body.product_amount;
    
    var errors = req.validationErrors();
    
    if(errors) {
        return console.log(errors);
    } else {
        var order = new Order({
            name: name,
            gsm: gsm,
            town: town,
            address_type: address_type,
            address: address,
            product_title: product_title,
            product_price: product_price,
            product_qty: product_qty,
            product_amount: product_amount
        });
        order.save(function(err) {
            if(err) {
                return console.log(err);
            } else {
                req.flash('success', 'Congratulation! Your order is taken and our agent will contact you shortly');
                res.redirect('/');
            }
            // User.find({}).populate(orders).populate(products).exec(function(err, user){
            //     if (err) {
            //         console.log(err);
            //     } 
            //  });
        });
        
        
    }
});

// GET admin users page
app.get('/admin/users', isAdmin, function(req, res){
    User.find(function(err, users){
        if (err)
        return console.log(err);
        res.render('admin/users', {
            users: users
        });
    });
});

app.get('/admin/orders', isAdmin, function(req, res){

});

// GET admin users delete page
app.get('/admin/users/delete-user/:id', isAdmin, function(req, res){
    User.findByIdAndDelete(req.params.id, function(err){
        if (err)
        return console.log(err);

        User.find(function(err, users){
            if (err) {
                console.log(err);
            } else {
                req.app.locals.users = users;
            }
        });

        req.flash('success', 'User Deleted');
        res.redirect('/admin/users');
    });
});


// app.post("/pages", function(req, res){
//     Page.create(req.body.page, function(err, newPage){
//         if(err){
//             res.render("new");
//         } else {
//             res.redirect("/pages");
//         }
//     });
// });

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, function(){
    console.log('Server started on port ' + PORT);
});