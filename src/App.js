import React, { useState, useEffect } from "react";
import "./App.css";
import { FaHome, FaAddressBook } from "react-icons/fa";

function App() {
  const defaultContacts = [
    { name: "National Emergency", number: "112" },
    { name: "Tourist Helpline", number: "1363" },
    { name: "Police", number: "100" },
    { name: "Fire", number: "101" },
    { name: "Ambulance", number: "102" },
    { name: "Road Accident", number: "1073" },
    { name: "Disaster Management", number: "108" },
    { name: "Air Accident", number: "1071" },
    { name: "Women in Distress", number: "1091" },
    { name: "Medical Helpline", number: "104" },
    { name: "Indian Railway Security", number: "1322" },
    { name: "Earthquake Helpline", number: "1092" },
  ];

  const [page, setPage] = useState("splash");
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState("light");
  const [dashboardTab, setDashboardTab] = useState("home");
  const [contactSearch, setContactSearch] = useState("");
  const [location, setLocation] = useState({ latitude: "-", longitude: "-", accuracy: "-" });
  const [battery, setBattery] = useState({ level: "-", charging: "-" });

  // Merge default + saved contacts
  const [emergencyContacts, setEmergencyContacts] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("emergencyContacts")) || [];
    const merged = [...defaultContacts, ...saved];
    const unique = merged.filter(
      (c, index, self) => index === self.findIndex(x => x.number === c.number)
    );
    return unique;
  });

  // Splash -> Login/Register
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedUser = localStorage.getItem("currentUser");
      if (savedUser) { setCurrentUser(JSON.parse(savedUser)); setPage("dashboard"); }
      else setPage("login");

      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) setTheme(savedTheme);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Geolocation, battery, fall detection
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition((pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      });
    }

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

  // Save currentUser
  useEffect(() => { 
    if (currentUser) localStorage.setItem("currentUser", JSON.stringify(currentUser)); 
    else localStorage.removeItem("currentUser"); 
  }, [currentUser]);

  // Save emergencyContacts
  useEffect(() => { 
    localStorage.setItem("emergencyContacts", JSON.stringify(emergencyContacts)); 
  }, [emergencyContacts]);

  // Save theme
  useEffect(() => { 
    document.body.setAttribute("data-theme", theme); 
    localStorage.setItem("theme", theme); 
  }, [theme]);

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

  if (page === "splash") return <Splash />;
  if (page === "login") return <Login onLogin={login} onSwitch={() => setPage("register")} />;
  if (page === "register") return <Register onRegister={register} onSwitch={() => setPage("login")} />;
  if (page === "dashboard")
    return (
      <Dashboard
        user={currentUser}
        greeting={greeting()}
        onLogout={() => { localStorage.removeItem("currentUser"); setCurrentUser(null); setPage("login"); }}
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

/* ---------------- SPLASH ---------------- */
function Splash() {
  return (
    <div className="splash-screen">
      <h1 className="splash-title">Welcome to Shakti App</h1>
    </div>
  );
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
  const [gender, setGender] = useState("male");
  const [password, setPassword] = useState("");

  return (
    <div className="login-screen">
      <div className="login-card">
        <h2>Register</h2>
        <input placeholder="Enter your name" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="tel" placeholder="Emergency number" value={number} onChange={(e) => setNumber(e.target.value)} />
        <select value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="btn" onClick={() => onRegister({ username, email, number, gender, password })}>Register</div>
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
  const avatar = user.gender === "male"
    ? "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIf4R5qPKHPNMyAqV-FjS_OTBB8pfUV29Phg&s"
    : "https://cdn-icons-png.freepik.com/512/6833/6833605.png";

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
    const msg = `🚨 Emergency alert! Please help.\nLocation: Latitude ${location.latitude}, Longitude ${location.longitude}\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}\nContact Number: ${num}`;
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
          <img src={avatar} alt="profile" />
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

            <div 
              className="panic-btn"
              onMouseDown={() => { if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]); window.location.href=`tel:${user.number}`; }}
              onTouchStart={() => { if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]); window.location.href=`tel:${user.number}`; }}
            >
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
          <section className="card contacts-section">
            <h2>Emergency Contacts</h2>
            <input
              type="text"
              className="search-bar"
              placeholder="Search contacts..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
            />

            <div className="contacts-list-modern">
              {filteredContacts.map((c, i) => (
                <div key={i} className="contact-card">
                  <div className="contact-avatar">
                    <span>{c.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="contact-details">
                    <p className="contact-name">{c.name}</p>
                    <p className="contact-number">{c.number}</p>
                  </div>
                  <div className="contact-actions">
                    <button className="action-btn call" onClick={() => { window.location.href = `tel:${c.number}`; setTimeout(() => { smsEmergency(c.number); }, 500); }}>📞</button>
                    <button className="action-btn edit" onClick={() => editContact(i)}>✏️</button>
                    <button className="action-btn delete" onClick={() => deleteContact(i)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>

            <button className="fab-add-contact" onClick={addContact}>＋</button>
          </section>
        )}

        {tab === "profile" && (
          <section className="card">
            <h2>Profile</h2>
            <img src={avatar} alt="logo" style={{ width: "80px", borderRadius: "50%", marginBottom: "1rem" }} />
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
        <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}><img src={avatar} alt="logo" style={{ width: "24px", height: "24px", borderRadius: "50%" }} /><span className="nav-label">Profile</span></button>
      </nav>
    </div>
  );
}

export default App;
