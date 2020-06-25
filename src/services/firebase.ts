import * as firebase from 'firebase';

// TODO: fill in your firebase config
const firebaseConfig = {
    apiKey: '***********************',
    authDomain: '***********************',
    databaseURL: '***********************',
    projectId: '***********************',
    appId: '***********************'
};

firebase.initializeApp(firebaseConfig);

interface IUserPublicProfile {
  id: string; 
  profilePic : string | null; 
  name: string | null; 
}

interface ISeat {
  id: string;
  order: number;
  user?: string;
}

interface ITable {
  id: string;
  order: number;
  seats: ISeat[];
}

interface ITableWithSeatStatus extends ITable {
  noOfSeatsOccupied: number;
}

export const saveUserProfile = async (user:  IUserPublicProfile): Promise<IUserPublicProfile | undefined> => {
  const db = firebase.firestore();
  const userRef = db.collection('publicProfile').doc(user.id);
  const userSnapshot = await userRef.get();

  if (userSnapshot.exists) {
    return userSnapshot.data() as IUserPublicProfile;
  }

  try {
    await userRef.set(user);

    return user;
  } catch (error) {
    console.log('Got error in saving user profile:');
    console.error(error);

    return undefined;
  }
};

export const assignSeatToUser = async (user:  IUserPublicProfile): Promise<any> => {
  const db = firebase.firestore();
  const roomRef = db.collection('rooms').doc('theater'); 
  const theaterRoomSnapshot = await roomRef.get();
  const theaterRoom = theaterRoomSnapshot.data();

  const configRef = db.collection('config').doc('2ifjRvQXJQx5SJDmzgoJ');
  const configSnapshot = await configRef.get();
  const config = configSnapshot.data();

  const maxAllowedPerTable = (config && config.maxAllowedPerTable) || 6;

  if (theaterRoom) {

    const isAlreadySeated = theaterRoom.tables.some((tables: ITable) => {
      const isSeatedOnTable = tables.seats.some((seat: ISeat) => seat.user === user.id);

      return isSeatedOnTable;
    });

    if (isAlreadySeated) {
      return;
    }

    const seatsStatus: ITableWithSeatStatus[] = theaterRoom.tables.map((table: ITable) => ({
      ...table,
      noOfSeatsOccupied: table.seats.reduce((acc: number, cur: ISeat) => cur.user ? acc + 1 : acc, 0)
    }));

    seatsStatus.sort((a, b) => a.order - b.order);

    const isFull = seatsStatus.reduce((acc: boolean, cur: ITableWithSeatStatus) => {
      return cur.noOfSeatsOccupied === maxAllowedPerTable && acc; 
    }, true);

    if (isFull) {
      return {
        isFull,
      };
    }

    const table1SeatsOccupied = seatsStatus[0].noOfSeatsOccupied;
    const seatsToBeFilled = getSeatsFilledPerTable(table1SeatsOccupied);
    
    let i = 0;
    let nextTable: ITableWithSeatStatus = seatsStatus[0];

    for (i = 0; i < seatsStatus.length; i += 1) {
      if (seatsStatus[i].noOfSeatsOccupied < seatsToBeFilled) {
        nextTable = seatsStatus[i];
        break;
      }
    }

    const nextSeat: ISeat | undefined = nextTable.seats.find((seat: ISeat) => !seat.user);
     
    if (!nextSeat) {
      return;
    }
    const table = { ...nextTable };
    delete table.noOfSeatsOccupied;

    if (!isAlreadySeated) {
      const batch = db.batch();

      batch.update(roomRef, {
        tables: firebase.firestore.FieldValue.arrayRemove({
          ...table,
        })
      });

      batch.update(roomRef, { 
        tables: firebase.firestore.FieldValue.arrayUnion({
          ...table,
          seats: table.seats.map((seat: any) => seat.id === nextSeat.id ? {...seat, user: user.id } : seat)
        })
      });

      await batch.commit();
    }
  }
};

const getSeatsFilledPerTable = (current: number): number => {
  if (current <= 2) {
    return 2;
  }

  return current;
};

export default firebase;
