"use client";
import React, { useState } from "react";
import AddLiq from "./addLiq";
import CreatePool from "./createPool";

export default function Pool() {
  const [isSelectedAdd, setIsSelectedAdd] = useState(true);
  return <>{isSelectedAdd ? <AddLiq /> : <CreatePool />}</>;
}
