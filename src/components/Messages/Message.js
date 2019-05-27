import React from 'react'
import { Comment, Image } from 'semantic-ui-react'
import moment from 'moment';

const isOwnMessage = (message, user) => {
    return message.user.id === user.uid ? 'message__self': ''
}

const isImage = (message) => {
    //console.log("IsImage?", message.hasOwnProperty('image') && !message.hasOwnProperty('content'));
    return message.hasOwnProperty('image') && !message.hasOwnProperty('content');
}

const timeFromNow = timestamp => {
    moment(timestamp).fromNow();
}

const Message = ({message,user}) => {
    //console.log("In Message.js", message)
  return (
    <Comment>
        <Comment.Avatar src={message.user.avatar} />
        <Comment.Content className={isOwnMessage(message, user)}>
            <Comment.Author as='a'>
                {message.user.name}
            </Comment.Author>
            <Comment.Metadata>
                {timeFromNow(message.timestamp)}
            </Comment.Metadata>
            {
                isImage(message)?
                <Image src={message.image}
                className='message_image'
                />:
                <Comment.Text>
                    {message.content}
                </Comment.Text>
                
            }
        </Comment.Content>
    </Comment>
  )
}

export default Message
