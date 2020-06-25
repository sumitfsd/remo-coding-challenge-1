import * as React from 'react';
import './index.scss'; 
import { useFirestoreDocData, useFirestore } from 'reactfire';
import MapImage from '../../assets/conference-map.svg';
import TableConfig from './tableConfig.json';
import UserPic from './UserPic';

const Theater: React.FC = () => {

  const theaterRef = useFirestore()
    .collection('rooms')
    .doc('theater');

  const theater: any = useFirestoreDocData(theaterRef, { startWithValue: [] });

  return ( 
    <div className='remo-theater' style={{width: TableConfig.width, height: TableConfig.height}}>
      <div className='rt-app-bar'>
          <h2>Hi There!</h2>
        <button>Logout</button>
      </div>
      <div className='rt-rooms'>
        {
          TableConfig.tables.map((table) => (
            <div
              key={table.id}
              className='rt-room'
              style={{
                width: table.width, 
                height: table.height, 
                top: table.y, 
                left: table.x
              }}
            >
              {
                theater.tables && table.seats.map(seat => {
                  const getTable: any = theater.tables.find((tablefire: any) => tablefire.id === table.id);
                  
                  if (!getTable) {
                    return null;
                  }

                  const seatFire1 = getTable.seats.find((seatFire: any) => seatFire.id === seat.id);

                  return seatFire1 && seatFire1.user ? 
                  (
                    <UserPic key={seatFire1.user} seat={seat} userId={seatFire1.user} />
                  ) : 
                  null;
                })
              }
              <div className='rt-room-name'>
                {table.id}
              </div>
            </div>
          ))
        }
      </div>
      <div className='rt-background'>
        <img src={MapImage} alt='Conference background'/>
      </div>
    </div>
  );
};
 
export default Theater;