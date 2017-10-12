/**
 * Init Dependencies
 */
const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const multer  = require('multer');
const local = require('./env/local.js');
const mysql = require('mysql');

/**
 * Using Dependencies
 */
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.set('views', 'views');
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/public', express.static(__dirname + "/public"));

/**
 * Define the configuration for Nodemailer
 */
var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: local.email,
		pass: local.pass
	}
});

/**
 * SQL Database CreateAction
 */
var con = mysql.createConnection({
	host: local.db_host,
	user: local.db_user,
	password: local.db_password,
	database: local.db_name
});

/**
 * Define the configuration for Multer
 */
const storage = multer.diskStorage({
	filename: function (req, file, cb) {
		var guid = guidGenerator();
		var newName = file.originalname.split(".");
		newName = newName[0]+guid+"."+newName[1];
		cb(null, newName);
	},
	fileFilter: function (req, file, cb) {
		var filetypes = /jpg|jpeg|JPG|JPEG|png|PNG|pdf|PDF|gif|GIF/;
		var mimetype = filetypes.test(file.mimetype);
		var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
		if (mimetype && extname) {
			return cb(null, true);
		}
		cb("Error: File upload only supports the following filetypes - " + filetypes);
	},
	destination: function (req, file, cb) {
		cb(null, 'uploads/')
	}
});
var upload = multer({ storage: storage });


/**
 * Set & Get unique string to concat with the filename
 */
function guidGenerator() {
	var S4 = function() {
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	};
	return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

/**
 * Home Page
 */
app.get('/', function (req, res) {
  res.render('index', {
  	currPath: req.path,
  	title: 'Hello Node',
  	header_title: 'Hello Node !',
  	header_text: 'Welcome on my first node application'
  });
});

/**
 * About Page
 */
app.get('/about', function (req, res) {
  res.render('about', {
  	currPath: req.path,
  	title: 'Hello Node - About',
  	header_title: 'About Me !',
  	header_text: 'Welcome on my first node application'
  });
});

/**
 * Project Page
 */
app.get('/project', function (req, res) {

	//Get Projects from Database
	con.query("SELECT * FROM projects", function (err, result, fields) {
		if (err) throw err;
		res.render('project', {
			currPath: req.path,
			title: 'Hello Node - Project',
			header_title: 'About My Projects !',
			header_text: 'Welcome on my first node application',
			projects: result
		});
	});
});

/**
 * Contact Page
 */
app.get('/contact', function (req, res) {
  res.render('contact', {
  	currPath: req.path,
  	title: 'Hello Node - Contact',
  	header_title: 'Contact Me',
  	header_text: 'Welcome on my first node application'
  });
});

/**
 * Contact Form Action
 * Send mail to the Admin, with an attachments or an error if something's wrong
 */
app.post('/contact-me', upload.single('filetoupload'), function(req, res) {
	var user_name = req.body.name.trim();
  	var user_email = req.body.email.trim();
  	var user_message = req.body.message.trim();
	var myfile = req.file;
  	var statusMsg = true;
  	var regaz = /^[a-zA-Z çéàè ÁÉÇÈ]{2,}$/;
  	var regText = /^[a-zA-Z ÉÀé(è!?çà&@\'\"\n\t@:0-9 \/.,]{2,}$/mg;
  	var regMail = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;

	if(myfile == undefined){
		var my_file = "";
	} else {
		var my_file = [{ path : myfile.path, filename:myfile.originalname}];
	}
	if(user_name.search(regaz) !== -1 && user_message.search(regText) !== -1 && user_email.search(regMail) !== -1){
		 var message = 'Message from : http://yourwebsite.com <p> Name : '+user_name+' </p><p> Email : '+user_email+'</p><p> Message :</p> '+user_message+'</p>';
			var mailOptions = {
				from: 'samiaibeche@gmail.com', //Website url email address
				to: 'samiaibeche@gmail.com', //Admin email address
				subject: 'Sending Email using Node.js',
				text: message,
				attachments : my_file
			};
			transporter.sendMail(mailOptions, function(error, info){
			  if (error) {
			    console.log(error);
			  } else {
			    res.render('contact', {
				  	currPath: req.path,
				  	title: 'Hello Node - Contact',
				  	header_title: 'Contact Me',
				  	header_text: 'Welcome on my first node application',
				  	msgStatus: statusMsg
				});
			  }
			});
	} else {
		statusMsg = false;
		res.render('contact', {
			currPath: req.path,
			title: 'Hello Node - Contact',
			header_title: 'Contact Me',
			header_text: 'Welcome on my first node application',
			msgStatus: statusMsg
		});

	}
});

/**
 * Set your port
 */
app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});

/**
 * Set 404 status & redirect to the 404 page if the route doesn't exist
 */
app.get('*', function(req, res){
  res.status(404);
  res.render('404');
});