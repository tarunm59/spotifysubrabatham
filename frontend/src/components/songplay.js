import React from 'react'
import SpotifyPlayer from "react-spotify-web-playback"
import { useState } from 'react';
import { useEffect } from 'react';
export default function Songplay({accessToken,trackUri}) {
   console.log(accessToken)
    const [play,setPlay] = useState(false);
    useEffect(()=>setPlay(true),[trackUri])
    if (!accessToken) return (<div><p>Testing </p></div>)
  return (

    <div><SpotifyPlayer
    token = {accessToken}
    showSaveIcon
    callback = {state=>{
        if (!state.isPlaying) setPlay(false)
    }}
    play = {play}
    uris = {trackUri ? [trackUri] : []
   }/></div>
  )
}

