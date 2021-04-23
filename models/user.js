const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('../config/config').get(process.env.NODE_ENV);
const salt = 10;
const { hash } = require('bcrypt');
var mongoose = require('mongoose');
const userSchema = mongoose.Schema({
    name:{
        type:String,
        require: true,
        maxlength: 100
    },
    address:{
        type: String,
        require: true,
        maxlength: 200
    },
    // address:[{
    //     type: String,
    //     require: true,
    //     maxlength: 200
    // },{
    //     type:String,
    //     require:true,
    //     maxlength:200
    // }
    // ],
    phone:{
        type: String,
        require: true,
        minlength: 10
    },
    password:{
        type: String,
        require: true,
        minlength: 6
    },
    token:{
        type:String
    }
});

// Hàm này để mã hóa mật khẩu
userSchema.pre('save',function(next){
    var user = this;
    if(user.isModified('password')){
        bcrypt.genSalt(salt, function(err,salt){
            if(err)
                return next(err);
            bcrypt.hash(user.password, salt, function(err, hash){
                if(err)
                    return next(err);
                    user.password = hash;
                    next();
            })    
        })
    }
    else
    {
        next();
    }
});

// so sanh mat khau khi dang nhap
userSchema.methods.comparepassword = function(password, cb){
    bcrypt.compare(password,this.password, function (err, isMatch) {
        if(err)
            return cb(next);
        cb(null,isMatch);    
    });
}


userSchema.methods.generataToken = function(cb){
    var user = this;
    var token = jwt.sign(user._id.toHexString(), config.SECRET);
    user.token = token;
    user.save(function(err,user){
        if(err) return cb(err);
        cb(null, user);
    })
}
// kiem tra nguoi dung da dang nhap hay chua
userSchema.statics.findByToken = function(token, cb){
    var user = this;
    jwt.verify(token, config.SECRET, function(err, decode){
        user.findOne({"_id":decode,"token":token},function(err, user){
            if(err)
                return cb(err);
            cb(null, user);    
        })
    })
};

//xoa token  khi dang xuat
userSchema.methods.deleteToken = function(token, cb){
    var user = this;
    user.update({$unset:{token:1}}, function(err,user){
        if(err)
            return cb(err);
        cb(null, user);    
    })
}

module.exports=mongoose.model('User',userSchema);