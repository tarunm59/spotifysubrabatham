import React from "react";
import { Container, Row, Button, Form } from "react-bootstrap";
import { useState } from "react";

const Landing = (code) => {
  // console.log(code);
  const [entered, setEntered] = useState("");
  return (
    <Container
      className="container-containerState  hover"
      style={{ height: "100vh " }}
    >
      <Row>
        <Button href={"/dashboard/" + code.code.toString()} variant="success">
          Start a Listening Session
        </Button>{" "}
      </Row>
      <br></br>
      <Row>
        <Form>
          <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter Party Code"
              onChange={(e) => {
                setEntered(e.target.value);
              }}
            />
          </Form.Group>

          <Button
            variant="primary"
            href={
              "/getParty/" + entered.toString() + "/" + code.code.toString()
            }
            type="submit"
          >
            Join the Session!
          </Button>
        </Form>
      </Row>
      <br></br>
    </Container>
  );
};

export default Landing;
