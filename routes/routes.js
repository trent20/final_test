const { User, Message, Likes } = require('../models/models.js')
const jwt = require('jsonwebtoken')
const { Router } = require('express')
const router = Router();
process.env.SECRET_KEY = "theSecret"


router.get('/', async function (req, res){
    let messages = await Message.findAll({ include: User })
    let likees = await Likes.findAll({ include: Message })
    res.render('index', {data: messages, likees: likees})
})

router.get('/createUser', async function(req, res){
    res.render('createUser.ejs')
})

router.post('/createUser', async function(req, res){
    let { username, password } = req.body

    try {
        await User.create({
            username,
            password,
            role: "user"
        })  
    } catch (e) {
        console.log(e)
    }

    res.redirect('/login')
})

router.get('/login', function(req, res) {
    res.render('login')
})

router.post('/login', async function(req, res) {
    let {username, password} = req.body


    try {
        let user = await User.findOne({
            where: {
                username
            }
        })
        if (user && user.password === password) {
            let data = {
                username: username,
                role: user.role
            }
    
            let token = jwt.sign(data, process.env.SECRET_KEY)
            res.cookie("token", token)
            res.redirect('/')
        } else {
            res.redirect('/error')
        }
    } catch (e) {
        console.log(e)
    }
})

router.get('/message', async function (req, res) {
    let token = req.cookies.token 
    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if(err){
            res.render('login')
            console.log(err)
        }
        if(decoded){
            res.render('message')
            console.log(decoded)
        }
    })
})

router.post('/message', async function(req, res){
    let { token } = req.cookies
    let { content } = req.body

    if (token) {
        let payload = await jwt.decode(token, "theSecret")  
        console.log(payload)
        let user = await User.findOne({
            where: {
                username: payload.username
            }
        })

        let msg = await Message.create({
            content,
            time: new Date(Date.now()),
            UserId: user.id
        })
        
        console.log(msg)
        res.redirect('/')
    } else {
        res.redirect('/login')
    }
})

router.post('/score', async function (req, res) {
    let msgId = req.body.content
    let messages = await Message.findAll({ include: User })
    console.log(msgId)
    let likees
    let msg = await Message.findOne({
        where: {
            id: msgId
        }
    })
    let like = await Likes.findOne({
        where: {
            MessageId: msg.id
        }
    })
    if(!like){
        like = await Likes.create({
            likes: + 1,
            MessageId : msg.id
        })
    } else {
        like.update({
            likes: like.likes+1
        })
        likees = like.likes
        console.log(likees)
    }
    likees = await Likes.findAll({ include: Message })
    for(let l of likees){
        console.log(l.dataValues.likes)
    }
    res.render('index', {likees: likees, data: messages} )
})

router.get('/error', function(req, res){
    res.render('error')
})

router.all('*', function(req, res){
    res.send('404 dude')
})

module.exports = router