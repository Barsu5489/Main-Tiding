const express = require('express')
const mysql = require('mysql')
const bcrypt = require('bcrypt')
const session = require('express-session')

const app = express()

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tidings',
    timezone:'local'
})

app.use(session({
    secret:'elect',
    resave:false,
    saveUninitialized:false
}))
app.use((req,res,next)=>{

    if(req.session.userId===undefined){
        res.locals.isloggedIn = false;
            
       
    }else{
        res.locals.isloggedIn = true;
        res.locals.username = req.session.username;
       
    }

    next();
})

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({extended: false}))


app.get('/', (req, res) => {
    res.render('home.ejs')
})

app.get('/about', (req, res) => {
    res.render('about-us.ejs')
})
connection.query(
    'SELECT dateposted FROM tyds',(error,results)=>{
        
        var data= results
        var spli = data[0]
        var data = spli.dateposted.toString()
        let date_post = data.split(' ').slice(0,5).join(' ')
        
        console.log(date_post)
        //console.log(new Date(data))
    }
)
app.get('/new-tyd', (req, res) => {
    if(res.locals.isloggedIn){
        res.render('new-tyd.ejs')
    }else{
        res.redirect('/login')
    }

   
})

app.post('/new-tyd',(req,res)=>{
connection.query(
    'INSERT INTO tyds (tyd, userID) VALUES(?,?)',
    [req.body.tyd, req.session.userId],
    (error,results)=>{
        res.redirect('/tyds')
    }
)
})
app.get('/tyds',(req,res)=>{
    if(res.locals.isloggedIn){
        connection.query(
            'SELECT * FROM tyds JOIN users ON tyds.userID = users.id',
            (error,results)=>{
              
                res.render('tyds.ejs',{tyds:results})
            
            }
        )
        
    }else{
        res.redirect('/login')
    }
})



app.get('/login', (req, res) => {
    let user = {
        email: '',
        password: ''
    }
    res.render('login.ejs', {error: false, user: user})
})

app.post('/login', (req, res) => {
    let user = {
        email: req.body.email,
        password: req.body.password
    }

    connection.query(
        'SELECT * FROM users WHERE email = ?', [user.email],
        (error, results) => {
            if (results.length > 0) {
                bcrypt.compare(user.password, results[0].password, (error, isEqual) => {
                    if(isEqual) {
                        req.session.userId = results[0].id
                        req.session.username = results[0].fullname.split(' ')[0].toLowerCase()
                        res.redirect('/tyds')
                    } else {
                        let message = 'Email/Password mistmatch.'
                        res.render('login.ejs', {error: true, message: message, user: user})
                    }
                })

            } else {
                let message = 'Account does not exist. Please create one'
                res.render('login.ejs', {error: true, message: message, user: user})
            }
        }
    )    


})
app.get('/logout',(req,res)=>{
    req.session.destroy((error)=>{
        res.redirect('/')
    })
})

app.get('/signup', (req, res) => {
    let user = {
        email: '',
        fullname: '',
        gender: '',
        password: '',
        confirmPassword: ''
    }
    res.render('signup.ejs', {error:false, user: user})
})

app.post('/signup', (req, res) => {
    let user = {
        email: req.body.email,
        fullname: req.body.fullname,
        gender: req.body.gender,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword
    }

    if(user.password === user.confirmPassword) {
        connection.query(
            'SELECT email FROM users WHERE email = ?', [user.email],
            (error, results) => {
                if(results.length === 0) {
                    bcrypt.hash(user.password, 10, (error, hash) => {
                        connection.query(
                            'INSERT INTO users (email, fullname, gender, password) VALUES (?,?,?,?)',
                            [user.email, user.fullname, user.gender, hash],
                            (error, results) => {
                                res.redirect('/login')
                            }
                        )
                    })
                } else {
                    let message = 'Email already exists.'
                    res.render('signup.ejs', {error: true, message: message, user: user})
                }
            }
        )
    } else {
        let message = 'Password & Confirm Password do not match.'
        console.log(user)
        res.render('signup.ejs', {error: true, message: message, user: user})
    }

})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server up on PORT ${PORT}`)
})