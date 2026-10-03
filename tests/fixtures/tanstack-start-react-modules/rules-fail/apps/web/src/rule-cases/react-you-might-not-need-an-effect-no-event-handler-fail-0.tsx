import { useEffect, useState } from 'react';
function Component() { const [data,setData] = useState(); useEffect(() => {if(data) {submitData(data);}}, [data]); return <div />; }