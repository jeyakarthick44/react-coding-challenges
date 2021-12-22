import React, { useContext, useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import useSound from 'use-sound';
import config from '../../../config';
import LatestMessagesContext from '../../../contexts/LatestMessages/LatestMessages';
import TypingMessage from './TypingMessage';
import Header from './Header';
import Footer from './Footer';
import Message from './Message';
import '../styles/_messages.scss';
import INITIAL_BOTTY_MESSAGE from '../../../common/constants/initialBottyMessage';


const socket = io(
  config.BOT_SERVER_ENDPOINT,
  { transports: ['websocket', 'polling', 'flashsocket'] }
);

function scrollToBottomOfMessages() {
  const list = document.getElementById('message-list');

  list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
}


const ME = 'me';
const BOT = 'bot';
const INITIAL_MESSAGE = {
  message: INITIAL_BOTTY_MESSAGE,
  id: Date.now(),
  user: BOT
};

const Messages = () => {
  const [playSend] = useSound(config.SEND_AUDIO_URL);
  const [playReceive] = useSound(config.RECEIVE_AUDIO_URL);
  const { setLatestMessage } = useContext(LatestMessagesContext);
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [botTyping, setBotTyping] = useState(false);


  const sendMessage = useCallback(() => {
    setMessages([...messages, { message, user: ME, id: Date.now() }]);
    scrollToBottomOfMessages();
    socket.emit('user-message', message);
    setMessage('');
    playSend()
    document.getElementById("user-message-input").value = "";
  }, [messages, message, playSend]);


  useEffect(() => {
    socket.on('bot-typing', () => {
      setBotTyping(true);
      scrollToBottomOfMessages();
    });
  }, []);


  useEffect(() => {
    socket.on('bot-message', (message) => {
      setBotTyping(false);
      setMessages([...messages, { message, user: BOT, id: Date.now() }]);
      setLatestMessage(BOT, message);
      playReceive()
      scrollToBottomOfMessages();
    });
  }, [messages, setLatestMessage, playReceive]);


  const onChangeMessage = (e) => {
    const value = e.target.value
    setMessage(value)
  };

  return (
    <div className="messages">
      <Header />
      <div className="messages__list" id="message-list" >
        {messages.map((message, index) => (
          <Message key={index} message={message} nextMessage={messages} botTyping={botTyping} />
        ))}
        {botTyping ? <TypingMessage /> : null}
      </div>
      <Footer message={message} sendMessage={sendMessage} onChangeMessage={onChangeMessage} />
    </div>
  );
}

export default Messages;
