import { useEffect, useState } from 'react';
function Component() { const [round,setRound] = useState(1); const isOver = round > 10; return <div>{isOver}</div>; }