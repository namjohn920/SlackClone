import React, { Component } from 'react'
import firebase from '../../firebase'
import { Segment, Comment } from 'semantic-ui-react'
import MessagesForm from './MessagesForm';
import MessagesHeader from './MessagesHeader';
import Message from './Message'

class Messages extends Component {
  state = {
    privateChannel: this.props.isPrivateChannel,
    privateMessagesRef: firebase.database().ref('privateMessages'),
    messagesRef: firebase.database().ref('messages'),
    messages: [],
    messagesLoading: true,
    channel: this.props.currentChannel,
    isChannelStarred: false,
    user: this.props.currentUser,
    usersRef: firebase.database().ref('users'),
    numUniqueUsers: '',
    searchTerm: '',
    searchLoading: false,
    searchResults: []
  }

  componentDidMount() {
    const { channel, user } = this.state;
    if (channel && user) {
      this.addListener(channel.id);
      this.addUserStarListener(channel.id, user.uid); 
    }
  }

  addListener = channelId => {
    this.addMessageListener(channelId);
  }

  addMessageListener = channelId => {
    let loadedMessages = [];
    const ref = this.getMessagesRef();

    ref.child(channelId).on('child_added', snap => {
      loadedMessages.push(snap.val());
      this.setState({
        messages: loadedMessages,
        messagesLoading: false,
      });
      this.countUniqueUsers(loadedMessages);
    })
  };

  addUserStarListener = (channelId, userId) => {
    this.state.usersRef
      .child(userId)
      .child('starred')
      .once('value')
      .then(data => {
        if(data.val() !== null){
          const channelIds = Object.keys(data.val());
          const prevStarred = channelIds.includes(channelId);
          this.setState({
            isChannelStarred: prevStarred
          })
        }
      })
  }

  getMessagesRef = () => {
    const { messagesRef, privateMessagesRef, privateChannel} = this.state;
    return privateChannel ? privateMessagesRef : messagesRef;
  }

  handleStar = () => {
    this.setState(prevState => ({
      isChannelStarred: !prevState.isChannelStarred
    }), () => this.starChannel())
  }

  starChannel = () => {
    if(this.state.isChannelStarred) {
      this.state.usersRef
        .child(`${this.state.user.uid}/starred`)
        .update({
          [this.state.channel.id]: {
            name: this.state.channel.name,
            details: this.state.channel.details,
            createdBy: {
              name:this.state.channel.createdBy.name,
              avatar: this.state.channel.createdBy.avatar,
            }
          }
        })
    }else {
      this.state.usersRef
        .child(`${this.state.user.uid}/starred`)
        .child(this.state.channel.id)
        .remove(err => {
          if(err != null) {
            console.error(err);
          }
        })
    }
  }

  handleSearchChange = event => {
    this.setState({
      searchTerm: event.target.value,
      searchLoading: true
    }, () => this.handleSearchMessages());
  }

  handleSearchMessages = () => {
    const channelMessages = [...this.state.messages];
    const regex = new RegExp(this.state.searchTerm, 'gi');
    const searchResults = channelMessages.reduce((acc, message) => {
      if (message.content && message.content.match(regex) || message.user.name.match(regex)) {
        acc.push(message)
      }
      return acc;
    }, []);

    this.setState({ searchResults })
    this.setState({ searchLoading: false })
  }
  
  countUniqueUsers = messages => {
    const uniqueUsers = messages.reduce((acc, message) => {
      if (!acc.includes(message.user.name)) {
        acc.push(message.user.name);
      }
      return acc;
    }, []);
    const plural = uniqueUsers.length > 1 || uniqueUsers.length === 0;
    const numUniqueUsers = `${uniqueUsers.length} user${plural ? 's' : ''}`
    this.setState({ numUniqueUsers });
  }

  displayMessages = (messages) => {
    return messages.length > 0 && messages.map(message => {
      //console.log("display Message", message)
      return (
        <Message
          key={message.timestamp}
          message={message}
          user={this.state.user}
        />
      )
    })
  }

  displayChannelName = channel => {

    return channel ? `${this.state.privateChannel ? '@' : '#'}${channel.name}` : '';

  }

  render() {
    const { messagesRef, messages, channel, user, numUniqueUsers, 
            searchTerm, searchResults, searchLoading, privateChannel, isChannelStarred } = this.state;

    return (
      <React.Fragment>
        <MessagesHeader
          channelName={this.displayChannelName(channel)}
          numUniqueUsers={numUniqueUsers}
          handleSearchChange={this.handleSearchChange}
          searchLoading={searchLoading}
          isPrivateChannel={privateChannel}
          handleStar={this.handleStar}
          isChannelStarred= {isChannelStarred}
        />
        <Segment>
          <Comment.Group className='messages' style={{ maxWidth: '100%' }}>
            {searchTerm ? this.displayMessages(searchResults) : this.displayMessages(messages)}
          </Comment.Group>
        </Segment>

        <MessagesForm
          messagesRef={messagesRef}
          currentChannel={channel}
          currentUser={user}
          isPrivateChannel={privateChannel}
          getMessagesRef={this.getMessagesRef}
        />
      </React.Fragment>
    )
  }
}

export default Messages