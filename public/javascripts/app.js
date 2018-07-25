
var sendBtn = document.getElementById('send-btn');
var messageBox = document.getElementById('message-to-send')
var messageList = document.getElementById('message-list');
var div = messageList.parentElement;
var userTyping = document.getElementById('typing');
var me = document.getElementById('me');
me = JSON.parse(me.value);
var users = document.getElementById('users');
var currUser = document.getElementById('currUser');
var socket = io();
var currentChatId = '';
var localUsers = localStorage.getItem('users');
var typingUsersId = {};

socket.emit('userconnect');


// console.log(me);
sendBtn.onclick = (event) => {
    if (messageBox.value !== '') {
        var user = {};
        user.id = currUser.dataset.id
        user.socketId = currUser.dataset.socketid;
        // console.log(messageBox.value)

        var date = new Date();
        var time = date.toLocaleTimeString();
        var li = document.createElement('li');
        var msg = `<div class="message-data align-right">
    <span class="message-data-time">${time}</span> &nbsp; &nbsp;
    <span class="message-data-name">You</span>
    <i class="fa fa-circle me"></i>
    </div>
    <div class="message other-message float-right">
    ${messageBox.value}
    </div>`;
        li.setAttribute('class', 'clearfix');
        li.innerHTML = msg;
        messageList.appendChild(li);
        socket.emit('chat', { user: user, message: messageBox.value });
        messageBox.value = '';
        typingUsersId[user.id].msg = '';
        socket.emit('typing', { user: user, message: messageBox.value });
    }
}


messageBox.onkeydown = (event) => {
    var user = {};
    user.id = currUser.dataset.id
    user.socketId = currUser.dataset.socketid;
    typingUsersId[user.id] = {
        msg: messageBox.value
    };
    socket.emit('typing', { user: user, message: messageBox.value });
}

if (currUser.textContent.trim() == '') {
    messageBox.setAttribute('disabled', 'disabled')
}

socket.on('userconnect', (newUser) => {
    var list = users.getElementsByTagName('li');
    var li = list[newUser.user._id];
    if (li) {
        if (li.dataset.status == 'false') {
            li.dataset.status = true;
            li.dataset.socketid = newUser.user.socketId;
            console.log(newUser, 'connetc');
            var status = li.children.about.children.status;
            status.innerHTML = `<i class="fa fa-circle online"></i> online`;
        }
    } else {
        users.appendChild(userBlock(newUser));
    }
});
socket.on('userdisconnect', (user) => {
    var list = users.getElementsByTagName('li');
    var li = list[user._id];
    li.dataset.status = false;
    li.dataset.socketid = null;
    var status = li.children.about.children.status;
    status.innerHTML = `<i class="fa fa-circle offline"></i> offline`;
});
socket.on('typing' + me._id, (data) => {

    var list = users.getElementsByTagName('li');
    // console.log(data);
    var li = list[data.senderId];
    // console.log(li);
    var status = li.children.about.children.status;
    var typing = li.children.about.children.typing;

    if (data.message !== '' && li.dataset.status == 'true') {
        typingUsersId[data.senderId] = {
            ...typingUsersId[data.senderId],
            typing: true
        }
        if (currUser.dataset.id == data.senderId) {
            userTyping.innerHTML = ` typing ...`;
            typing.textContent = '';
        }
        else {
            typing.textContent = 'typing';
        }
    }
    else {
        userTyping.innerHTML = ``;
        typingUsersId[data.senderId] = {
            ...typingUsersId[data.senderId],
            typing: false
        }
        typing.textContent = '';
        // status.innerHTML = `<i class="fa fa-circle offline"></i> offline`;
    }
});

socket.on('chat' + me._id, (data) => {

    // console.log(data.doc, data.users);

    var list = users.getElementsByTagName('li');
    var li = list[data.senderId]
    console.log(li);
    if (currUser.dataset.id == data.senderId) {

        messageList.appendChild(messageItem(data));
        console.log(messageItem(data));
    }
    else {
        var count = li.children.about.children.count;
        if (count.textContent == '') {
            count.textContent = 1;
        }

    }

});
// }




function userBlock(obj) {
    var userDiv = `
            <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_01.jpg" alt="avatar" />
            <div class="about">
            <div class="name text-uppercase text-white">${obj.user.name}</div>
            <div class="status">
    <i class="fa fa-circle ${(obj.user.logedIn) ? 'online' : 'offline'}"></i> ${(obj.user.logedIn) ? 'online' : 'offline'}
    </div>
    </div>`;
    var li = document.createElement('li');
    li.setAttribute('class', 'clearfix');
    li.setAttribute('id', obj.user._id);
    li.setAttribute('data-status', obj.user.logedIn);
    li.setAttribute('data-name', obj.user.name);
    li.setAttribute('data-socketid', obj.user.socketId);
    li.innerHTML = userDiv;

    return li;
}

function messageItem(doc) {
    var date = new Date(doc.time);
    var time = date.toLocaleTimeString();
    var li = document.createElement('li');

    li.setAttribute('id',doc._id);
    if (currUser.dataset.id == doc.senderId) {

        var msg = `<div class="message-data">
        <span class="message-data-name">
        <i class="fa fa-circle online"></i> ${currUser.dataset.name}</span>
        <span class="message-data-time">${time}</span>
        </div>
        <div class="message my-message">
        ${doc.message}
        </div>`;

        li.innerHTML = msg;

    }
    else if (doc.senderId == me._id) {
        var msg = `<div class="message-data align-right">
        <span class="message-data-time">${time}</span> &nbsp; &nbsp;
        <span class="message-data-name">You</span>
        <i class="fa fa-circle me"></i>
        </div>
        <div class="message other-message float-right">
        ${doc.message}
        </div>`;
        li.setAttribute('class', 'clearfix');
        li.innerHTML = msg;
    }

    // if (doc.senderId !== currUser.dataset.id) {

    //     // messageList.appendChild(li);
    // } else {
    //     // messageList.appendChild(li);
    // }
    return li;
}

$('#users li').on('click', function (event) {
    var li = this;
    currUser.style.display = 'block';
    messageBox.removeAttribute('disabled');
    messageList.innerHTML = '';
    messageBox.value = '';
    // console.log(this);
    // currentChatId = li.id;
    var myFriend = ` <img src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/195612/chat_avatar_01_green.jpg" alt="avatar" />

            <div class="chat-about" name="about" >
                <div class="chat-with" name="name">${li.dataset.name}</div>
                
                <div class="chat-num-messages" name="status">${(li.dataset.status == 'true') ? 'online' : 'offline'}</div>
            </div>
                <i class="fa fa-star"></i>`;
    currUser.dataset.name = li.dataset.name;
    currUser.dataset.id = li.id;
    fetchMessages(me._id, currUser.dataset.id);
    // console.log(typingUsersId);
    var typing = li.children.about.children.typing;

    if (typingUsersId[li.id]) {
        if (typingUsersId[li.id].typing) {
            userTyping.innerHTML = 'typing ...';
            typing.textContent = '';
        } else {
            userTyping.innerHTML = '';
            // typing.textContent = 'typing';
        }
        if (typingUsersId[li.id].msg !== '' && typingUsersId[li.id].msg) {
            messageBox.value = typingUsersId[li.id].msg;
        } else {
            messageBox.value = '';
        }

    } else {

        userTyping.innerHTML = '';
        typing.textContent = '';
    }
    showTyping(li.id);
    currUser.innerHTML = myFriend;
});

function showTyping(id) {
    var list = users.getElementsByTagName('li');
    Object.keys(typingUsersId).map((val, ind) => {
        var li = list[val]
        var typing = li.children.about.children.typing;
        if (id !== val && typingUsersId[val].typing)
            typing.textContent = 'typing';
    });
    console.log(typingUsersId)
}



function fetchMessages(send_id, receive_id) {
    $.ajax({
        url: `/api/messages/${send_id}/${receive_id}`,
        method: 'get',
        success: (data) => {
            console.log(data);
            data.map((val,ind)=>{
                messageList.appendChild(messageItem(val));
                
            });
            div.scrollTop = div.scrollHeight;
        },
        error: (err) => {
            console.error(err);
        }
    })
}


function filterUser(input) {
    var  filter, li, a, i;
    
    filter = input.value.toUpperCase();
    
    li = users.getElementsByTagName("li");
    for (i = 0; i < li.length; i++) {
        a = li[i].children.about.children.name;
        if (a.innerHTML.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
}
