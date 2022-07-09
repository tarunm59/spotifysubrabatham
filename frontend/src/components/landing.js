import React from 'react'
import { Container,Row,Col,Button } from 'react-bootstrap'
import { useState } from 'react'

const Landing = (code) => {

  
  console.log(code);
  return (
    <Container className="container-containerState  hover"  style={{ height: "100vh " }}>
        <Row>

        <Button href={'/dashboard/'+code.code.toString()} variant="success">Start a Listening Session</Button>{' '}

        </Row>
        <br></br>
        <Row>
        <Button  variant="success">Join one!</Button>{' '}
        </Row>
        <br></br>
        <Row>
        <Button  variant="success">Donate to Ukrain Refugees!!!!!!</Button>{' '}
        </Row>
    </Container>
  )
}

export default Landing