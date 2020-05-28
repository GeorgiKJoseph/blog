const express = require('express');
const router = express.Router();
const Joi = require('@hapi/joi');


// Bring in Article Models
let Articles = require('../models/article');
let User = require('../models/user');

// Add Route
router.get('/add',ensureAuthenticated, (req,res) => {
    res.render('add_article', {
        title:'Add Article'
    })
});

// Article Schema
const article_schema = Joi.object({
    title : Joi.string().max(20).required(),
    body : Joi.string().required()
})

// Add new Article
router.post('/add',ensureAuthenticated, (req,res) => {
    const validation = article_schema.validate(req.body);
    if(validation.error){
        req.flash('danger','Invalid Format');
        res.status(400).redirect('/article/add');
    }
    else{
        let article = new Articles();
        article.title = req.body.title;
        article.author = req.user._id;
        article.body = req.body.body;
        article.save((err) => {
            if (err){
                console.log(err);
            }else{
                req.flash('success','Article Added');
                res.redirect('/');
            }
        })
    }
});

// Get a Single article
router.get('/:id', (req,res) => {
    Articles.findById(req.params.id, (err, article) =>{
        if(err){
            console.log(err);
        }else{
            if(article){
                User.findById(article.author, (err,user) => {
                    res.render('article',{
                        article: article,
                        author: user.name,
                    })
                });
            } else {
                req.status(404);
            }
        }
    });
});

// Edit Article
router.get('/edit/:id',ensureAuthenticated,(req, res) => {
    Articles.findById(req.params.id,(err,article) => {
        if(err){
            console.log(err);
        }else{
            if(article.author == req.user._id){
                res.render('edit_article',{
                    article: article
                });
            } else {
                res.redirect('/');
            }
        }
    });
});

// Save Edited Article
router.post('/edit/:id', ensureAuthenticated, (req,res) => {
    const validation = article_schema.validate(req.body);
    if(validation.error){
        req.flash('danger','Invalid Format');
        res.redirect('/article/edit/'+req.params.id);
    }
    else{
        Articles.findById(req.params.id, (err,article) =>{
            if(err){
                console.log(err);
            }else{
                article.title = req.body.title;
                article.author = req.user._id;
                article.body = req.body.body;
                article.save((err) =>{
                    if(err){
                        console.log(err);
                    }else{
                        req.flash('success','Article Updated');
                        res.redirect('/article/'+article.id);
                    }
                });
            }
        });
    }
});

// Delete Article
router.delete('/delete/:id',ensureAuthenticated, (req,res) =>{
    let query = {_id:req.params.id}
    Articles.findById(req.params.id, function(err,article){
        if(article.author != req.user._id){
            res.status(500).send();
        } else {
            Articles.remove(query, (err) =>{
                if(err){
                    console.log(err);
                }
                else{
                    req.flash('danger','Article Deleted')
                    res.send("Deleted");
                }
            });
        }
    });
});

// Access Control
function ensureAuthenticated(req,res,next){
    if(req.isAuthenticated()){
        return next();
    } else {
        req.flash('danger','Please Login');
        res.redirect('/users/login');
    }
}


module.exports= router;