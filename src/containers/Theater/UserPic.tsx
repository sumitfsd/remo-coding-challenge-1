import * as React from 'react';
import './index.scss'; 
import { useFirestoreDocData, useFirestore } from 'reactfire';

const UserPic: React.FC<{ userId: string, seat: { id: string, x: number, y: number} }> = (props) => {
  const { userId, seat } = props;
  
  const userRef = useFirestore()
    .collection('publicProfile')
    .doc(userId);

  const user: any = useFirestoreDocData(userRef, { startWithValue: {} });

  return ( 
    <div key={`${seat.x}-${seat.y}`} style={{position: 'absolute', top: seat.y, left: seat.x}}>
      {user.profilePic && <img style={{margin: '5px', height: '40px', width: '40px', borderRadius: '50%'}} alt='' src={user.profilePic} />}
    </div>
  );
};
 
export default UserPic;