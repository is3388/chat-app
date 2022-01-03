const socket = io() //call this function to connect to the server and once the connection is established, you will see the log message
// use $sign is conventional for element from the DOM which is easy to parse
const $messageForm = document.querySelector('#messageForm')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
// 2 things we need for render template. 1. template itself and the place where the template renders
const $messages = document.querySelector('#messages')

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
// both client and server can use socket's method, the object contains info about the connection
// before client send out something, client should receive something from the server

// Using qs library to parse the query string to get the username and room. location.search is provided by browser to get the query string 
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true }) // to take care of question mark

// function to perform autoscrolling only when user viewing the most recent content not search/view older content
// make sure no autoscrolling when user is checking the chat history 
const autoscroll = () =>
{
    // new message element
    const $newMessage = $messages.lastElementChild // the latest new message
    /*const $newMessage = $messages.lastElementChild // the latest new message
    $newMessage.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"}) */
    // height of the message including the content itself and the margin bottom
    const newMessageStyles = getComputedStyle($newMessage) // browser provided function to find the margin bottom
    const newMessageMargin = parseInt(newMessageStyles.marginBottom) // convert pixel to number
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin // figure out how tall the message excluding margin plus margin
    // visible height

    const visibleHeight = $messages.offsetHeight // input message height excluding the margin bottom
    // height of message container
    const containerHeight = $messages.scrollHeight // the total height we are able to scroll through
    // how far down have we scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight // the amount of distance we scrolled from the top which is 0
    // get higher value as we scroll down. ScrollTop is the distance between the top of content and the top of the scrollbar
    // then we add on the scrollbar height which is the height of the container that gives us the picture of how close to the bottom we are
   if(containerHeight - newMessageHeight <= scrollOffset)
   {
       // perform auto scroll if we are in the bottom before the new message adding
       $messages.scrollTop = $messages.scrollHeight //set scrollTop to the height of the content
   }
}

// this single connection listens. 2nd arg is the function. whatever pass in the 2nd one from the server
socket.on('message', (message) => //message is an object not only a string 
{
    console.log(message) // moment lib is already loaded via script tag in index.html
    const html = Mustache.render(messageTemplate, { username: message.username, message: message.text, createdAt: moment(message.createdAt).format('h:mm a') }) // use Mustache templating lib to define html template
    // and render with our data from js, so it can render all sorts of dynamic data to the page
    $messages.insertAdjacentHTML('beforeend', html) // insert content before the message div ends
    autoscroll()
})

socket.on('locationMessage', (message) =>
{ 
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {username: message.username, url: message.url, createdAt: moment(message.createdAt).format('h:mm a') }) // use Mustache templating lib to define html template
    // and render with our data from js, so it can render all sorts of dynamic data to the page
    $messages.insertAdjacentHTML('beforeend', html) 
    autoscroll()
})
// client listens to server when user joins and leaves
socket.on('roomData', ({room, users}) =>
{
    const html = Mustache.render(sidebarTemplate, {room, users})
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (event) =>
{   
    event.preventDefault()
    const message = event.target.elements.message.value // event.target is form and any element name is within the form
    
    if (!message)
    {
        return alert('You must type something to send out!')
    }
    // disable the button once the form is submitted to prevent double send at the same time
    $messageFormButton.setAttribute('disabled', 'disabled') // the attribute name and the value
    
        socket.emit('sendMessage', message, (error) => {
        // enable button for sending next message
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = '' // clear the input and set focus
        $messageFormInput.focus()
        // third arg the server send out is the function will be run when the event is acknowledged from server
        if(error)
        {
            return alert(error)
        }
        console.log('The message was delivered.')
    })
})

// to fetch the user's location when the Send Location button is clicked
$sendLocationButton.addEventListener('click', () =>
{
   // check if the browser support geolocation 
   if (!navigator.geolocation)
   {
       return alert('Geolocation is not supported by your browser.')
   }
   // disable the button
   $sendLocationButton.setAttribute('disabled', 'disabled')
   navigator.geolocation.getCurrentPosition((position) =>
   {
       // position is the object gets back from the callback
       console.log(position)
       socket.emit('sendLocation', 
       { latitude: position.coords.latitude, longitude: position.coords.longitude }, () =>
       {    // enable button
            $sendLocationButton.removeAttribute('disabled')
            console.log('Location shared!') // acknowledgement
       } )
   })
})

//pass the the object with two properties to the server when join event occurs
socket.emit('join', { username, room }, (error) =>
{
    if (error)
    {
        alert(error)
        location.href = '/'
    }
} )

