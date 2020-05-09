const express = require("express")
const app = express()
const https = require("https")
const fs = require("fs")

app.set("view engine", "ejs")

app.use(express.static("public"))


app.get("/", (req, res) => {
    res.render("index")
})

// const httpsOptions = {
//     key: fs.readFileSync("./private.key"),
//     cert: fs.readFileSync("./certificate.pem")
// }

// server = app.listen(3000)

var server = https.createServer({ 
    key: fs.readFileSync('private.pem'),
    cert: fs.readFileSync('certificate.pem') 
 },app);
server.listen(3000)

const io = require("socket.io").listen(server)

var chatroom_numbers = {}
// var online_users = {
    // "chatroom":
    //     [
    //         {"ID":
    //             ["Person1 Name", "Pref_Name", "Prof_pic", "Time_joined"]
    //         }, {"ID":
    //             ["Person2", "...", "...", "..."]
    //         }
    //     ]
// }

var blocked_users = []
var online_users = {}
var admin_machines = []
function send_to_admin(key, data) {
    for (admin in admin_machines) {
        console.log("SEND-ADMIN: Sending to " + admin_machines[admin])
        io.to(admin_machines[admin]).emit(key, data)
    }
}

function cls() {
    console.log("          ----------")
}

io.on("connection", (socket) => {
    console.log("GENERAL: New user connected")
    cls()
    socket.on("iadmin", (data) => {
        admin_machines.push(socket.id)
        socket.admin = true
        console.log("ADMIN: Admin connected " + socket.id)
    })
    socket.on("admin_init", (data) => {
        console.log("ADMIN: Received admin_init request from " + socket.id)
        io.to(socket.id).emit("init", online_users)
        cls()
    })
    socket.on("blocked_users_init", (data) => {
        console.log("ADMIN: Received blocked_users_init request from " + socket.id)
        io.to(socket.id).emit("blocked_users", blocked_users)
        cls()
    })
    socket.on("kick_user", (data) => {
        console.log("ADMIN: Request from " + socket.id + " to kick " + data.id)
        io.emit("kick_user", {id : data.id})
        cls()
    })
    socket.on("block_user", (data) => {
        console.log("ADMIN: Request from " + socket.id + " to block " + data.id)
        io.emit("block_user", {id : data.id})
        blocked_users.push(data.id)
        console.log("ADMIN: New blocked users list:")
        console.log("       " + blocked_users)
        send_to_admin("blocked_users", blocked_users)
        cls()
    })
    socket.on("unblock_user", (data) => {
        console.log("ADMIN: Request from " + socket.id + " to unblock " + data.id)
        console.log("ADMIN: User at index " + blocked_users.indexOf(data.id) )
        // delete blocked_users[blocked_users.indexOf(data.id)]
        blocked_users.splice(blocked_users.indexOf(data.id)-1, 1)
        console.log(blocked_users)
        send_to_admin("blocked_users", blocked_users)
        cls()
    })


    socket.on("typing", (data) => {
        io.emit("typing", {chatroom : socket.chatroom, name : socket.name, id : socket.spotify_id})
    })
    var timestamp
    socket.on("name", (data) => {
        var d = new Date()
        timestamp = d.getFullYear()+"-"+d.getMonth()+"-"+d.getDate()+" "+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()
        socket.name = data.name
        socket.spotify_name = data.name
        socket.spotify_id = data.id
        socket.profile_url = data.profile_url
        socket.chatroom = data.chatroom
        socket.premium = data.premium
        console.log("USER-CON: User connected")
        console.log("USER-CON: User ID: " + socket.spotify_id)
        console.log("USER-CON: BLOCKED USERS: " + blocked_users)
        if (blocked_users.indexOf(socket.spotify_id) > -1) {
            console.log("USER-CON: User is blocked! Kicking...")
            io.emit("block_user", {id : socket.spotify_id})
        }
        if (!(socket.chatroom in online_users)) {
            online_users[socket.chatroom] = [{}]
        }
        online_users[socket.chatroom][0][socket.spotify_id] = [socket.spotify_name, socket.name, socket.profile_url, socket.premium, timestamp]
        // console.log("USER-CON: Connected users:")
        // console.log(JSON.stringify(online_users, null, 4))
        if (socket.chatroom in chatroom_numbers) {
            chatroom_numbers[socket.chatroom] = chatroom_numbers[socket.chatroom] + 1
        } else {
            chatroom_numbers[socket.chatroom] = 1
        }
        io.emit("chatroom_number", {chatroom : socket.chatroom, number : chatroom_numbers[socket.chatroom]})
        socket.join(socket.chatroom)
        console.log("USER-CON: Chatroom: " + socket.chatroom)
        console.log("USER-CON: Name: " + socket.name)
        console.log("USER-CON: Profile URL: " + socket.profile_url)
        io.emit("joined", {chatroom : socket.chatroom, name : socket.name, profile_url : socket.profile_url})
        send_to_admin("user_joined", [socket.spotify_id, socket.spotify_name, socket.name, socket.profile_url, socket.premium, timestamp, socket.chatroom])
        cls()
    })
    socket.on("message", (data) => {
        console.log("MSG: Message: " + data.message)
        console.log("MSG: From: " + socket.name)
        io.emit("message", {chatroom : socket.chatroom, id : socket.spotify_id, message : data.message, name : socket.name, profile_url : socket.profile_url})
        console.log("MSG: Chatroom: " + socket.chatroom)
        cls()
    })
    socket.on("state", (data) => {
        console.log("STAT: State: " + data.paused)
        console.log("STAT: From: " + socket.name + " (" + socket.spotify_id + ")")
        io.emit("state", {chatroom : socket.chatroom, id : socket.spotify_id, profile_url : socket.profile_url, paused : data.paused, name : socket.name, position : data.position, track : data.track, track_title : data.track_title, track_uri : data.track_uri})
        cls()
    })
    socket.on("change_name", (data) => {
        io.emit("change_name", {chatroom : socket.chatroom, old_name : socket.name, new_name : data.name, profile_url : socket.profile_url})
        socket.name = data.name
        online_users[socket.chatroom][0][socket.spotify_id] = [socket.spotify_name, socket.name, socket.profile_url, socket.premium, timestamp]
        send_to_admin("user_left", {id : socket.spotify_id})
        send_to_admin("user_joined", [socket.spotify_id, socket.spotify_name, socket.name, socket.profile_url, socket.premium, timestamp, socket.chatroom])
        console.log("USER-CON: Change name: " + socket.spotify_name + " to " + socket.name + " (" + socket.spotify_id + ")")
        cls()
    })
    socket.on("disconnect", (reason) => {
        if (!(socket.name == undefined)) {
            console.log("USER-CON: Disconnection: User " + socket.name + " (" + socket.spotify_id + ") has disconnected.")
            send_to_admin("user_left", {id : socket.spotify_id})
            chatroom_numbers[socket.chatroom] = chatroom_numbers[socket.chatroom] - 1
            if (chatroom_numbers[socket.chatroom] == 0) {
                delete chatroom_numbers[socket.chatroom]
                delete online_users[socket.chatroom]
            } else {
                if (!(socket.spotify_id == null)) {
                    delete online_users[socket.chatroom][0][socket.spotify_id]
                }
                io.emit("user_disconnected", {chatroom : socket.chatroom, id : socket.spotify_id, name : socket.name, profile_url : socket.profile_url})
                io.emit("chatroom_number", {chatroom : socket.chatroom, number : chatroom_numbers[socket.chatroom]})
            }
            // console.log("USER-CON: Now online users after disconnection")
            // console.log(JSON.stringify(online_users, null, 4))
            cls()
        } else {
            if (socket.admin) {
                console.log("ADMIN: Admin " + socket.id + " disconnected")
                admin_machines.splice(admin_machines.indexOf(socket.id))
                cls()
            }
        }
    })
})