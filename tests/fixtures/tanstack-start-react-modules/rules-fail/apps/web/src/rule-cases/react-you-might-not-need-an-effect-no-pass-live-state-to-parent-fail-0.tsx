import { useEffect, useState } from 'react';
function Component({onText}) { const [text,setText] = useState(); useEffect(() => {onText(text);}, [onText,text]); return <div />; }