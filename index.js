const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());
app.use(cookieParser());
const db=require('./config/config').get(process.env.NODE_ENV);
const User = require('./models/user');
const {auth} = require('./middlewares/auth');

// connection database
mongoose.Promise = global.Promise;
mongoose.connect(db.DATABASE,{useNewUrlParser:true, useUnifiedTopology:true},function(err){
    if(err)
        console.log(err);
        console.log(`connection thanh cong`);
});

app.get('/',function(req,res){
    res.status(200).send(`Welcom to Me`)
});

// Dang ky nguoi dung
app.post('/api/register',function(req,res){
    // taking a user
    const newuser=new User(req.body);
    console.log(newuser);
    if(newuser.name=="")
        return res.status(400).json({
            message:"xin dien name vao"
        });
    if(newuser.address=="")
        return res.status(400).json({
            message:"xin dien address vao"
        });    
    if(newuser.password=="")
        return res.status(400).json({
         message: "xin moi dien mat khau vao"
     });
    if(newuser.phone =="")
        return res.status(400).json({
            message:"xin moi dien so dien thoai vao"
        });
    User.findOne({phone:newuser.phone},function(err,user){
        if(user) 
            return res.status(400).json({ 
                auth : false, message :"phone da dang ky"
            });
 
        newuser.save((err,doc)=>{
            if(err) {console.log(err);
                return res.status(400).json({ success : false});}
            res.status(200).json({
                succes:true,
                user : doc
            });
        });
    });
 });

 // login
 app.post('/api/login', function(req,res){
    let token=req.cookies.auth;
    User.findByToken(token,(err,user)=>{
        if(err) return  res(err);
        if(user) return res.status(400).json({
            error :true,
            message:"You are already logged in"
        });
    
        else{
            User.findOne({'phone':req.body.phone},function(err,user){
                if(!user) return res.json({isAuth : false, message : ' Auth failed ,phone not found'});
        
                user.comparepassword(req.body.password,(err,isMatch)=>{
                    if(!isMatch) return res.json({ isAuth : false,message : "password doesn't match"});
        
                user.generataToken((err,user)=>{
                    if(err) return res.status(400).send(err);
                    res.cookie('auth',user.token).json({
                        isAuth : true,
                        id : user._id
                        ,phone : user.phone
                    });
                });    
            });
          });
        }
    });
});
// lay thong tin nguoi dang nhap
app.get('/api/profile',auth,function(req,res){
    res.json({
        isAuth: true,
        id: req.user._id,
        phone: req.user.phone,
        name: req.user.name + req.user.address,
        token: req.user.token
        
    })
});

//logout
app.get('/api/logout',auth,function(req,res){
    req.user.deleteToken(req.token,(err,user)=>{
        if(err) return res.status(400).send(err);
        res.sendStatus(200);
    });

}); 

const PORT = process.env.PORT||3000;
app.listen(PORT,()=>{
    console.log(`app is live at ${PORT}`);
});