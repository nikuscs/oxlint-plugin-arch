import { useEffect, useState } from 'react';
function Component({onText}) { const [text,setText] = useState(); return <input value={text} onChange={onText} />; }