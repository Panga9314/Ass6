/*********************************************************************************
*  WEB322 – Assignment 06
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: gkhaira2@myseneca.ca  ID: 171231210  Date: 16 April 2023

   cyclic: 

   github: https://github.com/Panga9314/Ass6.git
********************************************************************************/
const clientSessions = require("client-sessions")
const exphbs = require("express-handlebars");
const Handlebars = require("handlebars");
const path = require("path");
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { addPost, addCategory, deleteCategoryById, deletePostById } = require("./blog-service");
const { extname } = require("path");
const stripJs = require('strip-js');
const { checkUser, registerUser } = require("./auth-service");

cloudinary.config({
  cloud_name: "dsdhorks2",
  api_key: "193969161988572",
  api_secret: "WhHb_VpP6gcdrO7EAQXQO3aikhg",
  secure: true,
});

const upload = multer();

const blog_service = require(path.join(__dirname, "./blog-service.js"));
const authData = require(path.join(__dirname, "./auth-service.js"));
const app = express();
// Parse application/x-www-form-urlencoded

app.use(express.urlencoded({ extended: false }));
// Setup client-sessions
app.use(clientSessions({
  cookieName: "session", // this is the object name that will be added to 'req'
  secret: "week10example_web322", // this should be a long un-guessable string.
  duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
  activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
}));
app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
 });
 
app.engine('.hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');
app.set('views', './views');

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "static")));

app.use(express.urlencoded({ extended: true }));
app.get("/dashboard", ensureLogin, (req, res) => {
  res.render("dashboard", { user: req.session.user, layout: "main" });
});
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});

// Helpers
Handlebars.registerHelper('navLink', function (url, options) {
  return '<li' +
    ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
    '><a href="' + url + '">' + options.fn(this) + '</a></li>';
});
Handlebars.registerHelper('equal', function (lvalue, rvalue, options) {
  if (arguments.length < 3)
    throw new Error("Handlebars Helper equal needs 2 parameters");
  if (lvalue != rvalue) {
    return options.inverse(this);
  } else {
    return options.fn(this);
  }
});
Handlebars.registerHelper('safeHTML', function (context) {
  return stripJs(context);
});
Handlebars.registerHelper('formatDate', function (dateObj) {
  let year = dateObj.getFullYear();
  let month = (dateObj.getMonth() + 1).toString();
  let day = dateObj.getDate().toString();
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
});

// Routes
app.get("/", (req, res) => {
  res.redirect("/blog");
});

app.get("/about", (req, res) => {
  //res.sendFile(path.join(__dirname, "/views/about.html"));
  res.render('about', { layout: 'main' });
});

app.get('/blog', ensureLogin, async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try {

    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category 
      posts = await blog_service.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blog_service.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // get the latest post from the front of the list (element 0)
    let post = posts[0];

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;
    viewData.post = post;

  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blog_service.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results"
  }

  // render the "blog" view with all of the data (viewData)
  res.render("blog", { data: viewData })

});

app.get('/blog/:id', ensureLogin, async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try {

    // declare empty array to hold "post" objects
    let posts = [];

    // if there's a "category" query, filter the returned posts by category
    if (req.query.category) {
      // Obtain the published "posts" by category
      posts = await blog_service.getPublishedPostsByCategory(req.query.category);
    } else {
      // Obtain the published "posts"
      posts = await blog_service.getPublishedPosts();
    }

    // sort the published posts by postDate
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // store the "posts" and "post" data in the viewData object (to be passed to the view)
    viewData.posts = posts;

  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the post by "id"
    viewData.post = await blog_service.getPostById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await blog_service.getCategories();

    // store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results"
  }
  // render the "blog" view with all of the data (viewData)
  res.render("blog", { data: viewData })
});

app.get("/posts", ensureLogin, (req, res) => {
  if (req.query.category != null) {
    blog_service.getPostsByCategory(req.query.category)
      .then((resolve) => {
        if (resolve.length > 0)
          res.render('posts', { layout: 'main', posts: resolve });
        else
          res.render("posts", { message: "no results" });
      })
      .catch((err) => {
        res.render("posts", { message: err });
      });
  } else {
    blog_service
      .getAllPosts()
      .then((resolve) => {
        if (resolve.length > 0)
          res.render('posts', { layout: 'main', posts: resolve });
        else
          res.render("posts", { message: "no results" });
      })
      .catch((err) => {
        res.render("posts", { message: err });
      });
  }
});


app.get("/categories", ensureLogin, (req, res) => {
  blog_service
    .getCategories()
    .then((resolve) => {
      if (resolve.length > 0)
        res.render('categories', { categories: resolve });
      else
        res.render("categories", { message: "no results" });
    })
    .catch((err) => {
      res.render('categories', { message: err });
    });
});

app.get("/categories/add", ensureLogin, (req, res) => {
  res.render('addCategory', { layout: 'main' });
});

app.post("/categories/add", ensureLogin, (req, res, next) => {

  let category = {
    category: req.body.category
  };
  blog_service.addCategory(category)
    .then(() => {
      res.redirect("/categories");
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

app.get("/posts/add", ensureLogin, (req, res) => {
  blog_service.getCategories().then((data) => {
    res.render('addPost', { layout: 'main', categories: data });
  }).catch((err) => {
    res.render('addPost', { layout: 'main', categories: [] });
  });
});

app.post("/posts/add", ensureLogin, upload.single("featureImage"), (req, res, next) => {
  const currentDate = new Date(Date.now());
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  const formattedDate = `${year}-${month}-${day}`;
  let title = req.body.title;
  let body = req.body.body;
  let category = req.body.category;
  let published = false;
  let postedDate = formattedDate;
  let featureImage = "";
  if (req.body.published === "on") {
    published = true;
  }
  if (req.file) {
    let streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result);
          } else {
            reject(error);
          }
        });
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };
    async function upload(req) {
      let result = await streamUpload(req);
      //console.log(result);
      return result;
    }
    upload(req).then((uploaded) => {
      processPost(uploaded.url);
    });
  } else {
    processPost("");
  }
  function processPost(imageUrl) {
    featureImage = imageUrl;
    let post = {
      title,
      body,
      category,
      published,
      postedDate,
      featureImage,
    };
    addPost(post)
      .then(() => {
        res.redirect("/posts");
      })
      .catch((error) => {
        res.status(500).send(error);
      });
  }
});

app.get("/categories/delete/:id", ensureLogin, (req, res) => {
  blog_service.deleteCategoryById(req.params.id).then(() => {
    res.redirect("/categories");
  }).catch((err) => {
    res.status(500).send("Unable to Remove Category/Category not found");
  });
});

app.get("/posts/delete/:id", ensureLogin, (req, res) => {
  blog_service.deletePostById(req.params.id).then(() => {
    res.redirect("/posts");
  }).catch((err) => {
    res.status(500).send("Unable to Remove Post/Post not found");
  });
});

app.get("/login", (req, res) => {
  res.render('login',{layout:"main"});

});

app.post("/login", (req, res) => {
  //res.render('login',{layout:"main"});
  req.body.userAgent=req.get("User-Agent");
 // console.log(req.body);
  checkUser(req.body).then(response=>{
    req.session.user = {
      userName:response.userName, // authenticated user's userName
      email:response.email, // authenticated user's email
      loginHistory:response.loginHistory // authenticated user's loginHistory
      }
      console.log(req.session.user);
    res.redirect("/posts");
    
  }).catch(err=>{

    res.render("login",{layout:"main",errorMessage:err});
  })

});



app.get("/logout", (req, res) => {

  req.session.destroy();
  res.redirect("/login")

});

app.get("/userHistory",ensureLogin, (req, res) => {
  res.render('userHistory',{layout:"main",loginHistory:req.session.user.loginHistory});

  
});



app.get("/register", (req, res) => {
  res.render('register',{layout:"main"});
  
});

app.post("/register", (req, res) => {
 // res.render('login',{layout:"main"});

 registerUser(req.body).then(response=>res.render("register",{layout:"main",successMessage:"User registered successfully"})).catch(err=>res.render("register",{layout:"main",errorMessage:err}));
  


  
});


// Handle invalid routes
app.use((req, res) => {
  res.render('404', { layout: "main" });
});

// Catch Errors
app.use(function (err, req, res, next) {
  res.status(500).send("Something broke!");
});

// Port to listen to requests
const HTTP_PORT = process.env.PORT || 8080;

function onHttpStart() {
  console.log("Express http server listening on " + HTTP_PORT);
}

blog_service
  .initialize()
  .then(authData.initialize())
  .then(() => {
    // Listen on port 8080
    app.listen(HTTP_PORT, onHttpStart);
  })
  .catch((msg) => {
    console.log("Error in initialize():" + msg);
  });
