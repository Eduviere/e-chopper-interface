const methodOverride    = require("method-override"),
expressValidator        = require('express-validator'),
fileUpload              = require('express-fileupload'),
bodyParser              = require("body-parser"),
passport                = require('passport'),
mongoose                = require('mongoose'),
Category                = require('./models/category'),
Product                 = require('./models/products'),
express                 = require('express'),
session                 = require('express-session'),
Page                    = require('./models/page'),
path                    = require('path'),
db                      = require('./config/database.js').mongoURI;

var auth = require('./config/auth.js');
var isUser = auth.isUser;

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