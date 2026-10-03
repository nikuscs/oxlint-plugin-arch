import { useEffect, useState } from 'react';
function Component() { const {data} = useQuery("/data"); return <div>{data}</div>; }