import React from "react";
import "./App.css";
import Login from "./components/login/login";
import Header from "./components/header/Header";

function App() {
  return (
    <main className="main">
      <Header />
      <Login />
    </main>
  );
}

export default App;
