const passport = require('passport');

const LocalStrategy = require('passport-local');
const ObjectID = require('mongodb').ObjectID;

const BCrypt = require("bcrypt");
module.exports = function (app, mongoose) {
    var Schema = mongoose.Schema;
    var users = new Schema({
        name: {
            type: String,
            required: true
        },
        email: { type: String, required: true, unique: true },
        logedIn: { type: Boolean, default: false },
        password: { type: String, required: true, minlength: 8 },
        userName: { type: String, required: true, unique: true },
        // messages: { type: [Schema.Types.ObjectId], default: [] },
        lastSeen: { type: Date, default: new Date() },
        socketId: { type: String, default: null }

    });
    var messages = new Schema({
        message: {
            type: String,
            default: ''
        },
        time: { type: Date, default: new Date() },
        senderId: Schema.Types.ObjectId,
        receiverId: Schema.Types.ObjectId,
    })
    var Message = mongoose.model('Message', messages);

    var User = mongoose.model('User', users);



    passport.serializeUser((user, done) => {
        done(null, { _id: user._id, name: user.name });
    });

    passport.deserializeUser((user, done) => {
        User.findOne({ _id: new ObjectID(user._id) }, (err, doc) => {
            done(null, doc);
        });
    });

    passport.use(new LocalStrategy((username, password, done) => {
        // console.log(username,password);
        User.findOne({
            $or: [
                { email: username },
                { userName: username }
            ]
        }, (err, user) => {
            // console.log(user)
            if (err) return done(err);
            if (!user) return done(null, false);
            if (!BCrypt.compareSync(password, user.password)) return done(null, false);
            
            return done(null, user);
        });
    }));

}