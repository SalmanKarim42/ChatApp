// const register = require('./routes/register');
// const express = require('express');
// const router = express.Router();
const BCrypt = require('bcrypt');
const passport = require('passport');

module.exports = function (app, mongoose) {

    var User = mongoose.model('User');
    var Message = mongoose.model('Message');
    app.route('/')
        .get(ensureAuthenticated, (req, res) => {
            //   res.render(process.cwd()+'/views/pug/profile',{username:req.user.username});
            User.find({_id: {$ne : req.user._id}},{password:0},(err, data) => {
            //    console.log(data);
                res.render('home', { user: req.user , logedIn:true ,  users:data ,user_json:JSON.stringify(req.user) });
            });
        });

        // login
    app.route('/login')
        .get((req, res) => {
            res.render('login');
        })
        .post(passport.authenticate('local', { failureRedirect: '/login', failureFlash: 'Invalid username or password.' }), function (req, res) {
            console.log('User ' + req.isAuthenticated() + ' attempted to log in.');
            res.redirect('/');
        })




// register 


    app.route('/register')
        .get((req, res) => {
            // console.log('done');
            res.render('register');
        })
        .post((req, res, next) => {
            // console.log(req.body.email);
            User.findOne( {
                $or:[
                    { email: req.body.email },
                    { userName: req.body.email }
                ]
            }
                , (err, user) => {
                    // console.log(err)
                if (err) {
                    next(err);
                } else if (user) {
                    res.redirect('/register');
                } else {
                    var hash = BCrypt.hashSync(req.body.password, 12);
                    var newUser = new User({ name: req.body.name, email: req.body.username, userName: req.body.userName, password: hash,logedIn:true });
                    newUser.save((err, doc) => {
                        if (err) return res.redirect('/register')
                        // console.log('user ban gaya',doc);
                        // res.redirect('/');
                        next(null, doc);

                    });
                }
                // console.log(user);
            })

        },
            passport.authenticate('local', { failureRedirect: '/register' }),
            (req, res, next) => {
                console.log('err')
                res.redirect('/');
            }
        );
    app.route('/logout')
        .get((req, res) => {
            req.logout();
            res.redirect('/login');
        });
    function ensureAuthenticated(req, res, next) {
        // console.log(req.isAuthenticated())
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/login');
    };
    app.route('/api/messages/:sender/:receiver')
    .get((req,res)=>{
        console.log(req.params.sender, req.params.receiver) 
        Message.find({$or:[{senderId:req.params.sender,receiverId:req.params.receiver},{receiverId:req.params.sender,senderId:req.params.receiver}]},(err,docs)=>{
            res.json(docs);
        });
    })
    // error handler
    app.use((req, res, next) => {
        res.status(404)
            .type('text')
            .send('Not Found');
    });
}

