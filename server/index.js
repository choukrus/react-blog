const express = require('express');
const app = express();

const mongoose = require('mongoose');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const config = require('./config/key');
const bcrypt = require("bcrypt");

const User = require('./model/user');
const {auth} = require("./middleware/auth");



mongoose.connect(config.mongoURI,
    {
        useUnifiedTopology: true,
        useNewUrlParser: true
    }).then(() => {
    console.log("DB connected");
}).catch((err => console.error(err)));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());


app.get("/api/user/auth" ,auth ,(req, res) => {
    res.status(200).json({
        _id: req._id,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role
    })
});

app.post('/api/users/register', (req, res) => {
    console.log("has been called");
    var user = new User(req.body);
    user.save((err, doc) => {
        if (err) {
            console.log("failed");
            return res.json({success: false, err});
        }
        else {
            console.log("success");
        res.status(200).json(
            {
            success: true,
            userData: doc
        });
        return doc;
        }
    })

});

app.post('/api/user/login', (req, res) => {
    //find the email
    console.log("called");
    User.findOne({email: req.body.email}, (err, user) => {
        console.log(req.body.email);
        if(!user) {
            return res.json({
                loginSuccess: false,
                message: "Auth failed, email not found"
            });

        }

        //compare password
        user.comparePassword(req.body.password, (err, isMatch) => {
            if(!isMatch) {
                return res.json( {
                    loginSuccess: false,
                    message: "wrong password"
                })
            }
        })

        //generateToken
        user.generateToken((err, user) => {
            if(err) return res.status(400).send(err);
            res.cookie("x_auth", user.token)
                .status(200)
                .json( {
                    loginSuccess: true
                });
        });
    });

});

 app.get("/api/user/logout", auth ,(req,res)  => {
   User.findOneAndUpdate({_id: req.user._id}, { token: "" }, (err, doc) => {
       if (err) return res.json({success: false, err})
       return res.status(200).send({
           success: true
       })
   })
});

const port = process.env.PORT || 5000;


app.listen(port, () => {
    console.log(`Server running at ${port}`);
});
