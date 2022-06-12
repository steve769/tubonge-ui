import React, { useState} from 'react'
import { over } from 'stompjs'
import SockJS from 'sockjs-client'

var stompClient = null;

const ChatRoom = () => {
    const [publicChat, setPublicChat] = useState([])
    const [privateChats, setPrivateChats] = useState(new Map())
    const [tab, setTab] = useState("CHATROOM")
    const [userData, setUserData] = useState({
        userName: "",
        receiverName: "",
        connected: false,
        message: ""
    })

    //Handle Username as you type it
    const handleUserName = (e)=>{
        //Spread the initial state & change the userName state
        setUserData({...userData, userName: e.target.value})
    }
    //Handle Username as you type it
    const handleMessage = (e)=>{
        //Spread the initial state & change the message state
        setUserData({...userData, message: e.target.value})
    }
    //sendPublicMessage
    const sendPublicMessage=()=>{
        if(stompClient){
            let chatMessage = {
                senderName: userData.userName,
                message: userData.message,
                status: "MESSAGE"
            }
            stompClient.send("/app/message", {}, JSON.stringify(chatMessage))
            setUserData({...userData, message: ""})
        }
    }
    //sendPrivateMessage
    const sendPrivateMessage=()=>{
        if(stompClient){
            let chatMessage = {
                senderName: userData.userName,
                receiverName: tab,
                message: userData.message,
                status: "MESSAGE"
            }
            if(userData.userName !== tab){
                privateChats.get(tab).push(chatMessage)
                setPrivateChats(new Map(privateChats))
            }
            stompClient.send("/app/private-message/message", {}, JSON.stringify(chatMessage))
            setUserData({...userData, message: ""})
        }
    }
    //Register User
    const registerUser =()=>{
        let Sock = new SockJS("http://localhost:8080/steveChat")
        stompClient = over(Sock)
        stompClient.connect({}, onConnected, onError)

    }
    //onConnected
    const onConnected =()=>{
        setUserData({...userData, connected: true})
        stompClient.subscribe("/chatroom/public", onPublicMessageReceived)
        stompClient.subscribe(`/user/${userData.userName}/private`, onPrivateMessageReceived)
        userJoin()
    }
    //userJoin
    const userJoin =()=>{
        if(stompClient){
            let chatMessage = {
                senderName: userData.userName,
                status: "JOIN"
            }
            stompClient.send("/app/message", {}, JSON.stringify(chatMessage))
        }
    }
    //onPublicMessageReceived
    const onPublicMessageReceived=(payload)=>{
        let payloadData = JSON.parse(payload.body)
        switch(payloadData.status){
            case "JOIN":
                if(!privateChats.get(payloadData.senderName)){
                    privateChats.set(payloadData.senderName, [])
                    setPrivateChats(new Map(privateChats))
                }
                break;
            case "MESSAGE":
                publicChat.push(payloadData)
                setPublicChat([...publicChat])
                break;   
        }

    }
    //onError
    const onError =(err)=>{
        console.log(err)
    }

    //onPrivateMessageRecieved
    const onPrivateMessageReceived =(payload)=>{
        let payloadData = JSON.parse(payload.body)

        if(privateChats.get(payloadData.senderName)){
            privateChats.get(payloadData.senderName).push(payloadData)
            setPrivateChats(new Map(privateChats))
        }else{
            let list =[];
            list.push(payloadData)
            privateChats.set(payloadData.senderName, list)
            setPrivateChats(privateChats)
        }
    }
  return (
    <div className='container'>
        {
            userData.connected ?
            //If user is connected show the chat room 
            <div className='chat-box'>
                <div className="member-list">
                    <ul>
                        <li onClick={()=> setTab("CHATROOM")} className={`member ${tab === "CHATROOM" && "active"}`}>Chatroom</li>
                        {
                            [...privateChats.keys()].map((name, index)=>(
                                <li onClick={()=>setTab(name)} className={`member ${tab === name && "active"}` }key={index}>
                                    {name}
                                </li>
                            ))
                        }
                    </ul>
                </div>
                {tab === "CHATROOM" && <div className="chat-content">
                    <ul className="chat-messages">

                {publicChat.map((chat, index)=>(
                            <li className='message' key={index}>
                                    {chat.senderName !== userData.userName && <div className='avatar'>{chat.senderName}</div>}
                                    <div className='message-data'>{chat.message}</div>
                                    {chat.senderName === userData.userName && <div className='avatar self'>{chat.senderName}</div>}
                            </li>
                            ))
                        }
                    </ul>
                    <div className="send-message">
                        <input type="text" className='input-message' placeholder='Type Room Message...' value={userData.message} onChange={handleMessage}/>
                        <button type='button' className='send-button' onClick={sendPublicMessage}>Send</button>
                    </div>
                </div> }
                {tab !== "CHATROOM" && <div className="chat-content">
                    <ul className="chat-messages">
                
                    {[...privateChats.get(tab)].map((chat, index)=>(
                            <li className='message' key={index}>
                                    {chat.senderName !== userData.userName && <div className='avatar'>{chat.senderName}</div>}
                                    <div className='message-data'>{chat.message}</div>
                                    {chat.senderName === userData.userName && <div className='avatar self'>{chat.senderName}</div>}
                            </li>
                            ))}
                        
                    </ul>
                        
                    <div className="send-message">
                        <input type="text" className='input-message' placeholder='Type Private Message...' value={userData.message} onChange={handleMessage}/>
                        <button type='button' className='send-button' onClick={sendPrivateMessage}>Send</button>
                    </div>
                </div> }
            </div> 
            :
            //If user NOT connected give connection form
            <div className='register'>
                <input id='user-name' type="text" placeholder='Enter your username...' value={userData.userName} onChange={handleUserName}/>
                <button type='button' onClick={registerUser}>Register</button>
            </div>
        }
    </div>
  )
}

export default ChatRoom