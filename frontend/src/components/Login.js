import React from "react";
import { Container, Button } from "react-bootstrap";
const AUTH_URL =
  "https://accounts.spotify.com/authorize?client_id=7a561047270c440094df114ec0cbb949&response_type=code&redirect_uri=http://localhost:3000&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state";

export default function Login() {
  return (
    <Container classname="d-flex justify-content-center">
      <Button href={AUTH_URL}>Login with spotify</Button>
    </Container>
  );
}
