const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Joi = require('@hapi/joi');
const nodemailer = require('nodemailer');

// Bring in User model
let User = require('../models/user');

// Bring in password reset Model
let PassReset = require('../models/forgotpassword');

// Nodemailer Transpoter details
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'jeethjose2313@gmail.com',
      pass: '14132313'
    }
});

// Schema for forgot password form
const forgotpasswordSchema = Joi.object({
    username: Joi.string().max(50).required(),
    email: Joi.string().max(50).email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required()
});

// Schema for New password Form
const newpassSchema = Joi.object({
    password1: Joi.string().max(50).required(),
    password2: Joi.ref('password1')
})

// Forgot Password
router.get('/forgotpassword', (req,res)=> {
    res.render('forgotpassword');
});

// Forgot password Form
router.post('/forgotpassword', (req,res) => {
    const validation = forgotpasswordSchema.validate(req.body);
    if(validation.error){
        req.flash('danger','Username and Email do not match');
        res.redirect('/passreset/forgotpassword');
    } else {
        User.find({username: req.body.username}, (err,user) =>{
            if(err){
                console.log(err)
                req.flash('danger','Username and email does not match');
                res.redirect('/passreset/forgotpassword');
            } else {
                if(user[0].email == req.body.email){
                    bcrypt.genSalt(10, (err,salt) => {
                        if(err){
                            console.log(err);
                        } else {
                            bcrypt.hash(salt,salt,(err,hash)=> {
                                if(err){
                                    console.log(err);
                                } else {
                                    let passreset = new PassReset({
                                        user: user[0]._id,
                                        token: hash
                                    });
                                    passreset.save();
                                    let reset_link = 'http://localhost:3000/passreset/newpass/';
                                    reset_link += passreset._id + hash;

                                    var mailOptions = {
                                        from: 'jeethjose2313@gmail.com',
                                        to: user[0].email,
                                        subject: `Reset Password`,
                                        text: `Click this link  \n${reset_link}`
                                    };
                                    transporter.sendMail(mailOptions, function(error, info){
                                        if (error) {
                                            console.log(error);
                                        } else {
                                            console.log('Email sent: ' + info.response);
                                            req.flash('success','Password reset link send to your email');
                                            res.redirect('/users/login');
                                        }
                                    });
                                }
                            })
                        }
                    })
                } else {
                    req.flash('danger','Username and email does not match');
                    res.redirect('/passreset/forgotpassword');
                }
            }
        });
    }
});

// Password Reset Form
router.get('/newpass/:id', (req,res) => {
    let token = req.params.id;
    let rp_hash = token.slice(24);
    let rp_id = token.slice(0,24);
    PassReset.findById(rp_id, function(err,passreset){
        if(err){
            console.log(err);
            res.status(404);
        } else {
            if(passreset.token == rp_hash) {
                res.render('newpass',{
                    token: token
                });
            } else {
                res.status(404);
            }
        }
    });
});

// Changing Password
router.post('/newpass/:id', (req,res) => {
    let token = req.params.id;
    let rp_hash = token.slice(24);
    let rp_id = token.slice(0,24);
    const password1 = req.body.password1;
    const password2 = req.body.password2;

    const validation = newpassSchema.validate(req.body);
    if(validation.error){
        console.log(validation.error);
    } else {
        PassReset.findById(rp_id, function(err,passreset){
            if(err){
                console.log(err);
                res.status(404);
            } else {
                if(passreset) {                     // Cross Check
                    let user_id = passreset.user;
                    User.findById(user_id, function(err,user){
                        bcrypt.genSalt(10, function(err,salt){
                            bcrypt.hash(password1, salt, function(err, hash){
                                if(err){
                                    console.log(err);
                                }
                                user.password = hash;
                                user.save(function(err){
                                    if(err){
                                        console.log(err);
                                        return;
                                    } else {
                                        req.flash('success','Password Changed Successfully');
                                        res.redirect('/users/login');
                                    }
                                });
                            })
                        });
                    });
                } else {
                    res.status(404);
                }
            }
        });
    }
});

module.exports = router;