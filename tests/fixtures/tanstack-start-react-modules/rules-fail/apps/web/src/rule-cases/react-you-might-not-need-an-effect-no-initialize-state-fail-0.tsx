import { useEffect, useState } from 'react';
function Component() { const [value,setValue] = useState(); useEffect(() => {setValue("ready");}, []); return <div>{value}</div>; }