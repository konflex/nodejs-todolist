const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express()

var corsOptions = {
	origin: "http://localhost:8080",
	credentials: true, 
	};

app.use(cors(corsOptions))

// add middleware before routes
app.use(express.json())

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }))

const db = require("./api/models")

db.mongoose
	.connect(process.env.MONGODBKEY, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(() => {
		console.log("Successfully connect to MongoDB")
	})
	.catch(err => {
		console.error("Connection error", err)
		process.exit()
	})




app.get('/', (req,res) => {
	res.json({ message: "Welcome to the todo list application"})
})


//ROUTES
require("./api/routes/auth.routes")(app)
require("./api/routes/task.routes")(app)


const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
	console.log(String.raw`
===============================================================
 ______   ___   ___     ___       _      ____ _____ ______     
|      | /   \ |   \   /   \     | |    |    / ___/|      |    
|      ||     ||    \ |     |    | |     |  (   \_ |      |    
|_|  |_||  O  ||  D  ||  O  |    | |___  |  |\__  ||_|  |_|    
  |  |  |     ||     ||     |    |     | |  |/  \ |  |  |      
  |  |  |     ||     ||     |    |     | |  |\    |  |  |      
  |__|   \___/ |_____| \___/     |_____||____|\___|  |__|      
														
        ____    ____    __  __  _  _____  ____   ___           
       |    \  /    |  /  ]|  |/ ]|    _]|    \ |   \          
       |  o  )|  o  | /  / |  ' / |   [_ |  _  ||    \         
       |     ||     |/  /  |    \ |    _]|  |  ||  D  |        
       |  O  ||  _  /   \_ |     ||   [_ |  |  ||     |        
       |     ||  |  \     ||  .  ||     ||  |  ||     |        
       |_____||__|__|\____||__|\_||_____||__|__||_____|        
														
===============================================================
	`)
})