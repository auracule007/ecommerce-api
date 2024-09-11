const User = require('../models/users');
const bcrypt = require('bcryptjs');
const dotenv = require("dotenv");
const { validateUser } = require("../validators");
const transporter = require("../config/email");

dotenv.config();

exports.register = async (req, res) => {
    const { firstName, lastName, password, confirmPassword,email, phone, role } = req.body;

    if( password !== confirmPassword) {
        return res.json("Password do not match").status(400)
    }

    const { error } = validateUser(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        let user = await User.findOne({ email })    
        if (user) {
            return res.json("User already exists!...").status(400)
        }

        user = new User({ firstName, lastName, password, confirmPassword,email, phone, role });
        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(user.password, salt)
        await user.save()
        
        const mailOption = {
            from: process.env.EMAIL_USER, // sender address
            to: user.email, // list of receivers
            subject: "Hello ✔ users", // Subject line
            text: "Hello world?", // plain text body
        }

        await transporter.sendMail(mailOption);

        const token = user.generateAuthToken()
        res.header("auth-token", token).json(user)

    } catch (error) {
        console.log({ message: error.message })
    }
}


exports.login = async (req, res) => {
    const { email, password } = req.body;

    try{
        const user = await User.findOne({ email });
        if(!user) {
            return res.status(400).json({message: "Invalid Email" });
        }
    
        const validatePassword = await bcrypt.compare(password, user.password);
        if (!validatePassword) { 
            return res.status(400).json({ message: "Invalid password" });
        }
    
        const token = user.generateAuthToken()
        res.header("auth-token", token).json({ token })
    } catch (error) {
        console.log({  message: error.message })
    }
}


exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate();
        if (!user) return res.status(400).json({ message: "User does not exist" })
        res.json(user);
    }catch(error) {
        console.log({ message: error.message })
    }
}