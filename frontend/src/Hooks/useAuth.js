import { useState, useEffect } from "react";
import axios from "axios";

export default function useAuth(code) {
  const [accessToken, setAccessToken] = useState();
  const [refreshToken, setRefreshToken] = useState();
  const [expiresIn, setExpiresIn] = useState();

  useEffect(() => {
    axios
      .post("http://localhost:3001/login", {
        code,
      })
      .then((res) => {
        // console.log(res.data);
        setAccessToken(res.data.accessToken);
        setRefreshToken(res.data.refreshToken);
        setExpiresIn(res.data.expiresIn);
        
      })
      .catch((err) => {
        console.log(err);
        console.log(code)
        window.location = "/";
      });
  }, [code]);

  useEffect(() => {
    if (!refreshToken || !expiresIn) {
      return;
    }
    const timeout = setInterval(() => {
      // Code to call the refresh function in the server.
      axios
        .post("http://localhost:3001/refresh", {
          refreshToken,
        })
        .then((res) => {
          console.log(res.data);
          setAccessToken(res.data.accessToken);
          setExpiresIn(res.data.expiresIn);
        })
        .catch((err) => {
          console.log(err);
          console.log("here")
          window.location = "/";
        });
    }, 1000 * (expiresIn - 60));
    return () => clearInterval(timeout);
  }, [refreshToken, expiresIn]);

  return accessToken;
}
