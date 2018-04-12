var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var methodOverride = require('method-override');

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  useMongoClient: true
});


// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

app.use(methodOverride('_method'))

var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));

app.set("view engine", "handlebars");

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/newsscraper");

// Routes
app.get("/", function(req, res){
  db.Article.find({})
  .then(function(data) {
    var hbsObject = {
      Article: data
    };
    res.render("index", hbsObject)
  
  })
  .catch(function(err) {
    // If an error occurs, send the error back to the client
    res.json(err);
  });
});

app.get("/saved", function(req, res){
  db.Article.find({})
  .then(function(data) {
    var hbsObject = {
      Article: data
    };
    res.render("saved", hbsObject)
  
  })
  .catch(function(err) {
    // If an error occurs, send the error back to the client
    res.json(err);
  });
});

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("https://www.lgbtqnation.com/category/archive/world/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $(".detail").each(function(i, element) {
      // Save an empty result object
      //console.log("Element" + element)
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(element).children("h3").text();
      result.link = $(element).children("h3").children("a").attr("href");
      result.excerpt = $(element).children(".archive-item-excerpt").text();

      // Create a new Article using the `result` object built from scraping

      console.log("result", result)
      
      //SAVE ARTICLE GET ROUTE vv
      
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });
   // $('#myModal').modal('toggle')
    // If we were able to successfully scrape and save an Article, send a message to the client
    res.redirect("/");
  });
});

// Route for getting all Articles from the db
// app.get("/articles", function(req, res) {
//   // TODO: Finish the route so it grabs all of the articles
//   db.Article.find({})
//   .then(function(dbArticle) {
//     // If all Notes are successfully found, send them back to the client
//     res.json(dbArticle);
//   })
//   .catch(function(err) {
//     // If an error occurs, send the error back to the client
//     res.json(err);
//   });
// });

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // TODO
  // ====
  // Finish the route so it finds one article using the req.params.id,
  // and run the populate method with "note",
  // then responds with the article with the note included
  db.Article.findOne({ _id: req.params.id})
  .populate("note")
    .then(function(dbArticle) {
      // If any Libraries are found, send them to the client with any associated Books
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});

app.put("/articles/:id", function(req, res) {

 db.Article.update({ _id: req.params.id }, { $set: { saved: true }})
.then(function(dbArticle) {
    console.log(dbArticle)
    res.redirect("/")
})
.catch(function(err) {
    res.json(err);
})
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // TODO
  // ====
  //console.log(req.body)
  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
  db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
  })
  .then(function(dbArticle) {
      res.json(dbArticle);
  })
  .catch(function(err) {
      res.json(err);
  });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});


app.delete("/articles/:id", function(req, res){


})