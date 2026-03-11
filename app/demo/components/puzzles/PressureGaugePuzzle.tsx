"use client";

import { useState } from "react";
import PressureGauge from "./PressureGauge";

export default function PressureGaugePuzzle() {
  const [gauges, setGauges] = useState([0,0,0]);

  function addPressure(index:number) {

    const next = [...gauges];
    next[index] = Math.min(4, next[index] + 1);

    setGauges(next);

    new Audio("/assets/audio/Puzzles/Pressure_Plates/sfx_gauge_needle_tick.mp3").play();
  }

  return (
    <div style={{position:"relative"}}>

      <img
        src="/assets/V3/Dungeon/Puzzles/Pressure_Gauges/corridor_puzzle_room.png"
        style={{width:"100%"}}
      />

      <PressureGauge value={gauges[0]} left={610} top={430}/>
      <PressureGauge value={gauges[1]} left={825} top={430}/>
      <PressureGauge value={gauges[2]} left={1040} top={430}/>

      <button onClick={()=>addPressure(0)}>Sun Plate</button>
      <button onClick={()=>addPressure(1)}>Moon Plate</button>
      <button onClick={()=>addPressure(2)}>Cross Plate</button>

    </div>
  );
}
