import React, { Component } from 'react'
import uuidv4 from 'uuid/v4';
import firebase from '../../firebase'
import { Segment, Button, Input } from 'semantic-ui-react'
import FileModal from './FileModal';
import ProgressBar from './ProgressBar';

class MessagesForm extends Component {
  state = {
    storageRef: firebase.storage().ref(),
    privateMessagesRef: firebase.database().ref('privateMessages'),
    uploadTask: null,
    uploadState: '',
    percentUploaded: 0,
    message: '',
    channel: this.props.currentChannel,
    loading: false,
    user: this.props.currentUser,
    errors: [],
    modal: false,
  }

  openModal = () => {
    this.setState({ modal: true })
  }
  closeModal = () => {
    this.setState({ modal: false })
  }

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  }

  createMessage = (fileUrl = null) => {
    const message = {
      timestamp: firebase.database.ServerValue.TIMESTAMP,
      user: {
        id: this.state.user.uid,
        name: this.state.user.displayName,
        avatar: this.state.user.photoURL
      }
    };
    if (fileUrl !== null) {
      message['image'] = fileUrl;
    } else {
      message['content'] = this.state.message;
    }
    return message;
  }

  sendMessage = () => {
    const { getMessagesRef } = this.props;
    const { message, channel } = this.state;

    if (message) {
      this.setState({
        loading: true
      });
      getMessagesRef()
        .child(channel.id)
        .push()
        .set(this.createMessage())
        .then(() => {
          this.setState({ loading: false, message: '', errors: [] });
        })
        .catch(error => {
          console.log(error);
          this.setState({
            loading: false,
            errors: this.state.errors.concat(error)
          })
        })
    } else {
      this.setState({
        errors: this.state.errors.concat({ message: 'add a message ' })
      })
    }
  }
  
  getPath = () => {
    if(this.props.isPrivateChannel){
      return `chat/private-${this.state.channel.id}`
    } else {
      return 'chat/public'
    }
  }

  uploadFile = (file, metadata) => {
    const pathToUpload = this.state.channel.id;
    const ref = this.props.getMessagesRef();
    const filePath = `${this.getPath()}/chat/public/${uuidv4()}.jpg`

    this.setState({
      uploadState: 'uploading',
      uploadTask: this.state.storageRef.child(filePath).put(file, metadata)
    },
      () => {
        this.state.uploadTask.on(
          'state_changed',
          snap => {
            const percentUploaded = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
            this.setState({ percentUploaded })
          },
          err => {
            console.error(err);
            this.setState({
              error: this.state.errors.concat(err),
              uploadState: 'error',
              uploadTask: null,
            })
          },
          () => {
            this.state.uploadTask.snapshot.ref.getDownloadURL().then(downloadUrl => {
              this.sendFileMessage(downloadUrl, ref, pathToUpload);
            })
              .catch(err => {
                console.error(err);
                this.setState({
                  error: this.state.errors.concat(err),
                  uploadState: 'error',
                  uploadTask: null,
                });
              })
          }
        )

      }
    )
  };

  sendFileMessage = (fileUrl, ref, pathToUpload) => {
    ref.child(pathToUpload)
      .push()
      .set(this.createMessage(fileUrl))
      .then(() => {
        this.setState({ uploadState: 'done' })
      })
      .catch(err => {
        console.log(err);
        this.setState({
          errors: this.state.errors.concat(err),

        })
      })
  }

  render() {
    const { errors, message, loading, modal, uploadState, percentUploaded } = this.state
    return (
      <Segment className='message__form'>
        <Input
          fluid
          name='message'
          value={message}
          onChange={this.handleChange}
          style={{ marginBottom: '0.7em' }}
          label={<Button icon={'add'} />}
          labelPosition='left'
          className={
            errors.some(error => error.message.includes('message')) ? 'error' : ''
          }
          placeholder='write your messages'
        />
        <Button.Group icon widths='2'>
          <Button
            onClick={this.sendMessage}
            disabled={loading}
            color='orange'
            content='Add Reply'
            labelPosition='left'
            icon='edit'
          />
          <Button
            onClick={this.openModal}
            disabled={uploadState === 'uploading'}
            color='teal'
            content='Upload Media'
            labelPosition='right'
            icon='cloud upload'
          />
        </Button.Group>
          <FileModal
            modal={modal}
            closeModal={this.closeModal}
            uploadFile={this.uploadFile}
          />
          <ProgressBar 
            uploadState={uploadState}
            percentUploaded={percentUploaded}
          />
      </Segment>
    )
  }
}

export default MessagesForm