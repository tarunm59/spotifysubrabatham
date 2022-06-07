import React from "react";
import useAuth from "../Hooks/useAuth";
import { Container } from "react-bootstrap";
const Dashboard = (props) => {
  const token = useAuth(props.code);
  return <Container>token</Container>;
};

export default Dashboard;
