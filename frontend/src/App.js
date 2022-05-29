import "./App.css";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
const code = new URLSearchParams(window.location.search).get("code");
console.log(code);
// import { Row, Button, Col } from "react-bootstrap";
function App() {
  return <div>{code ? <Dashboard code={code} /> : <Login />}</div>;
}

export default App;
