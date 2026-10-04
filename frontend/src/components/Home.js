import React, { useEffect, useState } from "react";
import axios from "axios";

function Home() {
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState([]);

  useEffect(() => {
    axios
      .get("/hello/")
      .then((response) => {
        setMessage(response.data.msg);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  useEffect(() => {
    axios
      .get("/profile/fetchUser")
      .then((response) => {
        setProfile(response.data);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  return (
    <div className="App">
      <h1>{message}</h1>

      <div>
        <h2>Profile</h2>

        {profile.map((user) => {
          console.log("user", user);

          return (
            <div key={user._id || user.id}>
              <p>{JSON.stringify(user)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Home;
