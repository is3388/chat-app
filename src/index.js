// for express (node server) to support web socket (bidirectional and persistent connection),
// Refactor the code. But it doesn't affect the behavior of the server 

const path = require('path') // node core module called path to work with path
const http = require('http') // load in http core module on purpose as we want to bypass Express configuration not support web sockets. 
const express = require('express') // load in express module
const socketio = require('socket.io') // web socket protocol
const Filter = require('bad-words') // library to filter profanity
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/user')

const app = express() // create an express app
const server = http.createServer(app) // create new web server and pass the express app. Do it explicitly to bypass Express configure the server
const io = socketio(server) // create an instance of socket.io to configure socketio work with that raw  http server only
// so that our server support web sockets protocol

const port = process.env.PORT || 3000 //port based on env PROD or DEV which is default 3000 
const publicDirectoryPath = path.join(__dirname, '../public') 

app.use(express.static(publicDirectoryPath)) // the public directory to be served up

//let count = 0

// to further configure to work with the client connect to the server
// use on() fuction passing the event name and the function to be fired up when the event occurs
// here using connection event which fires whenever socketio gets new connection
// we also need the client side version of web socket library in order to client to communicate with the server
// pass in socket which is an object from socket.io servercontains about new connection and can use methods to on socket
// we need to create a js folder called chat.js under public folder to hold all js files
io.on('connection', (socket) =>
{ //whenever a socket connection is established by a client, the 'connection' event is emitted by the socket server and that socket connection is passed in as an argument.
    console.log('New WebSocket connection') // this callback code will be run whenever new connection occurs
    // for server to send updated count to all newly connected clients
    /*socket.emit('counterUpdated', count) // pass in custom event name and that event will be available for the callback function on the client
    // the server listens to the client sending that event and add one to counter
    socket.on('increment', () =>
    {
        count++
        //socket.emit('counterUpdated', count) // server send back the updated count to specific connection
        io.emit('counterUpdated', count) // emit that event to every single connection currently available
    }) */
    // use socket.io features to actually join these individual rooms
    // use method only for server to join a given chat room and pass the name of the room to join
    socket.on('join', ({username, room}, callback) => { 
        // or socket.on('join', ({options, callback) => { 
        //   const { error, user } = addUser({ id: socket.id, ...options }) 
        // either return error or user with properties
        const { error, user } = addUser({ id: socket.id, username, room }) 
    
        if(error)
        {
            return callback(error)
        }

    
        socket.join(user.room)
        // io.to.emit is to emit an event to everyone in a specific room
        // socket.broadcast.to.emit is to send event to everyone except specifi client limit it to a specfic chat room
        // same custom event called message but with different data to be emitted
    //socket.emit('message', 'Welcome!') // to that newly conncected client
    socket.emit('message', generateMessage('Admin', 'Welcome!'))
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined!`))
    // anounce that someone join in this room, so that pass it to client side to populate the sidebar with users and room
    io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
    })
    callback()
    })
    
    //socket.broadcast.emit('message', 'A new user has joined.') // use broadcast to all connected client EXCEPT the one who just connect
    //socket.broadcast.emit('message', generateMessage('A new user has joined.'))
    //socket.on('sendMessage', (message, callback) =>
    socket.on('sendMessage', (message, callback) =>
    {   
        const user = getUser(socket.id)
        // initialize bad-words 
        const filter = new Filter() // return T or F
        if(filter.isProfane(message)) // filter.addWords/clean/removeWords/replaceWord
        {
            return callback('Profanity is not allowed!')// client side will show this message
        }
        //io.emit('message', message) // message is the data and callback is the function 
        io.to(user.room).emit('message', generateMessage(user.username, message))
        //callback('Delivered!') // for acknowledgement call this to trigger the function from the sender which is the client. Can provide 
        // argument as data sending along then sender will get it 
        callback() // if use bad-words to filter the message, not passing anything as arg
    })
    // run callback when the particular user disconnects. No need to use broadcast or pass in (socket) as the user already disconnected
    // disconnect just like connection is a built-in event from socket.io
    socket.on('disconnect', () =>
    {
        const user = removeUser(socket.id)
        if(user)
        {
        //io.emit('message', 'A user has left!')
        io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left!`))
        // anounce that someone leave this room, so that pass it to client side to populate the sidebar with users and room
        io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
        })
        }
    })
    // listen to sendLocation event from a particular connected client and send to all connected clients
    socket.on('sendLocation', (coords, callback) =>
    {
        const user = getUser(socket.id)
        //io.emit('message', 'Location: ' + coords.latitude + ' ,' + coords.longitude)
        //io.emit('message', `Location: ${coords.latitude}, ${coords.longitude}`)
        // a link to google map to show your location
        //io.emit('message', `https://google.com/maps?q=${coords.latitude},${coords.longitude}`)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
    
})

// io - like broadcast to every connection
// socket - target only specific connection

/*app.set('', (req, res) =>
{
    res.render('index',
    { title: 'Chat App'})
})*/

/* app.listen(port, () =>
{
    console.log(`Server is up and running on port ${port}`)
})*/
// to start up http server we made
server.listen(port, () =>
{
    console.log(`Server is up and running on port ${port}`)
})