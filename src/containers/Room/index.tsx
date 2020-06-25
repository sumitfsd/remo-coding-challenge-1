import React from 'react';
import Firebase from '../../services/firebase';
import { getRoomWithTable } from './tableArrangement';

const Room: React.FC = () => {
  const createRoom = async () => {
    const db = Firebase.firestore();
    const room = getRoomWithTable('theater');
    await db.collection('rooms').doc(room.id).set(room);
  };

  return ( 
    <div 
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <button onClick={createRoom}> Create Room </button>
    </div> 
  );
};
 
export default Room;