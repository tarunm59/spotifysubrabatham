import axios from "axios"
import  React from 'react'
import {useState,useEffect} from "react"



export default function useAuth(code)
{
    const [accessToken,setAccessToken]=useState();
    const [refreshToken,setrefreshToken]=useState();
    const [expiresIn,setExpiresIn]=useState();
   

    useEffect(()=>{
     axios.post('https://localhost:3001/login',{
         code,
     }).then(res=>{
         console.log(res.data);
     })
      .catch(()=>{window.location="/"})
    },[code])
    

}