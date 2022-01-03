// keep track of users in our system and add few functions 
const users = []
const addUser = ({ id, username, room }) =>
{
    // clean up the data 
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    if(!username || !room)
    {
        return { error: 'Username and room are required!'}
    }
    // username must be unique in specific room
    const existingUser = users.find((user) =>
    {
        return user.room === room && user.username === username
    })

    if (existingUser)
    {
        return { error: 'Username is in use!'}
    }
    // no existingUser
    const user = { id, username, room }
    users.push(user)
    return {user} // or return object with user property. Reference to line 46 in index.js either get error or user property
}

// remove user
const removeUser = (id) =>
{
    const index = users.findIndex((user) =>
    {
        return user.id === id
        
    })
    if (index !== -1)
    {
        return users.splice(index, 1)[0] // which item to be removed and the total number of item to be removed
    }   // return an array contains all the users to be removed and we only want to return an object, so 1st object in the array
}       // can use filter to find but it keeps searching even one is found 


const getUser = (id) =>
{
    return users.find((user) => user.id === id)
    
}

const getUsersInRoom = ( room ) =>
{
    room = room.trim().toLowerCase()
    return users.filter((user) => user.room === room)
    
       
}
/* testing

addUser({ id: 1, username: 'Jenny', room: 'Lounge'})
addUser({ id: 2, username: 'Ray', room: 'Lounge'})
addUser({ id: 3, username: 'Amy', room: 'Sky'})
console.log(users)

console.log(getUser(2))

console.log(getUsersInRoom('sky'))

const res = addUser({ id: 33, username: 'Jenny', room: 'lounge'})
console.log(res)

const removedUser = removeUser(1)
console.log(removedUser) */

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}
