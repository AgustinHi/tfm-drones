import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [drones, setDrones] = useState([]);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [droneType, setDroneType] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/drones')
      .then(response => {
        setDrones(response.data);
      })
      .catch(error => {
        console.error('Error fetching drones:', error);
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newDrone = {
      brand,
      model,
      drone_type: droneType,
      notes,
    };

    axios.post('http://127.0.0.1:8000/drones', newDrone)
      .then((response) => {
        setDrones((prevDrones) => [...prevDrones, response.data]);
      })
      .catch((error) => {
        console.error('Error creating drone:', error);
      });
  };

  return (
    <div>
      <h1>Drones</h1>
      <ul>
        {drones.map((drone) => (
          <li key={drone.id}>
            {drone.brand} - {drone.model} - {drone.drone_type} - {drone.notes}
          </li>
        ))}
      </ul>
      
      <h2>Add a Drone</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Brand:
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </label>
        <br />
        <label>
          Model:
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </label>
        <br />
        <label>
          Drone Type:
          <input
            type="text"
            value={droneType}
            onChange={(e) => setDroneType(e.target.value)}
          />
        </label>
        <br />
        <label>
          Notes:
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <br />
        <button type="submit">Add Drone</button>
      </form>
    </div>
  );
}

export default App;
