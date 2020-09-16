var socket = io.connect("https://morahman.me:3000")
socket.emit("iadmin", {})
socket.emit("admin_init", {})
socket.emit("blocked_users_init", {})

var table = document.getElementById("user_table")
var blocked_table = document.getElementById("blocked_table")
var socket_row_map = {}
var current_row = 0
var blocked_table_rows = -1

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for(var i = this.length - 1; i >= 0; i--) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}

function btnKick(btnId) {
    socket.emit("kick_user", {id : btnId.substring(5)})
}

function btnBlock(btnId) {
    socket.emit("block_user", {id : btnId.substring(5)})
}

function btnUnblock(btnId) {
    console.log(btnId)
    socket.emit("unblock_user", {id : btnId.substring(8)})
}

function insert_row(user_data) {
    socket_row_map[user_data[0]] = current_row
    var row = table.insertRow(current_row)
    current_row = current_row + 1
    row.insertCell(0).innerHTML = "<img src=\""+user_data[3]+"\" width=50 height=50>"
    row.insertCell(1).innerHTML = user_data[6]
    row.insertCell(2).innerHTML = user_data[1]
    row.insertCell(3).innerHTML = user_data[2]
    row.insertCell(4).innerHTML = user_data[0]
    row.insertCell(5).innerHTML = user_data[4]
    row.insertCell(6).innerHTML = user_data[5]
    row.insertCell(7).innerHTML = "<button id=\"kick_"+user_data[0]+"\" onClick=\"btnKick(this.id)\">KICK</button>"
    row.insertCell(8).innerHTML = "<button id=\"bloc_"+user_data[0]+"\" onClick=\"btnBlock(this.id)\">BLOCK</button>"
    console.log("INSERT ROW")
    console.log(JSON.stringify(socket_row_map, null, 4))
}

socket.on("init", (data) => {
    console.log(data)
    for (room_i in data) {
        for (user_i in data[room_i][0]) {
            console.log(user_i)
            var user_data = data[room_i][0][user_i]
            console.log(user_data)
            insert_row([user_i, user_data[0], user_data[1], user_data[2], user_data[3], user_data[4], room_i])
        }
    }
})

socket.on("blocked_users", (data) => {
    // if (document.getElementById("blocked_table") == null) {
    //     document.getElementById("blocked_table_container").innerHTML = ""
    // } else {
    //     document.getElementById("blocked_table_container").innerHTML = "<table id=\"blocked_table\"><tr><th>Spotify URI</th><th>Unblock</th></tr></table>"
    // }
    document.getElementById("blocked_table_container").innerHTML = "<table id=\"blocked_table\"><tr><th>Spotify URI</th><th>Unblock</th></tr></table>"
    blocked_table_rows = 0
    console.log(data)
    for (spotify_id in data) {
        console.log(data[spotify_id])
        var row = document.getElementById("blocked_table").insertRow(blocked_table_rows)
        row.insertCell(0).innerHTML = data[spotify_id]
        row.insertCell(1).innerHTML = "<button id=\"unblock_"+data[spotify_id]+"\" onClick=\"btnUnblock(this.id)\">Unblock</button>"
        blocked_table_rows = blocked_table_rows + 1
    }
})

socket.on("user_left", (data) => {
    console.log("User " + data.id + " left.")
    var left_row = socket_row_map[data.id]
    delete socket_row_map[data.id]
    current_row = current_row - 1
    table.deleteRow(left_row)
    for (thing in socket_row_map) {
        console.log(thing)
        console.log(socket_row_map[thing])
        console.log(left_row)
        if (socket_row_map[thing] > left_row) {
            console.log("TRUE")
            socket_row_map[thing] = socket_row_map[thing] - 1
        }
    }
    console.log("USER LEFT")
    console.log(JSON.stringify(socket_row_map, null, 4))
})

socket.on("user_joined", (data) => {
    insert_row(data)
})