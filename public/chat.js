console.log("HEY")
// Authorisation request
var display_name = ""
var access_token = ""
var name_box = $("#name_box")
var me_url = "https://api.spotify.com/v1/me"
var id = ""
var player
var device
var profile_url
var chat_number = 9999999;
var current_track
var spotify_id

var send_message_btn = $("#send_message_btn")
var info_box = $("#info_box")
var message_input = $("#message_input")
var endpoint = "https://accounts.spotify.com/authorize?client_id=d7bc09b9fc624ecfb3345d126c96f61f&redirect_uri=https:%2F%2Fmorahman.me:3000&response_type=token&scope=streaming%20user-read-email%20user-modify-playback-state%20user-read-private&show_dialog=true"
var my_chatroom

function onLoad() {
    $("#typing_container").fadeOut(0)
    if(window.location.hash) {
        // alert("1")
        if (window.location.hash == "#admin1497") {
            window.location.replace("https://morahman.me:3000/admin1497.html")
        }
        $("html, body").animate({backgroundColor:"#171717"}, 100)
        access_token = window.location.hash.substr(14, window.location.hash.indexOf("&")-14)
        console.log(access_token)
        $("#name_box").animate({top:0}, 150)
        $("#message_container").animate({bottom:0}, 150)
        $("#info_box").animate({marginTop:"60px"}, 300)

        display_name = get_name()

        console.log("SET NAME!")
    } else {
        // alert("2")
        window.location.replace(endpoint)
    }
}

window.onload = function() {
    onLoad()
}

function makeChat(myName, myProfileUrl, myText, emphasise) {
    chat_number = chat_number-1;
    if (emphasise) {
        info_box.append("<div style=\"z-index:"+chat_number+";\" class=\"chat\"><img class=\"chat_pic\" src=\""+myProfileUrl+"\"/><div class=\"chat_details\"><div class=\"chat_name\">"+myName+"</div><div class=\"chat_text\"><em>"+myText+"</em></div></div></div>")
    } else {
        info_box.append("<div style=\"z-index:"+chat_number+";\" class=\"chat\"><img class=\"chat_pic\" src=\""+myProfileUrl+"\"/><div class=\"chat_details\"><div class=\"chat_name\">"+myName+"</div><div class=\"chat_text\">"+myText+"</div></div></div>")
    }
    console.log("")

    $("#info_box .chat:nth-last-child(1)").animate({marginTop:0}, 200)
    $("html, body").delay(100).animate({ scrollTop: $(document).height() }, 300);
    // $("html, body").delay(100).animate({ scrollTop: $(document).height() }, 500);
}

// Get user data
function get_name() {
    var name = ""
    $.ajax({
        url: me_url,
        type: "GET",
        dataType: "json",
        success: function(result) {
            console.log(result)
            console.log(typeof(result))
            console.log(result['display_name'])

            name = result['display_name']
            id = result['id']
            var premium
            if (result["product"] !== "premium") {
                alert("You need Spotify Premium to use music sync features!")
                premium = false
            } else {
                premium = true
            }
            if (result["images"].length == 0) {
                profile_url = "img/empty-profile.png"
            } else {
                profile_url = result["images"][0]["url"]
            }

            name_box.append("<div id=\"name\">"+name+"</div><img id=\"prof_pic\" src=\""+profile_url+"\"/><img id=\"spotify_logo\" src=\"img/spotify-logo.png\"/><div id=\"spotify_party_text\">Spotify Party</div>")
            $("#name_box div:not(:first-child), img").animate({opacity: 1}, 500)
            $("#name_pick").css("opacity", "0")
            $("#name_pick").css("left", ($("#name").position().left)+($("#name").width()/2)-75)

            $({blurRadius: 0}).delay(150).animate({blurRadius: 2}, {
                duration: 500,
                easing: 'swing', // or "linear"
                                 // use jQuery UI or Easing plugin for more options
                step: function() {
                    console.log(this.blurRadius);
                    $('#message_container, #name_box, #player_container').css({
                        "-webkit-filter": "blur("+this.blurRadius+"px)",
                        "filter": "blur("+this.blurRadius+"px)"
                    });
                }
            });

            $("#chatroom_input").delay(150).animate({opacity: 1}, 500)

            document.getElementById("chatroom_input").addEventListener("keyup", function(event) {
                if (event.keyCode === 13) {
                    my_chatroom = $("#chatroom_input").val()

                    if (my_chatroom.length < 4) {
                        alert("Chatroom code must be at least 4 characters long")
                        return
                    }

                    $({blurRadius: 2}).animate({blurRadius: 0}, {
                        duration: 500,
                        easing: 'swing', // or "linear"
                                         // use jQuery UI or Easing plugin for more options
                        step: function() {
                            console.log(this.blurRadius);
                            $('#message_container, #name_box, #player_container').css({
                                "-webkit-filter": "blur("+this.blurRadius+"px)",
                                "filter": "blur("+this.blurRadius+"px)"
                            });
                        }
                    });

                    $("#block").fadeOut(0)

                    event.preventDefault()
                    document.getElementById("message_input").focus()

                    // Chatroom stuff
                    spotify_id = result['id']
                    socket.emit("name", {premium : premium, name : name, id : result['id'], profile_url : profile_url, chatroom : my_chatroom})
                    $("#chatroom_input").fadeOut(500)
                    document.getElementById("name").addEventListener("click", (function() {
                        console.log("CLICK!")
                        console.log($("#name_pick").css("opacity"))
                        if ($("#name_pick").css("opacity") == 0) {
                            document.getElementById("name_pick_input").focus()
                            $("#name_pick").css("left", ($("#name").position().left)+($("#name").width()/2)-75)
                            $("#name_pick").animate({opacity:1, top:"40px"}, 200)
                        } else {
                            document.getElementById("message_input").focus()
                            $("#name_pick").animate({opacity:0, top:"60px"}, 200)
                            $("#name_pick").animate({top:"20px"}, 0)
                        }
                    }))
                }
            })
        },
        error: function() {
            console.log("ERROR")
        },
        beforeSend: setHeader
    })
    return name
}

function setName(myName) {
    socket.emit("change_name", {name : myName})
    $("#name").animate({opacity:0, top:"70%"}, 200)
    $("#name_pick").animate({opacity:0, top:"60px"}, 200)
    $("#name_pick").animate({top:"20px"}, 0)
    setTimeout(function() {document.getElementById("name").innerHTML = myName; document.getElementById("message_input").focus()}, 200)
    $("#name_pick_input").delay(400).val("")
    $("#name").delay(200).animate({top:"30%"}, 0).animate({opacity:1, top:"50%"}, 200)
    console.log(("left", ($("#name").position().left)+($("#name").width()/2)-75))
}

function setHeader(xhr) {
    xhr.setRequestHeader("Authorization", "Bearer "+access_token)
}

// Input event handlers

document.getElementById("message_input").addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault()
        document.getElementById("send_message_btn").click()
    } else {
        console.log("Hey!")
        socket.emit("typing")
    }
})

document.getElementById("name_pick_input").addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault()
        setName($("#name_pick_input").val())
    }
})

send_message_btn.mouseover(function() {
    console.log("HOVEERR")
    send_message_btn.clearQueue()
    send_message_btn.stop()
    send_message_btn.animate({backgroundColor:"#333333"}, 200)
})

$(window).click(function() {
    if ($("#name_pick").css("opacity") == 1) {
        document.getElementById("message_input").focus()
        $("#name_pick").animate({opacity:0, top:"60px"}, 200)
        $("#name_pick").animate({top:"20px"}, 0)
    }
})

$("#name_pick").click(function() {
    event.stopPropagation()
})

send_message_btn.mouseout(function() {
    console.log("HOVEERR")
    send_message_btn.clearQueue()
    send_message_btn.stop()
    send_message_btn.animate({backgroundColor:"#171717"}, 200)
})

send_message_btn.click(function() {
    if (!(message_input.val() == "")) {
        send_message_btn.stop()
        send_message_btn.clearQueue()
        message_input.stop()
        message_input.clearQueue()
        send_message_btn.animate({color:"#AAAAAA"}, 250)
        send_message_btn.delay().animate({color:"#FFFFFF"}, 250)
        socket.emit("message", {message : message_input.val()})
        message_input.animate({opacity:0}, 150)
        setTimeout(function() {message_input.val("")}, 150)
        message_input.delay(150).animate({opacity:1}, 300)
        console.log("SEND MESSAGE!")
        document.getElementById("message_input").focus()
    }
})

// Chat communication
var socket = io.connect("https://morahman.me:3000")

function SkipRoom(my_data) {
    if (!(my_data == my_chatroom)) {
        return true
    } else {
        return false
    }
}

socket.on("kick_user", (data) => {
    if (data.id == spotify_id) {
        socket.close()
        alert("You have been kicked off by admin")
        $({blurRadius: 0}).delay(150).animate({blurRadius: 2}, {
            duration: 500,
            easing: 'swing', // or "linear"
                             // use jQuery UI or Easing plugin for more options
            step: function() {
                console.log(this.blurRadius);
                $('#message_container, #name_box, #player_container, #info_box').css({
                    "-webkit-filter": "blur("+this.blurRadius+"px)",
                    "filter": "blur("+this.blurRadius+"px)"
                });
            }
        });
        $("#block").fadeIn(0)
    }
})

socket.on("block_user", (data) => {
    if (data.id == spotify_id) {
        socket.close()
        alert("You have been blocked by admin and may not access this website anymore, unless you are unblocked. User ID: "+spotify_id)
        $({blurRadius: 0}).delay(150).animate({blurRadius: 2}, {
            duration: 500,
            easing: 'swing', // or "linear"
                             // use jQuery UI or Easing plugin for more options
            step: function() {
                console.log(this.blurRadius);
                $('#message_container, #name_box, #player_container, #info_box').css({
                    "-webkit-filter": "blur("+this.blurRadius+"px)",
                    "filter": "blur("+this.blurRadius+"px)"
                });
            }
        });
        $("#block").fadeIn(0)
    }
})

socket.on("typing", (data) => {
    if (SkipRoom(data.chatroom)) {
        return
    }
    if (!(data.id == id)) {
        console.log("TYPING", data.name)
        $("#typing_container").clearQueue()
        $("#typing_container").stop()
        $("#typing_container").fadeIn(50)
        document.getElementById("typing_container").innerHTML = data.name+" is typing..."
        $("#typing_container").delay(300).fadeOut(500)
    }
})

socket.on("message", (data) => {
    if (SkipRoom(data.chatroom)) {
        return
    }
    makeChat(data.name, data.profile_url, data.message, false)
})

socket.on("change_name", (data) => {
    if (SkipRoom(data.chatroom)) {
        return
    }
    makeChat(data.new_name, data.profile_url, "Changed name from \""+data.old_name+"\" to \""+data.new_name+"\"" , true)
})

socket.on("joined", (data) => {
    if (SkipRoom(data.chatroom)) {
        return
    }
    makeChat(data.name, data.profile_url, "Joined the party", true)
})

socket.on("user_disconnected", (data) => {
    if (SkipRoom(data.chatroom)) {
        return
    }
    makeChat(data.name, data.profile_url, "Left the party", true)
})

socket.on("chatroom_number", (data) => {
    if (SkipRoom(data.chatroom)) {
        return
    }
    console.log(data.number + " online")
    $("#online_count").animate({opacity: 0}, 200)
    setTimeout(function() {
        if (data.number == 1) {
            document.getElementById("online_count").innerHTML = data.number+" person in party ("+data.chatroom+")"
        } else {
            document.getElementById("online_count").innerHTML = data.number+" people in party ("+data.chatroom+")"
        }
        // document.getElementById("online_count").innerHTML = data.number+" people in party"
    }, 200)
    $("#online_count").delay(200).animate({opacity: 1}, 600)
})

var paused = ""
var track = ""
var position = ""
var id_check
var continue_with_seek
var skip = false
var skip2 = false

function offSkipper() {
    skip = false
}

socket.on("state", (data) => {
    if (SkipRoom(data.chatroom)) {
        return
    }
    // info_box.append("<p>" + data.name + ": " + data.position + "</p>")
    // if (skip2) {
    //     skip2 = false
    //     return
    // } else {
    //     if (skip) {
    //         skip = false
    //         return
    //     }
    // }
    console.log(skip)
    if (skip) {
        return
    }
    if (data.id == id) {
        id_check = true;
    } else {
        id_check = false;
    }
    continue_with_seek = true
    if (paused !== data.paused) {
        // skip = true
        continue_with_seek = false
        paused = data.paused
        console.log(paused)
        if (paused) {
            console.log("PAUSED!")
            makeChat(data.name, data.profile_url, "Paused playback", true)
            if (!id_check) {
                window.player.pause().then(() => {
                    // console.log("PAUSED!")
                    // info_box.append("<p>" + data.name + ": " + "Paused playback" + "</p>")
                })
            }
        } else {
            console.log("RESUMED!")
            makeChat(data.name, data.profile_url, "Resumed playback", true)
            if (!id_check) {
                window.player.resume().then(() => {
                    // info_box.append("<p>" + data.name + ": " + "Resumed playback" + "</p>")
                })
            }
        }
    } else {
        continue_with_seek = true
    }

    if (track !== data.track) {
        track = data.track
        continue_with_seek = false
        makeChat(data.name, data.profile_url, "Now playing "+data.track_title, true)
        // skip = true
        // skip2 = true
        if (!id_check) {
            console.log("{\"uris\":[\""+data.track_uri+"\"]}")
            $.ajax({
                url: me_url+"/player/play",
                type: "PUT",
                data: "{\"uris\":[\""+data.track_uri+"\"]}",
                success: function() {
                    console.log("CHANGE SUCCESS")
                },
                error: function() {
                    console.log("CHANGE ERROR")
                },
                beforeSend: setHeader
            })
            $.ajax({
                url: "https://api.spotify.com/v1/tracks/"+data.track_uri.substr(14),
                type: "GET",
                beforeSend: setHeader,
                success: function(data, f1, f2) {
                    console.log("SONG NAME: " + data.name)
                }
            })
        }
    } else {
        if (continue_with_seek) {
            if (position !== data.position) {
                position = data.position
                // info_box.append("<p>" + data.name + ":<em> " + "Seeked to " + millisToMinutesAndSeconds(position) + "</em></p>")
                makeChat(data.name, data.profile_url, "Seeked to "+millisToMinutesAndSeconds(position), true)
                if (!id_check) {
                    window.player.seek(position)
                }
            }
        }
    }
    skip = true
    setTimeout(offSkipper, 500)
})

function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}