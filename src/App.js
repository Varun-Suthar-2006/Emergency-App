import React, { useState, useEffect } from "react";
import "./App.css";
import { FaHome, FaAddressBook } from "react-icons/fa";

function App() {
  const [page, setPage] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState("light");
  const [dashboardTab, setDashboardTab] = useState("home");
  const [emergencyContacts, setEmergencyContacts] = useState(() => {
    return JSON.parse(localStorage.getItem("emergencyContacts")) || [
      { name: "Police", number: "100" },
      { name: "Ambulance", number: "102" },
      { name: "Fire", number: "101" },
      { name: "Women Safety", number: "1091" },
    ];
  });
  const [contactSearch, setContactSearch] = useState("");
  const [location, setLocation] = useState({ latitude: "-", longitude: "-", accuracy: "-" });
  const [battery, setBattery] = useState({ level: "-", charging: "-" });

  // ========== Effects ==========
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) { setCurrentUser(JSON.parse(savedUser)); setPage("dashboard"); }
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) setTheme(savedTheme);

    // Location
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition((pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      });
    }

    // Battery
    if (navigator.getBattery) {
      navigator.getBattery().then(bat => {
        const updateBattery = () => setBattery({
          level: Math.round(bat.level * 100) + "%",
          charging: bat.charging ? "Charging" : "Not Charging"
        });
        updateBattery();
        bat.addEventListener('levelchange', updateBattery);
        bat.addEventListener('chargingchange', updateBattery);
      });
    }

    // Fall Detection
    const handleMotion = (event) => {
      const acc = event.accelerationIncludingGravity;
      const total = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
      if (total > 30 && currentUser) { 
        alert("Fall detected! Calling emergency number...");
        window.location.href = `tel:${currentUser.number}`;
      }
    };
    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, [currentUser]);

  useEffect(() => { 
    if (currentUser) 
      localStorage.setItem("currentUser", JSON.stringify(currentUser)); 
    else 
      localStorage.removeItem("currentUser"); 
  }, [currentUser]);

  useEffect(() => { 
    localStorage.setItem("emergencyContacts", JSON.stringify(emergencyContacts)); 
  }, [emergencyContacts]);

  useEffect(() => { 
    document.body.setAttribute("data-theme", theme); 
    localStorage.setItem("theme", theme); 
  }, [theme]);

  // ========== Actions ==========
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const login = (username, password) => {
    let users = JSON.parse(localStorage.getItem("users") || "{}");
    if (users[username] && users[username].password === password) { 
      setCurrentUser(users[username]); 
      setPage("dashboard"); 
    } else alert("Invalid Login. Please Register first.");
  };

  const register = (user) => {
    let users = JSON.parse(localStorage.getItem("users") || "{}");
    if (users[user.username]) return alert("User already exists");
    users[user.username] = user;
    localStorage.setItem("users", JSON.stringify(users));
    setCurrentUser(user);
    setPage("dashboard");
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // ========== Routing ==========
  if (page === "login") return <Login onLogin={login} onSwitch={() => setPage("register")} />;
  if (page === "register") return <Register onRegister={register} onSwitch={() => setPage("login")} />;
  if (page === "dashboard")
    return (
      <Dashboard
        user={currentUser}
        greeting={greeting()}
        onLogout={() => {
          localStorage.removeItem("currentUser");  // ✅ FIXED logout bug
          setCurrentUser(null);
          setPage("login");
        }}
        toggleTheme={toggleTheme}
        tab={dashboardTab}
        setTab={setDashboardTab}
        emergencyContacts={emergencyContacts}
        setEmergencyContacts={setEmergencyContacts}
        contactSearch={contactSearch}
        setContactSearch={setContactSearch}
        location={location}
        battery={battery}
      />
    );

  return null;
}

/* ---------------- LOGIN ---------------- */
function Login({ onLogin, onSwitch }) {
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div className="login-screen">
      <div className="login-card">
        <h2>Login</h2>
        <input placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="password" placeholder="Enter your password" value={pass} onChange={(e) => setPass(e.target.value)} />
        <div className="btn" onClick={() => onLogin(name, pass)}>Login</div>
        <p>Don't have an account? <span className="btn" onClick={onSwitch}>Register</span></p>
      </div>
    </div>
  );
}

/* ---------------- REGISTER ---------------- */
function Register({ onRegister, onSwitch }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="login-screen">
      <div className="login-card">
        <h2>Register</h2>
        <input placeholder="Enter your name" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="tel" placeholder="Emergency number" value={number} onChange={(e) => setNumber(e.target.value)} />
        <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="btn" onClick={() => onRegister({ username, email, number, password })}>Register</div>
        <p>Already have an account? <span className="btn" onClick={onSwitch}>Login</span></p>
      </div>
    </div>
  );
}

/* ---------------- DASHBOARD ---------------- */
function Dashboard({
  user, greeting, onLogout, toggleTheme, tab, setTab,
  emergencyContacts, setEmergencyContacts, contactSearch, setContactSearch,
  location, battery
}) {
  const filteredContacts = emergencyContacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.number.includes(contactSearch)
  );

  const addContact = () => {
    const name = prompt("Enter Contact Name");
    const number = prompt("Enter Contact Number");
    if (!name || !number) return alert("Name and Number are required!");
    setEmergencyContacts([...emergencyContacts, { name, number }]);
  };

  const editContact = (index) => {
    const contact = emergencyContacts[index];
    const name = prompt("Edit Name", contact.name);
    const number = prompt("Edit Number", contact.number);
    if (!name || !number) return alert("Name and Number are required!");
    const updatedContacts = [...emergencyContacts];
    updatedContacts[index] = { name, number };
    setEmergencyContacts(updatedContacts);
  };

  const deleteContact = (index) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      const updatedContacts = emergencyContacts.filter((_, i) => i !== index);
      setEmergencyContacts(updatedContacts);
    }
  };

  const smsEmergency = (num) => {
    const msg = `🚨 Emergency alert! Please help.
Location: Latitude ${location.latitude}, Longitude ${location.longitude}
Google Maps: https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}
Contact Number: ${num}`;
    window.location.href = `sms:${num}?body=${encodeURIComponent(msg)}`;
  };

  const shareLocation = () => {
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    const message = `🚨 Emergency Alert!\n\nPlease help me.\nMy Location: ${mapsLink}`;
    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
  };

  return (
    <div className="app">
      <header>
        <div className="profile">
          <img src="https://img.freepik.com/premium-vector/avatar-profile-icon-flat-style-male-user-profile-vector-illustration-isolated-background-man-profile-sign-business-concept_157943-38764.jpg" alt="profile" />
          <div className="greeting-container">
            <h1>Emergency Dashboard</h1>
            <p className="greeting">{greeting}, {user.username}</p>
            <small>
              Location: Lat {location.latitude}, Lng {location.longitude}, Accuracy {location.accuracy}m
              <br />
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: "#1c77c3", fontWeight: "bold" }}
              >
                📍 View on Google Maps
              </a>
            </small>
          </div>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>Toggle Theme</button>
      </header>

      <main>
        {tab === "home" && (
          <>
            <section className="card">
              <h2>Quick Actions</h2>
              <div className="btn-grid">
                <button className="btn" onClick={() => window.location.href=`tel:${user.number}`}>📞 Call</button>
                <button className="btn" onClick={() => smsEmergency(user.number)}>✉️ SMS</button>
                <button className="btn" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`, "_blank")}>📍 Location</button>
                <button className="btn" onClick={shareLocation}>🔗 Share (SMS)</button>
              </div>
            </section>

            <div className="panic-btn" onMouseDown={() => window.location.href=`tel:${user.number}`} onTouchStart={() => window.location.href=`tel:${user.number}`}>
              🚨 HOLD to PANIC
            </div>

            <section className="card">
              <h2>Status</h2>
              <p>Latitude: {location.latitude}</p>
              <p>Longitude: {location.longitude}</p>
              <p>Accuracy: {location.accuracy} m</p>
              <p>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: "#1c77c3", fontWeight: "bold" }}
                >
                  📍 View on Google Maps
                </a>
              </p>
            </section>

            <section className="card">
              <h2>Battery</h2>
              <p>Battery Level: {battery.level}</p>
              <p>Status: {battery.charging}</p>
            </section>
          </>
        )}

        {tab === "contacts" && (
          <section className="card">
            <input 
              type="text" 
              placeholder="Search contacts..." 
              value={contactSearch} 
              onChange={(e) => setContactSearch(e.target.value)} 
              style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }} 
            />
            <ul className="contacts-list">
              {filteredContacts.map((c, i) => (
                <li key={i} className="contact-item">
                  <span>{c.name}</span> - <span>{c.number}</span>
                  <div className="contact-actions">
                    <button className="call-sms-btn" onClick={() => {
                      window.location.href = `tel:${c.number}`;
                      setTimeout(() => { smsEmergency(c.number); }, 500);
                    }}>🚨 Call + SMS</button>
                    <button className="edit-btn" onClick={() => editContact(i)}>✏️</button>
                    <button className="delete-btn" onClick={() => deleteContact(i)}>🗑️</button>
                  </div>
                </li>
              ))}
            </ul>
            <button className="add-contact-btn" onClick={addContact}>+ Add Contact</button>
          </section>
        )}

        {tab === "profile" && (
          <section className="card">
            <h2>Profile</h2>
            <img src="https://img.freepik.com/premium-vector/avatar-profile-icon-flat-style-male-user-profile-vector-illustration-isolated-background-man-profile-sign-business-concept_157943-38764.jpg" alt="logo" style={{ width: "80px", borderRadius: "50%", marginBottom: "1rem" }} />
            <p><strong>Name:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Emergency Number:</strong> {user.number}</p>
            <div className="logout-btn" onClick={onLogout}>Logout</div>
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")}><FaHome size={24} /><span className="nav-label">Home</span></button>
        <button className={tab === "contacts" ? "active" : ""} onClick={() => setTab("contacts")}><FaAddressBook size={24} /><span className="nav-label">Contacts</span></button>
        <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}><img src="https://img.freepik.com/premium-vector/avatar-profile-icon-flat-style-male-user-profile-vector-illustration-isolated-background-man-profile-sign-business-concept_157943-38764.jpg" alt="logo" style={{ width: "24px", height: "24px", borderRadius: "50%" }} /><span className="nav-label">Profile</span></button>
      </nav>
    </div>
  );
}

export default App;
