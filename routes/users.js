const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const Joi = require('@hapi/joi');

// Bring in User Model
let User = require('../models/user');

// Register Schema
const registerSchema = Joi.object({
    name: Joi.string().max(20).required(),
    email: Joi.string().max(50).email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
    username: Joi.string().max(50).required(),
    password1: Joi.string().max(50).required(),
    password2: Joi.ref('password1')
})

// Register Form
router.get('/register', (req,res) => {
    res.render('register');
});

router.post('/register', (req,res) => {
    const name = req.body.name;
    const email = req.body.email;
    const username = req.body.username;
    const password1 = req.body.password1;
    const password2 = req.body.password2;

    const validation = registerSchema.validate(req.body);
    if(validation.error){
        req.flash('danger','Invalid User Info')
        res.render('register');
    } else{
        let newUser = new User({
            name:name,
            email:email,
            username:username,
            password:password1
        });
        bcrypt.genSalt(10, function(err,salt){
            bcrypt.hash(newUser.password, salt, function(err, hash){
                if(err){
                    console.log(err);
                }
                newUser.password = hash;
                newUser.save(function(err){
                    if(err){
                        console.log(err);
                        return;
                    } else {
                        req.flash('success','Registration Successful...');
                        res.redirect('/users/login');
                    }
                });
            })
        });
    }
});

// Login Form
router.get('/login', (req,res) => {
    res.render('login');
});

// Login Process
router.post('/login', (req,res,next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req,res,next);
});

// Logout Process
router.use('/logout', (req,res) => {
    req.logout();
    req.flash('success','You are logged out');
    res.redirect('/users/login');
});
// Exports
module.exports = router;