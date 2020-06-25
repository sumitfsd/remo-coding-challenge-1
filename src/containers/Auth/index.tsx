import React, { useEffect } from 'react';
import Firebase, { saveUserProfile, assignSeatToUser } from '../../services/firebase';
import { useHistory } from 'react-router-dom';
import { setToken } from '../../services/tokenManager';

const Auth: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    Firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {

        const userProfile = await saveUserProfile({
          id: user.uid,
          profilePic: user.photoURL,
          name: user.displayName,
        });

        if (userProfile) {
          await assignSeatToUser(userProfile);
        }

        setToken(user.uid);
        history.push('/theater');
      }
    });

  }, []);

  const redirect = () => {
    const provider = new Firebase.auth.GoogleAuthProvider();
    Firebase.auth().signInWithPopup(provider);
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
      <h1> Remo Coding Challenge Join Room </h1>
      <button onClick={redirect}> Login With Google </button>
    </div> 
  );
};
 
export default Auth;