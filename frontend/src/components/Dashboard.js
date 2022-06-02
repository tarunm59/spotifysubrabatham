import React from "react";
import useAuth from "../Hooks/useAuth";
const Dashboard = (props) => {
  const token = useAuth(props.code);
  return <div>{props.code}</div>;
};

export default Dashboard;
