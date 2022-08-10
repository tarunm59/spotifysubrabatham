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
import Addparty from "./components/Addparty";
import "font-awesome/css/font-awesome.min.css";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}></Route>
      <Route
        path="/getParty/:code/:authcode"
        element={<RenderGetParty />}
      ></Route>
      <Route path="/dashboard/:code" element={<Invoice />}></Route>
    </Routes>
  </BrowserRouter>
);
function Invoice() {
  let params = useParams();
  let clientid = "7a561047270c440094df114ec0cbb949";
  return <Addparty logcode={params.code} clientid={clientid} />;
}

function RenderGetParty() {
  let params = useParams();
  let clientid = "7a561047270c440094df114ec0cbb949";

  return (
    <Getparty
      partyCode={params.code}
      clientid={clientid}
      logcode={params.authcode}
    />
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
