import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import Dashboard from "./components/Dashboard";
import Landing from "./components/landing";
import reportWebVitals from "./reportWebVitals";
import "bootstrap/dist/css/bootstrap.min.css"; // bootstrap stylesheet
import { BrowserRouter, Routes, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Route } from "react-router-dom";
import Getparty from "./components/Getparty";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="/getParty" element={<Getparty />}></Route>
      </Route>
      <Route path="/dashboard/:code" element={<Invoice />}></Route>
    </Routes>
  </BrowserRouter>
);
function Invoice() {
  let params = useParams();
  return <Dashboard code={params.code} />;
}

function renderGetParty() {
  return <Getparty />;
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
