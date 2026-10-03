
import {useReactTable} from '@tanstack/react-table';
function Component({columns, data}) {
  const table = useReactTable({columns, data});
  return <div>{table.getRowModel().rows.length}</div>;
}
