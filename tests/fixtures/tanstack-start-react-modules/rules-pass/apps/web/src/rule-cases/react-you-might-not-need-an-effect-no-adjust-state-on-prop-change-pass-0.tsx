import { useEffect, useState } from 'react';
function Component({items}) { const [selection,setSelection] = useState(null); return <div>{selection}</div>; }