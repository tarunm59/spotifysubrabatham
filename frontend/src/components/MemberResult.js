// import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "react-bootstrap";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faX } from "@fortawesome/free-solid-svg-icons";
let songKey = 1;

const MemberResult = ({member}) => {

 
  return (
    <div
      className="d-flex m-2 align-items-center"
      style={{ cursor: "pointer" }}
      
    >
      <FontAwesomeIcon icon={["fal", "coffee"]} style = {{"height":"64px","width":"64px"}}/>
      <div style={{ marginLeft: "10px" }}>
        <div>
          {member} 
        </div>
        
      </div>
    </div>
  );
};

export default MemberResult;
