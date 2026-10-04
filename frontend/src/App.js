import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [hello, setHello] = useState('');
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  const fetchProfile = () => {
    fetch('/profile/fetchUser')
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetch('/hello/')
      .then(res => res.text())
      .then(data => setHello(data))
      .catch(err => console.error(err));

    fetchProfile();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('/profile/addUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, age: Number(age) })
    })
      .then(res => res.json())
      .then(() => {
        setName('');
        setAge('');
        fetchProfile();
      })
      .catch(err => console.error(err));
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Welcome</h1>
      <h2>{hello || 'Hello World'}</h2>

      <div style={{ margin: '30px auto', padding: '20px', maxWidth: '400px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Create / Update User</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input
            type="number"
            placeholder="Enter Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
            style={{ padding: '8px', fontSize: '14px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Submit
          </button>
        </form>
      </div>

      <h3>Current Profile in MongoDB</h3>
      <div style={{ background: '#f5f5f5', padding: '15px', display: 'inline-block', borderRadius: '6px' }}>
        <pre style={{ margin: 0 }}>{profile ? JSON.stringify(profile, null, 2) : 'No user data found'}</pre>
      </div>
    </div>
  );
}

export default App;
