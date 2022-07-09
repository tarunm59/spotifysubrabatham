import "./App.css";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Landing from "./components/landing";
const code = new URLSearchParams(window.location.search).get("code");
 console.log(code);
// import { Row, Button, Col } from "react-bootstrap";
function App() {
  return <div>{code ? <Landing code={code} /> : <Login />}</div>;
}

export default App;
