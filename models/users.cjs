const mongoose = require('mongoose')


const userSchema = mongoose.Schema({
    firstName:{
        type: String,
        required:true
    },
    lastName:{
        type: String,
        required:true
    },
    email:{
        type: String,
        required:true,
        unique: true
    },
    password:String,
    role: {
        type: String,
        enum: ['user', 'admin'], 
        default: 'user',
    },
    lastLogin: {
        type: String, 
    },
    lastLogout: {
        type: String, 
    },
    
    
})

module.exports =  mongoose.model('User', userSchema);