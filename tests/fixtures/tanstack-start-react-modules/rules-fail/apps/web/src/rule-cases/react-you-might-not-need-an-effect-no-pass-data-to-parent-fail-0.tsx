import { useEffect, useState } from 'react';
function Component({onData}) { const {data} = useQuery("/data"); useEffect(() => {onData(data);}, [data,onData]); return <div />; }